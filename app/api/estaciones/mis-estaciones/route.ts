import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/drizzle/connection'
import { estaciones, estacionesDatosAdicionales, precios } from '@/drizzle/schema'
import { eq, and, desc } from 'drizzle-orm'

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

    // Obtener todas las estaciones del usuario
    const userEstaciones = await db.query.estaciones.findMany({
      where: eq(estaciones.usuarioCreadorId, session.user.id),
      with: {
        datosAdicionales: true,
      },
      orderBy: [desc(estaciones.fechaCreacion)],
    })

    // Para cada estación, obtener los precios actuales (más recientes por tipo de combustible)
    const estacionesConPrecios = await Promise.all(
      userEstaciones.map(async (estacion) => {
        // Obtener los precios más recientes de cada tipo de combustible
        const preciosActuales = await db.query.precios.findMany({
          where: eq(precios.estacionId, estacion.id),
          orderBy: [desc(precios.fechaVigencia)],
          limit: 20, // Últimos 20 precios
        })

        // Agrupar por tipo de combustible y horario, quedándonos con el más reciente
        const preciosMap = new Map<string, typeof preciosActuales[0]>()
        
        preciosActuales.forEach(precio => {
          const key = `${precio.tipoCombustible}-${precio.horario}`
          if (!preciosMap.has(key)) {
            preciosMap.set(key, precio)
          }
        })

        return {
          ...estacion,
          preciosActuales: Array.from(preciosMap.values()).map(p => ({
            tipoCombustible: p.tipoCombustible,
            precio: p.precio,
            horario: p.horario,
            fechaVigencia: p.fechaVigencia,
          })),
        }
      })
    )

    // Verificar si tiene estaciones pendientes
    const tienePendientes = userEstaciones.some(e => e.estado === 'pendiente')

    return NextResponse.json({
      estaciones: estacionesConPrecios,
      tienePendientes,
    })
  } catch (error) {
    console.error('Error al obtener mis estaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener las estaciones' },
      { status: 500 }
    )
  }
}

