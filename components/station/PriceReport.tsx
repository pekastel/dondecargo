'use client'

import { useState } from 'react'
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
import { X, Upload, Camera, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { FuelType, FUEL_LABELS, HorarioType } from '@/lib/types'
import { StationFull } from '@/components/StationDetailClient'
import { authClient } from '@/lib/authClient'

interface PriceReportProps {
  station: StationFull
  onClose: () => void
  onSuccess: () => void
}

const priceReportSchema = z.object({
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().min(0.01, 'El precio debe ser mayor a 0').max(9999, 'El precio parece demasiado alto'),
  horario: z.enum(['diurno', 'nocturno']),
  notas: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
  evidencia: z.any().optional()
})

type PriceReportForm = z.infer<typeof priceReportSchema>

export function PriceReport({ station, onClose, onSuccess }: PriceReportProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setSubmitError('Solo se permiten archivos de imagen')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setSubmitError('El archivo no puede ser mayor a 5MB')
        return
      }
      setEvidenceFile(file)
      setSubmitError(null)
    }
  }

  const removeEvidence = () => {
    setEvidenceFile(null)
  }

  const onSubmit = async (data: PriceReportForm) => {
    if (!session?.user) {
      setSubmitError('Debes iniciar sesión para reportar precios')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // TODO: Replace with actual API call
      const formData = new FormData()
      formData.append('estacionId', station.id)
      formData.append('tipoCombustible', data.tipoCombustible)
      formData.append('precio', data.precio.toString())
      formData.append('horario', data.horario)
      if (data.notas) {
        formData.append('notas', data.notas)
      }
      if (evidenceFile) {
        formData.append('evidencia', evidenceFile)
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock success
      if (Math.random() > 0.1) { // 90% success rate
        setSubmitSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        throw new Error('Error al procesar el reporte. Intenta nuevamente.')
      }

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriceDifference = () => {
    if (!currentPrice || !selectedPrice) return null
    
    const difference = selectedPrice - currentPrice.precio
    const percentage = (difference / currentPrice.precio) * 100
    
    return { difference, percentage }
  }

  const priceDiff = getPriceDifference()

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">¡Reporte enviado!</h3>
          <p className="text-muted-foreground mb-4">
            Tu reporte de precio ha sido enviado exitosamente. Será revisado y publicado una vez validado.
          </p>
          <Button onClick={onClose} className="w-full">
            Continuar
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-4000 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">💰 Reportar Precio</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
          {/* Station Info */}
          <div className="p-3 rounded-lg bg-muted/20">
            <div className="font-medium">🏪 {station.nombre}</div>
            <div className="text-sm text-muted-foreground">{station.direccion}</div>
          </div>

          {/* Authentication Check */}
          {!session?.user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Debes <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = '/login'}>
                  iniciar sesión
                </Button> para reportar precios.
              </AlertDescription>
            </Alert>
          )}

          {/* Fuel Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="tipoCombustible">⛽ Tipo de combustible</Label>
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
            <Label htmlFor="precio">💰 Precio actual (por litro)</Label>
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
              <div className={`text-sm p-2 rounded ${
                Math.abs(priceDiff.difference) < 1 
                  ? 'bg-green-50 text-green-700' 
                  : Math.abs(priceDiff.difference) < 10
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-red-50 text-red-700'
              }`}>
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>
                    Precio actual: ${currentPrice.precio.toFixed(2)}
                    {priceDiff.difference !== 0 && (
                      <span className="ml-2">
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
            <Label>🕐 Horario observado</Label>
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

          {/* Evidence Upload */}
          <div className="space-y-2">
            <Label>📸 Evidencia (opcional)</Label>
            <div className="space-y-2">
              {!evidenceFile ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Subir foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement camera capture
                      alert('Función de cámara no implementada aún')
                    }}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Tomar foto
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      📸
                    </div>
                    <span className="text-sm">{evidenceFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeEvidence}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notas">📝 Notas adicionales (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Ej: Precio visto en el cartel principal a las 14:30"
              maxLength={500}
              {...register('notas')}
            />
            {errors.notas && (
              <p className="text-sm text-red-600">{errors.notas.message}</p>
            )}
          </div>

          {/* User Info */}
          {session?.user && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary">
                  {session.user.name || 'Usuario registrado'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                💡 Este precio será revisado antes de publicarse. Los usuarios verificados tienen mayor peso en la validación.
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
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
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
                '✅ Reportar'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}