import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { precios, estaciones } from '@/drizzle/schema'
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm'
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
  estacionId: z.string().optional(),
  tipoCombustible: z.string().optional(),
  horario: z.enum(['diurno', 'nocturno']).optional(),
  fuente: z.enum(['oficial', 'usuario']).optional(),
  esValidado: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  empresa: z.string().optional(),
  provincia: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  orderBy: z.enum(['precio', 'fecha', 'estacion']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
})

export async function GET(request: NextRequest) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    console.log('🔍 Starting precios API request')
    
    // Create database connection
    db = createDbConnection()
    console.log('✅ Database connection created')
    
    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))
    
    console.log('📊 Search params:', params)

    const limit = params.limit ? parseInt(params.limit) : 50
    const offset = params.offset ? parseInt(params.offset) : 0
    const orderBy = params.orderBy || 'fecha'
    const orderDir = params.orderDir || 'desc'

    let query = db
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

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    // Apply ordering
    switch (orderBy) {
      case 'precio':
        query = orderDir === 'asc' 
          ? query.orderBy(asc(precios.precio))
          : query.orderBy(desc(precios.precio))
        break
      case 'estacion':
        query = orderDir === 'asc'
          ? query.orderBy(asc(estaciones.nombre))
          : query.orderBy(desc(estaciones.nombre))
        break
      case 'fecha':
      default:
        query = orderDir === 'asc'
          ? query.orderBy(asc(precios.fechaVigencia))
          : query.orderBy(desc(precios.fechaVigencia))
        break
    }

    query = query.limit(limit).offset(offset)

    const result = await query

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
    console.error('❌ Error fetching precios:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    })
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}