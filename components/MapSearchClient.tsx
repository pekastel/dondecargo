'use client'

import { useState, useEffect } from 'react'
import { MapSearch } from '@/components/map/MapSearch'
import { MapFilters } from '@/components/map/MapFilters'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Filter, List, Settings, RotateCcw } from 'lucide-react'

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
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Initialize with default location or user geolocation
  useEffect(() => {
    const initializeLocation = async () => {
      // Try to get user's current location first
      if (navigator.geolocation) {
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setFilters(prev => ({ ...prev, location }))
            setCurrentLocation(location)
          },
          (error) => {
            console.error('Geolocation failed:', error)
            // Fallback to Buenos Aires, Argentina
            const defaultLocation = {
              lat: -34.6037,
              lng: -58.3816
            }
            setFilters(prev => ({ ...prev, location: defaultLocation }))
            setCurrentLocation(defaultLocation)
          },
          options
        )
      } else {
        // Fallback to Buenos Aires, Argentina if geolocation not supported
        const defaultLocation = {
          lat: -34.6037,
          lng: -58.3816
        }
        setFilters(prev => ({ ...prev, location: defaultLocation }))
        setCurrentLocation(defaultLocation)
      }
    }

    // Only initialize if location is not already set
    if (!filters.location) {
      initializeLocation()
    }

    setSelectedFuelType('nafta')
  }, [])

  // Set current location for map centering when filters.location changes
  useEffect(() => {
    setCurrentLocation(filters.location)
  }, [filters.location])

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
      fuelTypes: ['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc'],
      priceRange: { min: 800, max: 1000 },
      companies: [],
      radius: 5
    }))
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="h-full overflow-y-auto p-4">
          <div className="sticky z-20 top-0 bg-card/80 backdrop-blur-sm p-4 -m-4 mb-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Filtros de búsqueda</h3>
            </div>
            
            {/* Prominent Fuel Type Selector */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Precio destacado en mapa:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
                  <Button
                    key={fuel}
                    variant={selectedFuelType === fuel ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFuelType(fuel as FuelType)}
                    className="rounded-full px-3 py-2 text-xs font-medium transition-all duration-200"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <MapFilters filters={filters} onFiltersChange={setFilters} />
            
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
              <Button size="sm" onClick={fetchStations} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Buscar estaciones
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                {stations.length} estaciones{hasMore ? '+' : ''}
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
                  className="text-xs"
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
              
              <div className="flex border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="text-xs"
                >
                  🗺️ Mapa
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="text-xs"
                >
                  <List className="h-4 w-4 mr-1" />
                  Lista
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Map/List Content - Full Height */}
        <div className="flex-1 relative overflow-hidden">
          {/* Map View */}
          <div className={`absolute inset-0 ${viewMode === 'map' ? 'block' : 'hidden'}`}>
            <MapSearch 
              key={`map-${filters.location?.lat}-${filters.location?.lng}`}
              stations={stations}
              center={filters.location}
              radius={filters.radius}
              loading={loading}
              visible={viewMode === 'map'}
              selectedFuelType={selectedFuelType}
              currentLocation={currentLocation}
              onStationSelect={(station) => {
                window.location.href = `/estacion/${station.id}`
              }}
            />
          </div>
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="h-full overflow-y-auto p-4 bg-background">
              <div className="max-w-4xl mx-auto space-y-4">
                {stations.map(station => (
                  <Card key={station.id} className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border border-border/50 hover:border-primary/20"
                        onClick={() => window.location.href = `/estacion/${station.id}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{station.nombre}</h4>
                        <p className="text-sm text-muted-foreground">{station.direccion}</p>
                        <p className="text-xs text-muted-foreground">{station.localidad}, {station.provincia}</p>
                      </div>
                      <Badge variant="outline" className="font-medium">{station.empresa}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {station.precios.slice(0, 4).map(precio => (
                        <div key={precio.tipoCombustible} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1 text-sm">
                          <span className="font-medium">{FUEL_LABELS[precio.tipoCombustible]}</span>
                          <span className="font-bold text-primary">${precio.precio}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Quick Filter Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Filtros rápidos:</h4>
              <Badge variant="secondary" className="text-xs">
                {filters.fuelTypes.length} combustibles
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Más filtros
            </Button>
          </div>
          
          {/* Quick Fuel Type Toggles */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
              <Button
                key={fuel}
                variant={filters.fuelTypes.includes(fuel as FuelType) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFuelType(fuel as FuelType)}
                className="rounded-full text-xs whitespace-nowrap flex-shrink-0 px-3 py-1"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/60 z-50 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Filtros de búsqueda</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  ✕
                </Button>
              </div>
              
              {/* Mobile Fuel Type Selector */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Precio destacado:</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedFuelType === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFuelType(null)}
                    className="rounded-full text-xs"
                  >
                    💰 Menor precio
                  </Button>
                  {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
                    <Button
                      key={fuel}
                      variant={selectedFuelType === fuel ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFuelType(fuel as FuelType)}
                      className="rounded-full text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 pb-20">
              <MapFilters filters={filters} onFiltersChange={setFilters} />
            </div>
            
            <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border p-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Limpiar filtros
                </Button>
                <Button onClick={() => {
                  setShowFilters(false)
                  fetchStations()
                }} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Aplicar ({stations.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}