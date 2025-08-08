import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { favoritos, estaciones } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

const createFavoritoSchema = z.object({
  estacionId: z.string(),
})

const searchParamsSchema = z.object({
  estacionId: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))

    const limit = params.limit ? parseInt(params.limit) : 50
    const offset = params.offset ? parseInt(params.offset) : 0

    // If a specific station is requested, return isFavorite boolean
    if (params.estacionId) {
      const existing = await db
        .select({ id: favoritos.id })
        .from(favoritos)
        .where(and(
          eq(favoritos.usuarioId, session.user.id),
          eq(favoritos.estacionId, params.estacionId)
        ))
        .limit(1)

      return NextResponse.json({
        isFavorite: existing.length > 0,
      })
    }

    // Otherwise, list all favorites with station details
    const result = await db
      .select({
        id: favoritos.id,
        estacionId: favoritos.estacionId,
        fechaCreacion: favoritos.fechaCreacion,
        // station fields
        nombre: estaciones.nombre,
        empresa: estaciones.empresa,
        direccion: estaciones.direccion,
        localidad: estaciones.localidad,
        provincia: estaciones.provincia,
        latitud: estaciones.latitud,
        longitud: estaciones.longitud,
      })
      .from(favoritos)
      .leftJoin(estaciones, eq(favoritos.estacionId, estaciones.id))
      .where(eq(favoritos.usuarioId, session.user.id))
      .orderBy(desc(favoritos.fechaCreacion))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data: result,
      pagination: {
        limit,
        offset,
        total: result.length,
        hasMore: result.length === limit,
      },
    })
  } catch (error) {
    console.error('Error fetching favoritos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createFavoritoSchema.parse(body)

    // Check if already exists
    const existing = await db
      .select({ id: favoritos.id })
      .from(favoritos)
      .where(and(
        eq(favoritos.usuarioId, session.user.id),
        eq(favoritos.estacionId, validated.estacionId)
      ))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'La estación ya está en favoritos' }, { status: 400 })
    }

    const inserted = await db
      .insert(favoritos)
      .values({
        usuarioId: session.user.id,
        estacionId: validated.estacionId,
        fechaCreacion: new Date(),
      })
      .returning()

    return NextResponse.json(inserted[0], { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating favorito:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estacionId = searchParams.get('estacionId')

    if (!estacionId) {
      return NextResponse.json({ error: 'estacionId es requerido' }, { status: 400 })
    }

    const deleted = await db
      .delete(favoritos)
      .where(and(
        eq(favoritos.usuarioId, session.user.id),
        eq(favoritos.estacionId, estacionId)
      ))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Favorito no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Favorito eliminado' })
  } catch (error) {
    console.error('Error deleting favorito:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
