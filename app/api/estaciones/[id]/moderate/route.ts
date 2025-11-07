import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, moderacionesEstaciones, user } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createErrorResponse, handleDatabaseError, safeLog } from '@/lib/utils/errors'
import { sendStationApprovedEmail, sendStationRejectedEmail } from '@/lib/email'

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

// Schema de validación para moderar estación
const moderateStationSchema = z.object({
  action: z.enum(['aprobar', 'rechazar'], {
    errorMap: () => ({ message: 'La acción debe ser "aprobar" o "rechazar"' })
  }),
  motivo: z.string().optional(), // Opcional, útil para explicar rechazo
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    const { id } = await context.params
    safeLog(`🔍 Starting moderate station API request for ID: ${id}`)
    
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
        { error: 'No autorizado. Solo los administradores pueden moderar estaciones.' },
        { status: 403 }
      )
    }
    
    safeLog(`👤 Admin user authenticated: ${session.user.id}`)
    
    // Create database connection
    db = createDbConnection()
    safeLog('✅ Database connection created')
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = moderateStationSchema.parse(body)
    
    safeLog('✅ Request body validated')
    
    // Verificar que la estación existe
    const existingStation = await db
      .select()
      .from(estaciones)
      .where(eq(estaciones.id, id))
      .limit(1)
    
    if (existingStation.length === 0) {
      return NextResponse.json(
        { error: 'Estación no encontrada' },
        { status: 404 }
      )
    }
    
    const station = existingStation[0]
    
    // Verificar que la estación es de tipo usuario
    if (station.fuente !== 'usuario') {
      return NextResponse.json(
        { error: 'Solo se pueden moderar estaciones creadas por usuarios' },
        { status: 400 }
      )
    }
    
    // Verificar que la estación está pendiente
    if (station.estado !== 'pendiente') {
      return NextResponse.json(
        { error: `La estación ya está en estado "${station.estado}"` },
        { status: 400 }
      )
    }
    
    // Determinar nuevo estado
    const nuevoEstado = validatedData.action === 'aprobar' ? 'aprobado' : 'rechazado'
    
    // Actualizar estado de la estación
    const updated = await db
      .update(estaciones)
      .set({
        estado: nuevoEstado,
        fechaActualizacion: new Date(),
      })
      .where(eq(estaciones.id, id))
      .returning()
    
    safeLog(`✅ Station ${id} ${nuevoEstado}: ${updated[0].nombre}`)
    
    // Guardar en historial de moderaciones
    await db.insert(moderacionesEstaciones).values({
      estacionId: id,
      moderadorId: session.user.id,
      accion: validatedData.action,
      motivo: validatedData.motivo || null,
    })
    
    safeLog(`✅ Moderation history saved`)
    
    // Obtener datos del usuario creador para enviar email
    if (station.usuarioCreadorId) {
      const usuarioCreador = await db
        .select()
        .from(user)
        .where(eq(user.id, station.usuarioCreadorId))
        .limit(1)
      
      if (usuarioCreador.length > 0) {
        const usuario = usuarioCreador[0]
        
        try {
          if (validatedData.action === 'aprobar') {
            await sendStationApprovedEmail({
              user: {
                id: usuario.id,
                email: usuario.email,
                name: usuario.name || 'Usuario',
              },
              stationName: updated[0].nombre,
              address: updated[0].direccion,
            })
            safeLog(`✅ Approval email sent to ${usuario.email}`)
          } else {
            await sendStationRejectedEmail({
              user: {
                id: usuario.id,
                email: usuario.email,
                name: usuario.name || 'Usuario',
              },
              stationName: updated[0].nombre,
              address: updated[0].direccion,
              motivo: validatedData.motivo,
            })
            safeLog(`✅ Rejection email sent to ${usuario.email}`)
          }
        } catch (emailError) {
          // Email is non-critical, log but don't fail the moderation
          console.error('Failed to send moderation email:', emailError)
          safeLog('⚠️ Email send failed, but moderation was successful')
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Estación ${nuevoEstado === 'aprobado' ? 'aprobada' : 'rechazada'} exitosamente`,
      data: {
        id: updated[0].id,
        nombre: updated[0].nombre,
        estado: updated[0].estado,
        motivo: validatedData.motivo,
      }
    })
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'moderate station API validation',
        error,
        400,
        'Datos de moderación inválidos',
        error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return handleDatabaseError('moderate station API', error);
    }

    // Generic error handling
    return createErrorResponse(
      'moderate station API',
      error,
      500,
      'Error al moderar la estación'
    );
  }
}

