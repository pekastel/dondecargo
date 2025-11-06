import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { estaciones, estacionesDatosAdicionales, precios } from '@/drizzle/schema'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createErrorResponse, handleDatabaseError, safeLog } from '@/lib/utils/errors'
import { extractCoordinatesFromUrl, isValidGoogleMapsUrl, areCoordinatesInArgentina, extractPlaceDetails, getPlaceIdFromUrl, enrichPlaceData } from '@/lib/services/google-maps-service'
import { env } from '@/lib/env'
import { sendStationCreatedEmail } from '@/lib/email'
import { createId } from '@paralleldrive/cuid2'

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

// Schema de validación para crear estación
const createStationSchema = z.object({
  googleMapsUrl: z.string().url('URL de Google Maps inválida').min(1, 'URL de Google Maps es requerida'),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(200, 'El nombre no puede exceder 200 caracteres'),
  empresa: z.string().min(2, 'La empresa debe tener al menos 2 caracteres').max(100, 'La empresa no puede exceder 100 caracteres'),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(300, 'La dirección no puede exceder 300 caracteres'),
  localidad: z.string().min(2, 'La localidad debe tener al menos 2 caracteres').max(100, 'La localidad no puede exceder 100 caracteres'),
  provincia: z.string().min(2, 'La provincia debe tener al menos 2 caracteres').max(100, 'La provincia no puede exceder 100 caracteres'),
  cuit: z.string().optional(),
  
  // Datos adicionales opcionales
  horarios: z.record(z.string()).optional(),
  telefono: z.string().max(50).optional(),
  servicios: z.object({
    tienda: z.boolean().optional(),
    banios: z.boolean().optional(),
    lavadero: z.boolean().optional(),
    wifi: z.boolean().optional(),
    restaurante: z.boolean().optional(),
    estacionamiento: z.boolean().optional(),
  }).optional(),
  
  // Precios opcionales
  precios: z.array(z.object({
    tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
    precio: z.number().positive('El precio debe ser mayor a 0').max(10000, 'El precio no puede exceder $10,000'),
    horario: z.enum(['diurno', 'nocturno']).default('diurno'),
  })).optional(),
})

export async function POST(request: NextRequest) {
  let db: ReturnType<typeof createDbConnection> | null = null
  
  try {
    safeLog('🔍 Starting create station API request')
    
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para crear una estación.' },
        { status: 401 }
      )
    }
    
    const userId = session.user.id
    const userEmail = session.user.email
    const userName = session.user.name || 'Usuario'
    
    safeLog(`👤 User authenticated: ${userId}`)
    
    // Create database connection
    db = createDbConnection()
    safeLog('✅ Database connection created')
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createStationSchema.parse(body)
    
    safeLog('✅ Request body validated')
    
    // Validar URL de Google Maps
    if (!isValidGoogleMapsUrl(validatedData.googleMapsUrl)) {
      return NextResponse.json(
        { error: 'La URL proporcionada no es una URL válida de Google Maps' },
        { status: 400 }
      )
    }
    
    let coordinates
    const apiKey = env.GOOGLE_MAPS_API_KEY
    
    // SI tenemos API key, validar con Places API antes de continuar
    if (apiKey) {
      safeLog('🔑 Validating with Google Places API')
      
      try {
        const placeId = getPlaceIdFromUrl(validatedData.googleMapsUrl)
        
        if (placeId) {
          const enriched = await enrichPlaceData(placeId, apiKey)
          
          // Validación crítica: debe ser estación de servicio
          if (!enriched.isGasStation) {
            safeLog('❌ Validation failed: not a gas station')
            return NextResponse.json(
              { 
                error: 'El lugar no es una estación de servicio',
                details: 'La ubicación proporcionada no está registrada como estación de servicio en Google Maps. Por favor, verifica la URL.'
              },
              { status: 400 }
            )
          }
          
          // Usar coordenadas validadas de Places API
          coordinates = enriched.coordinates
          safeLog(`✅ Gas station validated via Places API: ${enriched.name}`)
        } else {
          // Si no se puede extraer Place ID, fallback a método manual
          safeLog('⚠️ Could not extract Place ID, falling back to manual extraction')
          coordinates = await extractCoordinatesFromUrl(validatedData.googleMapsUrl)
        }
      } catch (error) {
        // Si falla Places API, intentar con método manual
        safeLog(`⚠️ Places API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        safeLog('Falling back to manual coordinate extraction')
        coordinates = await extractCoordinatesFromUrl(validatedData.googleMapsUrl)
      }
    } else {
      // Sin API key, usar método manual
      safeLog('ℹ️ No API key configured, using manual extraction')
      try {
        coordinates = await extractCoordinatesFromUrl(validatedData.googleMapsUrl)
        safeLog(`📍 Coordinates extracted: ${coordinates.latitud}, ${coordinates.longitud}`)
      } catch (error) {
        return NextResponse.json(
          { 
            error: 'No se pudieron extraer las coordenadas de la URL de Google Maps proporcionada',
            details: error instanceof Error ? error.message : 'Error desconocido'
          },
          { status: 400 }
        )
      }
    }
    
    // Validar que las coordenadas estén en Argentina
    if (!areCoordinatesInArgentina(coordinates.latitud, coordinates.longitud)) {
      return NextResponse.json(
        { error: 'Las coordenadas proporcionadas no están dentro del territorio argentino' },
        { status: 400 }
      )
    }
    
    // Determinar región basada en provincia (mismo patrón que load-official-data.ts)
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
    
    const region = PROVINCE_TO_REGION[validatedData.provincia] || 'Otra'
    
    // Generar IDs
    const estacionId = createId()
    const idempresa = `user-${userId}-${Date.now()}` // ID único para estaciones de usuarios
    
    // Insertar estación
    const newStation = await db.insert(estaciones).values({
      id: estacionId,
      idempresa: idempresa,
      nombre: validatedData.nombre,
      empresa: validatedData.empresa,
      cuit: validatedData.cuit || 'N/A',
      direccion: validatedData.direccion,
      localidad: validatedData.localidad,
      provincia: validatedData.provincia,
      region: region,
      latitud: coordinates.latitud,
      longitud: coordinates.longitud,
      googleMapsUrl: validatedData.googleMapsUrl,
      fuente: 'usuario',
      estado: 'pendiente', // Requiere aprobación de admin
      usuarioCreadorId: userId,
    }).returning()
    
    safeLog(`✅ Station created: ${newStation[0].id}`)
    
    // Insertar datos adicionales si existen
    if (validatedData.horarios || validatedData.telefono || validatedData.servicios) {
      await db.insert(estacionesDatosAdicionales).values({
        estacionId: estacionId,
        horarios: validatedData.horarios || null,
        telefono: validatedData.telefono || null,
        servicios: validatedData.servicios || null,
      })
      
      safeLog('✅ Additional data inserted')
    }
    
    // Insertar precios si existen
    if (validatedData.precios && validatedData.precios.length > 0) {
      const preciosToInsert = validatedData.precios.map(p => ({
        estacionId: estacionId,
        tipoCombustible: p.tipoCombustible,
        precio: p.precio.toString(),
        horario: p.horario,
        fechaVigencia: new Date(),
        fuente: 'usuario' as const,
        usuarioId: userId,
        esValidado: false, // Los precios de usuarios requieren validación
        fechaReporte: new Date(),
      }))
      
      await db.insert(precios).values(preciosToInsert)
      
      safeLog(`✅ ${preciosToInsert.length} prices inserted`)
    }
    
    // Enviar email de agradecimiento
    try {
      await sendStationCreatedEmail({
        user: {
          id: userId,
          email: userEmail,
          name: userName,
        },
        stationName: validatedData.nombre,
        address: validatedData.direccion,
        status: 'pendiente',
      })
      
      safeLog('✅ Thank you email sent')
    } catch (emailError) {
      // No fallar la creación si el email falla
      console.error('Failed to send thank you email:', emailError)
      safeLog('⚠️ Email sending failed, but station was created')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Estación creada exitosamente. Está pendiente de aprobación por nuestro equipo.',
      data: {
        id: newStation[0].id,
        nombre: newStation[0].nombre,
        estado: newStation[0].estado,
      }
    }, { status: 201 })
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'create station API validation',
        error,
        400,
        'Datos de estación inválidos',
        error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      return handleDatabaseError('create station API', error);
    }

    // Generic error handling
    return createErrorResponse(
      'create station API',
      error,
      500,
      'Error al crear la estación'
    );
  }
}

