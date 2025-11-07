import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones, precios } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const crearPrecioRapidoSchema = z.object({
  estacionId: z.string().uuid(),
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().positive(),
  horario: z.enum(['diurno', 'nocturno']),
})

export async function POST(request: NextRequest) {
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

    // Validar datos de entrada
    const body = await request.json()
    const validatedData = crearPrecioRapidoSchema.parse(body)

    // Verificar que la estación existe y pertenece al usuario
    const estacion = await db.query.estaciones.findFirst({
      where: eq(estaciones.id, validatedData.estacionId),
    })

    if (!estacion) {
      return NextResponse.json(
        { error: 'Estación no encontrada' },
        { status: 404 }
      )
    }

    if (estacion.usuarioCreadorId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para cargar precios en esta estación' },
        { status: 403 }
      )
    }

    // Verificar que la estación esté aprobada
    if (estacion.estado !== 'aprobado') {
      return NextResponse.json(
        { 
          error: 'Solo puedes cargar precios en estaciones aprobadas',
          estado: estacion.estado,
        },
        { status: 403 }
      )
    }

    // Crear el precio
    const [nuevoPrecio] = await db.insert(precios).values({
      estacionId: validatedData.estacionId,
      tipoCombustible: validatedData.tipoCombustible,
      precio: validatedData.precio,
      horario: validatedData.horario,
      fuente: 'usuario',
      usuarioId: session.user.id,
      esValidado: true, // Los precios del dueño de la estación se consideran validados
      fechaVigencia: new Date(),
      fechaReporte: new Date(),
    }).returning()

    return NextResponse.json({
      success: true,
      precio: nuevoPrecio,
      message: 'Precio cargado exitosamente',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al crear precio rápido:', error)
    return NextResponse.json(
      { error: 'Error al cargar el precio' },
      { status: 500 }
    )
  }
}

