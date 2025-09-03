import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { reportesPrecios, estaciones } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { sendReportPriceThankYouEmail } from '@/lib/email'
import { FUEL_LABELS } from '@/lib/types'
import { createErrorResponse, handleAuthError, handleNotFoundError, safeLog } from '@/lib/utils/errors'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

const createReporteSchema = z.object({
  estacionId: z.string(),
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().positive(),
  horario: z.enum(['diurno', 'nocturno', 'ambos']),
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
      return handleAuthError('reportes-precios GET', 'No session found');
    }

    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))

    const limit = params.limit ? parseInt(params.limit) : 20
    const offset = params.offset ? parseInt(params.offset) : 0

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

    // Build the base query
    const baseQuery = db
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

    // Execute query with conditional where
    const result = conditions.length > 0
      ? await baseQuery
          .where(and(...conditions))
          .orderBy(desc(reportesPrecios.fechaCreacion))
          .limit(limit)
          .offset(offset)
      : await baseQuery
          .orderBy(desc(reportesPrecios.fechaCreacion))
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
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'reportes-precios GET validation',
        error,
        400,
        'Parámetros inválidos'
      );
    }

    return createErrorResponse(
      'reportes-precios GET',
      error,
      500,
      'Error al obtener reportes'
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user) {
      return handleAuthError('reportes-precios POST', 'No session found');
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
      return handleNotFoundError('reportes-precios POST', 'Estación');
    }

    // Create new report(s)
    let newReports;
    
    if (validatedData.horario === 'ambos') {
      // If 'ambos' is selected, create two reports: one for 'diurno' and one for 'nocturno'
      const baseReportData = {
        estacionId: validatedData.estacionId,
        tipoCombustible: validatedData.tipoCombustible,
        precio: validatedData.precio.toString(), // Convert to string to match DB schema
        notas: validatedData.notas,
        usuarioId: session.user.id,
        fechaCreacion: new Date(),
      };
      
      // Create two separate reports
      const diurnoReport = await db
        .insert(reportesPrecios)
        .values({
          ...baseReportData,
          horario: 'diurno',
        })
        .returning();
        
      const nocturnoReport = await db
        .insert(reportesPrecios)
        .values({
          ...baseReportData,
          horario: 'nocturno',
        })
        .returning();
        
      newReports = [...diurnoReport, ...nocturnoReport];
    } else {
      // For 'diurno' or 'nocturno', create a single report
      newReports = await db
        .insert(reportesPrecios)
        .values({
          estacionId: validatedData.estacionId,
          tipoCombustible: validatedData.tipoCombustible,
          precio: validatedData.precio.toString(), // Convert to string to match DB schema
          horario: validatedData.horario,
          notas: validatedData.notas,
          usuarioId: session.user.id,
          fechaCreacion: new Date(),
        })
        .returning();
    }

    // Note: User reports are stored only in reportesPrecios table
    // They will be displayed separately from official prices
    // and can be used for social validation and averaging

    // Send thank you email (don't let this fail the request)
    try {
      if (session.user.email && session.user.name) {
        await sendReportPriceThankYouEmail({
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          },
          stationName: station[0].nombre,
          fuelType: FUEL_LABELS[validatedData.tipoCombustible],
          price: `$${validatedData.precio.toString()}`,
          address: `${station[0].direccion}, ${station[0].localidad}, ${station[0].provincia}`,
        })
      }
    } catch (emailError) {
      safeLog('⚠️ Error sending thank you email, continuing with flow')
      // Continue with the flow even if email fails
    }

    // Revalidate caches for station user reports summary and estaciones listing
    try {
      const stationId = validatedData.estacionId
      // User reports cache
      revalidateTag(`station:${stationId}:user-reports`)
      // Estaciones search/list caches share these tags (see app/api/estaciones/route.ts)
      revalidateTag('estaciones')
      revalidateTag(`estacion:${stationId}`)
      revalidateTag(`combustible:${validatedData.tipoCombustible}`)
      if (validatedData.horario === 'ambos') {
        revalidateTag('horario:diurno')
        revalidateTag('horario:nocturno')
      } else {
        revalidateTag(`horario:${validatedData.horario}`)
      }
    } catch {}

    return NextResponse.json(newReports[0], { status: 201 })

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'reportes-precios POST validation',
        error,
        400,
        'Datos del reporte inválidos'
      );
    }

    return createErrorResponse(
      'reportes-precios POST',
      error,
      500,
      'Error al crear reporte de precio'
    );
  }
}