'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapSearch } from '@/components/map/MapSearch'
import { MapFilters } from '@/components/map/MapFilters'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Filter, List, Settings, RotateCcw, Info, Map as MapIcon } from 'lucide-react'
import { FUEL_LABELS, FuelType, FUEL_TYPES } from '@/lib/types'
import { getCompanyLogoPath } from '@/lib/companyLogos'
import { useFuelPreference } from '@/lib/stores/useFuelPreference'
import { MapSidebarAd, MapMobileFooterAd } from '@/components/ads/AdSenseUnit'

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
    // Optional fields coming from API when adjusted with user reports
    precioAjustado?: number
    precioAjustadoFuente?: 'usuario' | 'oficial'
    usandoPrecioUsuario?: boolean
    // Keep original server date if available
    fechaVigencia?: Date
    // Report date from user aggregated price (if applicable)
    fechaReporte?: Date
    // New: last user report date aggregated on server
    fechaUltimoReporteUsuario?: Date
  }[]
}

interface MapSearchClientProps {
  initialCoords?: {
    location: { lat: number; lng: number }
    radius: number
  } | null
}

export function MapSearchClient({ initialCoords }: MapSearchClientProps) {
  const router = useRouter()

  const [filters, setFilters] = useState<SearchFilters>({
    location: null,
    radius: 5,
    fuelTypes: FUEL_TYPES as FuelType[],
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
  const selectedFuelType = useFuelPreference((s) => s.selectedFuelType)
  const setSelectedFuelType = useFuelPreference((s) => s.setSelectedFuelType)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const listEndRef = useRef<HTMLDivElement | null>(null)

  // Currency formatter (ARS)
  const formatCurrency = useCallback((value: number) => {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
      }).format(value)
    } catch {
      return `$${Math.round(value)}`
    }
  }, [])

  // Function to update URL parameters when coordinates change
  const updateURL = useCallback((location: { lat: number; lng: number } | null, radius?: number) => {
    if (!location) return

    const params = new URLSearchParams()
    params.set('lat', location.lat.toFixed(6))
    params.set('lng', location.lng.toFixed(6))
    if (radius) {
      params.set('radius', radius.toString())
    }

    // Use replace to avoid cluttering browser history with every small change
    router.replace(`/buscar?${params.toString()}`, { scroll: false })
  }, [router])

  // Initialize with props coordinates or fallback to geolocation
  useEffect(() => {
    const initializeLocation = async () => {
      // First, try to use coordinates from props
      if (initialCoords) {
        // Use coordinates from URL props - no geolocation needed
        setFilters(prev => ({ 
          ...prev, 
          location: initialCoords.location,
          radius: initialCoords.radius 
        }))
        setCurrentLocation(initialCoords.location)
        return
      }

      // If no URL coordinates, try geolocation
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
            // Update URL with geolocation coordinates
            updateURL(location, filters.radius)
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
            updateURL(defaultLocation, filters.radius)
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
        updateURL(defaultLocation, filters.radius)
      }
    }

    // Only initialize if location is not already set
    if (!filters.location) {
      initializeLocation()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCoords])

  // Set current location for map centering when filters.location changes
  useEffect(() => {
    setCurrentLocation(filters.location)
  }, [filters.location])

  // Update URL whenever location or radius changes (except during initial load)
  useEffect(() => {
    if (filters.location) {
      updateURL(filters.location, filters.radius)
    }
  }, [filters.location, filters.radius, updateURL])

  // Fetch stations when filters change
  useEffect(() => {
    if (filters.location) {
      fetchStations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Send selected horario so API returns matching prices (defaults to diurno otherwise)
      if (filters.timeOfDay) {
        params.append('horario', filters.timeOfDay)
      }
      
      if (filters.fuelTypes.length > 0) {
        params.append('combustible', filters.fuelTypes.join(','))
      }
      
      if (filters.companies.length > 0) {
        params.append('empresa', filters.companies.join(','))
      }
      
      // Only send price range if user has modified from defaults
      if (filters.priceRange && (filters.priceRange.min !== 800 || filters.priceRange.max !== 1000)) {
        if (filters.priceRange.min > 0) {
          params.append('precioMin', filters.priceRange.min.toString())
        }
        if (filters.priceRange.max < 5000) {
          params.append('precioMax', filters.priceRange.max.toString())
        }
      }

      // Fixed page size and classic offset for progressive loading
      const limit = 24
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())
      
      const response = await fetch(`/api/estaciones?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform API response to match our Station interface
      const transformedStations: Station[] = data.data.map((station: { id: string; nombre: string; empresa: string; direccion: string; localidad: string; provincia: string; latitud: number; longitud: number; fechaActualizacion?: string | number | Date; precios?: Array<{ tipoCombustible: string; precio: string | number; horario: string; fechaVigencia?: string; fechaReporte?: string; fechaUltimoReporteUsuario?: string; precioAjustado?: number; precioAjustadoFuente?: 'usuario' | 'oficial'; usandoPrecioUsuario?: boolean; [key: string]: unknown }>; [key: string]: unknown }) => ({
        id: station.id,
        nombre: station.nombre,
        empresa: station.empresa,
        direccion: station.direccion,
        localidad: station.localidad,
        provincia: station.provincia,
        latitud: station.latitud,
        longitud: station.longitud,
        precios: (station.precios || []).map((precio: { tipoCombustible: string; precio: string | number; horario: string; fechaVigencia?: string; fechaReporte?: string; fechaUltimoReporteUsuario?: string; precioAjustado?: number; precioAjustadoFuente?: 'usuario' | 'oficial'; usandoPrecioUsuario?: boolean; [key: string]: unknown }) => ({
          tipoCombustible: precio.tipoCombustible,
          precio: parseFloat(precio.precio.toString()),
          horario: precio.horario,
          // Preserve adjusted fields from API if present
          precioAjustado: typeof precio.precioAjustado === 'number' ? precio.precioAjustado : undefined,
          precioAjustadoFuente: (precio.precioAjustadoFuente as 'usuario' | 'oficial' | undefined),
          usandoPrecioUsuario: typeof precio.usandoPrecioUsuario === 'boolean' ? precio.usandoPrecioUsuario : undefined,
          // Keep server-provided date fields for downstream UI
          fechaVigencia: precio.fechaVigencia ? new Date(precio.fechaVigencia) : undefined,
          fechaReporte: precio.fechaReporte ? new Date(precio.fechaReporte) : undefined,
          fechaUltimoReporteUsuario: precio.fechaUltimoReporteUsuario ? new Date(precio.fechaUltimoReporteUsuario) : undefined,
          fechaActualizacion: new Date(
            (precio.fechaVigencia as string | number | Date | undefined) ??
            (precio.fechaUltimoReporteUsuario as string | number | Date | undefined) ??
            (precio.fechaReporte as string | number | Date | undefined) ??
            (station.fechaActualizacion as string | number | Date | undefined) ??
            Date.now()
          )
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
      
      // Be resilient if API doesn't include pagination metadata
      const apiHasMore = data?.pagination?.hasMore
      setHasMore((apiHasMore === undefined ? transformedStations.length === limit : apiHasMore) && transformedStations.length > 0)
      
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

  // Aggregations (computed client-side to avoid extra server load)
  const companyAverages = useMemo(() => {
    const totals = new Map<string, { sum: number; count: number }>()
    for (const s of stations) {
      const precios = s.precios || []
      let priceToUse: number | null = null

      if (selectedFuelType) {
        // Use selected fuel type for averaging
        const candidates = precios.filter(
          (p) => p.tipoCombustible === selectedFuelType && (!filters.timeOfDay || p.horario === filters.timeOfDay)
        )
        if (candidates.length) {
          priceToUse = Math.min(...candidates.map((c) => c.precio))
        }
      } else {
        // 'Menor precio' case: use the lowest price across allowed fuel types
        const candidates = precios.filter(
          (p) => (filters.fuelTypes.length === 0 || filters.fuelTypes.includes(p.tipoCombustible)) && (!filters.timeOfDay || p.horario === filters.timeOfDay)
        )
        if (candidates.length) {
          priceToUse = Math.min(...candidates.map((c) => c.precio))
        }
      }

      if (priceToUse != null && isFinite(priceToUse)) {
        const key = s.empresa || '—'
        const entry = totals.get(key) || { sum: 0, count: 0 }
        entry.sum += priceToUse
        entry.count += 1
        totals.set(key, entry)
      }
    }

    return Array.from(totals.entries())
      .map(([empresa, { sum, count }]) => ({ empresa, promedio: count ? sum / count : 0, count }))
      .sort((a, b) => a.promedio - b.promedio)
  }, [stations, selectedFuelType, filters.fuelTypes, filters.timeOfDay]) as Array<{ empresa: string; promedio: number; count: number }>

  const fuelAverages = useMemo(() => {
    const totals = new Map<FuelType, { sum: number; count: number }>()
    for (const s of stations) {
      for (const p of s.precios) {
        if (filters.timeOfDay && p.horario !== filters.timeOfDay) continue
        if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(p.tipoCombustible)) continue
        const key = p.tipoCombustible
        const entry = totals.get(key) || { sum: 0, count: 0 }
        entry.sum += p.precio
        entry.count += 1
        totals.set(key, entry)
      }
    }
    return Array.from(totals.entries())
      .map(([tipo, { sum, count }]) => ({ tipo, promedio: count ? sum / count : 0, count }))
      .sort((a, b) => a.promedio - b.promedio)
  }, [stations, filters.fuelTypes, filters.timeOfDay]) as Array<{ tipo: FuelType; promedio: number; count: number }>

  // Calculate sidebar stats (average price and top 3 cheapest)
  const sidebarStats = useMemo(() => {
    if (stations.length === 0 || !filters.location) {
      return {
        averagePrice: 0,
        topStations: []
      }
    }

    // Calculate distance helper
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // Get prices for selected fuel type
    const stationsWithPrice = stations.map(station => {
      const precios = station.precios.filter(
        p => (!selectedFuelType || p.tipoCombustible === selectedFuelType) &&
             (!filters.timeOfDay || p.horario === filters.timeOfDay)
      )
      
      if (precios.length === 0) return null

      const minPrice = Math.min(...precios.map(p => p.precio))
      const distance = calculateDistance(
        filters.location!.lat,
        filters.location!.lng,
        station.latitud,
        station.longitud
      )

      return {
        id: station.id,
        nombre: station.nombre,
        empresa: station.empresa,
        precio: minPrice,
        distancia: distance
      }
    }).filter(Boolean) as Array<{
      id: string
      nombre: string
      empresa: string
      precio: number
      distancia: number
    }>

    // Calculate average
    const averagePrice = stationsWithPrice.length > 0
      ? stationsWithPrice.reduce((sum, s) => sum + s.precio, 0) / stationsWithPrice.length
      : 0

    // Get top 3 cheapest sorted by price
    const topStations = [...stationsWithPrice]
      .sort((a, b) => a.precio - b.precio)
      .slice(0, 3)

    return {
      averagePrice,
      topStations
    }
  }, [stations, selectedFuelType, filters.timeOfDay, filters.location])

  // Infinite scroll sentinel for list view
  useEffect(() => {
    if (viewMode !== 'list') return
    if (!hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreStations()
        }
      },
      { root: null, rootMargin: '800px', threshold: 0 }
    )
    const target = listEndRef.current
    if (target) observer.observe(target)
    return () => {
      if (target) observer.unobserve(target)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, hasMore, isLoadingMore, stations.length])

  const getDisplayPrice = useCallback((s: Station): { price: number | null; label: string } => {
    const precios = s.precios || []
    if (selectedFuelType) {
      const candidates = precios.filter(
        (p) => p.tipoCombustible === selectedFuelType && (!filters.timeOfDay || p.horario === filters.timeOfDay)
      )
      if (candidates.length) {
        const min = candidates.reduce((acc, cur) => (cur.precio < acc ? cur.precio : acc), candidates[0].precio)
        return { price: min, label: FUEL_LABELS[selectedFuelType] }
      }
      return { price: null, label: FUEL_LABELS[selectedFuelType] }
    }
    const candidates = precios.filter(
      (p) => (filters.fuelTypes.length === 0 || filters.fuelTypes.includes(p.tipoCombustible)) && (!filters.timeOfDay || p.horario === filters.timeOfDay)
    )
    if (!candidates.length) return { price: null, label: 'Menor' }
    const minCandidate = candidates.reduce((min, cur) => (cur.precio < min.precio ? cur : min), candidates[0])
    return { price: minCandidate.precio, label: FUEL_LABELS[minCandidate.tipoCombustible] }
  }, [selectedFuelType, filters.timeOfDay, filters.fuelTypes])

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
              <Button size="sm" onClick={() => fetchStations()} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Buscar estaciones
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header Bar moved to overlay */}

        {/* Map/List Content - Full Height */}
        <div className="flex-1 relative overflow-hidden">
          {/* Header Bar (overlaying map) */}
          <div className="absolute top-0 left-0 right-0 z-2000 border-b border-border bg-card/40 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Badge variant="secondary" className="hidden sm:block text-[12px] sm:text-sm font-medium leading-none px-2 sm:px-3 py-0.5 sm:py-1">
                  {stations.length} estaciones{hasMore ? '+' : ''}
                </Badge>
                {loading && (
                  <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-sm text-muted-foreground">
                    <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Actualizando...
                  </div>
                )}
                {hasMore && !loading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreStations}
                    disabled={isLoadingMore}
                    className="h-6 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3"
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
                
              <div className="flex gap-2 items-center">
                {/* Mobile Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden h-6 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3"
                  onClick={() => setShowFilters(true)}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Filtros
                </Button>
                  
                {/* Horario Toggle (Día/Noche) - compact on xs */}
                <div
                  className="inline-flex items-center rounded-full border bg-muted/30 p-0.5"
                  aria-label="Seleccionar horario"
                  role="tablist"
                >
                  <Button
                    variant={filters.timeOfDay === 'diurno' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, timeOfDay: 'diurno' }))}
                    title="Precios diurnos"
                    aria-pressed={filters.timeOfDay === 'diurno'}
                    role="tab"
                    className="h-6 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3 rounded-full"
                  >
                    Día
                  </Button>
                  <Button
                    variant={filters.timeOfDay === 'nocturno' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, timeOfDay: 'nocturno' }))}
                    title="Precios nocturnos"
                    aria-pressed={filters.timeOfDay === 'nocturno'}
                    role="tab"
                    className="h-6 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3 rounded-full"
                  >
                    Noche
                  </Button>
                </div>
                <div className="inline-flex items-center rounded-full border bg-muted/30 p-0.5">
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="sm"
                    role="tab"
                    aria-selected={viewMode === 'map'}
                    onClick={() => setViewMode('map')}
                    className="h-6 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3 rounded-full"
                  >
                    <MapIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Mapa
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    role="tab"
                    aria-selected={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    className="h-6 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3 rounded-full"
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Lista
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Map View */}
          <div className={`absolute inset-0 ${viewMode === 'map' ? 'block' : 'hidden'}`}>
            <MapSearch 
              key={`map-${filters.location?.lat}-${filters.location?.lng}-${viewMode}`}
              stations={stations}
              center={filters.location}
              radius={filters.radius}
              loading={loading}
              visible={viewMode === 'map'}
              selectedFuelType={selectedFuelType}
              selectedTimeOfDay={filters.timeOfDay}
              currentLocation={currentLocation}
              onStationSelect={(station) => {
                window.location.href = `/estacion/${station.id}`
              }}
            />
          </div>
          
          {/* List View */}
          {viewMode === 'list' && (
            <div className="h-full overflow-y-auto p-4 pt-24 pb-28 lg:pb-8 bg-background">
              <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Results grid */}
                <div className="xl:col-span-8 2xl:col-span-9">
                  <div className="rounded-md border divide-y">
                    {stations.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">No hay estaciones para mostrar.</div>
                    ) : (
                      stations.map(station => {
                        const display = getDisplayPrice(station)
                        return (
                          <div
                            key={station.id}
                            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => (window.location.href = `/estacion/${station.id}`)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow relative flex-shrink-0">
                                <img
                                  src={getCompanyLogoPath(station.empresa)}
                                  alt={station.empresa?.charAt(0)}
                                  className="w-6 h-6 object-contain rounded-full"
                                  onError={(e) => {
                                    const img = e.currentTarget
                                    img.style.display = 'none'
                                    const p = img.parentElement
                                    if (p) p.textContent = station.empresa?.charAt(0) || '—'
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm sm:text-base truncate max-w-[240px] sm:max-w-[360px]">{station.nombre}</h4>
                                  <Badge variant="outline" className="hidden sm:inline font-normal">{station.empresa}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate max-w-[420px]">{station.direccion}</p>
                                <p className="text-[11px] text-muted-foreground truncate max-w-[420px]">{station.localidad}, {station.provincia}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">{display.label}</div>
                                <div className="text-sm font-bold text-primary">{display.price !== null ? formatCurrency(display.price) : '—'}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => { e.stopPropagation(); window.location.href = `/estacion/${station.id}` }}
                              >
                                Ver
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Infinite scroll sentinel */}
                  {hasMore && <div ref={listEndRef} className="h-10" />}

                  {/* Fallback load more button (in case IntersectionObserver is unavailable) */}
                  {hasMore && (
                    <div className="flex justify-center pt-2 pb-4">
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
                    </div>
                  )}
                </div>

                {/* Analytics Sidebar */}
                <div className="xl:col-span-4 2xl:col-span-3">
                  <div className="sticky top-2 space-y-4">
                    <Card className="p-4">
                      <h4 className="font-semibold text-sm">Promedios por empresa</h4>
                      <p className="text-xs text-muted-foreground">Según filtros activos y resultados cargados</p>
                      <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {companyAverages.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Sin datos para calcular</p>
                        ) : (
                          companyAverages.slice(0, 20).map(item => (
                            <div key={item.empresa} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow relative flex-shrink-0">
                                  <img
                                    src={getCompanyLogoPath(item.empresa)}
                                    alt={item.empresa.charAt(0)}
                                    className="w-6 h-6 object-contain rounded-full"
                                    onError={(e) => {
                                      const img = e.currentTarget
                                      img.style.display = 'none'
                                      const p = img.parentElement
                                      if (p) p.textContent = item.empresa?.charAt(0) || '—'
                                    }}
                                  />
                                </div>
                                <Badge variant="outline" className="truncate max-w-[160px]">{item.empresa}</Badge>
                                <span className="text-[11px] text-muted-foreground">{item.count}</span>
                              </div>
                              <span className="font-medium text-sm">{formatCurrency(item.promedio)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold text-sm">Promedios por combustible</h4>
                      <p className="text-xs text-muted-foreground">Según filtros activos y resultados cargados</p>
                      <div className="mt-3 space-y-2">
                        {fuelAverages.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Sin datos para calcular</p>
                        ) : (
                          fuelAverages.map(item => (
                            <div key={item.tipo} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{FUEL_LABELS[item.tipo]}</span>
                                <span className="text-[11px] text-muted-foreground">{item.count}</span>
                              </div>
                              <span className="font-medium text-sm">{formatCurrency(item.promedio)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Floating Sidebar Ad */}
      <MapSidebarAd stats={sidebarStats} />

      {/* Mobile Quick Filter Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card shadow-lg border-t border-border z-400 safe-area-bottom">
        {/* Mobile Footer Ad */}
        <MapMobileFooterAd />
        <div className="container px-4 py-3 mx-auto">
          <div className="flex items-center justify-between mb-2">
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
              className="h-5 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3"
            >
              <Settings className="h-3 w-3 mr-2" />
              Más filtros
            </Button>
          </div>
          
          {/* Quick Fuel Type Toggles */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
              <Button
                key={fuel}
                variant={selectedFuelType === fuel ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFuelType(fuel as FuelType)}
                className="h-5 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the filter bar */}
      <div className="lg:hidden h-24"></div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/60 z-1000 lg:hidden">
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
                    Menor precio
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