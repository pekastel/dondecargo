'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
import { ArrowLeft, AlertCircle, CheckCircle2, Info, Lock } from 'lucide-react'
import { FuelType, FUEL_LABELS, HorarioType } from '@/lib/types'
import { StationFull } from '@/components/StationDetailClient'
import { authClient } from '@/lib/authClient'

interface PriceReportPageProps {
  station: StationFull
}

const priceReportSchema = z.object({
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().min(0.01, 'El precio debe ser mayor a 0').max(9999, 'El precio parece demasiado alto'),
  horario: z.enum(['diurno', 'nocturno', 'ambos']),
  notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
})

type PriceReportForm = z.infer<typeof priceReportSchema>

export function PriceReportPage({ station }: PriceReportPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const { data: session } = authClient.useSession()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PriceReportForm>({
    resolver: zodResolver(priceReportSchema),
    defaultValues: {
      tipoCombustible: 'nafta',
      horario: 'ambos',
    }
  })

  const selectedFuelType = watch('tipoCombustible')
  const currentPrice = station.precios.find(p => p.tipoCombustible === selectedFuelType)

  const onSubmit = async (data: PriceReportForm) => {
    if (!session?.user) {
      setSubmitError('Debes iniciar sesión para reportar precios')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/reportes-precios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          estacionId: station.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar el reporte')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        router.push(`/estacion/${station.id}`)
      }, 2000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error) {
      setSubmitError('Error al enviar el reporte. Por favor, intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">¡Gracias por tu reporte!</h2>
            <p className="text-gray-600">Redirigiendo a la estación...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Reportar Precio</h1>
              <p className="text-sm text-gray-600">Ayuda a mantener actualizados los precios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la estación */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h2 className="font-semibold text-lg mb-1">{station.nombre}</h2>
        <p className="text-sm text-gray-600">{station.direccion}</p>
        <p className="text-sm text-gray-600">
          {station.localidad}, {station.provincia}
        </p>
      </div>

      {/* Formulario de reporte */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Authentication Check */}
          {!session?.user && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-blue-100 p-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Iniciar sesión para reportar precios</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Necesitamos que te identifiques para dar validez a los reportes. Es rápido y gratuito.
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const qs = searchParams?.toString() ?? ''
                        const target = qs ? `${pathname}?${qs}` : pathname
                        router.push(`/login?callbackURL=${encodeURIComponent(target)}`)
                      }}
                    >
                      Iniciar sesión
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fuel Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="tipoCombustible">Tipo de combustible</Label>
            <Select 
              value={selectedFuelType} 
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
            {currentPrice && (
              <div className="text-sm p-3 rounded-md bg-green-50 text-green-700">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>
                    Precio actual en sistema: ${Number(currentPrice.precio).toFixed(2)}
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
                <RadioGroupItem value="ambos" id="ambos" />
                <Label htmlFor="ambos">Ambos</Label>
              </div>
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
              onClick={() => router.back()}
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
        </ul>
      </Card>
    </div>
  )
}