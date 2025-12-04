import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createErrorResponse, safeLog } from '@/lib/utils/errors'
import { env } from '@/lib/env'
import { enrichPlaceData } from '@/lib/services/google-maps-service'

const requestSchema = z.object({
  placeId: z.string().min(1, 'Place ID es requerido'),
})

export async function POST(request: NextRequest) {
  try {
    safeLog('🔍 Starting enrich place API request')
    
    const body = await request.json()
    const { placeId } = requestSchema.parse(body)
    
    const apiKey = env.GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key no configurada' },
        { status: 500 }
      )
    }
    
    safeLog(`📍 Enriching place with ID: ${placeId}`)
    
    // Llamar a Places API para obtener detalles completos
    const enriched = await enrichPlaceData(placeId, apiKey)
    
    // Validar que sea estación de servicio
    if (!enriched.isGasStation) {
      safeLog('❌ Selected place is not a gas station')
      return NextResponse.json(
        { 
          error: 'El lugar seleccionado no es una estación de servicio',
          details: 'Por favor, selecciona una estación de servicio válida.'
        },
        { status: 400 }
      )
    }
    
    safeLog('✅ Place enriched successfully')
    
    return NextResponse.json({
      success: true,
      enrichedData: {
        name: enriched.name,
        address: enriched.address,
        addressComponents: enriched.addressComponents,
        coordinates: enriched.coordinates,
        phone: enriched.phone,
        website: enriched.website,
        hours: enriched.hours,
        rating: enriched.rating,
        totalRatings: enriched.totalRatings,
      },
    })
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'enrich place API validation',
        error,
        400,
        'Place ID inválido',
        { errors: error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) }
      );
    }

    // Generic error handling
    return createErrorResponse(
      'enrich place API',
      error,
      500,
      'Error al enriquecer datos del lugar'
    );
  }
}

