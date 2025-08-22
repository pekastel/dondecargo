import { NextRequest, NextResponse } from 'next/server'
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

    // Get comment count for this station
    const result = await db
      .select({
        count: count(comentarios.id)
      })
      .from(comentarios)
      .where(eq(comentarios.estacionId, id))

    const commentCount = result[0]?.count || 0

    return NextResponse.json({ count: commentCount })
  } catch (error) {
    console.error('Error al obtener conteo de comentarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}