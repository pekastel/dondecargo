import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios, reportesPrecios, estacionesDatosAdicionales } from '@/drizzle/schema'
import { eq, and, sql, desc, asc, inArray, gte } from 'drizzle-orm'
import { z } from 'zod'
import { createErrorResponse, handleDatabaseError, safeLog } from '@/lib/utils/errors'

// Create connection with error handling
function createDbConnection() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  const connection = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  
  return drizzle(connection)
}

const searchParamsSchema = z.object({
  lat: z.string().optional(),
  lng: z.string().optional(),
  radius: z.string().refine((val) => val === undefined || (Number(val) >= 0 && Number(val) <= 25), {
    message: "radius debe ser un valor entre 0 y 25"
  }).optional(),
  empresa: z.string().optional(),
  provincia: z.string().optional(),
  localidad: z.string().optional(),
  combustible: z.string().optional(),
  horario: z.enum(['diurno', 'nocturno']).optional(),
  precioMin: z.string().refine((val) => val === undefined || !isNaN(Number(val)), {
    message: "precioMin debe ser un número válido"
  }).optional(),
  precioMax: z.string().refine((val) => val === undefined || !isNaN(Number(val)), {
    message: "precioMax debe ser un número válido"
  }).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

export async function GET(request: NextRequest) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    safeLog('🔍 Starting estaciones API request')
    
    // Create database connection
    db = createDbConnection()
    safeLog('✅ Database connection created')
    
    const { searchParams } = new URL(request.url)
    const params = searchParamsSchema.parse(Object.fromEntries(searchParams))
    
    const lat = params.lat ? parseFloat(params.lat) : undefined
    const lng = params.lng ? parseFloat(params.lng) : undefined
    const radius = params.radius ? Math.min(parseFloat(params.radius), 25) : 10 // default 10km, max 20km
    const limit = params.limit ? parseInt(params.limit) : 100
    const offset = params.offset ? parseInt(params.offset) : 0
    
    // Validate price range - only apply if provided by user
    const precioMin = params.precioMin && params.precioMin.trim() !== '' 
      ? Math.max(0, parseFloat(params.precioMin)) 
      : undefined
    const precioMax = params.precioMax && params.precioMax.trim() !== '' 
      ? Math.min(5000, parseFloat(params.precioMax)) 
      : undefined

    // Apply filters
    const conditions = []
    
    // IMPORTANTE: Solo mostrar estaciones aprobadas en búsquedas públicas
    conditions.push(eq(estaciones.estado, 'aprobado'))

    if (params.empresa) {
      const empresas = params.empresa.split(',')
      if (empresas.length === 1) {
        // Case-insensitive LIKE search for single empresa
        conditions.push(sql`LOWER(${estaciones.empresa}) LIKE LOWER(${`%${empresas[0]}%`})`)
      } else {
        // Case-insensitive LIKE search for multiple empresas with OR condition
        const likeConditions = empresas.map(empresa => 
          sql`LOWER(${estaciones.empresa}) LIKE LOWER(${`%${empresa}%`})`
        )
        conditions.push(sql`(${sql.join(likeConditions, sql` OR `)})`)
      }
    }

    if (params.provincia) {
      conditions.push(eq(estaciones.provincia, params.provincia))
    }

    if (params.localidad) {
      conditions.push(eq(estaciones.localidad, params.localidad))
    }

    // Distance filter (if lat/lng provided)
    if (lat && lng && radius) {
      conditions.push(
        sql`
          (6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(${estaciones.latitud})) * 
            cos(radians(${estaciones.longitud}) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(${estaciones.latitud}))
          )) <= ${radius}
        `
      )
    }

    // Build the base query con LEFT JOIN para datos adicionales
    const baseQuery = db
      .select({
        id: estaciones.id,
        nombre: estaciones.nombre,
        empresa: estaciones.empresa,
        direccion: estaciones.direccion,
        localidad: estaciones.localidad,
        provincia: estaciones.provincia,
        latitud: estaciones.latitud,
        longitud: estaciones.longitud,
        fechaActualizacion: estaciones.fechaActualizacion,
        fuente: estaciones.fuente,
        googleMapsUrl: estaciones.googleMapsUrl,
        // Datos adicionales (si existen)
        horarios: estacionesDatosAdicionales.horarios,
        telefono: estacionesDatosAdicionales.telefono,
        servicios: estacionesDatosAdicionales.servicios,
        // Calculate distance if lat/lng provided
        distancia: lat && lng 
          ? sql<number>`
              (6371 * acos(
                cos(radians(${lat})) * 
                cos(radians(${estaciones.latitud})) * 
                cos(radians(${estaciones.longitud}) - radians(${lng})) + 
                sin(radians(${lat})) * 
                sin(radians(${estaciones.latitud}))
              ))
            `.as('distancia')
          : sql<null>`null`.as('distancia')
      })
      .from(estaciones)
      .leftJoin(
        estacionesDatosAdicionales,
        eq(estaciones.id, estacionesDatosAdicionales.estacionId)
      )

    // Apply conditional where, ordering, and pagination
    const result = conditions.length > 0
      ? await baseQuery
          .where(and(...conditions))
          .orderBy(lat && lng ? sql`distancia ASC` : asc(estaciones.nombre))
          .limit(limit)
          .offset(offset)
      : await baseQuery
          .orderBy(lat && lng ? sql`distancia ASC` : asc(estaciones.nombre))
          .limit(limit)
          .offset(offset)
    safeLog(`📊 Found ${result.length} stations`)

    // Get current prices for each station with caching
    let stationsWithPrices = result
    if (result.length > 0) {
      const stationIds = result.map(s => s.id)
      const horarioSel = params.horario || 'diurno'
      const combustibleSel = params.combustible || 'all'
      const cacheKey = [
        'estaciones',
        `horario:${horarioSel}`,
        `combustible:${combustibleSel}`,
        `precioMin:${precioMin ?? 'none'}`,
        `precioMax:${precioMax ?? 'none'}`,
        `ids:${stationIds.join(',')}`,
      ]
      const tags = [
        'estaciones',
        `horario:${horarioSel}`,
        `combustible:${combustibleSel}`,
        ...stationIds.map(id => `estacion:${id}`),
      ]

      const fetchWithCache = unstable_cache(async () => {
        try {
          safeLog(`🔍 Fetching prices for ${stationIds.length} stations`)

          const priceConditions = [
            inArray(precios.estacionId, stationIds),
            eq(precios.horario, horarioSel)
          ]

          if (precioMin !== undefined) priceConditions.push(sql`${precios.precio} >= ${precioMin}`)
          if (precioMax !== undefined) priceConditions.push(sql`${precios.precio} <= ${precioMax}`)

          const currentPrices = await db!
            .select({
              estacionId: precios.estacionId,
              tipoCombustible: precios.tipoCombustible,
              precio: precios.precio,
              horario: precios.horario,
              fechaVigencia: precios.fechaVigencia,
              fechaReporte: precios.fechaReporte,
              fuente: precios.fuente,
              esValidado: precios.esValidado,
            })
            .from(precios)
            .where(and(...priceConditions))
            .orderBy(desc(precios.fechaVigencia))
            .limit(500)

          safeLog(`📊 Found ${currentPrices.length} prices`)

          // Aggregate recent user reports per station + fuel + horario (last 5 days)
          const fechaLimite = new Date()
          fechaLimite.setDate(fechaLimite.getDate() - 5)

          const reportsAgg = await db!
            .select({
              estacionId: reportesPrecios.estacionId,
              tipoCombustible: reportesPrecios.tipoCombustible,
              horario: reportesPrecios.horario,
              precioPromedio: sql<number>`ROUND(AVG(CAST(${reportesPrecios.precio} AS NUMERIC)), 2)`,
              cantidadReportes: sql<number>`COUNT(*)`,
              ultimoReporte: sql<Date>`MAX(${reportesPrecios.fechaCreacion})`,
            })
            .from(reportesPrecios)
            .where(and(
              inArray(reportesPrecios.estacionId, stationIds),
              eq(reportesPrecios.horario, horarioSel),
              gte(reportesPrecios.fechaCreacion, fechaLimite),
            ))
            .groupBy(
              reportesPrecios.estacionId,
              reportesPrecios.tipoCombustible,
              reportesPrecios.horario,
            )

          const reportsByStationFuel: Record<string, { precioPromedio: number; cantidadReportes: number; ultimoReporte: Date | null }> = {}
          for (const r of reportsAgg) {
            reportsByStationFuel[`${r.estacionId}::${r.tipoCombustible}`] = {
              precioPromedio: Number(r.precioPromedio),
              cantidadReportes: Number(r.cantidadReportes),
              ultimoReporte: (r.ultimoReporte ?? null) as Date | null,
            }
          }

          const pricesByStation = currentPrices.reduce((acc, price) => {
            if (!acc[price.estacionId]) acc[price.estacionId] = []
            acc[price.estacionId].push(price)
            return acc
          }, {} as Record<string, typeof currentPrices>)

          const isOlderThanDays = (d: Date | string | null | undefined, days: number) => {
            if (!d) return false
            const date = new Date(d as unknown as Date)
            if (Number.isNaN(date.getTime())) return false
            return (Date.now() - date.getTime()) > (days * 24 * 60 * 60 * 1000)
          }

          const stationsAugmented = result.map(station => {
            const stationOfficialPrices = pricesByStation[station.id] || []
            
            // Map official prices with user reports overlay
            const augmentedOfficialPrices = stationOfficialPrices.map(p => {
              const key = `${station.id}::${p.tipoCombustible}`
              const agg = reportsByStationFuel[key]
              const stale = isOlderThanDays(p.fechaVigencia as unknown as Date, 30)
              if (stale && agg && agg.cantidadReportes > 0 && p.horario === horarioSel) {
                return {
                  ...p,
                  precioAjustado: agg.precioPromedio,
                  precioAjustadoFuente: 'usuario',
                  usandoPrecioUsuario: true,
                  fechaUltimoReporteUsuario: agg.ultimoReporte,
                }
              }
              return {
                ...p,
                precioAjustado: p.precio,
                precioAjustadoFuente: 'oficial',
                usandoPrecioUsuario: false,
              }
            })

            // Find user reports that don't have official prices
            const officialFuelTypes = new Set(stationOfficialPrices.map(p => p.tipoCombustible))
            type ValidFuelType = 'nafta' | 'nafta_premium' | 'gasoil' | 'gasoil_premium' | 'gnc'
            const validFuelTypes: ValidFuelType[] = ['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']
            const userOnlyPrices = Object.entries(reportsByStationFuel)
              .filter(([key]) => {
                const [stationId, fuelType] = key.split('::')
                return stationId === station.id && !officialFuelTypes.has(fuelType as ValidFuelType) && validFuelTypes.includes(fuelType as ValidFuelType)
              })
              .map(([key, agg]) => {
                const fuelType = key.split('::')[1] as ValidFuelType
                return {
                  id: `user-${key}`,
                  estacionId: station.id,
                  tipoCombustible: fuelType,
                  precio: agg.precioPromedio,
                  horario: horarioSel as 'diurno' | 'nocturno',
                  fechaVigencia: agg.ultimoReporte || new Date(),
                  fechaReporte: agg.ultimoReporte || new Date(),
                  fuente: 'usuario' as const,
                  esValidado: false,
                  precioAjustado: agg.precioPromedio,
                  precioAjustadoFuente: 'usuario' as const,
                  usandoPrecioUsuario: true,
                  fechaUltimoReporteUsuario: agg.ultimoReporte,
                }
              })

            return {
              ...station,
              precios: [...augmentedOfficialPrices, ...userOnlyPrices]
            }
          })

          return stationsAugmented
        } catch (e) {
          safeLog('⚠️  Error fetching prices, returning stations only')
          return result.map(station => ({ ...station, precios: [] }))
        }
      }, cacheKey, { tags, revalidate: 3600 })

      stationsWithPrices = await fetchWithCache()
    }

    return NextResponse.json({
      data: stationsWithPrices,
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
        'estaciones API validation',
        error,
        400,
        'Parámetros de búsqueda inválidos'
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return handleDatabaseError('estaciones API', error);
    }

    // Generic error handling
    return createErrorResponse(
      'estaciones API',
      error,
      500,
      'Error al buscar estaciones'
    );
  }
}