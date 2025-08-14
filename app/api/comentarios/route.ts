import { NextResponse } from 'next/server';
import { db } from '@/drizzle/connection';
import { comentarios } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';

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

    // Obtener comentarios de la estación con información del usuario
    const comentariosEstacion = await db.query.comentarios.findMany({
      where: eq(comentarios.estacionId, estacionId),
      with: {
        usuario: {
          columns: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [desc(comentarios.fechaCreacion)],
    });

    return NextResponse.json(comentariosEstacion);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}