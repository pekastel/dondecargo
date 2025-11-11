// Tipos de combustibles basados en el schema de la base de datos
export type FuelType = 'nafta' | 'nafta_premium' | 'gasoil' | 'gasoil_premium' | 'gnc'

export const FUEL_TYPES = ['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']

// Etiquetas de combustibles para mostrar en la UI
export const FUEL_LABELS: Record<FuelType, string> = {
  nafta: 'Nafta',
  nafta_premium: 'Nafta Premium',
  gasoil: 'Diesel', 
  gasoil_premium: 'Diesel Premium',
  gnc: 'GNC'
}

// Tipos de horarios
export type HorarioType = 'diurno' | 'nocturno' | 'ambos'

// Tipos de fuentes de estaciones
export type EstacionFuente = 'oficial' | 'usuario'
export type FuenteType = 'oficial' | 'usuario'

// Tipos de estado de estaciones
export type EstacionEstado = 'pendiente' | 'aprobado' | 'rechazado'

// Tipos de estado para reportes
export type EstadoReporteType = 'pendiente' | 'aprobado' | 'rechazado'

// Tipos para datos adicionales de estaciones
export interface EstacionDatosAdicionales {
  horarios?: Record<string, string> // { lunes: "00:00-23:59", ... }
  telefono?: string
  servicios?: {
    tienda?: boolean
    banios?: boolean
    lavadero?: boolean
    wifi?: boolean
    restaurante?: boolean
    estacionamiento?: boolean
  }
}

// Interfaz para filtros de búsqueda
export interface SearchFilters {
  fuelTypes: FuelType[]
  priceRange: [number, number]
  companies: string[]
  onlyOpen: boolean
  radius: number
}

// Interfaz para precios 
export interface Price {
  tipoCombustible: FuelType
  precio: number
  horario: HorarioType
  fechaVigencia: Date
  fuente: FuenteType
}

// Interfaz para estaciones
export interface Station {
  id: string
  nombre: string
  empresa: string
  direccion: string
  localidad: string
  provincia: string
  latitud: number
  longitud: number
  precios: Price[]
  fuente?: EstacionFuente
  estado?: EstacionEstado
  googleMapsUrl?: string
  datosAdicionales?: EstacionDatosAdicionales
}