import { config } from 'dotenv'
import { join } from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, precios, preciosHistorico } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
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
    this.connection = postgres(DATABASE_URL!, { max: 1 })
    this.db = drizzle(this.connection)
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
    
    for (const row of processedRows) {
      try {
        // Process station
        const stationKey = `${row.cuit}-${row.idempresa}`
        
        if (!stationsMap.has(stationKey)) {
          const lat = parseFloat(row.latitud)
          const lng = parseFloat(row.longitud)
          
          // Skip rows with invalid coordinates
          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
            continue
          }
          
          const station: ProcessedStation = {
            id: createId(),
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
          estacionId: station.id,
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
    
    try {
      if (replaceExisting) {
        console.log('🗑️  Clearing existing official data...')
        await this.db.delete(precios).where(eq(precios.fuente, 'oficial'))
        await this.db.delete(estaciones)
      }
      
      // Insert stations
      console.log(`📍 Inserting ${stations.length} stations...`)
      let stationsInserted = 0
      
      for (const station of stations) {
        try {
          // Check if station exists
          const existing = await this.db
            .select()
            .from(estaciones)
            .where(eq(estaciones.cuit, station.cuit))
            .limit(1)
          
          if (existing.length === 0) {
            await this.db.insert(estaciones).values(station)
            stationsInserted++
          } else {
            // Update existing station
            await this.db
              .update(estaciones)
              .set({
                ...station,
                fechaActualizacion: new Date()
              })
              .where(eq(estaciones.cuit, station.cuit))
          }
        } catch (error) {
          console.warn(`⚠️  Error inserting station ${station.nombre}:`, error)
        }
      }
      
      // Insert prices
      console.log(`💰 Inserting ${prices.length} prices...`)
      let pricesInserted = 0
      
      for (const price of prices) {
        try {
          // Check if price already exists
          const existing = await this.db
            .select()
            .from(precios)
            .where(
              and(
                eq(precios.estacionId, price.estacionId),
                eq(precios.tipoCombustible, price.tipoCombustible),
                eq(precios.horario, price.horario),
                eq(precios.fuente, 'oficial')
              )
            )
            .limit(1)
          
          if (existing.length === 0) {
            await this.db.insert(precios).values({
              id: createId(),
              ...price
            })
            pricesInserted++
          } else {
            // Update existing price
            await this.db
              .update(precios)
              .set({
                precio: price.precio.toString(),
                fechaVigencia: price.fechaVigencia,
                fechaReporte: new Date()
              })
              .where(eq(precios.id, existing[0].id))
          }
          
          // Also save to historical data
          await this.db.insert(preciosHistorico).values({
            id: createId(),
            estacionId: price.estacionId,
            tipoCombustible: price.tipoCombustible,
            precio: price.precio.toString(),
            horario: price.horario,
            fechaVigencia: price.fechaVigencia,
            fuente: price.fuente,
            esValidado: price.esValidado,
            fechaCreacion: new Date()
          })
          
        } catch (error) {
          console.warn(`⚠️  Error inserting price:`, error)
        }
      }
      
      console.log(`✅ Inserted ${stationsInserted} new stations and ${pricesInserted} new prices`)
      
    } catch (error) {
      console.error('❌ Error saving data:', error)
      throw error
    }
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
    const csvText = await loader.downloadCSV()
    const rows = loader.parseCSV(csvText)
    
    // Process data
    const { stations, prices } = loader.processData(rows, limit)
    
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
      await loader.saveData(stations, prices, replaceExisting)
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
if (process.argv.length === 2) {
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