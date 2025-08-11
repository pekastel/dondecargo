import { config } from 'dotenv'
import { join } from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios, preciosHistorico } from '@/drizzle/schema'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// Load environment variables
config({ path: join(process.cwd(), '.env.local') })
config({ path: join(process.cwd(), '.env') })

// Types for CSV data structure based on actual CSV
interface CSVRow {
  'indice_tiempo': string
  'idempresa': string
  'cuit': string
  'empresa': string
  'direccion': string
  'localidad': string
  'provincia': string
  'region': string
  'idproducto': string
  'producto': string
  'idtipohorario': string
  'tipohorario': string
  'precio': string
  'fecha_vigencia': string
  'idempresabandera': string
  'empresabandera': string
  'latitud': string
  'longitud': string
  'geojson': string
}

interface ProcessedStation {
  id: string
  idempresa: string
  nombre: string
  empresa: string
  cuit: string
  direccion: string
  localidad: string
  provincia: string
  region: string
  latitud: number
  longitud: number
}

interface ProcessedPrice {
  estacionId: string
  tipoCombustible: 'nafta' | 'nafta_premium' | 'gasoil' | 'gasoil_premium' | 'gnc'
  precio: number
  horario: 'diurno' | 'nocturno'
  fechaVigencia: Date
  fuente: 'oficial'
  esValidado: true
  fechaReporte: Date
}

const CSV_URL = 'http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

// Map government product names to our fuel types (based on actual CSV data)
const FUEL_TYPE_MAPPING: Record<string, 'nafta' | 'nafta_premium' | 'gasoil' | 'gasoil_premium' | 'gnc'> = {
  'Nafta (súper) entre 92 y 95 Ron': 'nafta',
  'Nafta (premium) de más de 95 Ron': 'nafta_premium', 
  'Gas Oil Grado 2': 'gasoil',
  'Gas Oil Grado 3': 'gasoil_premium',
  'GNC': 'gnc',
  // Alternative formats that might appear
  'NAFTA (SÚPER) ENTRE 92 Y 95 RON': 'nafta',
  'NAFTA (PREMIUM) DE MÁS DE 95 RON': 'nafta_premium',
  'GAS OIL GRADO 2': 'gasoil',
  'GAS OIL GRADO 3': 'gasoil_premium',
}

// Map provinces to regions
const PROVINCE_TO_REGION: Record<string, string> = {
  'CABA': 'Metropolitana',
  'Buenos Aires': 'Metropolitana',
  'Córdoba': 'Centro',
  'Santa Fe': 'Centro',
  'Entre Ríos': 'Centro',
  'Mendoza': 'Cuyo',
  'San Juan': 'Cuyo',
  'San Luis': 'Cuyo',
  'La Rioja': 'Norte',
  'Catamarca': 'Norte',
  'Tucumán': 'Norte',
  'Santiago del Estero': 'Norte',
  'Salta': 'Norte',
  'Jujuy': 'Norte',
  'Chaco': 'Norte',
  'Formosa': 'Norte',
  'Corrientes': 'Norte',
  'Misiones': 'Norte',
  'Neuquén': 'Patagonia',
  'Río Negro': 'Patagonia',
  'Chubut': 'Patagonia',
  'Santa Cruz': 'Patagonia',
  'Tierra del Fuego': 'Patagonia',
}

class OfficialDataLoader {
  private db: ReturnType<typeof drizzle>
  private connection: ReturnType<typeof postgres>

  constructor() {
    const dbHost = (() => { try { return new URL(DATABASE_URL!).hostname } catch { return 'unknown' } })()
    this.connection = postgres(DATABASE_URL!, { max: 1, prepare: false })
    this.db = drizzle(this.connection)
    console.log(`🔌 DB connection initialized (host=${dbHost}, max=1)`) 
  }

  async downloadCSV(): Promise<string> {
    console.log('📥 Downloading official CSV data...')
    
    try {
      const response = await fetch(CSV_URL)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const csvText = await response.text()
      console.log(`✅ Downloaded ${csvText.length} characters`)
      return csvText
    } catch (error) {
      console.error('❌ Error downloading CSV:', error)
      throw error
    }
  }

  parseCSV(csvText: string): CSVRow[] {
    console.log('📊 Parsing CSV data...')
    
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    
    console.log('CSV Headers:', headers)
    
    const rows: CSVRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      
      if (values.length >= headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]?.replace(/"/g, '').trim() || ''
        })
        rows.push(row as CSVRow)
      }
    }
    
    console.log(`✅ Parsed ${rows.length} rows`)
    return rows
  }

  private parseCSVLine(line: string): string[] {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }

  processData(rows: CSVRow[], limit?: number): { stations: ProcessedStation[], prices: ProcessedPrice[] } {
    console.log('🔄 Processing data...')
    
    const stationsMap = new Map<string, ProcessedStation>()
    const prices: ProcessedPrice[] = []
    const processedRows = limit ? rows.slice(0, limit) : rows
    const totalRows = processedRows.length
    let i = 0
    
    for (const row of processedRows) {
      try {
        i++
        if (i % 50000 === 0) {
          console.log(`  • Processed ${i}/${totalRows} rows -> stations=${stationsMap.size}, prices=${prices.length}`)
        }
        // Process station using idempresa as unique key AND as station ID
        const stationKey = row.idempresa
        const stationId = row.idempresa // Use idempresa as the primary key
        
        if (!stationsMap.has(stationKey)) {
          const lat = parseFloat(row.latitud)
          const lng = parseFloat(row.longitud)
          
          // Skip rows with invalid coordinates
          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            continue
          }
          
          const station: ProcessedStation = {
            id: stationId, // Use idempresa as consistent ID
            idempresa: row.idempresa,
            nombre: row.empresabandera || row.empresa || 'Estación sin nombre',
            empresa: row.empresabandera || row.empresa,
            cuit: row.cuit,
            direccion: row.direccion,
            localidad: row.localidad,
            provincia: row.provincia,
            region: row.region || PROVINCE_TO_REGION[row.provincia] || 'Otra',
            latitud: lat,
            longitud: lng
          }
          
          stationsMap.set(stationKey, station)
        }
        
        // Process prices
        const station = stationsMap.get(stationKey)!
        const fuelType = FUEL_TYPE_MAPPING[row.producto]
        
        if (!fuelType) {
          console.warn(`⚠️  Unknown fuel type: ${row.producto}`)
          continue
        }
        
        const fechaVigencia = new Date(row.fecha_vigencia)
        if (isNaN(fechaVigencia.getTime())) {
          console.warn(`⚠️  Invalid date: ${row.fecha_vigencia}`)
          continue
        }
        
        const precio = parseFloat(row.precio)
        if (isNaN(precio) || precio <= 0) {
          console.warn(`⚠️  Invalid price: ${row.precio}`)
          continue
        }
        
        // Determine if it's daytime or nighttime price based on tipohorario
        const horario = row.tipohorario?.toLowerCase().includes('nocturn') ? 'nocturno' : 'diurno'
        
        prices.push({
          estacionId: stationId, // Use the same consistent ID
          tipoCombustible: fuelType,
          precio: precio,
          horario: horario,
          fechaVigencia,
          fuente: 'oficial',
          esValidado: true,
          fechaReporte: new Date()
        })
        
      } catch (error) {
        console.warn(`⚠️  Error processing row:`, error)
        continue
      }
    }
    
    const stations = Array.from(stationsMap.values())
    console.log(`✅ Processed ${stations.length} stations and ${prices.length} prices`)
    
    return { stations, prices }
  }

  async saveData(stations: ProcessedStation[], prices: ProcessedPrice[], replaceExisting: boolean = false) {
    console.log('💾 Saving data to database...')
    console.time('save_total')
    
    try {
      if (replaceExisting) {
        console.log('🗑️  Clearing existing official data...')
        await this.db.delete(precios).where(eq(precios.fuente, 'oficial'))
        await this.db.delete(estaciones)
      }
      
      // Insert stations
      console.log(`📍 Inserting ${stations.length} stations...`)
      console.time('stations_upsert')
      let stationsInserted = 0
      let stationsUpdated = 0
      let stationsUnchanged = 0

      // 1) Prefetch existing stations in one query
      const stationIds = stations.map(s => s.id)
      console.time('stations_prefetch')
      const existingRows = stationIds.length > 0
        ? await this.db
            .select({
              id: estaciones.id,
              nombre: estaciones.nombre,
              empresa: estaciones.empresa,
              cuit: estaciones.cuit,
              direccion: estaciones.direccion,
              localidad: estaciones.localidad,
              provincia: estaciones.provincia,
              region: estaciones.region,
              latitud: estaciones.latitud,
              longitud: estaciones.longitud,
            })
            .from(estaciones)
            .where(inArray(estaciones.id, stationIds))
        : []
      console.timeEnd('stations_prefetch')

      const existingMap = new Map(existingRows.map(r => [r.id, r]))

      // 2) Split into toInsert vs toUpdate
      const toInsert: ProcessedStation[] = []
      const toUpdate: ProcessedStation[] = []
      for (const s of stations) {
        const e = existingMap.get(s.id)
        if (!e) toInsert.push(s)
        else toUpdate.push(s)
      }

      // 3) Bulk insert in chunks
      const insertChunkSize = 1000
      console.time('stations_bulk_insert')
      for (let i = 0; i < toInsert.length; i += insertChunkSize) {
        const chunk = toInsert.slice(i, i + insertChunkSize)
        if (chunk.length === 0) continue
        try {
          await this.db.insert(estaciones).values(chunk)
          stationsInserted += chunk.length
          console.log(`  • Stations inserted ${Math.min(i + chunk.length, toInsert.length)}/${toInsert.length}`)
        } catch (error) {
          console.warn('⚠️  Error in stations bulk insert chunk:', error)
        }
      }

      console.timeEnd('stations_bulk_insert')

      // 4) Update only changed rows (per-row updates, but far fewer)
      console.time('stations_changed_updates')
      let processedUpdates = 0
      for (const station of toUpdate) {
        const e = existingMap.get(station.id)!
        const latChanged = Math.abs((e.latitud ?? 0) - station.latitud) > 1e-8
        const lngChanged = Math.abs((e.longitud ?? 0) - station.longitud) > 1e-8
        const needsUpdate = (
          e.nombre !== station.nombre ||
          e.empresa !== station.empresa ||
          e.cuit !== station.cuit ||
          e.direccion !== station.direccion ||
          e.localidad !== station.localidad ||
          e.provincia !== station.provincia ||
          e.region !== station.region ||
          latChanged ||
          lngChanged
        )
        if (needsUpdate) {
          try {
            await this.db
              .update(estaciones)
              .set({
                nombre: station.nombre,
                empresa: station.empresa,
                cuit: station.cuit,
                direccion: station.direccion,
                localidad: station.localidad,
                provincia: station.provincia,
                region: station.region,
                latitud: station.latitud,
                longitud: station.longitud,
                fechaActualizacion: new Date()
              })
              .where(eq(estaciones.id, station.id))
            stationsUpdated++
          } catch (error) {
            console.warn(`⚠️  Error updating station ${station.nombre}:`, error)
          }
        } else {
          stationsUnchanged++
        }
        processedUpdates++
        if (processedUpdates % 500 === 0) {
          console.log(`  • Stations checked (updates) ${processedUpdates}/${toUpdate.length} (upd=${stationsUpdated}, same=${stationsUnchanged})`)
        }
      }
      console.timeEnd('stations_changed_updates')
      console.timeEnd('stations_upsert')
      console.log(`✅ Stations summary: ins=${stationsInserted}, upd=${stationsUpdated}, same=${stationsUnchanged}`)
      
      // Insert prices (batch upsert)
      console.log(`💰 Processing ${prices.length} prices...`)
      console.time('prices_upsert')
      let pricesInserted = 0
      let pricesUpdated = 0
      let pricesUnchanged = 0

      // Prefetch existing prices for involved stations/products/horarios to avoid per-row selects
      const priceStationIds = Array.from(new Set(prices.map(p => p.estacionId)))
      const priceTipos = Array.from(new Set(prices.map(p => p.tipoCombustible)))
      const priceHorarios = Array.from(new Set(prices.map(p => p.horario)))

      console.time('prices_prefetch')
      const existingPrices = (priceStationIds.length > 0)
        ? await this.db
            .select({
              id: precios.id,
              estacionId: precios.estacionId,
              tipoCombustible: precios.tipoCombustible,
              horario: precios.horario,
              fuente: precios.fuente,
              precio: precios.precio,
              fechaVigencia: precios.fechaVigencia,
            })
            .from(precios)
            .where(
              and(
                inArray(precios.estacionId, priceStationIds),
                inArray(precios.tipoCombustible, priceTipos as any),
                inArray(precios.horario, priceHorarios as any),
                eq(precios.fuente, 'oficial')
              )
            )
        : []
      console.timeEnd('prices_prefetch')

      // Build a map by composite key
      const keyOf = (p: { estacionId: string; tipoCombustible: string; horario: string; fuente: string }) => `${p.estacionId}|${p.tipoCombustible}|${p.horario}|${p.fuente}`
      const existingPriceMap = new Map(existingPrices.map(p => [keyOf(p), p]))

      const toInsertOrUpdate: ProcessedPrice[] = []
      const changedForHistory: ProcessedPrice[] = []
      const EPS = 0.001

      for (const p of prices) {
        const key = keyOf({ estacionId: p.estacionId, tipoCombustible: p.tipoCombustible, horario: p.horario, fuente: 'oficial' })
        const existing = existingPriceMap.get(key)
        if (!existing) {
          // New row -> will insert
          toInsertOrUpdate.push(p)
          pricesInserted++
        } else {
          const existingPriceNum = parseFloat(existing.precio as string)
          if (Math.abs(existingPriceNum - p.precio) > EPS) {
            // Changed -> include in upsert and history
            toInsertOrUpdate.push(p)
            changedForHistory.push(p)
            pricesUpdated++
          } else {
            pricesUnchanged++
          }
        }
      }

      // Deduplicate within this command to avoid: ON CONFLICT DO UPDATE command cannot affect row a second time
      // Keep the most recent by fechaVigencia per (estacionId, tipoCombustible, horario, fuente)
      const upsertByKey = new Map<string, ProcessedPrice>()
      for (const p of toInsertOrUpdate) {
        const k = keyOf({ estacionId: p.estacionId, tipoCombustible: p.tipoCombustible, horario: p.horario, fuente: 'oficial' })
        const prev = upsertByKey.get(k)
        if (!prev || (p.fechaVigencia > prev.fechaVigencia)) {
          upsertByKey.set(k, p)
        }
      }
      const dedupedUpserts = Array.from(upsertByKey.values())

      const changedKeys = new Set(
        changedForHistory.map(p => keyOf({ estacionId: p.estacionId, tipoCombustible: p.tipoCombustible, horario: p.horario, fuente: 'oficial' }))
      )
      const dedupedHistory = dedupedUpserts.filter(p => changedKeys.has(keyOf({ estacionId: p.estacionId, tipoCombustible: p.tipoCombustible, horario: p.horario, fuente: 'oficial' })))
      if (dedupedUpserts.length !== toInsertOrUpdate.length) {
        console.log(`  • Dedup upserts: ${toInsertOrUpdate.length} -> ${dedupedUpserts.length}`)
      }

      // Upsert in chunks using the unique constraint (estacionId, tipoCombustible, horario, fuente)
      const upsertChunkSize = 1000
      console.time('prices_bulk_upsert')
      for (let i = 0; i < dedupedUpserts.length; i += upsertChunkSize) {
        const chunk = dedupedUpserts.slice(i, i + upsertChunkSize)
        if (chunk.length === 0) continue
        try {
          await this.db
            .insert(precios)
            .values(chunk.map(p => ({
              estacionId: p.estacionId,
              tipoCombustible: p.tipoCombustible,
              precio: p.precio.toString(),
              horario: p.horario,
              fechaVigencia: p.fechaVigencia,
              fuente: 'oficial' as const,
              esValidado: p.esValidado,
              fechaReporte: new Date(),
            })))
            .onConflictDoUpdate({
              target: [precios.estacionId, precios.tipoCombustible, precios.horario, precios.fuente],
              set: {
                precio: sql`excluded.precio`,
                fechaVigencia: sql`excluded.fecha_vigencia`,
                fechaReporte: new Date(),
              },
              // Only update when price actually changed
              where: sql`${precios.precio} IS DISTINCT FROM excluded.precio`
            })
          if ((i / upsertChunkSize) % 5 === 0) {
            console.log(`  • Prices upserted ${Math.min(i + chunk.length, dedupedUpserts.length)}/${dedupedUpserts.length}`)
          }
        } catch (error) {
          console.warn('⚠️  Error in prices bulk upsert chunk:', error)
        }
      }
      console.timeEnd('prices_bulk_upsert')

      // Insert history only for changed rows (same chunks)
      console.time('prices_history_insert')
      for (let i = 0; i < dedupedHistory.length; i += upsertChunkSize) {
        const chunk = dedupedHistory.slice(i, i + upsertChunkSize)
        if (chunk.length === 0) continue
        try {
          await this.db.insert(preciosHistorico).values(chunk.map(p => ({
            estacionId: p.estacionId,
            tipoCombustible: p.tipoCombustible,
            precio: p.precio.toString(),
            horario: p.horario,
            fechaVigencia: p.fechaVigencia,
            fuente: p.fuente,
            esValidado: p.esValidado,
            fechaCreacion: new Date(),
          })))
        } catch (error) {
          console.warn('⚠️  Error in prices history insert chunk:', error)
        }
      }
      console.timeEnd('prices_history_insert')

      console.timeEnd('prices_upsert')
      
      console.log(`✅ Inserted ${stationsInserted} new stations, ${pricesInserted} new prices, updated ${pricesUpdated} prices, and ${pricesUnchanged} prices were unchanged`)
      
    } catch (error) {
      console.error('❌ Error saving data:', error)
      throw error
    }
    console.timeEnd('save_total')
  }

  async close() {
    await this.connection.end()
  }
}

async function main() {
  const args = process.argv.slice(2)
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : undefined
  const replaceExisting = args.includes('--replace')
  const dryRun = args.includes('--dry-run')
  
  console.log('🚀 Starting official data import...')
  console.log(`Options: limit=${limit || 'none'}, replace=${replaceExisting}, dryRun=${dryRun}`)
  
  const loader = new OfficialDataLoader()
  
  try {
    // Download and parse CSV
    console.time('download_csv')
    const csvText = await loader.downloadCSV()
    console.timeEnd('download_csv')
    console.time('parse_csv')
    const rows = loader.parseCSV(csvText)
    console.timeEnd('parse_csv')
    
    // Process data
    console.time('process_data')
    const { stations, prices } = loader.processData(rows, limit)
    console.timeEnd('process_data')
    console.log(`📦 Prepared for save -> stations=${stations.length}, prices=${prices.length}`)
    
    if (dryRun) {
      console.log('🔍 DRY RUN - No data will be saved')
      console.log(`Would process ${stations.length} stations and ${prices.length} prices`)
      
      // Show sample data
      console.log('\nSample stations:')
      stations.slice(0, 3).forEach(s => {
        console.log(`  - ${s.nombre} (${s.empresa}) - ${s.direccion}, ${s.localidad}`)
      })
      
      console.log('\nSample prices:')
      prices.slice(0, 5).forEach(p => {
        console.log(`  - ${p.tipoCombustible} ${p.horario}: $${p.precio}`)
      })
      
    } else {
      // Save to database
      console.time('save_data')
      await loader.saveData(stations, prices, replaceExisting)
      console.timeEnd('save_data')
      console.log('🎉 Import completed successfully!')
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error)
    process.exit(1)
  } finally {
    await loader.close()
  }
}

// Show usage if no arguments
if (process.argv.length === 1) {
  console.log(`
Usage: tsx scripts/load-official-data.ts [options]

Options:
  --limit N         Only process first N rows (useful for testing)
  --replace         Replace all existing data (default: update/insert only)
  --dry-run         Don't save to database, just show what would be processed

Examples:
  # Load first 100 rows for testing
  tsx scripts/load-official-data.ts --limit 100 --dry-run
  
  # Full import (updates existing data)
  tsx scripts/load-official-data.ts
  
  # Replace all existing data with fresh import
  tsx scripts/load-official-data.ts --replace
  
  # Load first 1000 rows
  tsx scripts/load-official-data.ts --limit 1000
`)
  process.exit(0)
}

main()