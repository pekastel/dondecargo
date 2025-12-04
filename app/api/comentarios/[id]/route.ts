import { NextResponse } from 'next/server';
import { db } from '@/drizzle/connection';
import { comentarios } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const updateComentarioSchema = z.object({
  comentario: z
    .string()
    .min(1, 'Comentario requerido')
    .max(144, 'Comentario demasiado largo (máximo 144 caracteres)'),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validatedData = updateComentarioSchema.parse(body);

    // Verificar que el comentario existe y pertenece al usuario
    const existingComment = await db.query.comentarios.findFirst({
      where: and(
        eq(comentarios.id, id),
        eq(comentarios.usuarioId, session.user.id)
      ),
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Actualizar el comentario
    const updatedComentario = await db.update(comentarios)
      .set({
        comentario: validatedData.comentario,
        fechaActualizacion: new Date(),
      })
      .where(eq(comentarios.id, id))
      .returning();

    return NextResponse.json(updatedComentario[0]);
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el comentario existe y pertenece al usuario
    const existingComment = await db.query.comentarios.findFirst({
      where: and(
        eq(comentarios.id, id),
        eq(comentarios.usuarioId, session.user.id)
      ),
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Eliminar el comentario
    await db.delete(comentarios)
      .where(eq(comentarios.id, id));

    return NextResponse.json({ message: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}