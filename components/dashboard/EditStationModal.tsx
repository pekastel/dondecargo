'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

const editarEstacionSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  empresa: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  direccion: z.string().min(5, 'Mínimo 5 caracteres').max(300, 'Máximo 300 caracteres'),
  localidad: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  provincia: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  cuit: z.union([
    z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'Formato: XX-XXXXXXXX-X'),
    z.literal('')
  ]).optional(),
  telefono: z.string().optional(),
})

type FormData = z.infer<typeof editarEstacionSchema>

interface EditStationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  estacion: {
    id: string
    nombre: string
    empresa: string
    direccion: string
    localidad: string
    provincia: string
    datosAdicionales?: {
      telefono?: string
      horarios?: Record<string, string>
      servicios?: Record<string, boolean>
    }
  }
}

export default function EditStationModal({ open, onClose, onSuccess, estacion }: EditStationModalProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(editarEstacionSchema),
    defaultValues: {
      nombre: estacion.nombre,
      empresa: estacion.empresa,
      direccion: estacion.direccion,
      localidad: estacion.localidad,
      provincia: estacion.provincia,
      cuit: '',
      telefono: estacion.datosAdicionales?.telefono || '',
    },
  })

  // Reset form when estacion changes
  useEffect(() => {
    reset({
      nombre: estacion.nombre,
      empresa: estacion.empresa,
      direccion: estacion.direccion,
      localidad: estacion.localidad,
      provincia: estacion.provincia,
      cuit: '',
      telefono: estacion.datosAdicionales?.telefono || '',
    })
  }, [estacion, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/estaciones/${estacion.id}/editar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          empresa: data.empresa,
          direccion: data.direccion,
          localidad: data.localidad,
          provincia: data.provincia,
          cuit: data.cuit || '',
          datosAdicionales: {
            telefono: data.telefono || '',
            horarios: estacion.datosAdicionales?.horarios || {},
            servicios: estacion.datosAdicionales?.servicios || {},
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar la estación')
      }

      toast.success('Estación actualizada exitosamente')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error al actualizar estación:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar la estación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Estación</DialogTitle>
          <DialogDescription>
            Modifica los datos de tu estación de servicio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Estación *</Label>
            <Input
              id="nombre"
              placeholder="Ej: YPF Centro"
              {...register('nombre')}
            />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa/Bandera *</Label>
            <Input
              id="empresa"
              placeholder="Ej: YPF, Shell, Axion"
              {...register('empresa')}
            />
            {errors.empresa && (
              <p className="text-xs text-destructive">{errors.empresa.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input
              id="direccion"
              placeholder="Ej: Av. San Martín 1234"
              {...register('direccion')}
            />
            {errors.direccion && (
              <p className="text-xs text-destructive">{errors.direccion.message}</p>
            )}
          </div>

          {/* Localidad y Provincia */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="localidad">Localidad *</Label>
              <Input
                id="localidad"
                placeholder="Ej: Buenos Aires"
                {...register('localidad')}
              />
              {errors.localidad && (
                <p className="text-xs text-destructive">{errors.localidad.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia *</Label>
              <Input
                id="provincia"
                placeholder="Ej: Buenos Aires"
                {...register('provincia')}
              />
              {errors.provincia && (
                <p className="text-xs text-destructive">{errors.provincia.message}</p>
              )}
            </div>
          </div>

          {/* CUIT */}
          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT (Opcional)</Label>
            <Input
              id="cuit"
              placeholder="XX-XXXXXXXX-X"
              {...register('cuit')}
            />
            {errors.cuit && (
              <p className="text-xs text-destructive">{errors.cuit.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Formato: XX-XXXXXXXX-X
            </p>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono (Opcional)</Label>
            <Input
              id="telefono"
              placeholder="Ej: 11-5555-5555"
              {...register('telefono')}
            />
            {errors.telefono && (
              <p className="text-xs text-destructive">{errors.telefono.message}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

