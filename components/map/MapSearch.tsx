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

      // Create simple marker with no hover behavior
      const markerHtml = `
        <div class="station-marker-container cursor-pointer relative" data-station-id="${station.id}">
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

      {selectedStations.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 max-h-80 overflow-y-auto space-y-3">
          {selectedStations.map((station) => (
            <Card key={station.id} className="p-4 shadow-lg bg-background/95 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{station.nombre}</h4>
                  <p className="text-sm text-muted-foreground">{station.direccion}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{station.empresa}</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedStations(prev => prev.filter(s => s.id !== station.id))}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {station.precios.map(precio => (
                  <div key={precio.tipoCombustible} className={`text-center p-2 rounded-lg ${
                    selectedFuelType === precio.tipoCombustible ? 'bg-primary/20 border border-primary/30' : 'bg-muted/50'
                  }`}>
                    <div className="text-xs text-muted-foreground">
                      {getFuelIcon(precio.tipoCombustible)} {getFuelLabel(precio.tipoCombustible)}
                    </div>
                    <div className="font-semibold">${precio.precio}</div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => onStationSelect(station)}
                  className="flex-1"
                >
                  📍 Ver detalles
                </Button>
                <Button variant="outline">
                  💰 Reportar precio  
                </Button>
              </div>
            </Card>
          ))}
          
          {selectedStations.length > 1 && (
            <Card className="p-3 shadow-lg bg-primary/10 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {selectedStations.length} estaciones seleccionadas
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedStations([])}
                >
                  Limpiar todo
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}