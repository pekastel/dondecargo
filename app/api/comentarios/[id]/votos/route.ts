import { NextResponse } from 'next/server';
import { db } from '@/drizzle/connection';
import { votosComentarios, comentarios } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, count } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: comentarioId } = await params;

    // Verificar que el comentario existe
    const comentario = await db.query.comentarios.findFirst({
      where: eq(comentarios.id, comentarioId),
    });

    if (!comentario) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario no está intentando votar su propio comentario
    if (comentario.usuarioId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes votar tu propio comentario' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya votó este comentario
    const existingVote = await db.query.votosComentarios.findFirst({
      where: and(
        eq(votosComentarios.comentarioId, comentarioId),
        eq(votosComentarios.usuarioId, session.user.id)
      ),
    });

    if (existingVote) {
      // Si ya votó, remover el voto (toggle)
      await db.delete(votosComentarios)
        .where(eq(votosComentarios.id, existingVote.id));
      
      // Obtener el nuevo conteo
      const voteCount = await db
        .select({ count: count() })
        .from(votosComentarios)
        .where(eq(votosComentarios.comentarioId, comentarioId));

      return NextResponse.json({
        voted: false,
        voteCount: voteCount[0].count,
        message: 'Voto removido'
      });
    } else {
      // Si no votó, agregar el voto
      await db.insert(votosComentarios)
        .values({
          comentarioId,
          usuarioId: session.user.id,
        });

      // Obtener el nuevo conteo
      const voteCount = await db
        .select({ count: count() })
        .from(votosComentarios)
        .where(eq(votosComentarios.comentarioId, comentarioId));

      return NextResponse.json({
        voted: true,
        voteCount: voteCount[0].count,
        message: 'Voto agregado'
      });
    }
  } catch (error) {
    console.error('Error al procesar voto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: comentarioId } = await params;
    
    // Obtener el conteo de votos
    const voteCount = await db
      .select({ count: count() })
      .from(votosComentarios)
      .where(eq(votosComentarios.comentarioId, comentarioId));

    // Verificar si el usuario actual ya votó (si está autenticado)
    let userVoted = false;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      const existingVote = await db.query.votosComentarios.findFirst({
        where: and(
          eq(votosComentarios.comentarioId, comentarioId),
          eq(votosComentarios.usuarioId, session.user.id)
        ),
      });
      userVoted = !!existingVote;
    }

    return NextResponse.json({
      voteCount: voteCount[0].count,
      voted: userVoted
    });
  } catch (error) {
    console.error('Error al obtener votos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}