import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'

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

    // Cambiar estado a pendiente nuevamente
    await db.update(estaciones)
      .set({
        estado: 'pendiente',
        fechaActualizacion: new Date(),
      })
      .where(eq(estaciones.id, estacionId))

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

