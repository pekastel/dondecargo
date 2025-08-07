import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { reportesPrecios, estaciones, precios } from '@/drizzle/schema'
import { eq, and, desc, asc } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { sendReportPriceThankYouEmail } from '@/lib/email'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

const createReporteSchema = z.object({
  estacionId: z.string(),
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().positive(),
  horario: z.enum(['diurno', 'nocturno']),
  notas: z.string().optional(),
})

const searchParamsSchema = z.object({
  usuarioId: z.string().optional(),
  estacionId: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

export async function GET(request: NextRequest) {
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
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))

    const limit = params.limit ? parseInt(params.limit) : 20
    const offset = params.offset ? parseInt(params.offset) : 0

    let query = db
      .select({
        id: reportesPrecios.id,
        estacionId: reportesPrecios.estacionId,
        tipoCombustible: reportesPrecios.tipoCombustible,
        precio: reportesPrecios.precio,
        horario: reportesPrecios.horario,
        notas: reportesPrecios.notas,
        fechaCreacion: reportesPrecios.fechaCreacion,
        // Include station details
        estacionNombre: estaciones.nombre,
        estacionEmpresa: estaciones.empresa,
        estacionDireccion: estaciones.direccion,
      })
      .from(reportesPrecios)
      .leftJoin(estaciones, eq(reportesPrecios.estacionId, estaciones.id))

    // Apply filters
    const conditions = []

    // Users can only see their own reports unless they're admin
    if (session.user.role !== 'admin') {
      conditions.push(eq(reportesPrecios.usuarioId, session.user.id))
    }

    if (params.usuarioId && session.user.role === 'admin') {
      conditions.push(eq(reportesPrecios.usuarioId, params.usuarioId))
    }

    if (params.estacionId) {
      conditions.push(eq(reportesPrecios.estacionId, params.estacionId))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    query = query
      .orderBy(desc(reportesPrecios.fechaCreacion))
      .limit(limit)
      .offset(offset)

    const result = await query

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
    console.error('Error fetching reportes:', error)
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
    const validatedData = createReporteSchema.parse(body)

    // Verify station exists
    const station = await db
      .select()
      .from(estaciones)
      .where(eq(estaciones.id, validatedData.estacionId))
      .limit(1)

    if (station.length === 0) {
      return NextResponse.json(
        { error: 'Estación no encontrada' },
        { status: 404 }
      )
    }

    // Create new report
    const newReport = await db
      .insert(reportesPrecios)
      .values({
        ...validatedData,
        usuarioId: session.user.id,
        fechaCreacion: new Date(),
      })
      .returning()

    // Also create/update the price in the main prices table
    // This ensures user-reported prices are immediately visible
    try {
      await db
        .insert(precios)
        .values({
          estacionId: validatedData.estacionId,
          tipoCombustible: validatedData.tipoCombustible,
          precio: validatedData.precio.toString(),
          horario: validatedData.horario,
          fechaVigencia: new Date(),
          fuente: 'usuario',
          usuarioId: session.user.id,
          esValidado: false, // Will be validated by confirmations from other users
          fechaReporte: new Date(),
          notas: validatedData.notas || null,
        })
        .onConflictDoUpdate({
          target: [precios.estacionId, precios.tipoCombustible, precios.horario],
          set: {
            precio: validatedData.precio.toString(),
            fechaVigencia: new Date(),
            fuente: 'usuario',
            usuarioId: session.user.id,
            esValidado: false,
            fechaReporte: new Date(),
            notas: validatedData.notas || null,
          }
        })
    } catch (priceError) {
      console.error('Error updating price table:', priceError)
      // Continue with the flow even if price update fails
    }

    // Send thank you email (don't let this fail the request)
    try {
      if (session.user.email && session.user.name) {
        await sendReportPriceThankYouEmail({
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          },
          url: '', // Not needed for thank you email
          token: '', // Not needed for thank you email
        })
      }
    } catch (emailError) {
      console.error('Error sending thank you email:', emailError)
      // Continue with the flow even if email fails
    }

    return NextResponse.json(newReport[0], { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}