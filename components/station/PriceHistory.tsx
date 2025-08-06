'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { FuelType } from '@/components/MapSearchClient'

interface PriceHistoryProps {
  stationId: string
  fuelType: FuelType
  onFuelTypeChange: (fuelType: FuelType) => void
}

interface PriceHistoryItem {
  fecha: Date
  precio: number
  fuente: 'oficial' | 'usuario'
  esValidado: boolean
}

const FUEL_LABELS: Record<FuelType, string> = {
  nafta: 'Nafta Super',
  nafta_premium: 'Nafta Premium',
  gasoil: 'Gasoil Común',
  gasoil_premium: 'Gasoil Premium',
  gnc: 'GNC'
}

const TIME_PERIODS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 3 meses' },
  { value: '365', label: 'Último año' }
]

export function PriceHistory({ stationId, fuelType, onFuelTypeChange }: PriceHistoryProps) {
  const [history, setHistory] = useState<PriceHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState('30')

  useEffect(() => {
    fetchPriceHistory()
  }, [stationId, fuelType, timePeriod])

  const fetchPriceHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        estacionId: stationId,
        tipoCombustible: fuelType,
        fechaDesde: new Date(Date.now() - parseInt(timePeriod) * 24 * 60 * 60 * 1000).toISOString(),
        orderBy: 'fecha',
        orderDir: 'asc',
        limit: '100'
      })

      const response = await fetch(`/api/precios?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform API response to match our PriceHistoryItem interface
      const transformedHistory: PriceHistoryItem[] = data.data.map((item: any) => ({
        fecha: new Date(item.fechaVigencia),
        precio: parseFloat(item.precio),
        fuente: item.fuente,
        esValidado: item.esValidado
      }))
      
      setHistory(transformedHistory)
    } catch (error) {
      console.error('Error fetching price history:', error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const getBasePriceForFuel = (fuel: FuelType): number => {
    const basePrices: Record<FuelType, number> = {
      nafta: 890,
      nafta_premium: 925,
      gasoil: 845,
      gasoil_premium: 872,
      gnc: 485
    }
    return basePrices[fuel]
  }

  const calculateTrend = () => {
    if (history.length < 2) return { trend: 'stable', change: 0, percentage: 0 }
    
    const latest = history[history.length - 1].precio
    const previous = history[history.length - 2].precio
    const change = latest - previous
    const percentage = (change / previous) * 100
    
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (Math.abs(change) > 1) {
      trend = change > 0 ? 'up' : 'down'
    }
    
    return { trend, change, percentage }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const trend = calculateTrend()
  const latestPrice = history.length > 0 ? history[history.length - 1].precio : 0
  const oldestPrice = history.length > 0 ? history[0].precio : 0
  const totalChange = latestPrice - oldestPrice
  const totalPercentage = oldestPrice > 0 ? (totalChange / oldestPrice) * 100 : 0

  const maxPrice = Math.max(...history.map(h => h.precio), 0)
  const minPrice = Math.min(...history.map(h => h.precio), 0)

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h3 className="text-lg font-semibold mb-4 sm:mb-0 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Historial de Precios
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={fuelType} onValueChange={(value: FuelType) => onFuelTypeChange(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
                <SelectItem key={fuel} value={fuel}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchPriceHistory} disabled={loading}>
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando historial...</p>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-center">
          <div>
            <p className="text-muted-foreground mb-2">No hay datos disponibles</p>
            <Button variant="outline" onClick={fetchPriceHistory}>
              Intentar nuevamente
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <div className="text-lg font-bold">{formatPrice(latestPrice)}</div>
              <div className="text-xs text-muted-foreground">Actual</div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <div className="flex items-center justify-center gap-1">
                {trend.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                {trend.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                {trend.trend === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
                <span className={`text-sm font-medium ${
                  trend.trend === 'up' ? 'text-red-500' : 
                  trend.trend === 'down' ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Variación</div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <div className="text-lg font-bold text-green-600">{formatPrice(minPrice)}</div>
              <div className="text-xs text-muted-foreground">Mínimo</div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <div className="text-lg font-bold text-red-600">{formatPrice(maxPrice)}</div>
              <div className="text-xs text-muted-foreground">Máximo</div>
            </div>
          </div>

          {/* Chart Area - Simple line visualization */}
          <div className="relative h-40 border rounded-lg p-4 bg-muted/10">
            <div className="h-full flex items-end justify-between gap-1">
              {history.map((item, index) => {
                const height = ((item.precio - minPrice) / (maxPrice - minPrice)) * 100
                const isValidated = item.esValidado
                const isOfficial = item.fuente === 'oficial'
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className={`w-full rounded-t transition-colors ${
                        isOfficial 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : isValidated 
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-orange-400 hover:bg-orange-500'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 hidden group-hover:block bg-black/90 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg border border-white/10">
                      <div className="font-bold text-sm">{formatPrice(item.precio)}</div>
                      <div className="text-white/80">{formatDate(item.fecha)}</div>
                      <div className="flex items-center gap-1 mt-1 pt-1 border-t border-white/20">
                        <div className={`w-2 h-2 rounded-full ${
                          isOfficial ? 'bg-blue-400' : isValidated ? 'bg-green-400' : 'bg-orange-400'
                        }`} />
                        <span className="text-white/90">{isOfficial ? 'Oficial' : isValidated ? 'Validado' : 'Pendiente'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground -ml-12">
              <span>{formatPrice(maxPrice)}</span>
              <span>{formatPrice((maxPrice + minPrice) / 2)}</span>
              <span>{formatPrice(minPrice)}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Oficial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Usuario Validado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded" />
              <span>Pendiente Validación</span>
            </div>
          </div>

          {/* Recent Changes */}
          <div>
            <h4 className="font-medium mb-3">Cambios recientes</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {history.slice(-5).reverse().map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span>{formatDate(item.fecha)}</span>
                    <Badge variant={item.fuente === 'oficial' ? 'default' : 'secondary'} className="text-xs">
                      {item.fuente === 'oficial' ? 'Oficial' : 'Usuario'}
                    </Badge>
                    {item.esValidado ? (
                      <span className="text-green-600 text-xs">✅</span>
                    ) : (
                      <span className="text-orange-500 text-xs">⏳</span>
                    )}
                  </div>
                  <span className="font-medium">{formatPrice(item.precio)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}