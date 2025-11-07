'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, DollarSign, Edit, Clock, Phone, Navigation, Send } from 'lucide-react'
import FormularioPrecioInline from './FormularioPrecioInline'
import EditStationModal from './EditStationModal'
import Link from 'next/link'
import { toast } from 'sonner'

interface EstacionProps {
  id: string
  nombre: string
  empresa: string
  direccion: string
  localidad: string
  provincia: string
  latitud: number
  longitud: number
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  googleMapsUrl: string
  datosAdicionales?: {
    telefono?: string
    horarios?: Record<string, string>
    servicios?: Record<string, boolean>
  }
  preciosActuales?: Array<{
    tipoCombustible: string
    precio: number
    horario: 'diurno' | 'nocturno'
    fechaVigencia: Date
  }>
  ultimaModeracion?: {
    accion: 'aprobar' | 'rechazar'
    motivo: string | null
    fechaModeracion: Date
  } | null
  fechaCreacion: Date
}

interface StationCardProps {
  estacion: EstacionProps
  onPrecioCreado: () => void
  onEstacionEditada: () => void
}

const ESTADO_CONFIG = {
  aprobado: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    label: 'Aprobada',
    icon: '🟢',
  },
  pendiente: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    label: 'Pendiente',
    icon: '🟡',
  },
  rechazado: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    label: 'Rechazada',
    icon: '🔴',
  },
}

const COMBUSTIBLE_LABELS: Record<string, string> = {
  nafta: 'Nafta',
  nafta_premium: 'Nafta Premium',
  gasoil: 'Diesel',
  gasoil_premium: 'Diesel Premium',
  gnc: 'GNC',
}

export default function StationCard({ estacion, onPrecioCreado, onEstacionEditada }: StationCardProps) {
  const [mostrarFormPrecio, setMostrarFormPrecio] = useState(false)
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const estadoConfig = ESTADO_CONFIG[estacion.estado]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(price)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{estacion.nombre}</h3>
              <Badge className={estadoConfig.color}>
                {estadoConfig.icon} {estadoConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{estacion.empresa}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dirección */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div>
            <p>{estacion.direccion}</p>
            <p className="text-muted-foreground">
              {estacion.localidad}, {estacion.provincia}
            </p>
          </div>
        </div>

        {/* Teléfono y horarios si existen */}
        {(estacion.datosAdicionales?.telefono || estacion.datosAdicionales?.horarios) && (
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            {estacion.datosAdicionales.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{estacion.datosAdicionales.telefono}</span>
              </div>
            )}
            {estacion.datosAdicionales.horarios && Object.keys(estacion.datosAdicionales.horarios).length > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Horarios disponibles</span>
              </div>
            )}
          </div>
        )}

        {/* Precios actuales solo si está aprobada */}
        {estacion.estado === 'aprobado' && (
          <>
            {estacion.preciosActuales && estacion.preciosActuales.length > 0 ? (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Precios Actuales
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {estacion.preciosActuales.map((precio, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {COMBUSTIBLE_LABELS[precio.tipoCombustible]}
                        {precio.horario === 'nocturno' && ' (Noche)'}
                      </p>
                      <p className="text-lg font-bold">{formatPrice(precio.precio)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground italic">
                  No hay precios cargados aún
                </p>
              </div>
            )}
          </>
        )}

        {/* Estado pendiente o rechazado */}
        {estacion.estado === 'pendiente' && (
          <div className="border-t pt-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En revisión por moderadores
            </p>
          </div>
        )}

        {estacion.estado === 'rechazado' && (
          <div className="border-t pt-4 space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Esta estación fue rechazada durante la moderación
              </p>
              {estacion.ultimaModeracion?.motivo && (
                <div className="mt-2 p-3 bg-white dark:bg-red-900/50 rounded border border-red-200 dark:border-red-700">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                    Motivo del rechazo:
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {estacion.ultimaModeracion.motivo}
                  </p>
                </div>
              )}
            </div>
            <Button 
              variant="default" 
              size="sm"
              className="w-full"
              onClick={async () => {
                if (!confirm('¿Ya corregiste los datos de la estación y deseas re-enviarla para moderación?')) {
                  return
                }
                
                setReenviando(true)
                try {
                  const response = await fetch(`/api/estaciones/${estacion.id}/reenviar`, {
                    method: 'PATCH',
                  })
                  
                  if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Error al re-enviar')
                  }
                  
                  toast.success('Estación re-enviada para moderación')
                  onEstacionEditada() // Refrescar lista
                } catch (error) {
                  console.error('Error al re-enviar:', error)
                  toast.error(error instanceof Error ? error.message : 'Error al re-enviar')
                } finally {
                  setReenviando(false)
                }
              }}
              disabled={reenviando}
            >
              {reenviando ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Re-enviar para Moderación
                </>
              )}
            </Button>
          </div>
        )}

        {/* Formulario inline de precios */}
        {mostrarFormPrecio && estacion.estado === 'aprobado' && (
          <FormularioPrecioInline
            estacionId={estacion.id}
            onSuccess={() => {
              setMostrarFormPrecio(false)
              onPrecioCreado()
            }}
            onCancel={() => setMostrarFormPrecio(false)}
          />
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-2">
          {estacion.estado === 'aprobado' && (
            <Button
              variant={mostrarFormPrecio ? 'secondary' : 'default'}
              size="sm"
              onClick={() => setMostrarFormPrecio(!mostrarFormPrecio)}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              {mostrarFormPrecio ? 'Cancelar' : 'Cargar Precio'}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setMostrarModalEdicion(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar Datos
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/buscar?lat=${estacion.latitud}&lng=${estacion.longitud}&zoom=16&station=${estacion.id}`}>
              <Navigation className="h-4 w-4 mr-1" />
              Ver en mapa
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={estacion.googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4 mr-1" />
              Google Maps
            </a>
          </Button>
        </div>

        {/* Modal de edición */}
        <EditStationModal
          open={mostrarModalEdicion}
          onClose={() => setMostrarModalEdicion(false)}
          onSuccess={() => {
            setMostrarModalEdicion(false)
            onEstacionEditada()
          }}
          estacion={estacion}
        />
      </CardContent>
    </Card>
  )
}

