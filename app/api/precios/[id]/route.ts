import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones, precios } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const actualizarPrecioSchema = z.object({
  precio: z.number().positive('El precio debe ser mayor a 0'),
  horario: z.enum(['diurno', 'nocturno']).optional(),
})

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

    const { id: precioId } = await params

    // Validar datos de entrada
    const body = await request.json()
    const validatedData = actualizarPrecioSchema.parse(body)

    // Verificar que el precio existe
    const precioExistente = await db.query.precios.findFirst({
      where: eq(precios.id, precioId),
      with: {
        estacion: true,
      },
    })

    if (!precioExistente) {
      return NextResponse.json(
        { error: 'Precio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la estación pertenece al usuario
    if (precioExistente.estacion?.usuarioCreadorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar este precio' },
        { status: 403 }
      )
    }

    // Actualizar el precio
    const updateData: any = {
      precio: validatedData.precio,
      fechaVigencia: new Date(),
      fechaReporte: new Date(),
    }

    if (validatedData.horario !== undefined) {
      updateData.horario = validatedData.horario
    }

    const [precioActualizado] = await db
      .update(precios)
      .set(updateData)
      .where(eq(precios.id, precioId))
      .returning()

    return NextResponse.json({
      success: true,
      precio: precioActualizado,
      message: 'Precio actualizado exitosamente',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al actualizar precio:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el precio' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { id: precioId } = await params

    // Verificar que el precio existe
    const precioExistente = await db.query.precios.findFirst({
      where: eq(precios.id, precioId),
      with: {
        estacion: true,
      },
    })

    if (!precioExistente) {
      return NextResponse.json(
        { error: 'Precio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la estación pertenece al usuario
    if (precioExistente.estacion?.usuarioCreadorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este precio' },
        { status: 403 }
      )
    }

    // Eliminar el precio
    await db.delete(precios).where(eq(precios.id, precioId))

    return NextResponse.json({
      success: true,
      message: 'Precio eliminado exitosamente',
    })
  } catch (error) {
    console.error('Error al eliminar precio:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el precio' },
      { status: 500 }
    )
  }
}

