import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones, precios } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const crearPrecioRapidoSchema = z.object({
  estacionId: z.string().min(1, 'ID de estación requerido'),
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().positive(),
  horario: z.enum(['diurno', 'nocturno', 'ambos']),
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

    // Verificar precios existentes para evitar duplicados
    const preciosExistentes = await db.query.precios.findMany({
      where: and(
        eq(precios.estacionId, validatedData.estacionId),
        eq(precios.tipoCombustible, validatedData.tipoCombustible),
        eq(precios.fuente, 'usuario')
      ),
    })

    const tieneDiurno = preciosExistentes.some(p => p.horario === 'diurno')
    const tieneNocturno = preciosExistentes.some(p => p.horario === 'nocturno')

    // Crear el precio (o precios si es 'ambos')
    let nuevosPrecios = []

    if (validatedData.horario === 'ambos') {
      // Crear los horarios que no existan
      const valoresAInsertar = []
      
      if (!tieneDiurno) {
        valoresAInsertar.push({
          estacionId: validatedData.estacionId,
          tipoCombustible: validatedData.tipoCombustible,
          precio: validatedData.precio,
          horario: 'diurno' as const,
          fuente: 'usuario' as const,
          usuarioId: session.user.id,
          esValidado: true,
          fechaVigencia: new Date(),
          fechaReporte: new Date(),
        })
      }
      
      if (!tieneNocturno) {
        valoresAInsertar.push({
          estacionId: validatedData.estacionId,
          tipoCombustible: validatedData.tipoCombustible,
          precio: validatedData.precio,
          horario: 'nocturno' as const,
          fuente: 'usuario' as const,
          usuarioId: session.user.id,
          esValidado: true,
          fechaVigencia: new Date(),
          fechaReporte: new Date(),
        })
      }

      if (valoresAInsertar.length > 0) {
        nuevosPrecios = await db.insert(precios).values(valoresAInsertar).returning()
      }

      // Si ambos ya existían, actualizar el existente
      if (tieneDiurno && tieneNocturno) {
        const precioDiurno = preciosExistentes.find(p => p.horario === 'diurno')
        const precioNocturno = preciosExistentes.find(p => p.horario === 'nocturno')
        
        await db.update(precios)
          .set({ 
            precio: validatedData.precio,
            fechaVigencia: new Date(),
            fechaReporte: new Date(),
          })
          .where(
            and(
              eq(precios.estacionId, validatedData.estacionId),
              eq(precios.tipoCombustible, validatedData.tipoCombustible),
              eq(precios.fuente, 'usuario')
            )
          )
        
        return NextResponse.json({
          success: true,
          message: 'Precios actualizados para ambos horarios',
        })
      }
    } else {
      // Verificar si ya existe para este horario específico
      const yaExiste = validatedData.horario === 'diurno' ? tieneDiurno : tieneNocturno

      if (yaExiste) {
        // Actualizar el existente
        await db.update(precios)
          .set({
            precio: validatedData.precio,
            fechaVigencia: new Date(),
            fechaReporte: new Date(),
          })
          .where(
            and(
              eq(precios.estacionId, validatedData.estacionId),
              eq(precios.tipoCombustible, validatedData.tipoCombustible),
              eq(precios.horario, validatedData.horario),
              eq(precios.fuente, 'usuario')
            )
          )
        
        return NextResponse.json({
          success: true,
          message: 'Precio actualizado exitosamente',
        })
      } else {
        // Crear nuevo registro
        nuevosPrecios = await db.insert(precios).values({
          estacionId: validatedData.estacionId,
          tipoCombustible: validatedData.tipoCombustible,
          precio: validatedData.precio,
          horario: validatedData.horario,
          fuente: 'usuario',
          usuarioId: session.user.id,
          esValidado: true,
          fechaVigencia: new Date(),
          fechaReporte: new Date(),
        }).returning()
      }
    }

    return NextResponse.json({
      success: true,
      precios: nuevosPrecios,
      message: validatedData.horario === 'ambos' 
        ? 'Precios cargados para ambos horarios' 
        : 'Precio cargado exitosamente',
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

