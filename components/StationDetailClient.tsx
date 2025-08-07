'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StationDetail } from '@/components/station/StationDetail'
import { PriceHistory } from '@/components/station/PriceHistory'
import { StationInfo } from '@/components/station/StationInfo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft, Heart, Share2, Phone, Navigation, Star, Users, TrendingUp, CheckCircle2, Check } from 'lucide-react'
import { FuelType, FUEL_LABELS, HorarioType, FuenteType } from '@/lib/types'

export interface StationPrice {
  id: string
  tipoCombustible: FuelType
  precio: number
  horario: HorarioType
  fechaVigencia: Date
  fuente: FuenteType
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

interface UserPriceReport {
  tipoCombustible: FuelType
  horario: HorarioType
  precioPromedio: number
  cantidadReportes: number
  precioMinimo: number
  precioMaximo: number
  ultimoReporte: Date
}

interface IndividualReport {
  id: string
  tipoCombustible: FuelType
  precio: number
  horario: HorarioType
  notas?: string
  fechaCreacion: Date
  usuarioId: string
}

interface StationDetailClientProps {
  station: StationFull
}


export function StationDetailClient({ station }: StationDetailClientProps) {
  const router = useRouter()
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('nafta')
  const [isFavorite, setIsFavorite] = useState(false)
  const [userReports, setUserReports] = useState<UserPriceReport[]>([])
  const [individualReports, setIndividualReports] = useState<IndividualReport[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [showAllReports, setShowAllReports] = useState(false)

  // Fetch user reports for this station
  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        setLoadingReports(true)
        const response = await fetch(`/api/estaciones/${station.id}/reportes-precios?dias=7`)
        if (response.ok) {
          const data = await response.json()
          setUserReports(data.resumen || [])
          setIndividualReports(data.reportes || [])
        }
      } catch (error) {
        console.error('Error fetching user reports:', error)
      } finally {
        setLoadingReports(false)
      }
    }

    fetchUserReports()
  }, [station.id])

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

  // Get user reports for a specific fuel type
  const getUserReportsForFuel = (fuelType: FuelType) => {
    return userReports.filter(report => report.tipoCombustible === fuelType)
  }

  // Get individual reports for a specific fuel type
  const getIndividualReportsForFuel = (fuelType: FuelType) => {
    return individualReports.filter(report => report.tipoCombustible === fuelType)
      .slice(0, showAllReports ? undefined : 3)
  }

  const currentPrices = station.precios.filter(p => p.horario === 'diurno')
  const lowestPrice = Math.min(...currentPrices.map(p => p.precio))

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <Button variant="ghost" onClick={router.back}>
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
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
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
                
                <Button onClick={() => router.push(`/reportar-precio/${station.id}`)} className="w-full lg:w-auto">
                  Reportar Precio
                </Button>
              </div>
              <div>
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
                      </div>
                      
                      <div className="text-xl sm:text-2xl font-bold mb-1">
                        {formatPrice(precio.precio)}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>{formatTimeAgo(precio.fechaVigencia)}</div>
                        <div className="flex items-center gap-1">
                          {precio.esValidado ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Oficial</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4" />
                              <span>Reportado</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* User Contributed Prices */}
            {userReports.length > 0 && (
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Precios Reportados por Usuarios
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    Últimos 7 días
                  </Badge>
                </div>
                
                {loadingReports ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {userReports.map((report) => (
                        <div
                          key={`${report.tipoCombustible}-${report.horario}`}
                          className="p-3 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {FUEL_LABELS[report.tipoCombustible]}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {report.cantidadReportes} reporte{report.cantidadReportes > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-lg font-bold">
                              {formatPrice(report.precioPromedio)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Promedio • {formatTimeAgo(report.ultimoReporte)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>Min: {formatPrice(report.precioMinimo)}</span>
                              <span>•</span>
                              <span>Max: {formatPrice(report.precioMaximo)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Individual Reports Section */}
                    {individualReports.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-sm text-muted-foreground">
                            Reportes Individuales
                          </h3>
                          {individualReports.length > 3 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowAllReports(!showAllReports)}
                            >
                              {showAllReports ? 'Ver menos' : `Ver todos (${individualReports.length})`}
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {getIndividualReportsForFuel(selectedFuelType).map((report) => (
                            <div 
                              key={report.id} 
                              className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  <span className="font-medium">
                                    {FUEL_LABELS[report.tipoCombustible]}
                                  </span>
                                </div>
                                <span className="font-semibold">
                                  {formatPrice(report.precio)}
                                </span>
                                {report.notas && (
                                  <span className="text-muted-foreground text-xs">
                                    "{report.notas}"
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(report.fechaCreacion)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {getIndividualReportsForFuel(selectedFuelType).length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No hay reportes para {FUEL_LABELS[selectedFuelType]} en los últimos 7 días
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

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
      </main>
    </div>
  )
}