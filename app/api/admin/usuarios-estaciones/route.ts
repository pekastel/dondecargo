import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones, user } from '@/drizzle/schema'
import { eq, sql, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que sea admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden acceder.' },
        { status: 403 }
      )
    }

    // Obtener usuarios que han creado estaciones con estadísticas
    const usuariosConEstaciones = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        totalEstaciones: sql<number>`count(${estaciones.id})`,
        aprobadas: sql<number>`sum(case when ${estaciones.estado} = 'aprobado' then 1 else 0 end)`,
        pendientes: sql<number>`sum(case when ${estaciones.estado} = 'pendiente' then 1 else 0 end)`,
        rechazadas: sql<number>`sum(case when ${estaciones.estado} = 'rechazado' then 1 else 0 end)`,
        ultimaCreacion: sql<Date>`max(${estaciones.fechaCreacion})`,
      })
      .from(user)
      .innerJoin(estaciones, eq(estaciones.usuarioCreadorId, user.id))
      .groupBy(user.id, user.name, user.email)
      .orderBy(desc(sql`max(${estaciones.fechaCreacion})`))

    return NextResponse.json({
      usuarios: usuariosConEstaciones,
    })
  } catch (error) {
    console.error('Error al obtener usuarios con estaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener los datos' },
      { status: 500 }
    )
  }
}

