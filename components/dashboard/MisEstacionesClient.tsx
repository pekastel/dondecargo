'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import StationCard from './StationCard'

interface EstacionDashboard {
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
  fechaCreacion: Date
  fechaActualizacion: Date
}

export default function MisEstacionesClient() {
  const router = useRouter()
  const [estaciones, setEstaciones] = useState<EstacionDashboard[]>([])
  const [tienePendientes, setTienePendientes] = useState(false)
  const [loading, setLoading] = useState(true)

  async function fetchEstaciones() {
    try {
      const response = await fetch('/api/estaciones/mis-estaciones')
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Debes iniciar sesión')
          router.push('/login')
          return
        }
        throw new Error('Error al cargar las estaciones')
      }

      const data = await response.json()
      setEstaciones(data.estaciones)
      setTienePendientes(data.tienePendientes)
    } catch (error) {
      console.error('Error fetching estaciones:', error)
      toast.error('Error al cargar tus estaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstaciones()
  }, [])

  const handlePrecioCreado = () => {
    fetchEstaciones()
    toast.success('Precio actualizado')
  }

  const handleEstacionEditada = () => {
    fetchEstaciones()
    toast.success('Estación actualizada')
  }

  // Calcular estadísticas
  const stats = {
    total: estaciones.length,
    aprobadas: estaciones.filter(e => e.estado === 'aprobado').length,
    pendientes: estaciones.filter(e => e.estado === 'pendiente').length,
    rechazadas: estaciones.filter(e => e.estado === 'rechazado').length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando tus estaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header con estadísticas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Mis Estaciones</h1>
          <Link href="/crear-estacion">
            <Button disabled={tienePendientes}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Estación
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card border rounded-lg">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <p className="text-sm text-muted-foreground">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.aprobadas}</p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="p-4 bg-card border rounded-lg">
            <p className="text-sm text-muted-foreground">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
          </div>
        </div>
      </div>

      {/* Banner de advertencia si tiene pendientes */}
      {tienePendientes && (
        <Alert variant="default" className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Estaciones pendientes de aprobación
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Tienes {stats.pendientes} estación(es) pendiente(s). No podrás crear nuevas estaciones 
            hasta que sean aprobadas o rechazadas. El proceso de moderación suele tomar 24-48 horas.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de estaciones */}
      {estaciones.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-lg text-muted-foreground mb-4">No tienes estaciones creadas aún</p>
          <Link href="/crear-estacion">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear mi primera estación
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {estaciones.map((estacion) => (
            <StationCard
              key={estacion.id}
              estacion={estacion}
              onPrecioCreado={handlePrecioCreado}
              onEstacionEditada={handleEstacionEditada}
            />
          ))}
        </div>
      )}
    </div>
  )
}

