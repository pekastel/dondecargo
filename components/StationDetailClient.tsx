'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StationDetail } from '@/components/station/StationDetail'
import { PriceHistory } from '@/components/station/PriceHistory'
import { PriceReport } from '@/components/station/PriceReport'
import { StationInfo } from '@/components/station/StationInfo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft, Heart, Share2, Phone, Navigation, Star } from 'lucide-react'
import { FuelType } from '@/components/MapSearchClient'

export interface StationPrice {
  id: string
  tipoCombustible: FuelType
  precio: number
  horario: 'diurno' | 'nocturno'
  fechaVigencia: Date
  fuente: 'oficial' | 'usuario'
  usuarioId?: string
  esValidado: boolean
  fechaReporte: Date
}

export interface StationFull {
  id: string
  nombre: string
  empresa: string
  cuit: string
  direccion: string
  localidad: string
  provincia: string
  region: string
  latitud: number
  longitud: number
  geojson: object
  fechaCreacion: Date
  fechaActualizacion: Date
  precios: StationPrice[]
  servicios?: string[]
  formasPago?: string[]
  horarios?: string
  telefono?: string
  rating?: number
  reviewCount?: number
}

interface StationDetailClientProps {
  station: StationFull
}

const FUEL_LABELS: Record<FuelType, string> = {
  nafta: 'Nafta Super',
  nafta_premium: 'Nafta Premium',
  gasoil: 'Gasoil Común',
  gasoil_premium: 'Gasoil Premium',
  gnc: 'GNC'
}

export function StationDetailClient({ station }: StationDetailClientProps) {
  const router = useRouter()
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('nafta')
  const [isFavorite, setIsFavorite] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${station.nombre} - DondeCargo`,
          text: `Precios de combustibles en ${station.nombre}, ${station.direccion}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  const handleCall = () => {
    if (station.telefono) {
      window.location.href = `tel:${station.telefono}`
    }
  }

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitud},${station.longitud}`
    window.open(url, '_blank')
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // TODO: Persist to backend/localStorage
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const dateObj = date instanceof Date ? date : new Date(date)
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace menos de 1 hora'
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
    
    return dateObj.toLocaleDateString('es-AR')
  }

  const currentPrices = station.precios.filter(p => p.horario === 'diurno')
  const lowestPrice = Math.min(...currentPrices.map(p => p.precio))

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={toggleFavorite}
              className="flex-1 sm:flex-initial"
            >
              <Heart className={`h-4 w-4 mr-1 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'Guardado' : 'Guardar'}</span>
              <span className="sm:hidden">{isFavorite ? 'Guardado' : 'Guardar'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 sm:flex-initial">
              <Share2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Compartir</span>
              <span className="sm:hidden">Compartir</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Station Header */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h1 className="text-xl sm:text-2xl font-bold">{station.nombre}</h1>
                    <Badge variant="outline" className="text-xs w-fit">
                      {station.empresa}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                    {station.direccion}, {station.localidad}, {station.provincia}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    {station.horarios && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {station.horarios}
                      </span>
                    )}
                    {station.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{station.rating}</span>
                        {station.reviewCount && (
                          <span>({station.reviewCount})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button onClick={() => setShowReportModal(true)} className="w-full lg:w-auto">
                  Reportar Precio
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={handleDirections} className="flex-1 sm:flex-initial">
                  <Navigation className="h-4 w-4 mr-2" />
                  Cómo llegar
                </Button>
                {station.telefono && (
                  <Button variant="outline" size="sm" onClick={handleCall} className="flex-1 sm:flex-initial">
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar
                  </Button>
                )}
              </div>
            </Card>

            {/* Current Prices */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">Precios de hoy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {currentPrices.map((precio) => (
                  <div
                    key={precio.id}
                    className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      precio.precio === lowestPrice 
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 shadow-sm' 
                        : 'border-border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {FUEL_LABELS[precio.tipoCombustible]}
                        </span>
                      </div>
                      {precio.precio === lowestPrice && (
                        <Badge variant="secondary" className="text-xs">
                          Más bajo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xl sm:text-2xl font-bold mb-1">
                      {formatPrice(precio.precio)}
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{formatTimeAgo(precio.fechaVigencia)}</div>
                      <div className="flex items-center gap-1">
                        {precio.esValidado ? (
                          <>
                            <span className="text-green-600">✅</span>
                            <span>Verificado</span>
                          </>
                        ) : (
                          <>
                            <span className="text-orange-500">⏳</span>
                            <span>Pendiente</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Price History */}
            <PriceHistory 
              stationId={station.id}
              fuelType={selectedFuelType}
              onFuelTypeChange={setSelectedFuelType}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StationDetail station={station} />
            <StationInfo station={station} />
          </div>
        </div>

        {/* Price Report Modal */}
        {showReportModal && (
          <PriceReport
            station={station}
            onClose={() => setShowReportModal(false)}
            onSuccess={() => {
              setShowReportModal(false)
              // TODO: Refresh prices
            }}
          />
        )}
      </main>
    </div>
  )
}