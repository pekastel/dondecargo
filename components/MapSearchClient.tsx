'use client'

import { useState, useEffect } from 'react'
import { MapSearch } from '@/components/map/MapSearch'
import { MapFilters } from '@/components/map/MapFilters'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { MapPin, Filter, List, RotateCcw, Settings } from 'lucide-react'

export type FuelType = 'nafta' | 'nafta_premium' | 'gasoil' | 'gasoil_premium' | 'gnc'
export type PriceRange = { min: number; max: number }
export type SearchFilters = {
  location: { lat: number; lng: number } | null
  radius: number
  fuelTypes: FuelType[]
  priceRange: PriceRange
  companies: string[]
  timeOfDay: 'diurno' | 'nocturno'
}

export interface Station {
  id: string
  nombre: string
  empresa: string
  direccion: string
  localidad: string
  provincia: string
  latitud: number
  longitud: number
  precios: {
    tipoCombustible: FuelType
    precio: number
    horario: 'diurno' | 'nocturno'
    fechaActualizacion: Date
  }[]
}

const FUEL_LABELS: Record<FuelType, string> = {
  nafta: 'Nafta',
  nafta_premium: 'Premium', 
  gasoil: 'Gasoil',
  gasoil_premium: 'G.Premium',
  gnc: 'GNC'
}

const FUEL_ICONS: Record<FuelType, string> = {
  nafta: '⛽',
  nafta_premium: '⛽',
  gasoil: '🚛',
  gasoil_premium: '🚛', 
  gnc: '⚡'
}

export function MapSearchClient() {
  const [filters, setFilters] = useState<SearchFilters>({
    location: null,
    radius: 5,
    fuelTypes: ['nafta', 'nafta_premium', 'gasoil'],
    priceRange: { min: 800, max: 1000 },
    companies: [],
    timeOfDay: 'diurno'
  })
  
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [locationError, setLocationError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(true)
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null)

  // Get user location on mount
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('La geolocalización no está disponible en este navegador.')
        setGettingLocation(false)
        return
      }

      setGettingLocation(true)
      setLocationError(null)
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout
        maximumAge: 300000 // 5 minutes cache
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 Ubicación obtenida:', position.coords.latitude, position.coords.longitude)
          setFilters(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }))
          setGettingLocation(false)
        },
        (error) => {
          console.error('❌ Error de geolocalización:', error)
          let errorMessage = 'No se pudo obtener tu ubicación.'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permisos de ubicación denegados. Habilita la geolocalización para una mejor experiencia.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.'
              break
            case error.TIMEOUT:
              errorMessage = 'Tiempo agotado al obtener la ubicación. Intenta de nuevo.'
              break
            default:
              errorMessage = 'Error desconocido al obtener la ubicación.'
              break
          }
          
          setLocationError(errorMessage)
          setGettingLocation(false)
          
          // Set default location to Buenos Aires if geolocation fails
          setFilters(prev => ({
            ...prev,
            location: {
              lat: -34.6037,
              lng: -58.3816
            }
          }))
        },
        options
      )
    }

    getLocation()
  }, [])

  // Fetch stations when filters change
  useEffect(() => {
    if (filters.location) {
      fetchStations()
    }
  }, [filters])

  const fetchStations = async (offset = 0, append = false) => {
    if (offset === 0) {
      setLoading(true)
      setHasMore(false)
    } else {
      setIsLoadingMore(true)
    }
    
    try {
      const params = new URLSearchParams()
      
      if (filters.location) {
        params.append('lat', filters.location.lat.toString())
        params.append('lng', filters.location.lng.toString())
        params.append('radius', filters.radius.toString())
      }
      
      if (filters.fuelTypes.length > 0) {
        params.append('combustible', filters.fuelTypes.join(','))
      }
      
      if (filters.companies.length > 0) {
        params.append('empresa', filters.companies.join(','))
      }
      
      // Dynamic limit based on radius - more stations for larger areas
      const limit = Math.min(100, Math.max(50, Math.round(filters.radius * 2)))
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())
      
      const response = await fetch(`/api/estaciones?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform API response to match our Station interface
      const transformedStations: Station[] = data.data.map((station: any) => ({
        id: station.id,
        nombre: station.nombre,
        empresa: station.empresa,
        direccion: station.direccion,
        localidad: station.localidad,
        provincia: station.provincia,
        latitud: station.latitud,
        longitud: station.longitud,
        precios: (station.precios || []).map((precio: any) => ({
          tipoCombustible: precio.tipoCombustible,
          precio: parseFloat(precio.precio),
          horario: precio.horario,
          fechaActualizacion: new Date(precio.fechaReporte)
        }))
      }))
      
      if (append) {
        // Remove duplicates when appending
        setStations(prev => {
          const existingIds = new Set(prev.map(s => s.id))
          const newStations = transformedStations.filter(s => !existingIds.has(s.id))
          return [...prev, ...newStations]
        })
      } else {
        setStations(transformedStations)
      }
      
      setHasMore(data.pagination.hasMore && transformedStations.length > 0)
      
    } catch (error) {
      console.error('Error fetching stations:', error)
      if (!append) {
        setStations([])
      }
      setHasMore(false)
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMoreStations = () => {
    if (!isLoadingMore && hasMore) {
      fetchStations(stations.length, true)
    }
  }

  const handleRetryLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está disponible en este navegador.')
      return
    }

    setGettingLocation(true)
    setLocationError(null)
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0 // Force fresh location on retry
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }))
        setGettingLocation(false)
      },
      (error) => {
        let errorMessage = 'No se pudo obtener tu ubicación.'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados. Habilita la geolocalización para una mejor experiencia.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible.'
            break
          case error.TIMEOUT:
            errorMessage = 'Tiempo agotado al obtener la ubicación. Intenta de nuevo.'
            break
        }
        
        setLocationError(errorMessage)
        setGettingLocation(false)
      },
      options
    )
  }

  const toggleFuelType = (fuelType: FuelType) => {
    setFilters(prev => ({
      ...prev,
      fuelTypes: prev.fuelTypes.includes(fuelType)
        ? prev.fuelTypes.filter(f => f !== fuelType)
        : [...prev.fuelTypes, fuelType]
    }))
  }

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      fuelTypes: ['nafta', 'nafta_premium', 'gasoil'],
      priceRange: { min: 800, max: 1000 },
      companies: [],
      radius: 5
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Quick Filters Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {gettingLocation ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                  Obteniendo ubicación...
                </span>
              ) : filters.location ? (
                `📍 ${filters.location.lat.toFixed(4)}, ${filters.location.lng.toFixed(4)}`
              ) : (
                locationError || 'Ubicación no disponible'
              )}
            </span>
            {locationError && !gettingLocation && (
              <Button variant="outline" size="sm" onClick={handleRetryLocation}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reintentar
              </Button>
            )}
          </div>

          {/* Fuel Type Selector */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">💰 Precio preferido en marcadores:</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFuelType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFuelType(null)}
              >
                📊 Menor precio
              </Button>
              {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
                <Button
                  key={fuel}
                  variant={selectedFuelType === fuel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFuelType(fuel as FuelType)}
                >
                  {FUEL_ICONS[fuel as FuelType]} {label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={filters.fuelTypes.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, fuelTypes: [] }))}
            >
              🏪 Todas
            </Button>
            {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
              <Button
                key={fuel}
                variant={filters.fuelTypes.includes(fuel as FuelType) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFuelType(fuel as FuelType)}
              >
                {FUEL_ICONS[fuel as FuelType]} {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel - Desktop */}
          <div className="hidden lg:block">
            <Card className="p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5" />
                <h3 className="font-semibold">Filtros de búsqueda</h3>
              </div>
              <MapFilters filters={filters} onFiltersChange={setFilters} />
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
                <Button size="sm" onClick={fetchStations}>
                  Aplicar
                </Button>
              </div>
            </Card>
          </div>

          {/* Map/List Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {stations.length} estaciones{hasMore ? '+' : ''} encontradas
                </Badge>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Actualizando...
                  </div>
                )}
                {hasMore && !loading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreStations}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full mr-1" />
                        Cargando...
                      </>
                    ) : (
                      'Cargar más'
                    )}
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Mobile Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilters(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Filtros
                </Button>
                
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  🗺️ Mapa
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-1" />
                  Lista
                </Button>
              </div>
            </div>

            {/* Map Component */}
            <Card className="h-[600px] relative overflow-hidden">
              {/* Map - Always rendered but hidden when in list mode */}
              <div className={`absolute inset-0 ${viewMode === 'map' ? 'block' : 'hidden'}`}>
                <MapSearch 
                  key={`map-${filters.location?.lat}-${filters.location?.lng}`}
                  stations={stations}
                  center={filters.location}
                  radius={filters.radius}
                  loading={loading}
                  visible={viewMode === 'map'}
                  selectedFuelType={selectedFuelType}
                  onStationSelect={(station) => {
                    // Navigate to station detail
                    window.location.href = `/estacion/${station.id}`
                  }}
                />
              </div>
              
              {/* List View - Only rendered when in list mode */}
              {viewMode === 'list' && (
                <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                  {stations.map(station => (
                    <Card key={station.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.location.href = `/estacion/${station.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{station.nombre}</h4>
                          <p className="text-sm text-muted-foreground">{station.direccion}</p>
                        </div>
                        <Badge variant="outline">{station.empresa}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {station.precios.slice(0, 3).map(precio => (
                          <div key={precio.tipoCombustible} className="flex items-center gap-1 text-sm">
                            <span>{FUEL_ICONS[precio.tipoCombustible]}</span>
                            <span className="font-medium">${precio.precio}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
            <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-lg p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filtros</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  ✕
                </Button>
              </div>
              <MapFilters filters={filters} onFiltersChange={setFilters} />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar todo
                </Button>
                <Button onClick={() => {
                  setShowFilters(false)
                  fetchStations()
                }} className="flex-1">
                  Aplicar ({stations.length})
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}