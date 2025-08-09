'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, Phone, Clock, Building, Wrench, Star, Calendar } from 'lucide-react'
import { StationFull } from '@/components/StationDetailClient'

interface StationInfoProps {
  station: StationFull
}

export function StationInfo({ station }: StationInfoProps) {
  const handleCall = () => {
    if (station.telefono) {
      window.location.href = `tel:${station.telefono}`
    }
  }

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitud},${station.longitud}`
    window.open(url, '_blank')
  }

  const handleCompanyWebsite = (empresa: string) => {
    const websites: Record<string, string> = {
      'YPF': 'https://www.ypf.com',
      'Shell': 'https://www.shell.com.ar',
      'Axion Energy': 'https://www.axionenergy.com',
      'Puma': 'https://www.pumaenergy.com',
      'Trafigura': 'https://www.trafigura.com',
      'Petrobras': 'https://www.petrobras.com.ar',
      'DAPSA S.A.': 'https://www.dapsa.com.ar',
      'VOY': 'https://www.voy.com.ar',
      'SIN EMPRESA BANDERA': '',
      'OIL COMBUSTIBLES S.A.': 'https://www.oilcombustibles.com.ar',
      'REFINOR': 'https://www.refinor.com.ar',
      'SHELL C.A.P.S.A.': 'https://www.shell.com.ar',
      'GULF': 'https://www.gulf.com.ar',
      'BLANCA': ''
    }
    
    const website = websites[empresa]
    if (website) {
      window.open(website, '_blank')
    }
  }

  const formatDate = (date: Date | string | number) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCompanyColor = (empresa: string) => {
    const colors: Record<string, string> = {
      'YPF': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Shell': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Axion Energy': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Puma': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Trafigura': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Petrobras': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'DAPSA S.A.': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'VOY': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'SIN EMPRESA BANDERA': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'OIL COMBUSTIBLES S.A.': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'REFINOR': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'SHELL C.A.P.S.A.': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'GULF': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'BLANCA': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    return colors[empresa] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building className="h-5 w-5" />
          Información
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Empresa:</span>
            <div className="flex items-center gap-2">
              <Badge className={getCompanyColor(station.empresa)}>
                {station.empresa}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCompanyWebsite(station.empresa)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {station.horarios && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horarios:
              </span>
              <span className="font-medium">{station.horarios}</span>
            </div>
          )}

          {station.telefono && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCall}
                className="font-medium"
              >
                {station.telefono}
              </Button>
            </div>
          )}

          {station.rating && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Calificación:
              </span>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{station.rating}</span>
                {station.reviewCount && (
                  <span className="text-muted-foreground text-sm">({station.reviewCount} reseñas)</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CUIT:</span>
            <span className="font-mono text-sm">{station.cuit}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {station.telefono && (
            <Button variant="outline" onClick={handleCall} className="flex-1 sm:flex-initial">
              <Phone className="h-4 w-4 mr-2 sm:mr-0" />
              <span className="sm:hidden">Llamar</span>
            </Button>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Última actualización:
            </span>
            <span className="font-medium">
              {formatDate(station.fechaActualizacion)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Precios disponibles:</span>
            <span className="font-medium">{station.precios.length} combustibles</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Precios oficiales:</span>
            <span className="font-medium text-blue-600">
              {station.precios.filter(p => p.fuente === 'oficial').length}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reportes de usuarios:</span>
            <span className="font-medium text-green-600">
              {station.precios.filter(p => p.fuente === 'usuario' && p.esValidado).length}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Los precios oficiales provienen de datos.energia.gob.ar</p>
          <p>• Los datos se actualizan diariamente</p>
        </div>
      </Card>

      {/* Services and Amenities */}
      {(station.servicios && station.servicios.length > 0) && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Servicios disponibles
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {station.servicios.map((servicio) => (
              <div key={servicio} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                <span className="text-sm">
                  {getServiceIcon(servicio)}
                </span>
                <span className="text-sm font-medium">{servicio}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  )
}

// Helper functions
function getServiceIcon(servicio: string): string {
  const icons: Record<string, string> = {
    'Shop': '🏪',
    'Baños': '🚻',
    'Café': '☕',
    'Café Martinez': '☕',
    'ATM': '🏧',
    'Lavadero': '🚿',
    'Comida': '🍔',
    'WiFi': '📶',
    'Estacionamiento': '🅿️',
    'Aire': '🔧',
    'Agua': '💧'
  }
  return icons[servicio] || '🔧'
}

function getPaymentIcon(pago: string): string {
  const icons: Record<string, string> = {
    'Efectivo': '💵',
    'Tarjetas': '💳',
    'Transferencia': '📱',
    'QR': '📱',
    'Débito': '💳',
    'Crédito': '💳',
    'Mercado Pago': '📱',
    'Billetera Virtual': '📱'
  }
  return icons[pago] || '💳'
}