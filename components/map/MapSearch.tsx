'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Station } from '@/components/MapSearchClient'
import { FuelType, FUEL_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { getCompanyLogoPath } from '@/lib/companyLogos'
import { authClient } from '@/lib/authClient'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UserPriceReport {
  tipoCombustible: string
  horario: string
  precioPromedio: number
  cantidadReportes: number
  ultimoReporte: Date
}

interface MapSearchProps {
  stations: Station[]
  center: { lat: number; lng: number } | null
  radius: number // in kilometers
  loading: boolean
  visible?: boolean // to trigger map resize when becoming visible
  selectedFuelType: FuelType | null
  currentLocation?: { lat: number; lng: number } | null
  onStationSelect?: (station: Station) => void
  fitToStations?: boolean
  selectedTimeOfDay?: 'diurno' | 'nocturno' | null
}

interface LeafletMap {
  setView: (latlng: [number, number], zoom: number) => void
  invalidateSize: () => void
  remove: () => void
  removeLayer: (layer: unknown) => void
  fitBounds: (bounds: [[number, number], [number, number]], options?: Record<string, unknown>) => void
  zoomControl: { setPosition: (position: string) => void }
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker
  bindPopup: (content: string) => LeafletMarker
  on: (event: string, callback: () => void) => LeafletMarker
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => void
}

interface LeafletCircle {
  addTo: (map: LeafletMap) => LeafletCircle
  remove: () => void
  setLatLng: (latlng: [number, number]) => LeafletCircle
  setRadius: (radius: number) => LeafletCircle
  bringToFront?: () => LeafletCircle
}

interface Leaflet {
  map: (element: HTMLElement) => LeafletMap
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletTileLayer
  marker: (latlng: [number, number], options?: Record<string, unknown>) => LeafletMarker
  circle: (latlng: [number, number], options?: Record<string, unknown>) => LeafletCircle
  icon: (options: Record<string, unknown>) => unknown
}

declare global {
  interface Window {
    L: Leaflet
  }
}

export function MapSearch({ stations, center, radius, loading, visible = true, selectedFuelType, currentLocation, onStationSelect, fitToStations = false, selectedTimeOfDay = null }: MapSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<LeafletMap | null>(null)
  const radiusCircleRef = useRef<LeafletCircle | null>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const currentLocationMarkerRef = useRef<LeafletMarker | null>(null)
  const [selectedStations, setSelectedStations] = useState<Station[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  // User reports are now managed directly in DOM, keeping minimal state for cache management
  const [userReports, setUserReports] = useState<Record<string, UserPriceReport[]>>({})
  const [loadingReports, setLoadingReports] = useState<Set<string>>(new Set())
  const { data: session } = authClient.useSession()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [favLoading, setFavLoading] = useState<Set<string>>(new Set())
  const router = useRouter()


  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') {
        console.log('MapSearch: Window is undefined, skipping Leaflet load')
        return
      }

      // Check if Leaflet is already loaded
      if (window.L) {
        console.log('MapSearch: Leaflet already loaded, setting mapLoaded to true')
        setMapLoaded(true)
        return
      }

      // Check if CSS is already loaded
      const existingCSS = document.querySelector('link[href*="leaflet.css"]')
      if (!existingCSS) {
        console.log('MapSearch: Loading Leaflet CSS')
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Check if JS is already loaded or loading
      const existingScript = document.querySelector('script[src*="leaflet.js"]')
      if (!existingScript) {
        console.log('MapSearch: Loading Leaflet JS')
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => {
          console.log('MapSearch: Leaflet JS loaded successfully')
          setMapLoaded(true)
        }
        script.onerror = () => {
          console.error('MapSearch: Failed to load Leaflet JS')
          setMapLoaded(false)
        }
        document.head.appendChild(script)
      } else if (window.L) {
        console.log('MapSearch: Leaflet script exists and window.L is available')
        setMapLoaded(true)
      } else {
        console.log('MapSearch: Script exists but window.L is not available yet, waiting...')
        // Wait for the existing script to load
        let attempts = 0
        const checkInterval = setInterval(() => {
          attempts++
          if (window.L) {
            console.log('MapSearch: Leaflet loaded after waiting')
            setMapLoaded(true)
            clearInterval(checkInterval)
          } else if (attempts > 50) { // 5 seconds total
            console.error('MapSearch: Timeout waiting for Leaflet to load')
            setMapLoaded(false)
            clearInterval(checkInterval)
          }
        }, 100)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !visible || !center) return

    if (!leafletMapRef.current) {
      // Initialize map
      const map = window.L.map(mapRef.current)
      map.setView([center.lat, center.lng], 13)

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap contributors'
      }).addTo(map)

      // Position zoom controls on the left (we'll center via CSS)
      if (map && (map as any).zoomControl && typeof (map as any).zoomControl.setPosition === 'function') {
        map.zoomControl.setPosition('topleft')
      }

      leafletMapRef.current = map

      return () => {
        if (leafletMapRef.current) {
          leafletMapRef.current.remove()
          leafletMapRef.current = null
        }
      }
    }
  }, [mapLoaded, center, visible])

  // Load user's favorites when authenticated
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (!session?.user) {
          setFavoriteIds(new Set())
          return
        }
        const res = await fetch('/api/favoritos')
        if (res.ok) {
          const json = await res.json()
          const ids: string[] = (json?.data || []).map((f: any) => f.estacionId).filter(Boolean)
          setFavoriteIds(new Set(ids))
        }
      } catch (e) {
        console.error('Error loading favorites', e)
      }
    }
    loadFavorites()
  }, [session?.user])

  // Update map center
  useEffect(() => {
    if (leafletMapRef.current && center) {
      leafletMapRef.current.setView([center.lat, center.lng], 13)
    }
  }, [center])

  // Simple in-memory cache for user reports (client-side only)
  const reportCache = useRef<Map<string, { data: UserPriceReport[], expires: number }>>(new Map())

  // Function to get user report for specific fuel type from current data
  const getUserReport = (stationId: string, fuelType: string): UserPriceReport | null => {
    const reports = userReports[stationId] || []
    return reports.find(r => r.tipoCombustible === fuelType && r.horario === 'diurno') || null
  }

  // Function to check if we have user reports for a station
  const hasUserReports = (stationId: string, fuelType: string): boolean => {
    return getUserReport(stationId, fuelType) !== null
  }

  // Function to check if station is currently loading
  const isStationLoading = (stationId: string): boolean => {
    return loadingReports.has(stationId)
  }

  // Fetch user reports for a station with simple cache
  const fetchUserReports = async (stationId: string) => {
    if (loadingReports.has(stationId)) return
    
    // Check cache first
    const cacheKey = `user_reports:${stationId}:5:diurno`
    const cachedItem = reportCache.current.get(cacheKey)
    if (cachedItem && cachedItem.expires > Date.now()) {
      setUserReports(prev => ({
        ...prev,
        [stationId]: cachedItem.data
      }))
      return
    }

    setLoadingReports(prev => new Set(prev).add(stationId))
    
    try {
      const response = await fetch(`/api/estaciones/${stationId}/reportes-precios?dias=5&horario=diurno`)
      if (response.ok) {
        const data = await response.json()
        const reportData = data.resumen || []
        
        // Cache the data for 5 minutes
        const expires = Date.now() + (5 * 60 * 1000) // 5 minutes
        reportCache.current.set(cacheKey, { data: reportData, expires })
        
        setUserReports(prev => ({
          ...prev,
          [stationId]: reportData
        }))
        
        // Markers will be re-generated automatically via useEffect
      }
    } catch (error) {
      console.error('Error fetching user reports:', error)
    } finally {
      setLoadingReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(stationId)
        return newSet
      })
    }
  }

  // This function is kept for potential future use
  // const getUserReport = (stationId: string, fuelType: FuelType): UserPriceReport | null => {
  //   const reports = userReports[stationId] || []
  //   return reports.find(r => r.tipoCombustible === fuelType && r.horario === 'diurno') || null
  // }

  // Helper function to get display price based on selected fuel type and horario
  const getDisplayPrice = (station: Station): { price: number | null; label: string } => {
    const preciosFiltrados = Array.isArray(station.precios)
      ? (selectedTimeOfDay ? station.precios.filter(p => p.horario === selectedTimeOfDay) : station.precios)
      : []
    if (selectedFuelType) {
      const fuelPrice = preciosFiltrados.find(p => p.tipoCombustible === selectedFuelType)
      if (fuelPrice) {
        return { price: fuelPrice.precio, label: getFuelLabel(selectedFuelType) }
      } else {
        return { price: null, label: getFuelLabel(selectedFuelType) }
      }
    } else {
      // Show lowest price - check if prices array exists and has items
      if (!preciosFiltrados || preciosFiltrados.length === 0) {
        return { price: null, label: 'Sin precios' }
      }
      
      const validPrices = preciosFiltrados
        .map(p => p.precio)
        .filter(price => price != null && !isNaN(price) && isFinite(price))
      
      if (validPrices.length === 0) {
        return { price: null, label: 'Sin precios' }
      }
      
      const lowestPrice = Math.min(...validPrices)
      return { price: lowestPrice, label: 'Menor' }
    }
  }

  // getCompanyLogoPath now imported from '@/lib/companyLogos'

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (leafletMapRef.current && leafletMapRef.current.removeLayer) {
        leafletMapRef.current.removeLayer(marker)
      }
    })
    markersRef.current = []
  }

  // Add current location marker
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded || !currentLocation) return

    // Remove existing current location marker
    if (currentLocationMarkerRef.current) {
      leafletMapRef.current.removeLayer(currentLocationMarkerRef.current)
      currentLocationMarkerRef.current = null
    }

    // Create current location marker HTML
    const currentLocationHtml = `
      <div class="current-location-marker">
        <div class="w-5 h-5 bg-red-500 border-3 border-white rounded-full shadow-lg animate-pulse relative">
          <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
          <div class="relative w-full h-full bg-red-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
    `

    // Create custom icon for current location
    const currentLocationIcon = window.L.divIcon({
      html: currentLocationHtml,
      className: 'current-location-custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })

    // Create and add current location marker
    const currentLocationMarker = window.L.marker([currentLocation.lat, currentLocation.lng], {
      icon: currentLocationIcon
    }).addTo(leafletMapRef.current)

    currentLocationMarkerRef.current = currentLocationMarker
  }, [currentLocation, mapLoaded])

  // Remove automatic fetching of user reports - now only fetched on click

  // Function to generate markers
  const generateMarkers = useCallback(() => {
    if (!leafletMapRef.current || !mapLoaded) return

    // Clear existing markers first
    clearMarkers()
    
    stations.forEach((station) => {
      const displayPrice = getDisplayPrice(station)
      const logoPath = getCompanyLogoPath(station.empresa)
      const isSelected = selectedStations.some(s => s.id === station.id)
      const isFav = favoriteIds.has(station.id)
      // Filter prices by selected time of day to avoid duplicates in the popup grid
      const preciosToShow = Array.isArray(station.precios)
        ? (selectedTimeOfDay ? station.precios.filter(p => p.horario === selectedTimeOfDay) : station.precios)
        : []

      // Create marker with click popup functionality
      const markerHtml = `
        <div class="station-marker-container cursor-pointer relative" data-station-id="${station.id}">
          <!-- Floating Price Details Card (shown when selected) -->
          <div class="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                      bg-white rounded-md shadow-lg border border-gray-100 
              px-3 py-2.5 min-w-[240px] max-w-[280px]
              ${isSelected ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
              transition-all duration-200 ease-out station-popup-card">
            
            <!-- Arrow -->
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5">
              <div class="w-2 h-2 bg-white border-r border-b border-gray-100 transform rotate-45"></div>
            </div>
            
            <!-- Station Header -->
            <div class="flex items-center gap-2.5 mb-2.5">
              <div class="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow relative flex-shrink-0">
                <img
                  src="${logoPath}"
                  alt="${station.empresa ? station.empresa.charAt(0) : '—'}"
                  class="w-6 h-6 object-contain rounded-full"
                  onerror="const img = this; img.style.display='none'; const p = img.parentElement; if (p) p.textContent='${station.empresa ? station.empresa.charAt(0) : '—'}';"
                />
              </div>
              <div class="flex-grow min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate">${station.nombre}</h3>
                <p class="text-xs text-gray-500 truncate">${station.empresa}</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-50"
                        data-fav-toggle="true" data-station-id="${station.id}"
                        title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                  <span class="text-[14px] ${isFav ? 'text-yellow-400' : 'text-gray-300'}">★</span>
                </button>
                <button class="ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-50 text-gray-400 hover:text-gray-600" 
                        onclick="event.stopPropagation(); this.closest('.station-marker-container').click();">
                  ×
                </button>
              </div>
            </div>
              
            <!-- Fuel Prices Grid -->
            <div class="grid grid-cols-2 gap-2 mb-3">
              ${loading ? `
                <div class="col-span-2 flex items-center justify-center py-2">
                  <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span class="ml-2 text-xs text-gray-500">Cargando precios...</span>
                </div>
              ` : (
                preciosToShow.length > 0
                  ? preciosToShow.map(precio => {
                    return `
                    <div class="relative flex flex-col rounded-md border ${selectedFuelType === precio.tipoCombustible ? 'border-blue-300 ring-1 ring-blue-300 bg-blue-50/70' : 'border-gray-200 bg-white'} px-2.5 py-2 cursor-pointer transition-all hover:shadow-sm hover:border-blue-300"
                         onclick="window.location.href='/estacion/${station.id}'"
                         title="Click para ver detalles de la estación">
                      
                      <!-- Header with fuel type and community indicator -->
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-1">
                          <span class="text-xs font-medium">${getFuelLabel(precio.tipoCombustible)}</span>
                          ${isStationLoading(station.id) ? '<span class="flex items-center gap-0.5"><div class="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin"></div><span class="text-xs text-orange-600 font-medium">.</span></span>' : hasUserReports(station.id, precio.tipoCombustible) ? '<span class="flex items-center gap-0.5"><svg class="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg></span>' : ''}
                        </div>
                        ${(() => {
                          const userReport = getUserReport(station.id, precio.tipoCombustible)
                          return userReport && userReport.cantidadReportes >= 3 ? `<span class="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-medium">${userReport.cantidadReportes}</span>` : ''
                        })()}
                      </div>
                      
                      <!-- Official Price -->
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-800 font-medium">Oficial</span>
                        <span class="text-sm font-semibold">$${Math.round(precio.precio)}</span>
                      </div>
                      
                      <!-- User Average Price (if available and sufficient reports) -->
                      ${(() => {
                        const userReport = getUserReport(station.id, precio.tipoCombustible)
                        return userReport && userReport.cantidadReportes >= 1 ? `
                          <div class="flex items-center justify-between mt-0.5">
                            <span class="text-xs text-orange-600">Prom.</span>
                            <span class="text-sm font-semibold text-orange-700">$${Math.round(userReport.precioPromedio)}</span>
                          </div>
                        ` : ''
                      })()}
                     </div>
                    `
                  }).join('')
                  : '<div class="col-span-2 text-center text-gray-400 text-xs py-2">Sin precios</div>'
              )}
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button class="flex-1 text-xs px-2.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all shadow-sm flex items-center justify-center gap-1"
                      onclick="window.location.href='/estacion/${station.id}'" title="Ver detalles de la estación">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <circle cx="12" cy="16" r="1"></circle>
                </svg>
                <span>Detalles</span>
              </button>
              <button class="flex-1 text-xs px-2.5 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-sm flex items-center justify-center gap-1"
                      onclick="window.location.href='/reportar-precio/${station.id}'" title="Reportar precio">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 4v16"></path>
                  <path d="M4 5h10l-1-2h7l-1 2h-7"></path>
                </svg>
                <span>Reportar</span>
              </button>
            </div>
          </div>

          <!-- Base Marker Pin -->
          <div class="w-8 h-8 rounded-full border-2 border-white ${isSelected ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'} 
                      flex items-center justify-center text-white text-xs font-bold shadow-lg 
                      transition-all duration-200 relative z-10">
            <img src="${logoPath}" alt="${station.empresa}" 
                 class="w-6 h-6 object-contain rounded-full"
                 onerror="this.style.display='none'; this.parentElement.textContent='${station.empresa.charAt(0)}';" />
          </div>
          ${isFav ? `<div class="absolute -top-1 -left-1 z-20 bg-yellow-400 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow">★</div>` : ''}
          
          <!-- Price Badge -->
          <div class="absolute -bottom-1 -right-1 z-20 ${isSelected ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-blue-600'} rounded-full 
                      px-2 py-0.5 text-xs font-semibold shadow-md min-w-[40px] text-center">
            ${loading 
              ? '<div class="mx-auto w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>' 
              : (displayPrice.price !== null ? `$${Math.round(displayPrice.price)}` : '-')}
          </div>
        </div>
      `

      // Create custom icon with HTML content
      const customIcon = window.L.divIcon({
        html: markerHtml,
        className: 'custom-marker',
        iconSize: [60, 60], 
        iconAnchor: [30, 50],
        popupAnchor: [0, -50]
      })

      const marker = window.L.marker([station.latitud, station.longitud], {
        icon: customIcon
      }).addTo(leafletMapRef.current!)

      // Add click handler with user reports fetching
      marker.on('click', () => {
        setSelectedStations(prev => {
          const isAlreadySelected = prev.some(s => s.id === station.id)
          if (isAlreadySelected) {
            return prev.filter(s => s.id !== station.id)
          } else {
            // Fetch user reports when station is selected
            fetchUserReports(station.id)
            return [...prev, station]
          }
        })
      })

      // Attach favorite toggle listener to the marker DOM element
      // Using a microtask to ensure element exists
      setTimeout(() => {
        try {
          const anyMarker: any = marker as any
          const el: HTMLElement | null = anyMarker.getElement ? anyMarker.getElement() : null
          if (!el) return
          const favBtn = el.querySelector('[data-fav-toggle="true"]') as HTMLElement | null
          if (!favBtn) return
          favBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            handleFavoriteToggle(station.id)
          })
        } catch (err) {
          console.error('Fav listener attach error', err)
        }
      }, 0)

      // Store marker reference
      markersRef.current.push(marker)
    })
  }, [stations, selectedStations, selectedFuelType, selectedTimeOfDay, userReports, loadingReports, favoriteIds, mapLoaded, fetchUserReports, loading])

  const handleFavoriteToggle = async (stationId: string) => {
    if (!session?.user) {
      toast('Iniciá sesión para usar Favoritos', {
        action: { label: 'Ingresar', onClick: () => router.push('/login') }
      })
      return
    }
    if (favLoading.has(stationId)) return
    setFavLoading(prev => new Set(prev).add(stationId))
    const isFav = favoriteIds.has(stationId)
    try {
      if (isFav) {
        const res = await fetch(`/api/favoritos?estacionId=${encodeURIComponent(stationId)}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('DELETE favorito failed')
        setFavoriteIds(prev => {
          const n = new Set(prev)
          n.delete(stationId)
          return n
        })
        toast.success('Eliminado de favoritos')
      } else {
        const res = await fetch('/api/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estacionId: stationId })
        })
        if (!res.ok) throw new Error('POST favorito failed')
        setFavoriteIds(prev => new Set(prev).add(stationId))
        toast.success('Guardado en favoritos')
      }
    } catch (e) {
      console.error('toggle favorite error', e)
      toast.error('No se pudo actualizar el favorito')
    } finally {
      setFavLoading(prev => {
        const n = new Set(prev)
        n.delete(stationId)
        return n
      })
      // Regenerate markers to reflect star state
      generateMarkers()
    }
  }

  // Add station markers - now includes userReports and loadingReports in dependencies
  useEffect(() => {
    generateMarkers()
  }, [mapLoaded, generateMarkers])

  // Auto-fit map bounds to include all stations (optional)
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded || !fitToStations) return
    if (!stations || stations.length === 0) return
    const latitudes = stations.map(s => s.latitud).filter(v => Number.isFinite(v))
    const longitudes = stations.map(s => s.longitud).filter(v => Number.isFinite(v))
    if (latitudes.length === 0 || longitudes.length === 0) return
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)
    if (minLat === maxLat && minLng === maxLng) {
      // Single point - set a closer zoom
      leafletMapRef.current.setView([minLat, minLng], 15)
    } else {
      leafletMapRef.current.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [40, 40] })
    }
  }, [stations, mapLoaded, fitToStations])

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      clearMarkers()
      if (currentLocationMarkerRef.current && leafletMapRef.current) {
        leafletMapRef.current.removeLayer(currentLocationMarkerRef.current)
        currentLocationMarkerRef.current = null
      }
    }
  }, [])

  // Add/update radius circle
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded || !center || !visible) return

    if (radiusCircleRef.current) {
      radiusCircleRef.current
        .setLatLng([center.lat, center.lng])
        .setRadius(radius * 1000)
      if (typeof radiusCircleRef.current.bringToFront === 'function') {
        radiusCircleRef.current.bringToFront()
      }
    } else {
      radiusCircleRef.current = window.L.circle([center.lat, center.lng], {
        radius: radius * 1000, // Convert km to meters
        color: '#3b82f6',
        fillColor: '#3b82f6', 
        fillOpacity: 0.1,
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 5'
      }).addTo(leafletMapRef.current)
    }
  }, [center, radius, mapLoaded, visible])

  // Handle map visibility changes
  useEffect(() => {
    if (!leafletMapRef.current) return
    if (!visible) return
    // Wait until the container has a non-zero size, then refresh map and circle
    let attempts = 0
    const maxAttempts = 20 // ~2s
    const checkAndRefresh = () => {
      if (!leafletMapRef.current || !mapRef.current) return
      const w = mapRef.current.offsetWidth
      const h = mapRef.current.offsetHeight
      if (w > 0 && h > 0) {
        leafletMapRef.current.invalidateSize()
        if (center) {
          // Ensure circle exists and is updated
          if (radiusCircleRef.current) {
            radiusCircleRef.current
              .setLatLng([center.lat, center.lng])
              .setRadius(radius * 1000)
            if (typeof radiusCircleRef.current.bringToFront === 'function') {
              radiusCircleRef.current.bringToFront()
            }
          } else {
            radiusCircleRef.current = window.L.circle([center.lat, center.lng], {
              radius: radius * 1000, // Convert km to meters
              color: '#3b82f6',
              fillColor: '#3b82f6', 
              fillOpacity: 0.1,
              weight: 2,
              opacity: 0.6,
              dashArray: '5, 5'
            }).addTo(leafletMapRef.current)
          }
          // Nudge view to re-render overlays if necessary
          leafletMapRef.current.setView([center.lat, center.lng], 13)
        }
        clearInterval(interval)
      } else if (++attempts >= maxAttempts) {
        clearInterval(interval)
      }
    }
    const interval = setInterval(checkAndRefresh, 100)
    // Try immediately in case size is already correct
    checkAndRefresh()
    return () => clearInterval(interval)
  }, [visible, center, radius])

  // Cleanup circle on unmount
  useEffect(() => {
    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove()
        radiusCircleRef.current = null
      }
    }
  }, [])

  // This function is kept for potential future use
  // const getFuelIcon = (fuelType: string) => {
  //   const icons: Record<string, string> = {
  //     nafta: 'N',
  //     nafta_premium: 'P',
  //     gasoil: 'G',
  //     gasoil_premium: 'G+',
  //     gnc: 'GNC'
  //   }
  //   return icons[fuelType] || 'N'
  // }

  const getFuelLabel = (fuelType: string) => {
    return FUEL_LABELS[fuelType as FuelType] || fuelType
  }

  if (!mapLoaded || !center) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-muted rounded mx-auto animate-pulse" />
            <div className="h-4 w-36 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            {!center ? 'Obteniendo ubicación...' : !mapLoaded ? 'Cargando mapa...' : 'Inicializando mapa...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <style jsx global>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .current-location-custom-marker {
          background: none !important;
          border: none !important;
        }
        .station-popup-card {
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          backdrop-filter: blur(8px);
        }
        .station-popup-card button {
          font-weight: 500;
          letter-spacing: 0.025em;
        }
        /* Center Leaflet zoom controls vertically on the left, scoped to this map */
        .leaflet-zoom-left-center .leaflet-top.leaflet-left {
          top: 50% !important;
          transform: translateY(-50%);
        }
        .leaflet-zoom-left-center .leaflet-top.leaflet-left .leaflet-control-zoom {
          margin-top: 0; /* remove default top margin so true center */
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full leaflet-zoom-left-center" />
      
      {loading && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Actualizando estaciones...
          </div>
        </div>
      )}

      {selectedStations.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedStations.length} estaciones seleccionadas para comparar precios
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedStations([])}
            >
              Limpiar todo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}