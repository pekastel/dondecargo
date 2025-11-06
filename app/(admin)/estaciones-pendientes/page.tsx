'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/authClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, MapPin, Building2, Phone, Clock, Check, X, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface EstacionPendiente {
  id: string
  nombre: string
  empresa: string
  direccion: string
  localidad: string
  provincia: string
  latitud: number
  longitud: number
  googleMapsUrl: string | null
  fechaCreacion: string
  usuarioCreador: {
    id: string
    name: string
    email: string
  } | null
  datosAdicionales?: {
    telefono?: string
    horarios?: Record<string, string>
    servicios?: {
      tienda?: boolean
      banios?: boolean
      lavadero?: boolean
      wifi?: boolean
      restaurante?: boolean
      estacionamiento?: boolean
    }
  }
}

export default function EstacionesPendientesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [estaciones, setEstaciones] = useState<EstacionPendiente[]>([])
  const [selectedEstacion, setSelectedEstacion] = useState<EstacionPendiente | null>(null)
  const [action, setAction] = useState<'aprobar' | 'rechazar' | null>(null)
  const [motivo, setMotivo] = useState('')
  const [moderating, setModerating] = useState(false)

  useEffect(() => {
    fetchEstacionesPendientes()
  }, [])

  async function fetchEstacionesPendientes() {
    try {
      const session = await authClient.getSession()
      
      if (!session?.user || session.user.role !== 'admin') {
        toast.error('No tienes permisos para acceder a esta página')
        router.push('/')
        return
      }

      const response = await fetch('/api/estaciones/pendientes')
      
      if (!response.ok) {
        throw new Error('Error al cargar estaciones pendientes')
      }

      const data = await response.json()
      setEstaciones(data.data || [])
    } catch (error) {
      console.error('Error fetching pending stations:', error)
      toast.error('Error al cargar estaciones pendientes')
    } finally {
      setLoading(false)
    }
  }

  async function handleModerate() {
    if (!selectedEstacion || !action) return

    setModerating(true)
    
    try {
      const response = await fetch(`/api/estaciones/${selectedEstacion.id}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          motivo: motivo.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al moderar estación')
      }

      toast.success(
        action === 'aprobar' 
          ? 'Estación aprobada exitosamente' 
          : 'Estación rechazada'
      )

      // Actualizar lista
      setEstaciones(estaciones.filter(e => e.id !== selectedEstacion.id))
      
      // Cerrar diálogo
      setSelectedEstacion(null)
      setAction(null)
      setMotivo('')
    } catch (error) {
      console.error('Error moderating station:', error)
      toast.error(error instanceof Error ? error.message : 'Error al moderar estación')
    } finally {
      setModerating(false)
    }
  }

  function openModerateDialog(estacion: EstacionPendiente, moderateAction: 'aprobar' | 'rechazar') {
    setSelectedEstacion(estacion)
    setAction(moderateAction)
    setMotivo('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (estaciones.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Estaciones Pendientes de Aprobación</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Check className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-xl font-medium text-muted-foreground">
              No hay estaciones pendientes de moderación
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Estaciones Pendientes de Aprobación</h1>
        <p className="text-muted-foreground mt-2">
          {estaciones.length} {estaciones.length === 1 ? 'estación pendiente' : 'estaciones pendientes'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {estaciones.map((estacion) => (
          <Card key={estacion.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{estacion.nombre}</CardTitle>
                  <CardDescription className="mt-1">
                    <Building2 className="inline h-3 w-3 mr-1" />
                    {estacion.empresa}
                  </CardDescription>
                </div>
                <Badge variant="secondary">Pendiente</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {estacion.direccion}, {estacion.localidad}, {estacion.provincia}
                  </span>
                </div>

                {estacion.datosAdicionales?.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {estacion.datosAdicionales.telefono}
                    </span>
                  </div>
                )}

                {estacion.datosAdicionales?.horarios && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground text-xs">
                      Horarios disponibles
                    </span>
                  </div>
                )}

                {estacion.googleMapsUrl && (
                  <a
                    href={estacion.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver en Google Maps
                  </a>
                )}

                {estacion.usuarioCreador && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Creada por: <strong>{estacion.usuarioCreador.name}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {estacion.usuarioCreador.email}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => openModerateDialog(estacion, 'aprobar')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => openModerateDialog(estacion, 'rechazar')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={!!selectedEstacion} onOpenChange={(open) => !open && setSelectedEstacion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'aprobar' ? 'Aprobar' : 'Rechazar'} Estación
            </DialogTitle>
            <DialogDescription>
              {action === 'aprobar'
                ? '¿Estás seguro de que deseas aprobar esta estación? Será visible para todos los usuarios.'
                : '¿Estás seguro de que deseas rechazar esta estación?'}
            </DialogDescription>
          </DialogHeader>

          {selectedEstacion && (
            <div className="py-4">
              <p className="font-medium">{selectedEstacion.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {selectedEstacion.direccion}, {selectedEstacion.localidad}
              </p>

              {action === 'rechazar' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="motivo">Motivo del rechazo (opcional)</Label>
                  <Textarea
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Explica por qué se rechaza esta estación..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedEstacion(null)}
              disabled={moderating}
            >
              Cancelar
            </Button>
            <Button
              variant={action === 'aprobar' ? 'default' : 'destructive'}
              onClick={handleModerate}
              disabled={moderating}
            >
              {moderating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {action === 'aprobar' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Aprobar
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Rechazar
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

