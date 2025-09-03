import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/drizzle/connection';
import { comentarios, reportesComentarios, votosComentarios } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { eq, and, desc, count, sql } from 'drizzle-orm';

const createComentarioSchema = z.object({
  estacionId: z.string().min(1, 'ID de estación requerido'),
  comentario: z
    .string()
    .min(1, 'Comentario requerido')
    .max(144, 'Comentario demasiado largo (máximo 144 caracteres)'),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const validatedData = createComentarioSchema.parse(body);

    // Verificar si ya existe un comentario de este usuario para esta estación
    const existingComment = await db.query.comentarios.findFirst({
      where: and(
        eq(comentarios.usuarioId, session.user.id),
        eq(comentarios.estacionId, validatedData.estacionId)
      ),
    });

    if (existingComment) {
      return NextResponse.json(
        { error: 'Ya tienes un comentario en esta estación. Puedes editarlo en su lugar.' },
        { status: 409 }
      );
    }

    // Crear el nuevo comentario
    const nuevoComentario = await db.insert(comentarios)
      .values({
        usuarioId: session.user.id,
        estacionId: validatedData.estacionId,
        comentario: validatedData.comentario,
      })
      .returning();

    // Revalidate cached comments count for the station
    try {
      revalidateTag(`station:${validatedData.estacionId}:comments-count`)
    } catch {}

    return NextResponse.json(nuevoComentario[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estacionId = searchParams.get('estacionId');

    if (!estacionId) {
      return NextResponse.json(
        { error: 'ID de estación requerido' },
        { status: 400 }
      );
    }

    // Obtener información de sesión para verificar votos del usuario actual
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const currentUserId = session?.user?.id;

    // Obtener comentarios con conteo de votos y ordenarlos por utilidad
    const comentariosConVotos = await db
      .select({
        id: comentarios.id,
        usuarioId: comentarios.usuarioId,
        estacionId: comentarios.estacionId,
        comentario: comentarios.comentario,
        fechaCreacion: comentarios.fechaCreacion,
        fechaActualizacion: comentarios.fechaActualizacion,
        usuario: {
          id: sql`"usuario"."id"`.mapWith(String),
          name: sql`"usuario"."name"`.mapWith(String),
          image: sql`"usuario"."image"`.mapWith(String),
        },
        voteCount: count(votosComentarios.id).as('vote_count'),
        userVoted: currentUserId ? 
          sql`CASE WHEN EXISTS(
            SELECT 1 FROM ${votosComentarios} 
            WHERE ${votosComentarios.comentarioId} = ${comentarios.id} 
            AND ${votosComentarios.usuarioId} = ${currentUserId}
          ) THEN true ELSE false END`.mapWith(Boolean) : 
          sql`false`.mapWith(Boolean),
        userReported: currentUserId ?
          sql`CASE WHEN EXISTS(
            SELECT 1 FROM ${reportesComentarios} 
            WHERE ${reportesComentarios.comentarioId} = ${comentarios.id} 
            AND ${reportesComentarios.usuarioId} = ${currentUserId}
          ) THEN true ELSE false END`.mapWith(Boolean) :
          sql`false`.mapWith(Boolean),
      })
      .from(comentarios)
      .leftJoin(sql`"user" as "usuario"`, sql`"usuario"."id" = ${comentarios.usuarioId}`)
      .leftJoin(votosComentarios, eq(votosComentarios.comentarioId, comentarios.id))
      .where(eq(comentarios.estacionId, estacionId))
      .groupBy(
        comentarios.id, 
        comentarios.usuarioId, 
        comentarios.estacionId,
        comentarios.comentario, 
        comentarios.fechaCreacion, 
        comentarios.fechaActualizacion,
        sql`"usuario"."id"`,
        sql`"usuario"."name"`,
        sql`"usuario"."image"`
      )
      .orderBy(
        desc(count(votosComentarios.id)), // Más votos primero
        desc(comentarios.fechaCreacion)   // Luego por fecha más reciente
      );

    return NextResponse.json(comentariosConVotos);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}