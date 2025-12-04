import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { reportesPrecios, user } from '@/drizzle/schema'
import { eq, and, sql, gte, inArray } from 'drizzle-orm'
import { z } from 'zod'

// Create connection with error handling
function createDbConnection() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  const connection = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  
  return drizzle(connection)
}

const searchParamsSchema = z.object({
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc'] as const).optional(),
  horario: z.enum(['diurno', 'nocturno'] as const).optional(),
  dias: z.string().optional(), // Number of days to look back
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    const { id } = await params
    console.log(`🔍 Fetching user price reports for station: ${id}`)
    
    // Create database connection
    db = createDbConnection()
    
    const { searchParams } = new URL(request.url)
    const queryParams = searchParamsSchema.parse(Object.fromEntries(searchParams))
    
    const dias = queryParams.dias ? parseInt(queryParams.dias) : 5 // Default to 5 days
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - dias)

    // Build query conditions
    const conditions = [eq(reportesPrecios.estacionId, id)]
    
    if (queryParams.tipoCombustible) {
      conditions.push(eq(reportesPrecios.tipoCombustible, queryParams.tipoCombustible))
    }
    
    if (queryParams.horario) {
      conditions.push(eq(reportesPrecios.horario, queryParams.horario))
    }

    // Add date filter
    conditions.push(gte(reportesPrecios.fechaCreacion, fechaLimite))

    const tag = `station:${id}:user-reports`
    const cacheKey = ['user-reports', id, queryParams.tipoCombustible ?? 'all', queryParams.horario ?? 'any', String(dias)]

    const getReportsCached = unstable_cache(
      async () => {
        // First get user reports with proper aggregation
        const userReportsRaw = await db!
          .select({
            tipoCombustible: reportesPrecios.tipoCombustible,
            horario: reportesPrecios.horario,
            // Convert decimal to number explicitly
            precioPromedio: sql<number>`ROUND(AVG(CAST(${reportesPrecios.precio} AS NUMERIC)), 2)`,
            cantidadReportes: sql<number>`COUNT(*)`,
            precioMinimo: sql<number>`ROUND(MIN(CAST(${reportesPrecios.precio} AS NUMERIC)), 2)`,
            precioMaximo: sql<number>`ROUND(MAX(CAST(${reportesPrecios.precio} AS NUMERIC)), 2)`,
            ultimoReporte: sql<Date>`MAX(${reportesPrecios.fechaCreacion})`,
            // Get user info from the most recent report using window functions
            ultimoUsuarioId: sql<string>`
              (ARRAY_AGG(${reportesPrecios.usuarioId} ORDER BY ${reportesPrecios.fechaCreacion} DESC))[1]
            `,
          })
          .from(reportesPrecios)
          .where(and(...conditions))
          .groupBy(reportesPrecios.tipoCombustible, reportesPrecios.horario)

        // Now get user info for the latest user IDs
        const userIds = userReportsRaw.map(r => r.ultimoUsuarioId).filter(Boolean)
        const usuarios = userIds.length > 0 ? await db!
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          })
          .from(user)
          .where(inArray(user.id, userIds)) : []

        // Combine user info with reports
        const userReports = userReportsRaw.map(report => {
          const usuario = usuarios.find(u => u.id === report.ultimoUsuarioId)
          return {
            ...report,
            ultimoUsuarioNombre: usuario?.name || null,
            ultimoUsuarioEmail: usuario?.email || null,
            ultimoUsuarioImagen: usuario?.image || null,
          }
        })

        // Also fetch individual reports for detailed view with user information
        const individualReports = await db!
          .select({
            id: reportesPrecios.id,
            tipoCombustible: reportesPrecios.tipoCombustible,
            // Convert decimal to number explicitly
            precio: sql<number>`ROUND(CAST(${reportesPrecios.precio} AS NUMERIC), 2)`,
            horario: reportesPrecios.horario,
            notas: reportesPrecios.notas,
            fechaCreacion: reportesPrecios.fechaCreacion,
            usuarioId: reportesPrecios.usuarioId,
            // Include user info for avatar
            usuarioNombre: user.name,
            usuarioEmail: user.email,
            usuarioImagen: user.image,
          })
          .from(reportesPrecios)
          .leftJoin(user, eq(reportesPrecios.usuarioId, user.id))
          .where(and(...conditions))
          .orderBy(sql`${reportesPrecios.fechaCreacion} DESC`)
          .limit(50) // Limit to avoid too much data

        return { resumen: userReports, reportes: individualReports }
      },
      cacheKey,
      { tags: [tag], revalidate: 300 }
    )

    const data = await getReportsCached()
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Error fetching user price reports:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}