import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios } from '@/drizzle/schema'
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm'
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
  lat: z.string().optional(),
  lng: z.string().optional(),
  radius: z.string().optional(),
  empresa: z.string().optional(),
  provincia: z.string().optional(),
  localidad: z.string().optional(),
  combustible: z.string().optional(),
  horario: z.enum(['diurno', 'nocturno']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

export async function GET(request: NextRequest) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    console.log('🔍 Starting estaciones API request')
    
    // Create database connection
    db = createDbConnection()
    console.log('✅ Database connection created')
    
    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))
    
    console.log('📊 Search params:', params)

    const lat = params.lat ? parseFloat(params.lat) : undefined
    const lng = params.lng ? parseFloat(params.lng) : undefined
    const radius = params.radius ? parseFloat(params.radius) : 10 // default 10km
    const limit = params.limit ? parseInt(params.limit) : 50
    const offset = params.offset ? parseInt(params.offset) : 0

    let query = db
      .select({
        id: estaciones.id,
        nombre: estaciones.nombre,
        empresa: estaciones.empresa,
        direccion: estaciones.direccion,
        localidad: estaciones.localidad,
        provincia: estaciones.provincia,
        latitud: estaciones.latitud,
        longitud: estaciones.longitud,
        fechaActualizacion: estaciones.fechaActualizacion,
        // Calculate distance if lat/lng provided
        distancia: lat && lng 
          ? sql<number>`
              (6371 * acos(
                cos(radians(${lat})) * 
                cos(radians(${estaciones.latitud})) * 
                cos(radians(${estaciones.longitud}) - radians(${lng})) + 
                sin(radians(${lat})) * 
                sin(radians(${estaciones.latitud}))
              ))
            `.as('distancia')
          : sql<null>`null`.as('distancia')
      })
      .from(estaciones)

    // Apply filters
    const conditions = []

    if (params.empresa) {
      const empresas = params.empresa.split(',')
      if (empresas.length === 1) {
        conditions.push(eq(estaciones.empresa, empresas[0]))
      } else {
        conditions.push(sql`${estaciones.empresa} = ANY(${empresas})`)
      }
    }

    if (params.provincia) {
      conditions.push(eq(estaciones.provincia, params.provincia))
    }

    if (params.localidad) {
      conditions.push(eq(estaciones.localidad, params.localidad))
    }

    // Distance filter (if lat/lng provided)
    if (lat && lng && radius) {
      conditions.push(
        sql`
          (6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(${estaciones.latitud})) * 
            cos(radians(${estaciones.longitud}) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(${estaciones.latitud}))
          )) <= ${radius}
        `
      )
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    // Order by distance if location provided, otherwise by name
    if (lat && lng) {
      query = query.orderBy(sql`distancia ASC`)
    } else {
      query = query.orderBy(asc(estaciones.nombre))
    }

    query = query.limit(limit).offset(offset)

    console.log('🔍 Executing stations query...')
    const result = await query
    console.log(`📊 Found ${result.length} stations`)

    // Get current prices for each station (simplified query)
    let stationsWithPrices = result
    
    if (result.length > 0) {
      try {
        const stationIds = result.map(s => s.id)
        console.log(`🔍 Fetching prices for ${stationIds.length} stations`)
        
        const currentPrices = await db
          .select({
            estacionId: precios.estacionId,
            tipoCombustible: precios.tipoCombustible,
            precio: precios.precio,
            horario: precios.horario,
            fechaReporte: precios.fechaReporte,
            fuente: precios.fuente,
            esValidado: precios.esValidado,
          })
          .from(precios)
          .where(and(
            inArray(precios.estacionId, stationIds),
            eq(precios.horario, params.horario || 'diurno')
          ))
          .orderBy(desc(precios.fechaVigencia))
          .limit(500) // Reasonable limit
        
        console.log(`📊 Found ${currentPrices.length} prices`)
        
        // Group prices by station
        const pricesByStation = currentPrices.reduce((acc, price) => {
          if (!acc[price.estacionId]) {
            acc[price.estacionId] = []
          }
          acc[price.estacionId].push(price)
          return acc
        }, {} as Record<string, typeof currentPrices>)

        // Combine stations with their prices
        stationsWithPrices = result.map(station => ({
          ...station,
          precios: pricesByStation[station.id] || []
        }))
        
      } catch (priceError) {
        console.warn('⚠️  Error fetching prices, returning stations only:', priceError)
        stationsWithPrices = result.map(station => ({
          ...station,
          precios: []
        }))
      }
    }

    return NextResponse.json({
      data: stationsWithPrices,
      pagination: {
        limit,
        offset,
        total: result.length,
        hasMore: result.length === limit
      }
    })

  } catch (error) {
    console.error('❌ Error fetching estaciones:', error)
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