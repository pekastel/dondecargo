'use client'

import { useEffect, useRef, useState } from 'react'
import { Station, FuelType } from '@/components/MapSearchClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface MapSearchProps {
  stations: Station[]
  center: { lat: number; lng: number } | null
  radius: number // in kilometers
  loading: boolean
  visible?: boolean // to trigger map resize when becoming visible
  selectedFuelType: FuelType | null
  onStationSelect: (station: Station) => void
}

interface LeafletMap {
  setView: (latlng: [number, number], zoom: number) => void
  invalidateSize: () => void
  remove: () => void
  removeLayer: (layer: any) => void
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
}

interface Leaflet {
  map: (element: HTMLElement) => LeafletMap
  tileLayer: (url: string, options?: any) => LeafletTileLayer
  marker: (latlng: [number, number], options?: any) => LeafletMarker
  circle: (latlng: [number, number], options?: any) => LeafletCircle
  icon: (options: any) => any
}

declare global {
  interface Window {
    L: Leaflet
  }
}

export function MapSearch({ stations, center, radius, loading, visible = true, selectedFuelType, onStationSelect }: MapSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<LeafletMap | null>(null)
  const radiusCircleRef = useRef<LeafletCircle | null>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const [selectedStations, setSelectedStations] = useState<Station[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      // Check if Leaflet is already loaded
      if (window.L) {
        setMapLoaded(true)
        return
      }

      // Check if CSS is already loaded
      const existingCSS = document.querySelector('link[href*="leaflet.css"]')
      if (!existingCSS) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Check if JS is already loaded or loading
      const existingScript = document.querySelector('script[src*="leaflet.js"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => setMapLoaded(true)
        script.onerror = () => {
          console.error('Failed to load Leaflet')
          setMapLoaded(false)
        }
        document.head.appendChild(script)
      } else if (window.L) {
        setMapLoaded(true)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !center) return

    // Clean up existing map if it exists
    if (leafletMapRef.current) {
      leafletMapRef.current.remove()
      leafletMapRef.current = null
    }

    // Create new map
    const map = window.L.map(mapRef.current).setView([center.lat, center.lng], 13)

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    leafletMapRef.current = map

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [mapLoaded, center])

  // Update map center
  useEffect(() => {
    if (leafletMapRef.current && center) {
      leafletMapRef.current.setView([center.lat, center.lng], 13)
    }
  }, [center])

  // Helper function to get display price based on selected fuel type
  const getDisplayPrice = (station: Station): { price: number | null; label: string } => {
    if (selectedFuelType) {
      const fuelPrice = station.precios.find(p => p.tipoCombustible === selectedFuelType)
      if (fuelPrice) {
        return { price: fuelPrice.precio, label: getFuelLabel(selectedFuelType) }
      } else {
        return { price: null, label: getFuelLabel(selectedFuelType) }
      }
    } else {
      // Show lowest price - check if prices array exists and has items
      if (!station.precios || station.precios.length === 0) {
        return { price: null, label: 'Sin precios' }
      }
      
      const validPrices = station.precios
        .map(p => p.precio)
        .filter(price => price != null && !isNaN(price) && isFinite(price))
      
      if (validPrices.length === 0) {
        return { price: null, label: 'Sin precios' }
      }
      
      const lowestPrice = Math.min(...validPrices)
      return { price: lowestPrice, label: 'Menor' }
    }
  }

  // Helper function to get company logo path
  const getCompanyLogoPath = (empresa: string): string => {
    const normalizedCompany = empresa.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    const logoMap: Record<string, string> = {
      'ypf': 'icono-ypf.png',
      'shell': 'icono-shell.png',
      'axion': 'icono-axion.png',
      'petrobras': 'icono-petrobras.png',
      'gulf': 'icono-gulf.png',
      'puma': 'icono-puma.png',
      'esso': 'icono-esso.png',
      'oil': 'icono-oil.png'
    }
    
    // Try to find exact match first
    const exactMatch = logoMap[normalizedCompany]
    if (exactMatch) {
      return `/logos/${exactMatch}`
    }
    
    // Try partial matches
    for (const [key, logo] of Object.entries(logoMap)) {
      if (normalizedCompany.includes(key) || key.includes(normalizedCompany)) {
        return `/logos/${logo}`
      }
    }
    
    return `/logos/icono-default.svg`
  }

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (leafletMapRef.current && leafletMapRef.current.removeLayer) {
        leafletMapRef.current.removeLayer(marker)
      }
    })
    markersRef.current = []
  }

  // Add station markers
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded) return

    // Clear existing markers first
    clearMarkers()
    
    stations.forEach((station, index) => {
      const displayPrice = getDisplayPrice(station)
      const logoPath = getCompanyLogoPath(station.empresa)
      const isSelected = selectedStations.some(s => s.id === station.id)

      // Create marker with click popup functionality
      const markerHtml = `
        <div class="station-marker-container cursor-pointer relative" data-station-id="${station.id}">
          <!-- Floating Price Details Card (shown when selected) -->
          <div class="absolute z-50 bottom-full mb-3 left-1/2 transform -translate-x-1/2 
                      bg-white rounded-lg shadow-xl border border-gray-200 
                      px-4 py-3 min-w-[280px] max-w-[320px]
                      ${isSelected ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
                      transition-all duration-300 ease-in-out station-popup-card">
            
            <!-- Arrow -->
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div class="w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
            </div>
            
            <!-- Station Header -->
            <div class="flex items-center space-x-3 mb-3">
              <div class="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                <img src="${logoPath}" alt="${station.empresa} logo" 
                     class="w-full h-full object-contain p-1"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  ${station.empresa.charAt(0)}
                </div>
              </div>
              
              <div class="flex-grow min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 truncate">${station.nombre}</h3>
                <p class="text-xs text-gray-500 truncate">${station.direccion}</p>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${station.empresa}</span>
              </div>

              <!-- Close button -->
              <button class="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 station-close-btn" 
                      onclick="event.stopPropagation(); this.closest('.station-marker-container').click();">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <!-- Fuel Prices Grid -->
            <div class="space-y-2 mb-3">
              <h4 class="text-xs font-medium text-gray-600 uppercase tracking-wide">Precios por combustible</h4>
              <div class="grid grid-cols-2 gap-2">
                ${station.precios.length > 0 ? station.precios.map(precio => `
                  <div class="text-center p-2 rounded-lg ${selectedFuelType === precio.tipoCombustible ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'} transition-colors">
                    <div class="text-xs text-gray-600 mb-1">
                      ${getFuelIcon(precio.tipoCombustible)} ${getFuelLabel(precio.tipoCombustible)}
                    </div>
                    <div class="font-bold text-sm ${selectedFuelType === precio.tipoCombustible ? 'text-blue-600' : 'text-gray-800'}">
                      $${Math.round(precio.precio)}
                    </div>
                  </div>
                `).join('') : '<div class="col-span-2 text-center text-gray-500 text-sm py-2">No hay precios disponibles</div>'}
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2 border-t border-gray-100">
              <button class="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors"
                      onclick="window.location.href='/estacion/${station.id}'">
                📍 Ver detalles
              </button>
              <button class="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md transition-colors">
                💰 Reportar precio
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
          
          <!-- Price Badge -->
          <div class="absolute -bottom-1 -right-1 z-20 ${isSelected ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-blue-600'} rounded-full 
                      px-2 py-0.5 text-xs font-semibold shadow-md min-w-[40px] text-center">
            ${displayPrice.price !== null ? `$${Math.round(displayPrice.price)}` : 'N/A'}
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

      // Add click handler
      marker.on('click', () => {
        setSelectedStations(prev => {
          const isAlreadySelected = prev.some(s => s.id === station.id)
          if (isAlreadySelected) {
            return prev.filter(s => s.id !== station.id)
          } else {
            return [...prev, station]
          }
        })
      })

      // Store marker reference
      markersRef.current.push(marker)
    })
  }, [stations, mapLoaded, selectedStations, selectedFuelType])

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      clearMarkers()
    }
  }, [])

  // Add/update radius circle
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded || !center) return

    // Remove existing circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove()
      radiusCircleRef.current = null
    }

    // Create new circle
    const circle = window.L.circle([center.lat, center.lng], {
      radius: radius * 1000, // Convert km to meters
      color: '#3b82f6',
      fillColor: '#3b82f6', 
      fillOpacity: 0.1,
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 5'
    }).addTo(leafletMapRef.current)

    radiusCircleRef.current = circle
  }, [center, radius, mapLoaded])

  // Handle map visibility changes
  useEffect(() => {
    if (leafletMapRef.current && visible) {
      // Invalidate map size when becoming visible to ensure proper rendering
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize()
        }
      }, 100)
    }
  }, [visible])

  // Cleanup circle on unmount
  useEffect(() => {
    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove()
        radiusCircleRef.current = null
      }
    }
  }, [])

  const getFuelIcon = (fuelType: string) => {
    const icons: Record<string, string> = {
      nafta: '⛽',
      nafta_premium: '⛽',
      gasoil: '🚛',
      gasoil_premium: '🚛',
      gnc: '⚡'
    }
    return icons[fuelType] || '⛽'
  }

  const getFuelLabel = (fuelType: string) => {
    const labels: Record<string, string> = {
      nafta: 'Nafta Super',
      nafta_premium: 'Nafta Premium',
      gasoil: 'Gasoil Común',
      gasoil_premium: 'Gasoil Premium',
      gnc: 'GNC'
    }
    return labels[fuelType] || fuelType
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
            {!center ? 'Obteniendo ubicación...' : 'Cargando mapa...'}
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
        .station-popup-card {
          z-index: 1000;
        }
        .station-close-btn:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
      
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