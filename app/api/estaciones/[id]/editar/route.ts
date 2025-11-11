import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones, estacionesDatosAdicionales } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const editarEstacionSchema = z.object({
  nombre: z.string().min(3).max(200).optional(),
  empresa: z.string().min(2).max(100).optional(),
  direccion: z.string().min(5).max(300).optional(),
  localidad: z.string().min(2).max(100).optional(),
  provincia: z.string().min(2).max(100).optional(),
  cuit: z.union([
    z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'Formato de CUIT inválido: XX-XXXXXXXX-X'),
    z.literal('')
  ]).optional(),
  datosAdicionales: z.object({
    telefono: z.string().optional(),
    horarios: z.record(z.string()).optional(),
    servicios: z.record(z.boolean()).optional(),
  }).optional(),
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

    // Permitir edición si el usuario es admin o es el creador de la estación
    if (estacion.usuarioCreadorId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta estación' },
        { status: 403 }
      )
    }

    // Validar datos de entrada
    const body = await request.json()
    const validatedData = editarEstacionSchema.parse(body)

    // Actualizar datos de la estación (excepto ubicación)
    const updateData: any = {}
    
    if (validatedData.nombre !== undefined) updateData.nombre = validatedData.nombre
    if (validatedData.empresa !== undefined) updateData.empresa = validatedData.empresa
    if (validatedData.direccion !== undefined) updateData.direccion = validatedData.direccion
    if (validatedData.localidad !== undefined) updateData.localidad = validatedData.localidad
    if (validatedData.provincia !== undefined) updateData.provincia = validatedData.provincia
    // Solo actualizar CUIT si se proporciona un valor válido (no vacío)
    if (validatedData.cuit !== undefined && validatedData.cuit !== '') {
      updateData.cuit = validatedData.cuit
    }

    // Solo actualizar si hay cambios en estaciones
    if (Object.keys(updateData).length > 0) {
      updateData.fechaActualizacion = new Date()
      
      await db.update(estaciones)
        .set(updateData)
        .where(eq(estaciones.id, estacionId))
    }

    // Actualizar datos adicionales si existen
    if (validatedData.datosAdicionales) {
      const datosAdicionalesExistentes = await db.query.estacionesDatosAdicionales.findFirst({
        where: eq(estacionesDatosAdicionales.estacionId, estacionId),
      })

      const datosUpdate: any = {}
      if (validatedData.datosAdicionales.telefono !== undefined) {
        datosUpdate.telefono = validatedData.datosAdicionales.telefono || null
      }
      if (validatedData.datosAdicionales.horarios !== undefined) {
        datosUpdate.horarios = validatedData.datosAdicionales.horarios
      }
      if (validatedData.datosAdicionales.servicios !== undefined) {
        datosUpdate.servicios = validatedData.datosAdicionales.servicios
      }

      if (datosAdicionalesExistentes) {
        // Actualizar existente
        await db.update(estacionesDatosAdicionales)
          .set(datosUpdate)
          .where(eq(estacionesDatosAdicionales.estacionId, estacionId))
      } else {
        // Crear nuevo
        await db.insert(estacionesDatosAdicionales).values({
          estacionId,
          ...datosUpdate,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Estación actualizada exitosamente',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al editar estación:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la estación' },
      { status: 500 }
    )
  }
}

