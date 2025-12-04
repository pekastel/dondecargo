import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { precios, estaciones } from '@/drizzle/schema'
import { eq, and, desc, asc, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { createErrorResponse, handleDatabaseError, safeLog } from '@/lib/utils/errors'

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
  estacionId: z.string().optional(),
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc'] as const).optional(),
  horario: z.enum(['diurno', 'nocturno'] as const).optional(),
  fuente: z.enum(['oficial', 'usuario'] as const).optional(),
  esValidado: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  empresa: z.string().optional(),
  provincia: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  orderBy: z.enum(['precio', 'fecha', 'estacion'] as const).optional(),
  orderDir: z.enum(['asc', 'desc'] as const).optional(),
})

export async function GET(request: NextRequest) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    safeLog('🔍 Starting precios API request')
    
    // Create database connection
    db = createDbConnection()
    safeLog('✅ Database connection created')
    
    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))

    const limit = params.limit ? parseInt(params.limit) : 50
    const offset = params.offset ? parseInt(params.offset) : 0
    const orderBy = params.orderBy || 'fecha'
    const orderDir = params.orderDir || 'desc'

    // Apply filters
    const conditions = []

    if (params.estacionId) {
      conditions.push(eq(precios.estacionId, params.estacionId))
    }

    if (params.tipoCombustible) {
      conditions.push(eq(precios.tipoCombustible, params.tipoCombustible))
    }

    if (params.horario) {
      conditions.push(eq(precios.horario, params.horario))
    }

    if (params.fuente) {
      conditions.push(eq(precios.fuente, params.fuente))
    }

    if (params.esValidado !== undefined) {
      conditions.push(eq(precios.esValidado, params.esValidado === 'true'))
    }

    if (params.fechaDesde) {
      conditions.push(gte(precios.fechaVigencia, new Date(params.fechaDesde)))
    }

    if (params.fechaHasta) {
      conditions.push(lte(precios.fechaVigencia, new Date(params.fechaHasta)))
    }

    if (params.empresa) {
      conditions.push(eq(estaciones.empresa, params.empresa))
    }

    if (params.provincia) {
      conditions.push(eq(estaciones.provincia, params.provincia))
    }

    // Build the base query
    const baseQuery = db
      .select({
        id: precios.id,
        estacionId: precios.estacionId,
        tipoCombustible: precios.tipoCombustible,
        precio: precios.precio,
        horario: precios.horario,
        fechaVigencia: precios.fechaVigencia,
        fuente: precios.fuente,
        esValidado: precios.esValidado,
        fechaReporte: precios.fechaReporte,
        notas: precios.notas,
        // Include station details
        estacionNombre: estaciones.nombre,
        estacionEmpresa: estaciones.empresa,
        estacionDireccion: estaciones.direccion,
        estacionLocalidad: estaciones.localidad,
        estacionProvincia: estaciones.provincia,
      })
      .from(precios)
      .leftJoin(estaciones, eq(precios.estacionId, estaciones.id))

    // Determine ordering
    const orderColumn = orderBy === 'precio' ? precios.precio 
      : orderBy === 'estacion' ? estaciones.nombre 
      : precios.fechaVigencia
    const orderFn = orderDir === 'asc' ? asc : desc

    // Execute query with conditional where
    const result = conditions.length > 0
      ? await baseQuery
          .where(and(...conditions))
          .orderBy(orderFn(orderColumn))
          .limit(limit)
          .offset(offset)
      : await baseQuery
          .orderBy(orderFn(orderColumn))
          .limit(limit)
          .offset(offset)

    return NextResponse.json({
      data: result,
      pagination: {
        limit,
        offset,
        total: result.length,
        hasMore: result.length === limit
      }
    })

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'precios API validation',
        error,
        400,
        'Parámetros de búsqueda inválidos'
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return handleDatabaseError('precios API', error);
    }

    // Generic error handling
    return createErrorResponse(
      'precios API',
      error,
      500,
      'Error al obtener precios'
    );
  }
}