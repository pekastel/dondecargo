import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, estacionesDatosAdicionales } from '@/drizzle/schema'
import { user } from '@/drizzle/better-auth-schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
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

export async function GET(request: NextRequest) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    safeLog('🔍 Starting user stations API request')
    
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }
    
    // Verificar que el usuario sea admin
    const userRole = session.user.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores pueden ver estaciones de usuarios.' },
        { status: 403 }
      )
    }
    
    safeLog(`👤 Admin user authenticated: ${session.user.id}`)
    
    // Create database connection
    db = createDbConnection()
    safeLog('✅ Database connection created')
    
    // Obtener estaciones creadas por usuarios (fuente='usuario')
    const userStations = await db
      .select({
        id: estaciones.id,
        nombre: estaciones.nombre,
        empresa: estaciones.empresa,
        direccion: estaciones.direccion,
        localidad: estaciones.localidad,
        provincia: estaciones.provincia,
        latitud: estaciones.latitud,
        longitud: estaciones.longitud,
        googleMapsUrl: estaciones.googleMapsUrl,
        estado: estaciones.estado,
        fechaCreacion: estaciones.fechaCreacion,
        usuarioCreadorId: estaciones.usuarioCreadorId,
        usuarioCreadorName: user.name,
        usuarioCreadorEmail: user.email,
        // Datos adicionales
        horarios: estacionesDatosAdicionales.horarios,
        telefono: estacionesDatosAdicionales.telefono,
        servicios: estacionesDatosAdicionales.servicios,
      })
      .from(estaciones)
      .leftJoin(
        estacionesDatosAdicionales,
        eq(estaciones.id, estacionesDatosAdicionales.estacionId)
      )
      .leftJoin(
        user,
        eq(estaciones.usuarioCreadorId, user.id)
      )
      .where(eq(estaciones.fuente, 'usuario'))
      .orderBy(estaciones.fechaCreacion)
    
    safeLog(`📊 Found ${userStations.length} user-created stations`)
    
    // Formatear respuesta
    const formattedStations = userStations.map(station => ({
      id: station.id,
      nombre: station.nombre,
      empresa: station.empresa,
      direccion: station.direccion,
      localidad: station.localidad,
      provincia: station.provincia,
      latitud: station.latitud,
      longitud: station.longitud,
      googleMapsUrl: station.googleMapsUrl,
      estado: station.estado,
      fechaCreacion: station.fechaCreacion,
      usuarioCreador: station.usuarioCreadorId ? {
        id: station.usuarioCreadorId,
        name: station.usuarioCreadorName || 'Usuario',
        email: station.usuarioCreadorEmail || '',
      } : null,
      datosAdicionales: (station.horarios || station.telefono || station.servicios) ? {
        horarios: station.horarios || undefined,
        telefono: station.telefono || undefined,
        servicios: station.servicios || undefined,
      } : undefined,
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedStations,
      total: formattedStations.length,
    })
    
  } catch (error) {
    // Handle database connection errors
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return handleDatabaseError('user stations API', error);
    }

    // Generic error handling
    return createErrorResponse(
      'user stations API',
      error,
      500,
      'Error al obtener estaciones de usuarios'
    );
  }
}

