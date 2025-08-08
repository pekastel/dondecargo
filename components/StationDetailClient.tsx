'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StationDetail } from '@/components/station/StationDetail'
import { PriceHistory } from '@/components/station/PriceHistory'
import { StationInfo } from '@/components/station/StationInfo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft, Heart, Share2, Star, Users, CheckCircle2, Sun, Moon } from 'lucide-react'
import { FuelType, FUEL_LABELS, HorarioType, FuenteType } from '@/lib/types'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { authClient } from '@/lib/authClient'
import { toast } from 'sonner'

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
  cantidadReportes: string
  precioMinimo: number
  precioMaximo: number
  ultimoReporte: Date | string
  ultimoUsuarioId?: string
  ultimoUsuarioNombre?: string | null
  ultimoUsuarioEmail?: string | null
  ultimoUsuarioImagen?: string | null
}

interface IndividualReport {
  id: string
  tipoCombustible: FuelType
  precio: number
  horario: HorarioType
  notas?: string
  fechaCreacion: Date | string
  usuarioId: string
  usuarioNombre?: string | null
  usuarioEmail?: string | null
  usuarioImagen?: string | null
}

interface StationDetailClientProps {
  station: StationFull
}


// Interface for consolidated price data
interface ConsolidatedPriceReport {
  tipoCombustible: FuelType
  hasSamePrice: boolean
  diurno?: UserPriceReport
  nocturno?: UserPriceReport
  consolidatedData?: {
    precioPromedio: number
    cantidadReportes: string
    precioMinimo: number
    precioMaximo: number
    ultimoReporte: Date | string
    ultimoUsuarioId?: string
    ultimoUsuarioNombre?: string | null
    ultimoUsuarioEmail?: string | null
    ultimoUsuarioImagen?: string | null
    horarios: HorarioType[]
  }
}

export function StationDetailClient({ station }: StationDetailClientProps) {
  const router = useRouter()
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('nafta')
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [userReports, setUserReports] = useState<UserPriceReport[]>([])
  const [individualReports, setIndividualReports] = useState<IndividualReport[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [showAllReports, setShowAllReports] = useState(false)
  const [horarioToggles, setHorarioToggles] = useState<Record<string, HorarioType>>({})
  const { data: session } = authClient.useSession()

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

  // Load initial favorite state for authenticated users
  useEffect(() => {
    const loadFavorite = async () => {
      if (!session?.user) return
      try {
        const res = await fetch(`/api/favoritos?estacionId=${station.id}`)
        if (res.ok) {
          const data = await res.json()
          if (typeof data.isFavorite === 'boolean') {
            setIsFavorite(data.isFavorite)
          }
        }
      } catch (e) {
        console.error('Error fetching favorite state', e)
      }
    }
    loadFavorite()
  }, [session?.user, station.id])

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

  // Removed unused handlers - handleCall and handleDirections

  const toggleFavorite = async () => {
    if (!session?.user) {
      toast('Iniciá sesión para usar Favoritos', {
        action: {
          label: 'Ingresar',
          onClick: () => router.push('/login'),
        },
      })
      return
    }

    try {
      setFavoriteLoading(true)
      if (isFavorite) {
        const res = await fetch(`/api/favoritos?estacionId=${station.id}`, { method: 'DELETE' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'No se pudo eliminar de favoritos')
        }
        setIsFavorite(false)
        toast.success('Eliminado de favoritos')
      } else {
        const res = await fetch('/api/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estacionId: station.id }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'No se pudo guardar en favoritos')
        }
        setIsFavorite(true)
        toast.success('Guardado en favoritos')
      }
    } catch (e: any) {
      console.error('toggleFavorite error', e)
      toast.error(e?.message || 'Ocurrió un error')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price) || !isFinite(price)) {
      return 'N/A'
    }
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


  // These functions are now replaced by consolidated versions

  // Consolidate user reports by fuel type and same price
  const getConsolidatedReports = (): ConsolidatedPriceReport[] => {
    const reportsByFuel = userReports.reduce((acc, report) => {
      const key = report.tipoCombustible
      if (!acc[key]) acc[key] = []
      acc[key].push(report)
      return acc
    }, {} as Record<FuelType, UserPriceReport[]>)

    return Object.entries(reportsByFuel).map(([fuelType, reports]) => {
      const fuel = fuelType as FuelType
      const diurno = reports.find(r => r.horario === 'diurno')
      const nocturno = reports.find(r => r.horario === 'nocturno')

      // Check if both exist and have the same price (within tolerance)
      const hasSamePrice = diurno && nocturno && 
        Math.abs(diurno.precioPromedio - nocturno.precioPromedio) < 0.01

      if (hasSamePrice && diurno && nocturno) {
        // Consolidate data - weighted average, not simple average
        const totalReportes = parseInt(diurno.cantidadReportes) + parseInt(nocturno.cantidadReportes)
        const diurnoDate = diurno.ultimoReporte instanceof Date ? diurno.ultimoReporte : new Date(diurno.ultimoReporte)
        const nocturnoDate = nocturno.ultimoReporte instanceof Date ? nocturno.ultimoReporte : new Date(nocturno.ultimoReporte)
        const ultimoReporte = diurnoDate > nocturnoDate ? diurnoDate : nocturnoDate
        const ultimoReporteTipo = diurnoDate > nocturnoDate ? diurno : nocturno
        
        const consolidatedData = {
          precioPromedio: totalReportes > 0 ? 
            ((diurno.precioPromedio * parseInt(diurno.cantidadReportes)) + (nocturno.precioPromedio * parseInt(nocturno.cantidadReportes))) / totalReportes :
            (diurno.precioPromedio + nocturno.precioPromedio) / 2,
          cantidadReportes: totalReportes,
          precioMinimo: Math.min(diurno.precioMinimo, nocturno.precioMinimo),
          precioMaximo: Math.max(diurno.precioMaximo, nocturno.precioMaximo),
          ultimoReporte,
          ultimoUsuarioId: ultimoReporteTipo.ultimoUsuarioId,
          ultimoUsuarioNombre: ultimoReporteTipo.ultimoUsuarioNombre,
          ultimoUsuarioEmail: ultimoReporteTipo.ultimoUsuarioEmail,
          ultimoUsuarioImagen: ultimoReporteTipo.ultimoUsuarioImagen,
          horarios: ['diurno', 'nocturno'] as HorarioType[]
        }
        
        return {
          tipoCombustible: fuel,
          hasSamePrice: true,
          consolidatedData
        }
      }

      // Return separate entries for different prices
      return {
        tipoCombustible: fuel,
        hasSamePrice: false,
        diurno,
        nocturno
      }
    })
  }

  // Get consolidated individual reports (merge same price + fuel + time)
  const getConsolidatedIndividualReports = () => {
    const reports = individualReports.slice(0, showAllReports ? undefined : 6)
    const consolidated: Array<{
      id: string
      tipoCombustible: FuelType
      precio: number
      horarios: HorarioType[]
      fechaCreacion: Date | string
      usuarioId: string
      usuarioNombre: string
      usuarioEmail: string
      usuarioImagen: string
      notas?: string
    }> = []

    reports.forEach(report => {
      // Look for existing report with same fuel, price, and recent time (within 2 hours)
      const existing = consolidated.find(c => {
        const existingDate = c.fechaCreacion instanceof Date ? c.fechaCreacion : new Date(c.fechaCreacion)
        const reportDate = report.fechaCreacion instanceof Date ? report.fechaCreacion : new Date(report.fechaCreacion)
        
        return c.tipoCombustible === report.tipoCombustible &&
          Math.abs(c.precio - report.precio) < 0.01 &&
          Math.abs(existingDate.getTime() - reportDate.getTime()) < 2 * 60 * 60 * 1000
      })

      if (existing && !existing.horarios.includes(report.horario)) {
        existing.horarios.push(report.horario)
        existing.horarios.sort((a) => a === 'diurno' ? -1 : 1) // diurno first
      } else {
        consolidated.push({
          id: report.id,
          tipoCombustible: report.tipoCombustible,
          precio: report.precio,
          horarios: [report.horario],
          fechaCreacion: report.fechaCreacion,
          usuarioId: report.usuarioId,
          usuarioNombre: report.usuarioNombre || '',
          usuarioEmail: report.usuarioEmail || '',
          usuarioImagen: report.usuarioImagen || '',
          notas: report.notas
        })
      }
    })

    return consolidated
  }

  // Toggle horario for differentiated prices
  const toggleHorario = (fuelType: FuelType) => {
    const current = horarioToggles[fuelType] || 'diurno'
    setHorarioToggles(prev => ({
      ...prev,
      [fuelType]: current === 'diurno' ? 'nocturno' : 'diurno'
    }))
  }

  // Get current report data for toggle
  const getCurrentReportData = (consolidatedReport: ConsolidatedPriceReport): UserPriceReport | null => {
    if (consolidatedReport.hasSamePrice) {
      return null // Use consolidated data instead
    }

    const selectedHorario = horarioToggles[consolidatedReport.tipoCombustible] || 'diurno'
    return selectedHorario === 'diurno' ? consolidatedReport.diurno : consolidatedReport.nocturno
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
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
                              <span className="font-medium text-gray-800">Oficial</span>
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
                      {getConsolidatedReports().map((consolidatedReport) => {
                        if (consolidatedReport.hasSamePrice && consolidatedReport.consolidatedData) {
                          // Consolidated card for same prices
                          return (
                            <div
                              key={consolidatedReport.tipoCombustible}
                              className="p-3 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {FUEL_LABELS[consolidatedReport.tipoCombustible]}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Sun className="h-3 w-3 text-amber-500" />
                                    <Moon className="h-3 w-3 text-blue-500" />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {consolidatedReport.consolidatedData.ultimoUsuarioId && (
                                    <UserAvatar
                                      userId={consolidatedReport.consolidatedData.ultimoUsuarioId}
                                      name={consolidatedReport.consolidatedData.ultimoUsuarioNombre || undefined}
                                      email={consolidatedReport.consolidatedData.ultimoUsuarioEmail || undefined}
                                      image={consolidatedReport.consolidatedData.ultimoUsuarioImagen || undefined}
                                      size="md"
                                    />
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-lg font-bold">
                                  {formatPrice(consolidatedReport.consolidatedData.precioPromedio)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Promedio • {formatTimeAgo(consolidatedReport.consolidatedData.ultimoReporte)}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>Min: {formatPrice(consolidatedReport.consolidatedData.precioMinimo)}</span>
                                  <span>•</span>
                                  <span>Max: {formatPrice(consolidatedReport.consolidatedData.precioMaximo)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        } else {
                          // Different prices - show toggle interface
                          const currentData = getCurrentReportData(consolidatedReport)
                          const selectedHorario = horarioToggles[consolidatedReport.tipoCombustible] || 'diurno'
                          const hasMultipleHorarios = consolidatedReport.diurno && consolidatedReport.nocturno
                          
                          if (!currentData) return null
                          
                          return (
                            <div
                              key={`${consolidatedReport.tipoCombustible}-${selectedHorario}`}
                              className="p-3 rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 relative"
                            >
                              {hasMultipleHorarios && (
                                <div className="absolute top-2 right-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleHorario(consolidatedReport.tipoCombustible)}
                                    className="h-6 w-6 p-0 hover:bg-orange-200 dark:hover:bg-orange-800"
                                    title={`Cambiar a horario ${selectedHorario === 'diurno' ? 'nocturno' : 'diurno'}`}
                                  >
                                    {selectedHorario === 'diurno' ? 
                                      <Moon className="h-3 w-3" /> : 
                                      <Sun className="h-3 w-3" />
                                    }
                                  </Button>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mb-2 pr-8">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {FUEL_LABELS[consolidatedReport.tipoCombustible]}
                                  </span>
                                  {selectedHorario === 'diurno' ? 
                                    <Sun className="h-3 w-3 text-amber-500" title="Horario diurno" /> : 
                                    <Moon className="h-3 w-3 text-blue-500" title="Horario nocturno" />
                                  }
                                  {hasMultipleHorarios && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                      Variable
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {currentData.ultimoUsuarioId && (
                                    <UserAvatar
                                      userId={currentData.ultimoUsuarioId}
                                      name={currentData.ultimoUsuarioNombre || undefined}
                                      email={currentData.ultimoUsuarioEmail || undefined}
                                      image={currentData.ultimoUsuarioImagen || undefined}
                                      size="md"
                                    />
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {parseInt(currentData.cantidadReportes)} reporte{parseInt(currentData.cantidadReportes) > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-lg font-bold">
                                  {formatPrice(currentData.precioPromedio)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Promedio • {formatTimeAgo(currentData.ultimoReporte)}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>Min: {formatPrice(currentData.precioMinimo)}</span>
                                  <span>•</span>
                                  <span>Max: {formatPrice(currentData.precioMaximo)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      })}
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
                              {showAllReports ? 'Ver menos' : 'Ver todos'}
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {getConsolidatedIndividualReports().map((report) => (
                            <div 
                              key={report.id} 
                              className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <UserAvatar
                                  userId={report.usuarioId}
                                  name={report.usuarioNombre || undefined}
                                  email={report.usuarioEmail || undefined}
                                  image={report.usuarioImagen || undefined}
                                  size="md"
                                />
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  <span className="font-medium">
                                    {FUEL_LABELS[report.tipoCombustible]}
                                  </span>
                                  <div className="flex items-center gap-1 ml-1">
                                    {report.horarios.includes('diurno') && (
                                      <Sun className="h-3 w-3 text-amber-500" title="Horario diurno" />
                                    )}
                                    {report.horarios.includes('nocturno') && (
                                      <Moon className="h-3 w-3 text-blue-500" title="Horario nocturno" />
                                    )}
                                  </div>
                                </div>
                                <span className="font-semibold">
                                  {formatPrice(report.precio)}
                                </span>
                                {report.notas && (
                                  <span className="text-muted-foreground text-xs">
                                    &ldquo;{report.notas}&rdquo;
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(report.fechaCreacion)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {getConsolidatedIndividualReports().length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No hay reportes individuales en los últimos 7 días
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