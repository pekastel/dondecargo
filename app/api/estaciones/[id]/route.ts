import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios, preciosHistorico } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import { createErrorResponse, handleDatabaseError, handleNotFoundError, safeLog } from '@/lib/utils/errors'

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
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  let db: ReturnType<typeof createDbConnection> | null = null
  const { id } = await params
  
  try {
    safeLog(`🔍 Starting station detail API request for ID: ${id}`)
    
    // Create database connection
    db = createDbConnection()
    safeLog('✅ Database connection created')

    // Get station details
    safeLog(`🔍 Fetching station: ${id}`)
    const station = await db
      .select()
      .from(estaciones)
      .where(eq(estaciones.id, id))
      .limit(1)

    if (station.length === 0) {
      return handleNotFoundError('station details', 'Estación');
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
    // Handle database connection errors
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return handleDatabaseError('station details', error);
    }

    // Generic error handling
    return createErrorResponse(
      'station details',
      error,
      500,
      'Error al obtener detalles de la estación',
      { stationId: id }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  let db: ReturnType<typeof createDbConnection> | null = null
  const { id } = await params
  
  try {
    safeLog(`🗑️  Starting station deletion API request for ID: ${id}`)
    
    // Verificar autenticación
    const { auth: authLib } = await import('@/lib/auth')
    const session = await authLib.api.getSession({
      headers: request.headers
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }
    
    // Verificar que el usuario sea admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores pueden eliminar estaciones.' },
        { status: 403 }
      )
    }
    
    safeLog(`👤 Admin user authenticated: ${session.user.id}`)
    
    // Create database connection
    db = createDbConnection()
    safeLog('✅ Database connection created')

    // Verificar que la estación existe
    const station = await db
      .select()
      .from(estaciones)
      .where(eq(estaciones.id, id))
      .limit(1)

    if (station.length === 0) {
      return handleNotFoundError('station deletion', 'Estación');
    }

    // Eliminar la estación (cascade eliminará precios y datos adicionales)
    await db
      .delete(estaciones)
      .where(eq(estaciones.id, id))

    safeLog(`✅ Station ${id} deleted successfully`)

    return NextResponse.json({
      success: true,
      message: 'Estación eliminada exitosamente'
    })

  } catch (error) {
    // Handle database connection errors
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return handleDatabaseError('station deletion', error);
    }

    // Generic error handling
    return createErrorResponse(
      'station deletion',
      error,
      500,
      'Error al eliminar la estación',
      { stationId: id }
    );
  }
}