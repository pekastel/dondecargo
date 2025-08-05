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

  // Add station markers
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded) return

    // Clear existing markers (in a real implementation, you'd track markers)
    
    stations.forEach(station => {
      const prices = station.precios
      const lowestPrice = Math.min(...prices.map(p => p.precio))
      
      // Custom marker with price display
      const markerHtml = `
        <div class="station-marker" style="
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 4px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #1e40af;
          min-width: 60px;
        ">
          <div style="font-size: 10px; color: #6b7280;">${station.empresa}</div>
          <div>$${lowestPrice}</div>
        </div>
      `

      const customIcon = window.L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="80" height="40" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="30" rx="6" fill="white" stroke="#3b82f6" stroke-width="2"/>
            <text x="40" y="12" text-anchor="middle" font-size="8" fill="#6b7280">${station.empresa}</text>
            <text x="40" y="24" text-anchor="middle" font-size="10" font-weight="600" fill="#1e40af">$${lowestPrice}</text>
            <polygon points="35,30 40,40 45,30" fill="#3b82f6"/>
          </svg>
        `),
        iconSize: [80, 40],
        iconAnchor: [40, 40],
        popupAnchor: [0, -40]
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