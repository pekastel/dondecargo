import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios, preciosHistorico } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'

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

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    const { id } = await params

    console.log(`🔍 Starting station detail API request for ID: ${id}`)
    
    // Create database connection
    db = createDbConnection()
    console.log('✅ Database connection created')
    

    // Get station details
    console.log(`🔍 Fetching station: ${id}`)
    const station = await db
      .select()
      .from(estaciones)
      .where(eq(estaciones.id, id))
      .limit(1)

    if (station.length === 0) {
      return NextResponse.json(
        { error: 'Estación no encontrada' },
        { status: 404 }
      )
    }

    // Get current prices for this station
    const currentPrices = await db
      .select()
      .from(precios)
      .where(eq(precios.estacionId, id))
      .orderBy(desc(precios.fechaVigencia))

    // Get price history (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const priceHistory = await db
      .select()
      .from(preciosHistorico)
      .where(
        and(
          eq(preciosHistorico.estacionId, id),
          // gte(preciosHistorico.fechaVigencia, thirtyDaysAgo)
        )
      )
      .orderBy(desc(preciosHistorico.fechaVigencia))
      .limit(100)

    const result = {
      ...station[0],
      precios: currentPrices,
      historial: priceHistory
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Error fetching station details:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      stationId: params.id,
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