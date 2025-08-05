'use client'

import { useEffect, useRef, useState } from 'react'
import { Station } from '@/components/MapSearchClient'
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
  onStationSelect: (station: Station) => void
}

interface LeafletMap {
  setView: (latlng: [number, number], zoom: number) => void
  invalidateSize: () => void
  remove: () => void
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

export function MapSearch({ stations, center, radius, loading, visible = true, onStationSelect }: MapSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<LeafletMap | null>(null)
  const radiusCircleRef = useRef<LeafletCircle | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
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

  // Add station markers
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded) return

    console.log('🗺️ Adding markers for', stations.length, 'stations')
    
    stations.forEach((station, index) => {
      const prices = station.precios
      const lowestPrice = Math.min(...prices.map(p => p.precio))
      const logoPath = getCompanyLogoPath(station.empresa)
      
      console.log(`📍 Adding marker ${index + 1}:`, station.nombre, 'at', station.latitud, station.longitud)

      // Create floating card marker with HTML/CSS
      const markerHtml = `
        <div class="station-marker-container group cursor-pointer relative">
          <!-- Floating Card (tooltip) -->
          <div class="absolute z-50 bottom-full mb-3 left-1/2 transform -translate-x-1/2 
                      bg-white rounded-lg shadow-lg border border-gray-100 
                      px-4 py-3 min-w-[220px] max-w-[280px]
                      opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100
                      transition-all duration-300 ease-in-out pointer-events-none">
            
            <!-- Arrow -->
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div class="w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-45"></div>
            </div>
            
            <div class="flex items-center space-x-3">
              <!-- Company Logo -->
              <div class="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                <img src="${logoPath}" alt="${station.empresa} logo" 
                     class="w-full h-full object-contain p-1"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  ${station.empresa.charAt(0)}
                </div>
              </div>
              
              <!-- Station Details -->
              <div class="flex-grow min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 truncate mb-1">${station.nombre}</h3>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-500">${station.empresa}</span>
                </div>
                <p class="text-blue-600 font-bold text-lg leading-none">$${lowestPrice.toFixed(2)}</p>
              </div>
            </div>
            
            ${prices.length > 1 ? `
              <div class="mt-3 pt-3 border-t border-gray-100">
                <div class="flex flex-wrap gap-2">
                  ${prices.slice(0, 3).map(precio => `
                    <div class="text-xs bg-gray-50 px-2 py-1 rounded">
                      ${getFuelIcon(precio.tipoCombustible)} $${precio.precio}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Base Marker Pin -->
          <div class="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 
                      flex items-center justify-center text-white text-xs font-bold shadow-lg 
                      hover:scale-110 transition-all duration-200 relative z-10">
            <img src="${logoPath}" alt="${station.empresa}" 
                 class="w-6 h-6 object-contain rounded-full"
                 onerror="this.style.display='none'; this.parentElement.textContent='${station.empresa.charAt(0)}';" />
          </div>
          
          <!-- Price Badge -->
          <div class="absolute -bottom-1 -right-1 z-20 bg-white border border-gray-200 rounded-full 
                      px-2 py-0.5 text-xs font-semibold text-blue-600 shadow-md min-w-[40px] text-center">
            $${lowestPrice}
          </div>
        </div>
      `

      // Create custom icon with HTML content
      const customIcon = window.L.divIcon({
        html: markerHtml,
        className: 'custom-marker',
        iconSize: [60, 60],
        iconAnchor: [30, 60],
        popupAnchor: [0, -60]
      })

      const marker = window.L.marker([station.latitud, station.longitud], {
        icon: customIcon
      }).addTo(leafletMapRef.current!)

      // Create popup content
      const popupContent = `
        <div class="station-popup" style="min-width: 250px;">
          <div style="font-weight: 600; margin-bottom: 8px;">
            ${station.nombre} - ${station.direccion}
          </div>
          <div style="margin-bottom: 8px;">
            ${prices.map(precio => `
              <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>${getFuelIcon(precio.tipoCombustible)} ${getFuelLabel(precio.tipoCombustible)}:</span>
                <span style="font-weight: 600;">$${precio.precio}</span>
              </div>
            `).join('')}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button onclick="window.location.href='/estacion/${station.id}'" 
                    style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
              📍 Ver detalles
            </button>
            <button style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
              💰 Reportar
            </button>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      marker.on('click', () => {
        setSelectedStation(station)
      })
    })
  }, [stations, mapLoaded])

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
        .custom-marker .group:hover .opacity-0 {
          opacity: 1 !important;
        }
        .custom-marker .group:hover .scale-90 {
          transform: scale(1) !important;
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

      {selectedStation && (
        <Card className="absolute bottom-4 left-4 right-4 p-4 shadow-lg bg-background/95 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold">{selectedStation.nombre}</h4>
              <p className="text-sm text-muted-foreground">{selectedStation.direccion}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{selectedStation.empresa}</Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedStation(null)}
              >
                ✕
              </Button>
            </div>
          </div>
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {selectedStation.precios.map(precio => (
              <div key={precio.tipoCombustible} className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground">
                  {getFuelIcon(precio.tipoCombustible)} {getFuelLabel(precio.tipoCombustible)}
                </div>
                <div className="font-semibold">${precio.precio}</div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => onStationSelect(selectedStation)}
              className="flex-1"
            >
              📍 Ver detalles
            </Button>
            <Button variant="outline">
              💰 Reportar precio
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}