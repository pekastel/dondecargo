import { NextResponse } from 'next/server';
import { db } from '@/drizzle/connection';
import { reportesComentarios, comentarios } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { sendReportCommentThankYouEmail } from '@/lib/email';

interface RouteParams {
  params: Promise<{ id: string }>
}

const createReportSchema = z.object({
  motivos: z.array(z.enum(['spam', 'contenido_inapropiado', 'informacion_falsa', 'otro'] as const))
    .min(1, 'Debe seleccionar al menos un motivo'),
  observaciones: z.string()
    .max(288, 'Las observaciones no pueden exceder 288 caracteres')
    .optional(),
});

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

    const body = await request.json();
    const validatedData = createReportSchema.parse(body);
    const { id: comentarioId } = await params;

    // Verificar que el comentario existe y obtener información de la estación
    const comentario = await db.query.comentarios.findFirst({
      where: eq(comentarios.id, comentarioId),
      with: {
        estacion: {
          columns: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!comentario) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario no está intentando reportar su propio comentario
    if (comentario.usuarioId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes reportar tu propio comentario' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya reportó este comentario
    const existingReport = await db.query.reportesComentarios.findFirst({
      where: and(
        eq(reportesComentarios.comentarioId, comentarioId),
        eq(reportesComentarios.usuarioId, session.user.id)
      ),
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'Ya has reportado este comentario anteriormente' },
        { status: 409 }
      );
    }

    // Crear reportes para cada motivo seleccionado
    const reportes = await Promise.all(
      validatedData.motivos.map(motivo =>
        db.insert(reportesComentarios)
          .values({
            comentarioId,
            usuarioId: session.user.id,
            motivo,
            observaciones: validatedData.observaciones?.trim() || null,
          })
          .returning()
      )
    );

    // Enviar email de confirmación al usuario que reportó
    try {
      await sendReportCommentThankYouEmail({
        user: {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.name || 'Usuario',
        },
        reason: validatedData.motivos.join(', '),
        observation: validatedData.observaciones?.trim() || 'Sin observaciones adicionales',
        stationName: comentario.estacion?.nombre || 'Estación desconocida',
        stationId: comentario.estacionId,
      });
    } catch (emailError) {
      // Log error but don't fail the request if email fails
      console.error('Failed to send report confirmation email:', emailError);
    }

    return NextResponse.json({
      message: 'Reporte enviado correctamente',
      reportes: reportes.map(r => r[0])
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    
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

export async function GET(request: Request, { params }: RouteParams) {
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

    // Solo permitir a los usuarios ver si ellos mismos han reportado
    const userReports = await db.query.reportesComentarios.findMany({
      where: and(
        eq(reportesComentarios.comentarioId, comentarioId),
        eq(reportesComentarios.usuarioId, session.user.id)
      ),
    });

    return NextResponse.json({
      hasReported: userReports.length > 0,
      reportCount: userReports.length
    });
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}