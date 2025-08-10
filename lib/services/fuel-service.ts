import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios, preciosHistorico } from '@/drizzle/schema'
import { eq, and, sql, desc, asc, inArray, gte, lte } from 'drizzle-orm'
import { FuelType, HorarioType } from '@/lib/types'

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

export interface SearchStationsParams {
  lat?: number
  lng?: number
  radius?: number
  empresa?: string
  provincia?: string
  localidad?: string
  combustible?: FuelType
  horario?: HorarioType
  precioMin?: number
  precioMax?: number
  limit?: number
  offset?: number
}

export interface StationWithPrices {
  id: string
  nombre: string
  empresa: string
  direccion: string
  localidad: string
  provincia: string
  latitud: number
  longitud: number
  fechaActualizacion: Date | null
  distancia?: number | null
  precios: Array<{
    tipoCombustible: string
    precio: string
    horario: string
    fechaReporte: Date | null
    fuente: string
    esValidado: boolean
  }>
}

export class FuelService {
  async searchStations(params: SearchStationsParams): Promise<{
    data: StationWithPrices[]
    pagination: {
      limit: number
      offset: number
      total: number
      hasMore: boolean
    }
  }> {
    const db = createDbConnection()
    
    const {
      lat,
      lng,
      radius = 10,
      empresa,
      provincia,
      localidad,
      combustible,
      horario = 'diurno',
      precioMin,
      precioMax,
      limit = 100,
      offset = 0
    } = params

    let query = db
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

    // Apply filters
    const conditions = []

    if (empresa) {
      const empresas = empresa.split(',')
      if (empresas.length === 1) {
        conditions.push(sql`LOWER(${estaciones.empresa}) LIKE LOWER(${`%${empresas[0]}%`})`)
      } else {
        const likeConditions = empresas.map(emp => 
          sql`LOWER(${estaciones.empresa}) LIKE LOWER(${`%${emp}%`})`
        )
        conditions.push(sql`(${sql.join(likeConditions, sql` OR `)})`)
      }
    }

    if (provincia) {
      conditions.push(eq(estaciones.provincia, provincia))
    }

    if (localidad) {
      conditions.push(eq(estaciones.localidad, localidad))
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

    if (conditions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.where(and(...conditions)) as any
    }

    // Order by distance if location provided, otherwise by name
    if (lat && lng) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.orderBy(sql`distancia ASC`) as any
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.orderBy(asc(estaciones.nombre)) as any
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.limit(limit).offset(offset) as any

    const result = await query

    // Get current prices for each station
    let stationsWithPrices: StationWithPrices[] = []
    
    if (result.length > 0) {
      const stationIds = result.map(s => s.id)
      
      const priceConditions = [
        inArray(precios.estacionId, stationIds),
      ]
      
      // Handle horario filter - if 'ambos' is specified, don't filter by horario
      if (horario !== 'ambos') {
        priceConditions.push(eq(precios.horario, horario))
      }
      
      if (combustible) {
        priceConditions.push(eq(precios.tipoCombustible, combustible))
      }
      
      // Add price range filter
      if (precioMin !== undefined) {
        priceConditions.push(gte(precios.precio, precioMin.toString()))
      }
      if (precioMax !== undefined) {
        priceConditions.push(lte(precios.precio, precioMax.toString()))
      }
      
      const currentPrices = await db
        .select({
          estacionId: precios.estacionId,
          tipoCombustible: precios.tipoCombustible,
          precio: precios.precio,
          horario: precios.horario,
          fechaReporte: precios.fechaReporte,
          fuente: precios.fuente,
          esValidado: precios.esValidado,
        })
        .from(precios)
        .where(and(...priceConditions))
        .orderBy(desc(precios.fechaVigencia))
        .limit(500) // Reasonable limit
      
      // Group prices by station
      const pricesByStation = currentPrices.reduce((acc, price) => {
        if (!acc[price.estacionId]) {
          acc[price.estacionId] = []
        }
        acc[price.estacionId].push(price)
        return acc
      }, {} as Record<string, typeof currentPrices>)

      // Combine stations with their prices
      stationsWithPrices = result.map(station => ({
        ...station,
        precios: pricesByStation[station.id] || []
      }))
    }

    return {
      data: stationsWithPrices,
      pagination: {
        limit,
        offset,
        total: result.length,
        hasMore: result.length === limit
      }
    }
  }

  async getStationDetails(stationId: string): Promise<StationWithPrices | null> {
    const db = createDbConnection()
    
    const station = await db
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
      })
      .from(estaciones)
      .where(eq(estaciones.id, stationId))
      .limit(1)

    if (!station[0]) return null

    // Get all current prices for this station
    const currentPrices = await db
      .select({
        estacionId: precios.estacionId,
        tipoCombustible: precios.tipoCombustible,
        precio: precios.precio,
        horario: precios.horario,
        fechaReporte: precios.fechaReporte,
        fuente: precios.fuente,
        esValidado: precios.esValidado,
      })
      .from(precios)
      .where(eq(precios.estacionId, stationId))
      .orderBy(desc(precios.fechaVigencia))

    return {
      ...station[0],
      distancia: null,
      precios: currentPrices
    }
  }

  async findCheapestFuel(
    fuelType: FuelType,
    lat?: number,
    lng?: number,
    radius: number = 20,
    horario: HorarioType = 'diurno',
    limit: number = 10
  ): Promise<StationWithPrices[]> {
    const db = createDbConnection()
    
    let query = db
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
        precio: precios.precio,
        tipoCombustible: precios.tipoCombustible,
        horario: precios.horario,
        fechaReporte: precios.fechaReporte,
        fuente: precios.fuente,
        esValidado: precios.esValidado,
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
      .innerJoin(precios, eq(precios.estacionId, estaciones.id))
      .where(and(
        eq(precios.tipoCombustible, fuelType),
        ...(horario !== 'ambos' ? [eq(precios.horario, horario)] : [])
      ))

    // Distance filter if location provided
    if (lat && lng && radius) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = (query as any).where(
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

    // Order by price (cheapest first), then by distance if location provided
    if (lat && lng) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = (query as any).orderBy(asc(precios.precio), sql`distancia ASC`)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = (query as any).orderBy(asc(precios.precio))
    }

    const result = await query.limit(limit)

    // Transform results to match StationWithPrices format
    return result.map(row => ({
      id: row.id,
      nombre: row.nombre,
      empresa: row.empresa,
      direccion: row.direccion,
      localidad: row.localidad,
      provincia: row.provincia,
      latitud: row.latitud,
      longitud: row.longitud,
      fechaActualizacion: row.fechaActualizacion,
      distancia: row.distancia,
      precios: [{
        tipoCombustible: row.tipoCombustible,
        precio: row.precio,
        horario: row.horario,
        fechaReporte: row.fechaReporte,
        fuente: row.fuente,
        esValidado: row.esValidado,
      }]
    }))
  }

  async getPriceHistory(
    stationId: string,
    fuelType?: FuelType,
    horario: HorarioType = 'diurno',
    days: number = 30
  ): Promise<Array<{
    tipoCombustible: string
    precio: string
    fechaVigencia: Date
    fuente: string
    esValidado: boolean
  }>> {
    const db = createDbConnection()
    
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    
    const conditions = [
      eq(preciosHistorico.estacionId, stationId),
      gte(preciosHistorico.fechaVigencia, fromDate)
    ]
    
    // Handle horario filter - if 'ambos' is specified, don't filter by horario
    if (horario !== 'ambos') {
      conditions.push(eq(preciosHistorico.horario, horario))
    }
    
    if (fuelType) {
      conditions.push(eq(preciosHistorico.tipoCombustible, fuelType))
    }
    
    const history = await db
      .select({
        tipoCombustible: preciosHistorico.tipoCombustible,
        precio: preciosHistorico.precio,
        fechaVigencia: preciosHistorico.fechaVigencia,
        fuente: preciosHistorico.fuente,
        esValidado: preciosHistorico.esValidado,
      })
      .from(preciosHistorico)
      .where(and(...conditions))
      .orderBy(desc(preciosHistorico.fechaVigencia))
      .limit(200) // Reasonable limit for history
      
    return history
  }

  async getRegionalSummary(provincia?: string): Promise<Array<{
    provincia: string
    localidad: string
    empresa: string
    totalEstaciones: number
    precioPromedio: number
    tipoCombustible: string
  }>> {
    const db = createDbConnection()
    
    const conditions = []
    if (provincia) {
      conditions.push(eq(estaciones.provincia, provincia))
    }
    
    const summary = await db
      .select({
        provincia: estaciones.provincia,
        localidad: estaciones.localidad,
        empresa: estaciones.empresa,
        tipoCombustible: precios.tipoCombustible,
        totalEstaciones: sql<number>`COUNT(DISTINCT ${estaciones.id})`,
        precioPromedio: sql<number>`AVG(${precios.precio}::numeric)`,
      })
      .from(estaciones)
      .innerJoin(precios, eq(precios.estacionId, estaciones.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        estaciones.provincia, 
        estaciones.localidad, 
        estaciones.empresa, 
        precios.tipoCombustible
      )
      .orderBy(
        asc(estaciones.provincia),
        asc(estaciones.localidad),
        asc(estaciones.empresa)
      )
      .limit(100)
      
    return summary
  }
}