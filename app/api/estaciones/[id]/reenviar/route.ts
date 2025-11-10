import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones, user, moderacionesEstaciones } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import { sendStationResubmittedEmail } from '@/lib/email'
import { safeLog } from '@/lib/utils/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id: estacionId } = await params

    // Verificar que la estación existe y pertenece al usuario
    const estacion = await db.query.estaciones.findFirst({
      where: eq(estaciones.id, estacionId),
    })

    if (!estacion) {
      return NextResponse.json(
        { error: 'Estación no encontrada' },
        { status: 404 }
      )
    }

    if (estacion.usuarioCreadorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para re-enviar esta estación' },
        { status: 403 }
      )
    }

    // Verificar que la estación esté rechazada
    if (estacion.estado !== 'rechazado') {
      return NextResponse.json(
        { error: 'Solo puedes re-enviar estaciones que hayan sido rechazadas' },
        { status: 400 }
      )
    }

    // Obtener el motivo previo de rechazo (última moderación de tipo 'rechazar')
    const ultimaModeracion = await db.query.moderacionesEstaciones.findFirst({
      where: and(
        eq(moderacionesEstaciones.estacionId, estacionId),
        eq(moderacionesEstaciones.accion, 'rechazar')
      ),
      orderBy: desc(moderacionesEstaciones.fechaModeracion),
    })

    // Cambiar estado a pendiente nuevamente
    await db.update(estaciones)
      .set({
        estado: 'pendiente',
        fechaActualizacion: new Date(),
      })
      .where(eq(estaciones.id, estacionId))

    // Enviar emails de notificación
    try {
      // Obtener datos completos del usuario para los emails
      const userData = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      })

      if (userData?.email) {
        await sendStationResubmittedEmail({
          user: {
            id: session.user.id,
            email: userData.email,
            name: userData.name || 'Usuario',
          },
          stationName: estacion.nombre,
          address: estacion.direccion,
          previousReason: ultimaModeracion?.motivo || undefined,
        })

        safeLog(`✅ Resubmission emails sent for station: ${estacion.nombre}`)
      }
    } catch (emailError) {
      // No fallar la resubmisión si el email falla
      console.error('Failed to send resubmission emails:', emailError)
      safeLog('⚠️ Email sending failed, but station was resubmitted')
    }

    return NextResponse.json({
      success: true,
      message: 'Estación re-enviada para moderación',
    })
  } catch (error) {
    console.error('Error al re-enviar estación:', error)
    return NextResponse.json(
      { error: 'Error al re-enviar la estación' },
      { status: 500 }
    )
  }
}

