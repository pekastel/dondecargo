'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { FuelType, FUEL_LABELS, HorarioType } from '@/lib/types'
import { StationFull } from '@/components/StationDetailClient'
import { authClient } from '@/lib/authClient'

interface PriceReportPageProps {
  station: StationFull
}

const priceReportSchema = z.object({
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().min(0.01, 'El precio debe ser mayor a 0').max(9999, 'El precio parece demasiado alto'),
  horario: z.enum(['diurno', 'nocturno']),
  notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
})

type PriceReportForm = z.infer<typeof priceReportSchema>

export function PriceReportPage({ station }: PriceReportPageProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const { data: session, isLoading: isSessionLoading } = authClient.useSession()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PriceReportForm>({
    resolver: zodResolver(priceReportSchema),
    defaultValues: {
      horario: 'diurno',
      tipoCombustible: 'nafta'
    }
  })

  const selectedFuel = watch('tipoCombustible')
  const selectedPrice = watch('precio')
  
  // Get current price for comparison
  const currentPrice = station.precios.find(p => 
    p.tipoCombustible === selectedFuel && p.horario === watch('horario')
  )

  const onSubmit = async (data: PriceReportForm) => {
    if (!session?.user) {
      setSubmitError('Debes iniciar sesión para reportar precios')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/reportes-precios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estacionId: station.id,
          tipoCombustible: data.tipoCombustible,
          precio: data.precio,
          horario: data.horario,
          notas: data.notas || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al procesar el reporte')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        router.push(`/estacion/${station.id}?reported=true`)
      }, 2000)

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriceDifference = () => {
    if (!currentPrice || !selectedPrice) return null
    
    const currentPriceValue = Number(currentPrice.precio)
    const difference = selectedPrice - currentPriceValue
    const percentage = (difference / currentPriceValue) * 100
    
    return { difference, percentage }
  }

  const priceDiff = getPriceDifference()

  const goBack = () => {
    router.back()
  }

  // Show loading state while checking authentication
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Reporte enviado!</h1>
          <p className="text-muted-foreground mb-4">
            Tu reporte de precio ha sido enviado exitosamente. Será validado por otros usuarios de la comunidad.
          </p>
          <Button onClick={() => router.push(`/estacion/${station.id}`)} className="w-full">
            Ver Estación
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Reportar Precio</h1>
              <p className="text-sm text-muted-foreground">{station.nombre}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4">
        <Card className="mt-6">
          {/* Station Info */}
          <div className="p-6 border-b bg-muted/20">
            <div className="font-medium text-lg">{station.nombre}</div>
            <div className="text-sm text-muted-foreground">{station.empresa}</div>
            <div className="text-sm text-muted-foreground mt-1">{station.direccion}</div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Authentication Check */}
            {!session?.user && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Debes <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={() => router.push('/login')}
                  >
                    iniciar sesión
                  </Button> para reportar precios.
                </AlertDescription>
              </Alert>
            )}

            {/* Fuel Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="tipoCombustible">Tipo de combustible</Label>
              <Select 
                value={selectedFuel} 
                onValueChange={(value: FuelType) => setValue('tipoCombustible', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
                    <SelectItem key={fuel} value={fuel}>
                      <div className="flex items-center gap-2">
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipoCombustible && (
                <p className="text-sm text-red-600">{errors.tipoCombustible.message}</p>
              )}
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <Label htmlFor="precio">Precio actual (por litro)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  placeholder="890.50"
                  className="pl-8"
                  {...register('precio', { valueAsNumber: true })}
                />
              </div>
              {errors.precio && (
                <p className="text-sm text-red-600">{errors.precio.message}</p>
              )}
              
              {/* Price Comparison */}
              {currentPrice && selectedPrice && priceDiff && (
                <div className={`text-sm p-3 rounded-md ${
                  Math.abs(priceDiff.difference) < 1 
                    ? 'bg-green-50 text-green-700' 
                    : Math.abs(priceDiff.difference) < 10
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>
                      Precio actual en sistema: ${Number(currentPrice.precio).toFixed(2)}
                      {priceDiff.difference !== 0 && (
                        <span className="ml-2 font-semibold">
                          ({priceDiff.difference > 0 ? '+' : ''}${priceDiff.difference.toFixed(2)}, {priceDiff.percentage > 0 ? '+' : ''}{priceDiff.percentage.toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Time of Day */}
            <div className="space-y-3">
              <Label>Horario observado</Label>
              <RadioGroup
                value={watch('horario')}
                onValueChange={(value: HorarioType) => setValue('horario', value)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="diurno" id="diurno" />
                  <Label htmlFor="diurno">Diurno</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nocturno" id="nocturno" />
                  <Label htmlFor="nocturno">Nocturno</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas adicionales (opcional)</Label>
              <Textarea
                id="notas"
                placeholder="Ej: Precio visto en el cartel principal a las 14:30"
                maxLength={500}
                {...register('notas')}
                rows={3}
              />
              {errors.notas && (
                <p className="text-sm text-red-600">{errors.notas.message}</p>
              )}
            </div>

            {/* User Info */}
            {session?.user && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    {session.user.name || 'Usuario registrado'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Este precio será visible inmediatamente y otros usuarios podrán confirmarlo para validarlo.
                </p>
              </div>
            )}

            {/* Error Display */}
            {submitError && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {submitError}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={goBack}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !session?.user}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Reportar Precio'
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Additional Info */}
        <Card className="mt-4 p-4">
          <h3 className="font-medium mb-2">Como funciona el sistema de reportes</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Los precios reportados son visibles inmediatamente</li>
            <li>• Otros usuarios pueden confirmar tu precio para validarlo</li>
            <li>• Los precios más confirmados tienen mayor peso en el sistema</li>
            <li>• Solo se pueden reportar precios oficiales y del sitio de la estación</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}