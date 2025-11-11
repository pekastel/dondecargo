import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createErrorResponse, safeLog } from '@/lib/utils/errors'
import { env } from '@/lib/env'
import {
  extractCoordinatesFromUrl,
  extractPlaceDetails,
  isValidGoogleMapsUrl,
  areCoordinatesInArgentina,
  getPlaceIdFromUrl,
  enrichPlaceData,
  searchNearbyGasStations,
} from '@/lib/services/google-maps-service'

const requestSchema = z.object({
  url: z.string().url('Debe ser una URL válida'),
})

export async function POST(request: NextRequest) {
  try {
    safeLog('🔍 Starting extract Google Maps data API request')
    
    const body = await request.json()
    const { url } = requestSchema.parse(body)
    
    // Validar que sea una URL de Google Maps
    if (!isValidGoogleMapsUrl(url)) {
      return NextResponse.json(
        { error: 'La URL proporcionada no es una URL válida de Google Maps' },
        { status: 400 }
      )
    }
    
    const apiKey = env.GOOGLE_MAPS_API_KEY
    const enrichedData = null
    let validated = false
    let isGasStation: boolean | null = null
    
    // SI tenemos API key, usar Places API para validación y enriquecimiento
    if (apiKey) {
      safeLog('🔑 Google Maps API key detected, attempting Places API enrichment')
      
      try {
        // Intentar extraer Place ID primero (flujo directo, más rápido)
        const placeId = await getPlaceIdFromUrl(url)
        
        if (placeId) {
          safeLog(`📍 Place ID extracted: ${placeId}`)
          
          try {
            // Llamar a Places API
            const enriched = await enrichPlaceData(placeId, apiKey)
            
            validated = true
            isGasStation = enriched.isGasStation
            
            // Si NO es estación de servicio, retornar error inmediato
            if (!enriched.isGasStation) {
              safeLog('❌ Location is not a gas station')
              return NextResponse.json(
                { 
                  error: 'El lugar no es una estación de servicio',
                  validated: true,
                  isGasStation: false,
                  details: 'La ubicación proporcionada no está registrada como estación de servicio en Google Maps.'
                },
                { status: 400 }
              )
            }
            
            // Validar que las coordenadas estén en Argentina
            if (!areCoordinatesInArgentina(enriched.coordinates.latitud, enriched.coordinates.longitud)) {
              return NextResponse.json(
                { error: 'Las coordenadas proporcionadas no están dentro del territorio argentino' },
                { status: 400 }
              )
            }
            
            safeLog('✅ Location validated as gas station (direct method)')
            
            return NextResponse.json({
              success: true,
              validated: true,
              isGasStation: true,
              method: 'direct',
              coordinates: enriched.coordinates,
              enrichedData: {
                name: enriched.name,
                address: enriched.address,
                addressComponents: enriched.addressComponents,
                phone: enriched.phone,
                website: enriched.website,
                hours: enriched.hours,
                rating: enriched.rating,
                totalRatings: enriched.totalRatings,
              },
            })
          } catch (error) {
            safeLog(`⚠️ Place Details with extracted ID failed: ${error instanceof Error ? error.message : 'Unknown'}`)
            // Continuar al flujo de Nearby Search
          }
        }
        
        // Si no se pudo extraer Place ID O falló Place Details, usar Nearby Search
        safeLog('🔍 Using Nearby Search to find gas stations')
        
        // Primero necesitamos coordenadas
        let searchCoordinates
        try {
          searchCoordinates = await extractCoordinatesFromUrl(url)
        } catch (error) {
          throw new Error('No se pudieron extraer coordenadas para búsqueda cercana')
        }
        
        // Validar que estén en Argentina
        if (!areCoordinatesInArgentina(searchCoordinates.latitud, searchCoordinates.longitud)) {
          return NextResponse.json(
            { error: 'Las coordenadas proporcionadas no están dentro del territorio argentino' },
            { status: 400 }
          )
        }
        
        // Buscar estaciones cercanas (radio 150m - ampliado para capturar URLs cortas)
        const nearbyStations = await searchNearbyGasStations(
          searchCoordinates.latitud,
          searchCoordinates.longitud,
          150,
          apiKey
        )
        
        if (nearbyStations.length === 0) {
          safeLog('⚠️ No gas stations found nearby, trying larger radius')
          
          // Intentar con radio más grande (300m)
          const nearbyStationsLarger = await searchNearbyGasStations(
            searchCoordinates.latitud,
            searchCoordinates.longitud,
            300,
            apiKey
          )
          
          if (nearbyStationsLarger.length === 0) {
            return NextResponse.json(
              { 
                error: 'No se encontraron estaciones de servicio en un radio de 300 metros',
                details: 'El punto en Google Maps debe corresponder a una estación de servicio o estar a menos de 300 metros de distancia. Intenta pegando la URL directa de la estación desde Google Maps (busca el nombre de la estación, no solo un punto en el mapa).',
                searchRadius: 300,
                coordinates: {
                  lat: searchCoordinates.latitud,
                  lng: searchCoordinates.longitud
                }
              },
              { status: 404 }
            )
          }
          
          safeLog(`✅ Found ${nearbyStationsLarger.length} gas stations nearby (300m radius)`)
          
          return NextResponse.json({
            success: true,
            method: 'nearby_search',
            needsSelection: true,
            coordinates: searchCoordinates,
            nearbyStations: nearbyStationsLarger.map(s => ({
              placeId: s.placeId,
              name: s.name,
              address: s.address,
              distance: s.distance,
            })),
          })
        }
        
        safeLog(`✅ Found ${nearbyStations.length} gas stations nearby (150m radius)`)
        
        return NextResponse.json({
          success: true,
          method: 'nearby_search',
          needsSelection: true,
          coordinates: searchCoordinates,
          nearbyStations: nearbyStations.map(s => ({
            placeId: s.placeId,
            name: s.name,
            address: s.address,
            distance: s.distance,
          })),
        })
        
      } catch (error) {
        // Si falla completamente Places API, continuar con método de fallback
        safeLog(`⚠️ Places API completely failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        safeLog('Falling back to coordinate extraction method')
      }
    } else {
      safeLog('ℹ️ No Google Maps API key configured, using fallback method')
    }
    
    // FALLBACK: Método original (solo coordenadas)
    let coordinates
    try {
      coordinates = await extractCoordinatesFromUrl(url)
      safeLog(`📍 Coordinates extracted (fallback): ${coordinates.latitud}, ${coordinates.longitud}`)
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'No se pudieron extraer las coordenadas de la URL proporcionada',
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        { status: 400 }
      )
    }
    
    // Validar que las coordenadas estén en Argentina
    if (!areCoordinatesInArgentina(coordinates.latitud, coordinates.longitud)) {
      return NextResponse.json(
        { error: 'Las coordenadas proporcionadas no están dentro del territorio argentino' },
        { status: 400 }
      )
    }
    
    // Intentar extraer nombre del place (método básico)
    let placeData = null
    try {
      const details = await extractPlaceDetails(url)
      placeData = {
        nombre: details.nombre,
        placeId: details.placeId,
      }
    } catch (error) {
      safeLog('⚠️ Could not extract basic place details')
    }
    
    return NextResponse.json({
      success: true,
      validated: false,
      isGasStation: null,
      coordinates,
      placeData,
      warning: !apiKey 
        ? 'Validación automática no disponible. Configura GOOGLE_MAPS_API_KEY para habilitar validación de estaciones de servicio.'
        : 'No se pudo validar automáticamente. Por favor, verifica que la ubicación sea una estación de servicio.',
    })
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'extract Google Maps data API validation',
        error,
        400,
        'URL inválida'
      );
    }

    // Generic error handling
    return createErrorResponse(
      'extract Google Maps data API',
      error,
      500,
      'Error al procesar la URL de Google Maps'
    );
  }
}

