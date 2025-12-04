import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { confirmacionesPrecios, precios, estaciones } from '@/drizzle/schema'
import { eq, and, count, desc } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

const confirmPriceSchema = z.object({
  precioId: z.string(),
})

const searchParamsSchema = z.object({
  precioId: z.string().optional(),
  usuarioId: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))

    const limit = params.limit ? parseInt(params.limit) : 20
    const offset = params.offset ? parseInt(params.offset) : 0

    // Apply filters
    const conditions = []

    if (params.precioId) {
      conditions.push(eq(confirmacionesPrecios.precioId, params.precioId))
    }

    if (params.usuarioId) {
      conditions.push(eq(confirmacionesPrecios.usuarioId, params.usuarioId))
    }

    // Build query with conditional where clause
    const baseQuery = db
      .select({
        id: confirmacionesPrecios.id,
        precioId: confirmacionesPrecios.precioId,
        usuarioId: confirmacionesPrecios.usuarioId,
        fechaCreacion: confirmacionesPrecios.fechaCreacion,
        // Include price and station details for context
        precio: precios.precio,
        tipoCombustible: precios.tipoCombustible,
        horario: precios.horario,
        estacionNombre: estaciones.nombre,
        estacionEmpresa: estaciones.empresa,
      })
      .from(confirmacionesPrecios)
      .leftJoin(precios, eq(confirmacionesPrecios.precioId, precios.id))
      .leftJoin(estaciones, eq(precios.estacionId, estaciones.id))

    const result = conditions.length > 0
      ? await baseQuery
          .where(and(...conditions))
          .orderBy(desc(confirmacionesPrecios.fechaCreacion))
          .limit(limit)
          .offset(offset)
      : await baseQuery
          .orderBy(desc(confirmacionesPrecios.fechaCreacion))
          .limit(limit)
          .offset(offset)

    return NextResponse.json({
      data: result,
      pagination: {
        limit,
        offset,
        total: result.length,
        hasMore: result.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching confirmaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = confirmPriceSchema.parse(body)

    // Verify price exists and is user-reported (not official)
    const price = await db
      .select({
        id: precios.id,
        fuente: precios.fuente,
        usuarioId: precios.usuarioId,
        estacionId: precios.estacionId,
      })
      .from(precios)
      .where(eq(precios.id, validatedData.precioId))
      .limit(1)

    if (price.length === 0) {
      return NextResponse.json(
        { error: 'Precio no encontrado' },
        { status: 404 }
      )
    }

    // Only user-reported prices can be confirmed, not official ones
    if (price[0].fuente === 'oficial') {
      return NextResponse.json(
        { error: 'No se pueden confirmar precios oficiales' },
        { status: 400 }
      )
    }

    // Users cannot confirm their own price reports
    if (price[0].usuarioId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes confirmar tus propios reportes de precios' },
        { status: 400 }
      )
    }

    // Check if user already confirmed this price
    const existingConfirmation = await db
      .select()
      .from(confirmacionesPrecios)
      .where(and(
        eq(confirmacionesPrecios.precioId, validatedData.precioId),
        eq(confirmacionesPrecios.usuarioId, session.user.id)
      ))
      .limit(1)

    if (existingConfirmation.length > 0) {
      return NextResponse.json(
        { error: 'Ya confirmaste este precio anteriormente' },
        { status: 400 }
      )
    }

    // Create new confirmation
    const newConfirmation = await db
      .insert(confirmacionesPrecios)
      .values({
        precioId: validatedData.precioId,
        usuarioId: session.user.id,
        fechaCreacion: new Date(),
      })
      .returning()

    // Get confirmation count for this price
    const confirmationCount = await db
      .select({ count: count() })
      .from(confirmacionesPrecios)
      .where(eq(confirmacionesPrecios.precioId, validatedData.precioId))

    // Optionally update the price validation status based on confirmations
    // For example, if a price has 3+ confirmations, mark it as validated
    if (confirmationCount[0].count >= 3) {
      await db
        .update(precios)
        .set({ esValidado: true })
        .where(eq(precios.id, validatedData.precioId))
    }

    return NextResponse.json({
      ...newConfirmation[0],
      confirmationCount: confirmationCount[0].count
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating confirmation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const precioId = searchParams.get('precioId')

    if (!precioId) {
      return NextResponse.json(
        { error: 'precioId es requerido' },
        { status: 400 }
      )
    }

    // Delete the confirmation (users can only delete their own confirmations)
    const deletedConfirmation = await db
      .delete(confirmacionesPrecios)
      .where(and(
        eq(confirmacionesPrecios.precioId, precioId),
        eq(confirmacionesPrecios.usuarioId, session.user.id)
      ))
      .returning()

    if (deletedConfirmation.length === 0) {
      return NextResponse.json(
        { error: 'Confirmación no encontrada o no tienes permisos para eliminarla' },
        { status: 404 }
      )
    }

    // Get updated confirmation count
    const confirmationCount = await db
      .select({ count: count() })
      .from(confirmacionesPrecios)
      .where(eq(confirmacionesPrecios.precioId, precioId))

    // Update validation status if confirmations drop below threshold
    if (confirmationCount[0].count < 3) {
      await db
        .update(precios)
        .set({ esValidado: false })
        .where(eq(precios.id, precioId))
    }

    return NextResponse.json({
      message: 'Confirmación eliminada',
      confirmationCount: confirmationCount[0].count
    })

  } catch (error) {
    console.error('Error deleting confirmation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}