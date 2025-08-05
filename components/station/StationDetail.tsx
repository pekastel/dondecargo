'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MapPin, Clock, Phone, Star, ExternalLink } from 'lucide-react'
import { StationFull } from '@/components/StationDetailClient'

interface StationDetailProps {
  station: StationFull
}

interface LeafletMap {
  setView: (latlng: [number, number], zoom: number) => void
  remove: () => void
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
  tileLayer: (url: string, options?: any) => LeafletTileLayer
  marker: (latlng: [number, number], options?: any) => LeafletMarker
  icon: (options: any) => any
}

declare global {
  interface Window {
    L: Leaflet
  }
}

export function StationDetail({ station }: StationDetailProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<LeafletMap | null>(null)

  // Load and initialize map
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined' || window.L || leafletMapRef.current) return

      // Load Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      
      script.onload = () => {
        if (mapRef.current) {
          const map = window.L.map(mapRef.current).setView([station.latitud, station.longitud], 16)

          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map)

          // Custom marker icon
          const customIcon = window.L.icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
                <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">E</text>
              </svg>
            `),
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
          })

          const marker = window.L.marker([station.latitud, station.longitud], {
            icon: customIcon
          }).addTo(map)

          marker.bindPopup(`
            <div style="text-align: center; padding: 8px;">
              <strong>${station.nombre}</strong><br>
              <small>${station.direccion}</small>
            </div>
          `)

          leafletMapRef.current = map
        }
      }
      
      document.head.appendChild(script)
    }

    loadLeaflet()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [station])

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitud},${station.longitud}`
    window.open(url, '_blank')
  }

  const handleCall = () => {
    if (station.telefono) {
      window.location.href = `tel:${station.telefono}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Location Map */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          🗺️ Ubicación
        </h3>
        
        <div 
          ref={mapRef} 
          className="w-full h-48 rounded-lg bg-muted/20 mb-4"
          style={{ minHeight: '192px' }}
        />
        
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{station.direccion}</p>
              <p className="text-muted-foreground">{station.localidad}, {station.provincia}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={handleDirections}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Direcciones
            </Button>
            {station.telefono && (
              <Button variant="outline" size="sm" onClick={handleCall}>
                <Phone className="h-4 w-4 mr-1" />
                Llamar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Station Information */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">ℹ️ Información</h3>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Empresa:</span>
              <Badge variant="outline">{station.empresa}</Badge>
            </div>
            
            {station.horarios && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horarios:</span>
                <span className="font-medium">{station.horarios}</span>
              </div>
            )}
            
            {station.telefono && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">{station.telefono}</span>
              </div>
            )}

            {station.rating && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Calificación:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{station.rating}</span>
                  {station.reviewCount && (
                    <span className="text-muted-foreground">({station.reviewCount})</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Services */}
          {station.servicios && station.servicios.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Servicios disponibles:</h4>
              <div className="flex flex-wrap gap-1">
                {station.servicios.map((servicio) => (
                  <Badge key={servicio} variant="secondary" className="text-xs">
                    {servicio}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {station.formasPago && station.formasPago.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Formas de pago:</h4>
              <div className="flex flex-wrap gap-1">
                {station.formasPago.map((pago) => (
                  <Badge key={pago} variant="outline" className="text-xs">
                    {pago}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Update Info */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>
              Última actualización: {new Date(station.fechaActualizacion).toLocaleDateString('es-AR')}
            </div>
            <div>
              CUIT: {station.cuit}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">📊 Estadísticas</h3>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/20">
            <div className="text-2xl font-bold text-primary">
              {station.precios.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Combustibles
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/20">
            <div className="text-2xl font-bold text-green-600">
              {station.precios.filter(p => p.esValidado).length}
            </div>
            <div className="text-xs text-muted-foreground">
              Verificados
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/20">
            <div className="text-2xl font-bold text-blue-600">
              {station.precios.filter(p => p.fuente === 'oficial').length}
            </div>
            <div className="text-xs text-muted-foreground">
              Oficiales
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/20">
            <div className="text-2xl font-bold text-orange-600">
              {station.precios.filter(p => p.fuente === 'usuario').length}
            </div>
            <div className="text-xs text-muted-foreground">
              Reportados
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}