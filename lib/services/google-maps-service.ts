/**
 * Google Maps Service
 * 
 * Servicio para extraer coordenadas y datos de URLs de Google Maps
 * Integración con Google Places API para validación y enriquecimiento de datos
 */

import { safeLog } from "../utils/errors";

export interface GoogleMapsCoordinates {
  latitud: number;
  longitud: number;
}

export interface GoogleMapsPlaceData extends GoogleMapsCoordinates {
  nombre?: string;
  direccion?: string;
  placeId?: string;
}

// Tipos para Google Places API
export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface OpeningHours {
  open_now?: boolean;
  periods?: Array<{
    open: { day: number; time: string };
    close?: { day: number; time: string };
  }>;
  weekday_text?: string[];
}

// Tipos para Places API (New)
export interface PlaceDetailsNew {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  addressComponents: AddressComponent[];
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions?: string[];
  };
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
}

// Mantener compatibilidad con formato legacy para código existente
export interface PlaceDetails {
  name: string;
  formatted_address: string;
  address_components: AddressComponent[];
  geometry: {
    location: { lat: number; lng: number };
  };
  types: string[];
  formatted_phone_number?: string;
  international_phone_number?: string;
  opening_hours?: OpeningHours;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  place_id: string;
}

export interface EnrichedPlaceData {
  isGasStation: boolean;
  name: string;
  address: string;
  addressComponents: {
    street: string;
    streetNumber: string;
    locality: string;
    province: string;
    postalCode: string;
    country: string;
  };
  coordinates: { latitud: number; longitud: number };
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  rating?: number;
  totalRatings?: number;
  placeId: string;
}

// Tipos para Nearby Search API
export interface NearbyGasStation {
  placeId: string;
  name: string;
  address: string;
  distance: number;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
}

/**
 * Extrae coordenadas de una URL de Google Maps
 * 
 * Soporta los siguientes formatos:
 * - https://www.google.com/maps/place/.../@-34.123,-58.456,17z/...
 * - https://www.google.com/maps/@-34.123,-58.456,17z/...
 * - https://maps.app.goo.gl/... (requiere seguir redirect)
 * - https://www.google.com/maps/search/?api=1&query=-34.123,-58.456
 * - https://www.google.com/maps?q=-34.123,-58.456
 */
export async function extractCoordinatesFromUrl(url: string): Promise<GoogleMapsCoordinates> {
  try {
    // Normalizar URL
    const normalizedUrl = url.trim();
    
    // Si es un shortlink (goo.gl), seguir el redirect
    if (normalizedUrl.includes('goo.gl') || normalizedUrl.includes('maps.app.goo.gl')) {
      const redirectUrl = await followRedirect(normalizedUrl);
      return extractCoordinatesFromUrl(redirectUrl);
    }

    // Patrón 1: URLs con coordenadas en formato @lat,lng
    // Ejemplo: https://www.google.com/maps/place/YPF/@-34.6037,-58.3816,17z/
    const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = normalizedUrl.match(atPattern);
    if (atMatch) {
      return {
        latitud: parseFloat(atMatch[1]),
        longitud: parseFloat(atMatch[2])
      };
    }

    // Patrón 2: URLs con query parameter q=lat,lng
    // Ejemplo: https://www.google.com/maps?q=-34.6037,-58.3816
    const qPattern = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = normalizedUrl.match(qPattern);
    if (qMatch) {
      return {
        latitud: parseFloat(qMatch[1]),
        longitud: parseFloat(qMatch[2])
      };
    }

    // Patrón 3: URLs con query parameter en formato search API
    // Ejemplo: https://www.google.com/maps/search/?api=1&query=-34.6037,-58.3816
    const queryPattern = /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const queryMatch = normalizedUrl.match(queryPattern);
    if (queryMatch) {
      return {
        latitud: parseFloat(queryMatch[1]),
        longitud: parseFloat(queryMatch[2])
      };
    }

    // Patrón 4: URLs con ll parameter (latlong)
    // Ejemplo: https://www.google.com/maps?ll=-34.6037,-58.3816
    const llPattern = /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const llMatch = normalizedUrl.match(llPattern);
    if (llMatch) {
      return {
        latitud: parseFloat(llMatch[1]),
        longitud: parseFloat(llMatch[2])
      };
    }

    throw new Error('No se pudieron extraer coordenadas de la URL proporcionada');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error al procesar la URL de Google Maps');
  }
}

/**
 * Sigue un redirect de URL corta de Google Maps
 */
async function followRedirect(shortUrl: string): Promise<string> {
  try {
    // Usar fetch con redirect: 'manual' para obtener la URL de destino
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });
    
    return response.url;
  } catch (error) {
    throw new Error('No se pudo seguir el redirect de la URL corta');
  }
}

/**
 * Extrae el Place ID de una URL de Google Maps si está disponible
 */
export function extractPlaceId(url: string): string | null {
  // Patrón para extraer place_id o cid
  const placeIdPattern = /place_id=([A-Za-z0-9_-]+)/;
  const cidPattern = /cid=(\d+)/;
  
  const placeIdMatch = url.match(placeIdPattern);
  if (placeIdMatch) {
    return placeIdMatch[1];
  }
  
  const cidMatch = url.match(cidPattern);
  if (cidMatch) {
    return `cid:${cidMatch[1]}`;
  }
  
  return null;
}

/**
 * Extrae nombre del lugar de la URL si está disponible
 * Ejemplo: https://www.google.com/maps/place/YPF+Avenida+Corrientes/...
 */
export function extractPlaceName(url: string): string | null {
  try {
    // Intentar extraer del path /place/NOMBRE/
    const placePattern = /\/place\/([^/@]+)/;
    const match = url.match(placePattern);
    
    if (match) {
      // Decodificar y limpiar el nombre
      const encodedName = match[1];
      const decodedName = decodeURIComponent(encodedName);
      // Reemplazar + por espacios y limpiar
      return decodedName.replace(/\+/g, ' ').trim();
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extrae todos los datos posibles de una URL de Google Maps
 */
export async function extractPlaceDetails(url: string): Promise<GoogleMapsPlaceData> {
  const coordinates = await extractCoordinatesFromUrl(url);
  const placeId = extractPlaceId(url);
  const nombre = extractPlaceName(url);
  
  return {
    ...coordinates,
    nombre: nombre || undefined,
    placeId: placeId || undefined
  };
}

/**
 * Valida si una URL es una URL válida de Google Maps
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  try {
    const normalizedUrl = url.trim().toLowerCase();
    return (
      normalizedUrl.includes('google.com/maps') ||
      normalizedUrl.includes('maps.google.com') ||
      normalizedUrl.includes('goo.gl') ||
      normalizedUrl.includes('maps.app.goo.gl')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Valida que las coordenadas estén dentro de los límites de Argentina
 */
export function areCoordinatesInArgentina(lat: number, lng: number): boolean {
  // Límites aproximados de Argentina
  // Lat: -55.0 (sur) a -21.8 (norte)
  // Lng: -73.6 (oeste) a -53.6 (este)
  return lat >= -55.0 && lat <= -21.8 && lng >= -73.6 && lng <= -53.6;
}

/**
 * Extrae el Place ID de una URL de Google Maps
 * Soporta múltiples formatos de URL incluyendo URLs cortas (goo.gl)
 */
export function getPlaceIdFromUrl(url: string): string | null {
  try {
    // Formato 1: place_id en query parameter (más directo y confiable)
    // Ejemplo: ?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4
    const placeIdMatch = url.match(/place_id=([A-Za-z0-9_-]+)/);
    if (placeIdMatch) {
      return placeIdMatch[1];
    }

    // Formato 2: Place ID corto en formato /g/... (común en URLs redirigidas)
    // Ejemplo: !16s%2Fg%2F11m5fxktlk (URL encoded) o /g/11m5fxktlk (decoded)
    const shortPlaceIdMatch = url.match(/!16s%2Fg%2F([A-Za-z0-9_-]+)/);
    if (shortPlaceIdMatch) {
      return shortPlaceIdMatch[1];
    }

    // Formato 2b: Versión decodificada del Place ID /g/...
    const decodedPlaceIdMatch = url.match(/\/g\/([A-Za-z0-9_-]+)/);
    if (decodedPlaceIdMatch) {
      return decodedPlaceIdMatch[1];
    }

    // Formato 3: ChIJ format (Place ID estándar de Google)
    // Ejemplo: ChIJN1t_tDeuEmsRUsoyG83frY4
    const chiJMatch = url.match(/ChIJ[A-Za-z0-9_-]+/);
    if (chiJMatch) {
      return chiJMatch[0];
    }

    // Formato 4: Feature ID completo en data parameter (con dos puntos)
    // Ejemplo: !1s0x9681411e668775b7:0xc3284df363e157a1
    const ftidDataMatch = url.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    if (ftidDataMatch) {
      return ftidDataMatch[1];
    }

    // Formato 5: ftid (Feature ID) en query parameter
    // Ejemplo: ftid=0x9681411e668775b7:0xc3284df363e157a1
    const ftidMatch = url.match(/ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i);
    if (ftidMatch) {
      return ftidMatch[1];
    }

    // Formato 6: CID (Customer ID) en la URL
    // Ejemplo: cid=12345678901234567890
    const cidMatch = url.match(/cid=(\d+)/);
    if (cidMatch) {
      return `cid:${cidMatch[1]}`;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Valida si un lugar es una estación de servicio basado en sus tipos
 */
export function validateIsGasStation(types: string[]): boolean {
  const gasStationTypes = [
    'gas_station',
    'petrol_station', 
    'fuel',
  ];
  
  return types.some(type => 
    gasStationTypes.includes(type.toLowerCase())
  );
}

/**
 * Obtiene detalles de un lugar desde Google Places API (New)
 */
export async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails> {
  safeLog(`🔍 [NEW API] Getting Place Details for ID: ${placeId}`)
  
  // Places API (New) usa un endpoint diferente con el Place ID en la ruta
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  // Lista de campos a solicitar (usando FieldMask)
  const fieldMask = [
    'id',
    'displayName',
    'formattedAddress',
    'addressComponents',
    'location',
    'types',
    'nationalPhoneNumber',
    'internationalPhoneNumber',
    'regularOpeningHours',
    'websiteUri',
    'rating',
    'userRatingCount',
  ].join(',');

  safeLog(`📤 [NEW API] Place Details URL: ${url}`)
  safeLog(`📤 [NEW API] Field Mask: ${fieldMask}`)
  safeLog(`📤 [NEW API] API Key (primeros 10 chars): ${apiKey.substring(0, 10)}...`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
  });
  
  safeLog(`📥 [NEW API] Response Status: ${response.status} ${response.statusText}`)
  safeLog(`📥 [NEW API] Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)

  const responseText = await response.text();
  safeLog(`📥 [NEW API] Response Body (primeros 1000 chars): ${responseText.substring(0, 1000)}...`)
  
  if (!response.ok) {
    safeLog(`❌ [NEW API] HTTP Error: ${response.status}`)
    let errorDetails = responseText;
    try {
      const errorData = JSON.parse(responseText);
      errorDetails = JSON.stringify(errorData, null, 2);
      safeLog(`❌ Error details: ${errorDetails}`)
    } catch (e) {
      safeLog(`❌ Error response (not JSON): ${responseText}`)
    }
    throw new Error(`Places API (New) error: ${response.status} - ${errorDetails}`);
  }

  const data: PlaceDetailsNew = JSON.parse(responseText);
  safeLog(`✅ [NEW API] Place Details retrieved: ${data.displayName?.text || 'Unknown'}`)

  // Convertir respuesta de New API a formato legacy para compatibilidad
  const legacyFormat: PlaceDetails = {
    name: data.displayName?.text || '',
    formatted_address: data.formattedAddress || '',
    address_components: data.addressComponents || [],
    geometry: {
      location: {
        lat: data.location?.latitude || 0,
        lng: data.location?.longitude || 0,
      },
    },
    types: data.types || [],
    formatted_phone_number: data.nationalPhoneNumber,
    international_phone_number: data.internationalPhoneNumber,
    opening_hours: data.regularOpeningHours ? {
      open_now: data.regularOpeningHours.openNow,
      weekday_text: data.regularOpeningHours.weekdayDescriptions,
    } : undefined,
    website: data.websiteUri,
    rating: data.rating,
    user_ratings_total: data.userRatingCount,
    place_id: data.id,
  };

  safeLog(`✅ [NEW API] Converted to legacy format successfully`)
  return legacyFormat;
}

/**
 * Parsea los address_components para extraer información estructurada
 * Optimizado para direcciones en Argentina
 */
function parseAddressComponents(components: AddressComponent[]): {
  street: string;
  streetNumber: string;
  locality: string;
  province: string;
  postalCode: string;
  country: string;
} {
  safeLog(`🔍 Parsing ${components.length} address components:`)
  components.forEach(c => {
    safeLog(`  📍 ${c.long_name}: [${c.types.join(', ')}]`)
  })

  const result = {
    street: '',
    streetNumber: '',
    locality: '',
    province: '',
    postalCode: '',
    country: '',
  };

  // Buscar locality con prioridades específicas para Argentina
  let localityComponent = null
  
  // Prioridad 1: locality exacto (más común y confiable)
  localityComponent = components.find(c => c.types.includes('locality'))
  if (localityComponent) {
    result.locality = localityComponent.long_name
    safeLog(`  ✅ Locality found (priority 1): ${result.locality}`)
  } else {
    // Prioridad 2: sublocality_level_1 (barrios o zonas)
    localityComponent = components.find(c => c.types.includes('sublocality_level_1') || c.types.includes('sublocality'))
    if (localityComponent) {
      result.locality = localityComponent.long_name
      safeLog(`  ✅ Locality found (priority 2 - sublocality): ${result.locality}`)
    } else {
      // Prioridad 3: postal_town (ciudades pequeñas)
      localityComponent = components.find(c => c.types.includes('postal_town'))
      if (localityComponent) {
        result.locality = localityComponent.long_name
        safeLog(`  ✅ Locality found (priority 3 - postal_town): ${result.locality}`)
      } else {
        safeLog(`  ⚠️ Locality not found in address components`)
      }
    }
  }

  // Provincia: SOLO administrative_area_level_1 (NO usar level_2 que es departamento)
  const provinceComponent = components.find(c => c.types.includes('administrative_area_level_1'))
  if (provinceComponent) {
    result.province = provinceComponent.long_name
    safeLog(`  ✅ Province found: ${result.province}`)
  } else {
    safeLog(`  ⚠️ Province not found in address components`)
  }

  // Otros campos
  for (const component of components) {
    const types = component.types;

    if (types.includes('route') && !result.street) {
      result.street = component.long_name;
    } else if (types.includes('street_number') && !result.streetNumber) {
      result.streetNumber = component.long_name;
    } else if (types.includes('postal_code') && !result.postalCode) {
      result.postalCode = component.long_name;
    } else if (types.includes('country') && !result.country) {
      result.country = component.long_name;
    }
  }

  safeLog(`  📊 Parsed result: locality="${result.locality}", province="${result.province}"`)
  return result;
}

/**
 * Lista de empresas de estaciones de servicio conocidas en Argentina
 */
const KNOWN_COMPANIES = [
  'YPF',
  'Shell',
  'Axion',
  'Puma',
  'Esso',
  'Petrobras',
  'Oil',
  'Refinor',
  'Rhasa',
  'Sol',
  'Dapsa',
  'Raizen',
  'Gulf',
  'Texaco',
  'Total',
]

/**
 * Extrae la empresa/marca de una estación desde su nombre
 * Ejemplo: "YPF - Combustibles Barceló" → "YPF"
 */
export function extractCompanyFromName(name: string): string | null {
  if (!name) return null
  
  safeLog(`🏢 Extracting company from name: "${name}"`)
  
  // Prioridad 1: Buscar al inicio del nombre (case-sensitive primero)
  for (const company of KNOWN_COMPANIES) {
    if (name.startsWith(company)) {
      safeLog(`  ✅ Found company (exact match): ${company}`)
      return company
    }
  }
  
  // Prioridad 2: Buscar al inicio (case-insensitive)
  const nameLower = name.toLowerCase()
  for (const company of KNOWN_COMPANIES) {
    if (nameLower.startsWith(company.toLowerCase())) {
      safeLog(`  ✅ Found company (case-insensitive match): ${company}`)
      return company
    }
  }
  
  // Prioridad 3: Buscar palabra completa en cualquier parte (word boundary)
  for (const company of KNOWN_COMPANIES) {
    const regex = new RegExp(`\\b${company}\\b`, 'i')
    if (regex.test(name)) {
      safeLog(`  ✅ Found company (word boundary match): ${company}`)
      return company
    }
  }
  
  safeLog(`  ⚠️ No known company found in name`)
  return null
}

/**
 * Convierte opening_hours a un formato más simple
 */
function parseOpeningHours(openingHours?: OpeningHours): Record<string, string> | undefined {
  if (!openingHours?.weekday_text) {
    return undefined;
  }

  const daysMap: Record<string, string> = {
    'monday': 'lunes',
    'tuesday': 'martes',
    'wednesday': 'miércoles',
    'thursday': 'jueves',
    'friday': 'viernes',
    'saturday': 'sábado',
    'sunday': 'domingo',
  };

  const result: Record<string, string> = {};

  for (const text of openingHours.weekday_text) {
    // Formato: "Monday: 9:00 AM – 5:00 PM" o "lunes: 9:00 – 17:00"
    const parts = text.split(':');
    if (parts.length >= 2) {
      const day = parts[0].trim().toLowerCase();
      const hours = parts.slice(1).join(':').trim();
      
      // Intentar traducir día al español
      const spanishDay = daysMap[day] || day;
      result[spanishDay] = hours;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Función principal: obtiene y enriquece datos de un lugar
 * Incluye validación de que sea una estación de servicio
 */
export async function enrichPlaceData(
  placeId: string,
  apiKey: string
): Promise<EnrichedPlaceData> {
  const details = await getPlaceDetails(placeId, apiKey);

  const isGasStation = validateIsGasStation(details.types);
  const addressComponents = parseAddressComponents(details.address_components);
  const hours = parseOpeningHours(details.opening_hours);

  return {
    isGasStation,
    name: details.name,
    address: details.formatted_address,
    addressComponents,
    coordinates: {
      latitud: details.geometry.location.lat,
      longitud: details.geometry.location.lng,
    },
    phone: details.formatted_phone_number || details.international_phone_number,
    website: details.website,
    hours,
    rating: details.rating,
    totalRatings: details.user_ratings_total,
    placeId: details.place_id,
  };
}

/**
 * Calcula la distancia entre dos puntos geográficos en metros
 * Usa la fórmula de Haversine
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Busca estaciones de servicio cercanas usando Google Places API (New)
 */
export async function searchNearbyGasStations(
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Promise<NearbyGasStation[]> {
  safeLog(`🔍 [NEW API] Starting Nearby Search: lat=${lat}, lng=${lng}, radius=${radius}m`)
  
  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  
  const requestBody = {
    includedTypes: ['gas_station'],
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng,
        },
        radius: radius,
      },
    },
  };

  safeLog(`📤 [NEW API] Request URL: ${url}`)
  safeLog(`📤 [NEW API] Body: ${JSON.stringify(requestBody, null, 2)}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.location',
    },
    body: JSON.stringify(requestBody),
  });

  safeLog(`📥 [NEW API] Response: ${response.status} ${response.statusText}`)

  const responseText = await response.text();
  safeLog(`📥 [NEW API] Body: ${responseText.substring(0, 500)}...`)

  if (!response.ok) {
    let errorDetails = responseText;
    try {
      const errorData = JSON.parse(responseText);
      errorDetails = JSON.stringify(errorData, null, 2);
    } catch (e) {
      // ignore
    }
    
    throw new Error(`Places API (New) error ${response.status}: ${errorDetails}`);
  }

  const data = JSON.parse(responseText);

  if (!data.places || data.places.length === 0) {
    safeLog('ℹ️ [NEW API] No places found')
    return [];
  }

  safeLog(`✅ [NEW API] Found ${data.places.length} places`)

  const results: NearbyGasStation[] = data.places.map((place: any) => {
    const distance = calculateDistance(lat, lng, place.location.latitude, place.location.longitude);

    return {
      placeId: place.id,
      name: place.displayName?.text || 'Estación sin nombre',
      address: place.formattedAddress || 'Dirección no disponible',
      distance: Math.round(distance),
      location: {
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      },
      types: place.types || [],
    };
  });

  results.sort((a, b) => a.distance - b.distance);
  safeLog(`✅ [NEW API] Returning ${results.length} sorted results`)
  return results;
}

