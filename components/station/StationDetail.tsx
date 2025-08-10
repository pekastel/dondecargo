'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, ExternalLink } from 'lucide-react'
import { StationFull } from '@/components/StationDetailClient'
import { getCompanyLogoPath } from '@/lib/companyLogos'

interface StationDetailProps {
  station: StationFull
}

interface LeafletMap {
  setView: (latlng: [number, number], zoom: number) => void
  remove: () => void
  removeLayer: (layer: unknown) => void
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker
  bindPopup: (content: string) => LeafletMarker
}

interface LeafletTileLayer {
  addTo: (map: LeafletMap) => void
}

interface Leaflet {
  map: (element: HTMLElement) => LeafletMap
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletTileLayer
  marker: (latlng: [number, number], options?: Record<string, unknown>) => LeafletMarker
  divIcon: (options: Record<string, unknown>) => unknown
  icon: (options: Record<string, unknown>) => unknown
}


export function StationDetail({ station }: StationDetailProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<LeafletMap | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // getCompanyLogoPath now imported from '@/lib/companyLogos'

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
    if (!mapLoaded || !mapRef.current) return

    // Clean up existing map if it exists
    if (leafletMapRef.current) {
      leafletMapRef.current.remove()
      leafletMapRef.current = null
    }

    // Create new map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leafletMap: any = (window as any).L.map(mapRef.current).setView([station.latitud, station.longitud], 16)
    
    // Add tile layer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tileLayer = (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    })
    tileLayer.addTo(leafletMap)

    const logoPath = getCompanyLogoPath(station.empresa)

    // Create marker with same style as MapSearch
    const markerHtml = `
      <div class="station-marker-container">
        <!-- Base Marker Pin -->
        <div class="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 
                    flex items-center justify-center text-white text-xs font-bold shadow-lg 
                    relative z-10">
          <img src="${logoPath}" alt="${station.empresa}" 
               class="w-6 h-6 object-contain rounded-full"
               onerror="this.style.display='none'; this.parentElement.textContent='${station.empresa.charAt(0)}';" />
        </div>
      </div>
    `

    // Create custom icon with HTML content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customIcon = (window as any).L.divIcon({
      html: markerHtml,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const marker = (window as any).L.marker([station.latitud, station.longitud], {
      icon: customIcon
    }).addTo(leafletMap)

    marker.bindPopup(`
      <div style="text-align: center; padding: 12px; min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <img src="${logoPath}" alt="${station.empresa}" style="width: 24px; height: 24px; object-fit: contain;" />
          <strong style="font-size: 14px;">${station.nombre}</strong>
        </div>
        <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${station.empresa}</div>
        <div style="font-size: 12px;">${station.direccion}</div>
      </div>
    `)

    leafletMapRef.current = leafletMap

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [mapLoaded, station])

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitud},${station.longitud}`
    window.open(url, '_blank')
  }

  const handleCall = () => {
    if (station.telefono) {
      window.location.href = `tel:${station.telefono}`
    }
  }

  if (!mapLoaded) {
    return (
      <div className="space-y-6">
        <Card className="p-3 sm:p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación
          </h3>
          
          <div className="w-full h-48 rounded-lg bg-muted/20 mb-4 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
      <div className="space-y-6">
        {/* Location Map */}
        <Card className="p-3 sm:p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación
          </h3>
          
          <div 
            ref={mapRef} 
            className="w-full h-40 sm:h-48 rounded-lg bg-muted/20 mb-4"
            style={{ minHeight: '160px' }}
          />
        
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{station.direccion}</p>
              <p className="text-muted-foreground">{station.localidad}, {station.provincia}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" onClick={handleDirections} className="flex-1 sm:flex-initial">
              <ExternalLink className="h-4 w-4 mr-2" />
              Direcciones
            </Button>
            {station.telefono && (
              <Button variant="outline" size="sm" onClick={handleCall} className="flex-1 sm:flex-initial">
                <Phone className="h-4 w-4 mr-2" />
                Llamar
              </Button>
            )}
          </div>
        </div>
      </Card>
      </div>
    </>
  )
}