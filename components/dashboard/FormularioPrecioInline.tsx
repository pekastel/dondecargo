'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const precioSchema = z.object({
  tipoCombustible: z.enum(['nafta', 'nafta_premium', 'gasoil', 'gasoil_premium', 'gnc']),
  precio: z.number().positive('El precio debe ser mayor a 0').max(10000, 'Precio máximo: $10,000'),
  horario: z.enum(['diurno', 'nocturno']),
})

type FormData = z.infer<typeof precioSchema>

interface FormularioPrecioInlineProps {
  estacionId: string
  onSuccess: () => void
  onCancel: () => void
}

const TIPOS_COMBUSTIBLE = [
  { value: 'nafta', label: 'Nafta' },
  { value: 'nafta_premium', label: 'Nafta Premium' },
  { value: 'gasoil', label: 'Diesel' },
  { value: 'gasoil_premium', label: 'Diesel Premium' },
  { value: 'gnc', label: 'GNC' },
]

export default function FormularioPrecioInline({ estacionId, onSuccess, onCancel }: FormularioPrecioInlineProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [selectedHorario, setSelectedHorario] = useState<string>('diurno')

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(precioSchema),
    defaultValues: {
      horario: 'diurno',
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/precios/crear-rapido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estacionId,
          ...data,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cargar el precio')
      }

      toast.success('Precio cargado exitosamente')
      onSuccess()
    } catch (error) {
      console.error('Error al cargar precio:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar el precio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t pt-4 mt-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h4 className="font-medium text-sm mb-3">Cargar Nuevo Precio</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tipo de Combustible */}
          <div className="space-y-2">
            <Label htmlFor="tipoCombustible">Tipo de Combustible *</Label>
            <Select 
              value={selectedTipo}
              onValueChange={(value) => {
                setSelectedTipo(value)
                setValue('tipoCombustible', value as any)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_COMBUSTIBLE.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipoCombustible && (
              <p className="text-xs text-destructive">{errors.tipoCombustible.message}</p>
            )}
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <Label htmlFor="precio">Precio ($/litro) *</Label>
            <Input
              id="precio"
              type="number"
              step="0.01"
              placeholder="850.50"
              {...register('precio', { valueAsNumber: true })}
            />
            {errors.precio && (
              <p className="text-xs text-destructive">{errors.precio.message}</p>
            )}
          </div>

          {/* Horario */}
          <div className="space-y-2">
            <Label htmlFor="horario">Horario *</Label>
            <Select 
              value={selectedHorario}
              onValueChange={(value) => {
                setSelectedHorario(value)
                setValue('horario', value as any)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diurno">Diurno</SelectItem>
                <SelectItem value="nocturno">Nocturno</SelectItem>
              </SelectContent>
            </Select>
            {errors.horario && (
              <p className="text-xs text-destructive">{errors.horario.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Guardando...' : 'Guardar Precio'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

