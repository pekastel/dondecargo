/**
 * Script de diagnóstico para problemas de extracción de Google Maps
 * 
 * Casos de prueba:
 * - URLs cortas (goo.gl)
 * - URLs largas con Place ID
 * - Coordenadas directas
 * 
 * Uso:
 * npx tsx scripts/diagnose-google-maps-extraction.ts <URL> [PLACE_ID_ESPERADO]
 * 
 * Ejemplos:
 * npx tsx scripts/diagnose-google-maps-extraction.ts "https://maps.app.goo.gl/XfBjmVAqQWHP3E3S8"
 * npx tsx scripts/diagnose-google-maps-extraction.ts "https://maps.app.goo.gl/XfBjmVAqQWHP3E3S8" "ChIJ5_cDA2EBvb0RpQJ1H9dVPfY"
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { 
  extractCoordinatesFromUrl,
  getPlaceIdFromUrl,
  enrichPlaceData,
  searchNearbyGasStations,
  isValidGoogleMapsUrl,
  areCoordinatesInArgentina
} from '@/lib/services/google-maps-service'

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function section(title: string) {
  console.log('\n' + '='.repeat(80))
  log(title, 'bright')
  console.log('='.repeat(80) + '\n')
}

async function diagnoseUrl(url: string, expectedPlaceId?: string) {
  section(`🔍 DIAGNÓSTICO: ${url}`)
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    log('❌ ERROR: GOOGLE_MAPS_API_KEY no configurada', 'red')
    process.exit(1)
  }
  
  // Paso 1: Validar URL
  log('📋 PASO 1: Validación de URL', 'cyan')
  const isValid = isValidGoogleMapsUrl(url)
  log(`   ├─ ¿Es válida?: ${isValid ? '✅ Sí' : '❌ No'}`, isValid ? 'green' : 'red')
  
  if (!isValid) {
    log('   └─ Abortando diagnóstico', 'red')
    return
  }
  
  // Paso 2: Extracción de coordenadas
  log('\n📍 PASO 2: Extracción de coordenadas', 'cyan')
  let coordinates
  try {
    coordinates = await extractCoordinatesFromUrl(url)
    log(`   ├─ Latitud: ${coordinates.latitud}`, 'green')
    log(`   ├─ Longitud: ${coordinates.longitud}`, 'green')
    
    const inArgentina = areCoordinatesInArgentina(coordinates.latitud, coordinates.longitud)
    log(`   └─ ¿En Argentina?: ${inArgentina ? '✅ Sí' : '❌ No'}`, inArgentina ? 'green' : 'red')
    
    if (!inArgentina) {
      log('   └─ Abortando diagnóstico (fuera de Argentina)', 'red')
      return
    }
  } catch (error) {
    log(`   └─ ❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'red')
    return
  }
  
  // Paso 3: Extracción de Place ID
  log('\n🆔 PASO 3: Extracción de Place ID', 'cyan')
  let placeId
  let resolvedUrl = url
  try {
    placeId = await getPlaceIdFromUrl(url)
    if (placeId) {
      log(`   ├─ Place ID extraído: ${placeId}`, 'green')
      if (expectedPlaceId) {
        const matches = placeId === expectedPlaceId
        log(`   └─ ¿Coincide con esperado?: ${matches ? '✅ Sí' : `❌ No (esperado: ${expectedPlaceId})`}`, matches ? 'green' : 'yellow')
      } else {
        log(`   └─ (No hay Place ID esperado para comparar)`, 'reset')
      }
    } else {
      log(`   └─ ⚠️  No se pudo extraer Place ID de la URL`, 'yellow')
    }
  } catch (error) {
    log(`   └─ ❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'red')
  }
  
  // Paso 4: Place Details (si hay Place ID)
  if (placeId) {
    log('\n🏢 PASO 4: Place Details API (método directo)', 'cyan')
    try {
      const enriched = await enrichPlaceData(placeId, apiKey)
      log(`   ├─ Nombre: ${enriched.name}`, 'green')
      log(`   ├─ Dirección: ${enriched.address}`, 'green')
      log(`   ├─ ¿Es gas station?: ${enriched.isGasStation ? '✅ Sí' : '❌ No'}`, enriched.isGasStation ? 'green' : 'red')
      log(`   ├─ Coordenadas API: (${enriched.coordinates.latitud}, ${enriched.coordinates.longitud})`, 'green')
      
      if (enriched.addressComponents) {
        log(`   ├─ Localidad: ${enriched.addressComponents.locality || 'N/A'}`, 'green')
        log(`   ├─ Provincia: ${enriched.addressComponents.province || 'N/A'}`, 'green')
      }
      
      if (enriched.phone) {
        log(`   ├─ Teléfono: ${enriched.phone}`, 'green')
      }
      
      log(`   └─ ✅ Place Details exitoso`, 'green')
      
      // Si es gas station, esto debería funcionar
      if (enriched.isGasStation) {
        log('\n   💡 RESULTADO: Este lugar ES una estación de servicio según Google', 'green')
        log('   💡 El flujo directo debería funcionar correctamente', 'green')
        return { success: true, method: 'direct', data: enriched }
      } else {
        log('\n   ⚠️  RESULTADO: Este lugar NO es una estación de servicio según Google', 'yellow')
        return { success: false, reason: 'not_gas_station' }
      }
    } catch (error) {
      log(`   └─ ❌ Error en Place Details: ${error instanceof Error ? error.message : 'Desconocido'}`, 'red')
      log('   └─ Continuando con Nearby Search...', 'yellow')
    }
  }
  
  // Paso 5: Nearby Search (si no hay Place ID o falló Place Details)
  log('\n🔍 PASO 5: Nearby Search API (método alternativo)', 'cyan')
  
  // Radio 100m
  log('\n   📏 Buscando en radio de 100m...', 'blue')
  try {
    const nearby100 = await searchNearbyGasStations(
      coordinates.latitud,
      coordinates.longitud,
      100,
      apiKey
    )
    
    log(`   ├─ Estaciones encontradas: ${nearby100.length}`, nearby100.length > 0 ? 'green' : 'yellow')
    
    if (nearby100.length > 0) {
      nearby100.forEach((station, idx) => {
        log(`   │  ${idx + 1}. ${station.name}`, 'reset')
        log(`   │     └─ Distancia: ${station.distance}m`, 'reset')
        log(`   │     └─ Place ID: ${station.placeId}`, 'reset')
        if (expectedPlaceId && station.placeId === expectedPlaceId) {
          log(`   │     └─ ✅ MATCH: Este es el lugar esperado`, 'green')
        }
      })
      
      return { success: true, method: 'nearby_100m', stations: nearby100 }
    }
  } catch (error) {
    log(`   └─ ❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'red')
  }
  
  // Radio 250m
  log('\n   📏 Buscando en radio de 250m...', 'blue')
  try {
    const nearby250 = await searchNearbyGasStations(
      coordinates.latitud,
      coordinates.longitud,
      250,
      apiKey
    )
    
    log(`   ├─ Estaciones encontradas: ${nearby250.length}`, nearby250.length > 0 ? 'green' : 'yellow')
    
    if (nearby250.length > 0) {
      nearby250.forEach((station, idx) => {
        log(`   │  ${idx + 1}. ${station.name}`, 'reset')
        log(`   │     └─ Distancia: ${station.distance}m`, 'reset')
        log(`   │     └─ Place ID: ${station.placeId}`, 'reset')
        if (expectedPlaceId && station.placeId === expectedPlaceId) {
          log(`   │     └─ ✅ MATCH: Este es el lugar esperado`, 'green')
        }
      })
      
      return { success: true, method: 'nearby_250m', stations: nearby250 }
    }
  } catch (error) {
    log(`   └─ ❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'red')
  }
  
  // Radio 500m (extra, para debug)
  log('\n   📏 Buscando en radio de 500m (debug)...', 'blue')
  try {
    const nearby500 = await searchNearbyGasStations(
      coordinates.latitud,
      coordinates.longitud,
      500,
      apiKey
    )
    
    log(`   ├─ Estaciones encontradas: ${nearby500.length}`, nearby500.length > 0 ? 'green' : 'red')
    
    if (nearby500.length > 0) {
      nearby500.forEach((station, idx) => {
        log(`   │  ${idx + 1}. ${station.name}`, 'reset')
        log(`   │     └─ Distancia: ${station.distance}m`, 'reset')
        log(`   │     └─ Place ID: ${station.placeId}`, 'reset')
        if (expectedPlaceId && station.placeId === expectedPlaceId) {
          log(`   │     └─ ✅ MATCH: Este es el lugar esperado`, 'green')
        }
      })
      
      return { success: true, method: 'nearby_500m', stations: nearby500 }
    } else {
      log(`   └─ ⚠️  No se encontraron estaciones ni siquiera en 500m`, 'red')
    }
  } catch (error) {
    log(`   └─ ❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`, 'red')
  }
  
  // Conclusión
  log('\n' + '─'.repeat(80), 'red')
  log('❌ CONCLUSIÓN: No se encontraron estaciones de servicio', 'red')
  log('─'.repeat(80), 'red')
  
  return { success: false, reason: 'no_stations_found' }
}

// Main function
async function main() {
  console.clear()
  log('🚀 SCRIPT DE DIAGNÓSTICO - EXTRACCIÓN GOOGLE MAPS', 'bright')
  log('═'.repeat(80), 'bright')
  
  // Obtener argumentos de línea de comandos
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    log('\n❌ ERROR: Debes proporcionar una URL como parámetro', 'red')
    log('\n📖 USO:', 'yellow')
    log('   npx tsx scripts/diagnose-google-maps-extraction.ts <URL> [PLACE_ID_ESPERADO]', 'cyan')
    log('\n💡 EJEMPLOS:', 'yellow')
    log('   npx tsx scripts/diagnose-google-maps-extraction.ts "https://maps.app.goo.gl/XfBjmVAqQWHP3E3S8"', 'cyan')
    log('   npx tsx scripts/diagnose-google-maps-extraction.ts "https://maps.app.goo.gl/XfBjmVAqQWHP3E3S8" "ChIJ5_cDA2EBvb0RpQJ1H9dVPfY"', 'cyan')
    console.log('')
    process.exit(1)
  }
  
  const url = args[0]
  const expectedPlaceId = args[1]
  
  // Ejecutar diagnóstico
  const result = await diagnoseUrl(url, expectedPlaceId)
  
  // Resumen final
  section('📊 RESUMEN FINAL')
  
  log(`URL analizada: ${url}`, 'reset')
  if (expectedPlaceId) {
    log(`Place ID esperado: ${expectedPlaceId}`, 'reset')
  }
  
  if (result.success) {
    log(`\n✅ DIAGNÓSTICO EXITOSO (método: ${result.method})`, 'green')
    if (result.method === 'direct' && result.data) {
      log(`   └─ Estación: ${result.data.name}`, 'green')
    } else if (result.stations && result.stations.length > 0) {
      log(`   └─ Estaciones encontradas: ${result.stations.length}`, 'green')
    }
  } else {
    log(`\n❌ DIAGNÓSTICO FALLIDO`, 'red')
    log(`   └─ Razón: ${result.reason || 'desconocida'}`, 'red')
  }
  
  console.log('\n')
}

main().catch((error) => {
  log(`\n❌ ERROR FATAL: ${error instanceof Error ? error.message : 'Desconocido'}`, 'red')
  console.error(error)
  process.exit(1)
})

