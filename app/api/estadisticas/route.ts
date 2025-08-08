import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios, reportesPrecios } from '@/drizzle/schema'
import { eq, and, sql, desc, gte, count } from 'drizzle-orm'
import { z } from 'zod'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

const searchParamsSchema = z.object({
  tipo: z.enum(['general', 'precios', 'empresas', 'regiones']).optional(),
  periodo: z.enum(['7d', '30d', '90d', '365d']).optional(),
  combustible: z.string().optional(),
  empresa: z.string().optional(),
  provincia: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))

    const tipo = params.tipo || 'general'
    const periodo = params.periodo || '30d'

    // Calculate date range
    const now = new Date()
    const daysBack = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '365d': 365
    }[periodo]
    
    const fechaDesde = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    switch (tipo) {
      case 'general':
        return await getEstadisticasGenerales(fechaDesde)
      
      case 'precios':
        return await getEstadisticasPrecios(fechaDesde, params)
      
      case 'empresas':
        return await getEstadisticasEmpresas(fechaDesde)
      
      case 'regiones':
        return await getEstadisticasRegiones(fechaDesde)
      
      default:
        return NextResponse.json(
          { error: 'Tipo de estadística no válido' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error fetching estadisticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function getEstadisticasGenerales(fechaDesde: Date) {
  const [
    totalEstaciones,
    totalPrecios,
    preciosValidados,
    reportesPendientes,
    empresasActivas,
    provinciasActivas
  ] = await Promise.all([
    // Total stations
    db.select({ count: count() }).from(estaciones),
    
    // Total prices in period
    db.select({ count: count() })
      .from(precios)
      .where(gte(precios.fechaReporte, fechaDesde)),
    
    // Validated prices in period
    db.select({ count: count() })
      .from(precios)
      .where(
        and(
          gte(precios.fechaReporte, fechaDesde),
          eq(precios.esValidado, true)
        )
      ),
    
    // Pending reports
    db.select({ count: count() })
      .from(reportesPrecios)
      .where(eq(reportesPrecios.estado, 'pendiente')),
    
    // Active companies
    db.select({ empresa: estaciones.empresa, count: count() })
      .from(estaciones)
      .groupBy(estaciones.empresa)
      .orderBy(desc(count())),
    
    // Active provinces
    db.select({ provincia: estaciones.provincia, count: count() })
      .from(estaciones)
      .groupBy(estaciones.provincia)
      .orderBy(desc(count()))
  ])

  return NextResponse.json({
    general: {
      totalEstaciones: totalEstaciones[0].count,
      totalPrecios: totalPrecios[0].count,
      preciosValidados: preciosValidados[0].count,
      reportesPendientes: reportesPendientes[0].count,
      tasaValidacion: totalPrecios[0].count > 0 
        ? (preciosValidados[0].count / totalPrecios[0].count * 100).toFixed(1)
        : '0'
    },
    empresas: empresasActivas.slice(0, 10),
    provincias: provinciasActivas.slice(0, 10)
  })
}

async function getEstadisticasPrecios(fechaDesde: Date, params: z.infer<typeof searchParamsSchema>) {
  const conditions = [gte(precios.fechaReporte, fechaDesde)]
  
  if (params.combustible) {
    conditions.push(eq(precios.tipoCombustible, params.combustible))
  }
  
  if (params.empresa) {
    conditions.push(eq(estaciones.empresa, params.empresa))
  }

  const [
    preciosPorCombustible,
    precioPromedio,
    precioMinMax,
    variacionTemporal
  ] = await Promise.all([
    // Prices by fuel type
    db.select({
      tipoCombustible: precios.tipoCombustible,
      count: count(),
      promedio: sql<number>`AVG(CAST(${precios.precio} AS DECIMAL))`,
      minimo: sql<number>`MIN(CAST(${precios.precio} AS DECIMAL))`,
      maximo: sql<number>`MAX(CAST(${precios.precio} AS DECIMAL))`
    })
      .from(precios)
      .leftJoin(estaciones, eq(precios.estacionId, estaciones.id))
      .where(and(...conditions))
      .groupBy(precios.tipoCombustible),
    
    // Average prices
    db.select({
      promedio: sql<number>`AVG(CAST(${precios.precio} AS DECIMAL))`
    })
      .from(precios)
      .leftJoin(estaciones, eq(precios.estacionId, estaciones.id))
      .where(and(...conditions)),
    
    // Min/Max prices
    db.select({
      minimo: sql<number>`MIN(CAST(${precios.precio} AS DECIMAL))`,
      maximo: sql<number>`MAX(CAST(${precios.precio} AS DECIMAL))`
    })
      .from(precios)
      .leftJoin(estaciones, eq(precios.estacionId, estaciones.id))
      .where(and(...conditions)),
    
    // Temporal variation (daily averages)
    db.select({
      fecha: sql<string>`DATE(${precios.fechaReporte})`,
      promedio: sql<number>`AVG(CAST(${precios.precio} AS DECIMAL))`,
      count: count()
    })
      .from(precios)
      .leftJoin(estaciones, eq(precios.estacionId, estaciones.id))
      .where(and(...conditions))
      .groupBy(sql`DATE(${precios.fechaReporte})`)
      .orderBy(sql`DATE(${precios.fechaReporte}) DESC`)
      .limit(30)
  ])

  return NextResponse.json({
    preciosPorCombustible,
    resumen: {
      promedio: precioPromedio[0]?.promedio || 0,
      minimo: precioMinMax[0]?.minimo || 0,
      maximo: precioMinMax[0]?.maximo || 0
    },
    variacionTemporal: variacionTemporal.reverse()
  })
}

async function getEstadisticasEmpresas(fechaDesde: Date) {
  const estadisticasEmpresas = await db
    .select({
      empresa: estaciones.empresa,
      totalEstaciones: count(estaciones.id),
      totalPrecios: sql<number>`COUNT(${precios.id})`,
      precioPromedio: sql<number>`AVG(CAST(${precios.precio} AS DECIMAL))`,
      ultimaActualizacion: sql<Date>`MAX(${precios.fechaReporte})`
    })
    .from(estaciones)
    .leftJoin(precios, 
      and(
        eq(precios.estacionId, estaciones.id),
        gte(precios.fechaReporte, fechaDesde)
      )
    )
    .groupBy(estaciones.empresa)
    .orderBy(desc(count(estaciones.id)))

  return NextResponse.json({
    empresas: estadisticasEmpresas
  })
}

async function getEstadisticasRegiones(fechaDesde: Date) {
  const estadisticasRegiones = await db
    .select({
      provincia: estaciones.provincia,
      region: estaciones.region,
      totalEstaciones: count(estaciones.id),
      totalPrecios: sql<number>`COUNT(${precios.id})`,
      precioPromedio: sql<number>`AVG(CAST(${precios.precio} AS DECIMAL))`,
      ultimaActualizacion: sql<Date>`MAX(${precios.fechaReporte})`
    })
    .from(estaciones)
    .leftJoin(precios,
      and(
        eq(precios.estacionId, estaciones.id),
        gte(precios.fechaReporte, fechaDesde)
      )
    )
    .groupBy(estaciones.provincia, estaciones.region)
    .orderBy(desc(count(estaciones.id)))

  return NextResponse.json({
    regiones: estadisticasRegiones
  })
}