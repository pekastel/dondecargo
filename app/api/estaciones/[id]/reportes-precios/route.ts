import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { reportesPrecios } from '@/drizzle/schema'
import { eq, and, sql, gte } from 'drizzle-orm'
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
  tipoCombustible: z.string().optional(),
  horario: z.enum(['diurno', 'nocturno']).optional(),
  dias: z.string().optional(), // Number of days to look back
})

interface RouteParams {
  params: { id: string }
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

    // Fetch user reports with aggregation
    const userReports = await db
      .select({
        tipoCombustible: reportesPrecios.tipoCombustible,
        horario: reportesPrecios.horario,
        precioPromedio: sql<number>`AVG(${reportesPrecios.precio})`,
        cantidadReportes: sql<number>`COUNT(*)`,
        precioMinimo: sql<number>`MIN(${reportesPrecios.precio})`,
        precioMaximo: sql<number>`MAX(${reportesPrecios.precio})`,
        ultimoReporte: sql<Date>`MAX(${reportesPrecios.fechaCreacion})`,
      })
      .from(reportesPrecios)
      .where(and(...conditions))
      .groupBy(reportesPrecios.tipoCombustible, reportesPrecios.horario)

    // Also fetch individual reports for detailed view
    const individualReports = await db
      .select({
        id: reportesPrecios.id,
        tipoCombustible: reportesPrecios.tipoCombustible,
        precio: reportesPrecios.precio,
        horario: reportesPrecios.horario,
        notas: reportesPrecios.notas,
        fechaCreacion: reportesPrecios.fechaCreacion,
        usuarioId: reportesPrecios.usuarioId,
      })
      .from(reportesPrecios)
      .where(and(...conditions))
      .orderBy(sql`${reportesPrecios.fechaCreacion} DESC`)
      .limit(50) // Limit to avoid too much data

    return NextResponse.json({
      resumen: userReports,
      reportes: individualReports,
    })

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