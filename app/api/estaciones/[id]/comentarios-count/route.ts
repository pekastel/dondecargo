import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { db } from '@/drizzle/connection'
import { comentarios } from '@/drizzle/schema'
import { eq, count } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de estación requerido' },
        { status: 400 }
      )
    }

    const tag = `station:${id}:comments-count`

    const getCountCached = unstable_cache(
      async () => {
        const result = await db
          .select({
            count: count(comentarios.id)
          })
          .from(comentarios)
          .where(eq(comentarios.estacionId, id))
        return result[0]?.count || 0
      },
      ['comments-count', id],
      { tags: [tag], revalidate: 300 }
    )

    const commentCount = await getCountCached()

    return NextResponse.json({ count: commentCount })
  } catch (error) {
    console.error('Error al obtener conteo de comentarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}