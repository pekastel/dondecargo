'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, MapPin, Building2, Phone, Clock, Check, X, ExternalLink, Pencil, Trash2, Map, RefreshCw } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'

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

interface EstacionUsuario extends EstacionPendiente {
  estado: 'pendiente' | 'aprobado' | 'rechazado'
}

export default function EstacionesPendientesClient() {
  const [loading, setLoading] = useState(true)
  const [estaciones, setEstaciones] = useState<EstacionPendiente[]>([])
  const [estacionesUsuarios, setEstacionesUsuarios] = useState<EstacionUsuario[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [selectedEstacion, setSelectedEstacion] = useState<EstacionPendiente | EstacionUsuario | null>(null)
  const [action, setAction] = useState<'aprobar' | 'rechazar' | null>(null)
  const [reason, setReason] = useState('')
  const [moderating, setModerating] = useState(false)
  const [activeTab, setActiveTab] = useState('pendientes')
  const [refreshing, setRefreshing] = useState(false)
  
  // Estados para edición
  const [estacionToEdit, setEstacionToEdit] = useState<EstacionUsuario | null>(null)
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    empresa: '',
    direccion: '',
    localidad: '',
    provincia: '',
    telefono: '',
  })
  const [editing, setEditing] = useState(false)
  
  // Estados para eliminación
  const [estacionToDelete, setEstacionToDelete] = useState<EstacionUsuario | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchEstacionesPendientes()
  }, [])

  useEffect(() => {
    if (activeTab === 'usuarios' && estacionesUsuarios.length === 0) {
      fetchEstacionesUsuarios()
    }
  }, [activeTab])

  async function fetchEstacionesPendientes(silent = false) {
    try {
      if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
    }
  }

  async function fetchEstacionesUsuarios(silent = false) {
    if (!silent) setLoadingUsuarios(true)
    try {
      const response = await fetch('/api/estaciones/usuarios')
      
      if (!response.ok) {
        throw new Error('Error al cargar estaciones de usuarios')
      }

      const data = await response.json()
      setEstacionesUsuarios(data.data || [])
    } catch (error) {
      console.error('Error fetching user stations:', error)
      toast.error('Error al cargar estaciones de usuarios')
    } finally {
      if (!silent) setLoadingUsuarios(false)
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
          reason: reason.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al moderar estación')
      }

      toast.success(
        action === 'aprobar' 
          ? 'Estación aprobada exitosamente' 
          : 'Estación rechazada exitosamente'
      )

      // Actualizar listas según corresponda
      if (activeTab === 'pendientes') {
        setEstaciones(estaciones.filter(e => e.id !== selectedEstacion.id))
      } else if (activeTab === 'usuarios') {
        // Recargar lista de estaciones de usuarios para reflejar el cambio de estado
        await fetchEstacionesUsuarios()
      }
      
      // Cerrar diálogo
      setSelectedEstacion(null)
      setAction(null)
      setReason('')
    } catch (error) {
      console.error('Error moderating station:', error)
      toast.error(error instanceof Error ? error.message : 'Error al moderar estación')
    } finally {
      setModerating(false)
    }
  }

  function openModerateDialog(estacion: EstacionPendiente | EstacionUsuario, moderateAction: 'aprobar' | 'rechazar') {
    setSelectedEstacion(estacion)
    setAction(moderateAction)
    setReason('')
  }

  function openEditDialog(estacion: EstacionUsuario) {
    setEstacionToEdit(estacion)
    setEditFormData({
      nombre: estacion.nombre,
      empresa: estacion.empresa,
      direccion: estacion.direccion,
      localidad: estacion.localidad,
      provincia: estacion.provincia,
      telefono: estacion.datosAdicionales?.telefono || '',
    })
  }

  async function handleEdit() {
    if (!estacionToEdit) return

    setEditing(true)
    try {
      const response = await fetch(`/api/estaciones/${estacionToEdit.id}/editar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: editFormData.nombre,
          empresa: editFormData.empresa,
          direccion: editFormData.direccion,
          localidad: editFormData.localidad,
          provincia: editFormData.provincia,
          datosAdicionales: {
            telefono: editFormData.telefono || undefined,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al editar estación')
      }

      toast.success('Estación actualizada exitosamente')
      
      // Actualizar lista
      await fetchEstacionesUsuarios()
      
      // Cerrar diálogo
      setEstacionToEdit(null)
    } catch (error) {
      console.error('Error editing station:', error)
      toast.error(error instanceof Error ? error.message : 'Error al editar estación')
    } finally {
      setEditing(false)
    }
  }

  function openDeleteDialog(estacion: EstacionUsuario) {
    setEstacionToDelete(estacion)
  }

  async function handleDelete() {
    if (!estacionToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/estaciones/${estacionToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar estación')
      }

      toast.success('Estación eliminada exitosamente')
      
      // Actualizar lista
      setEstacionesUsuarios(estacionesUsuarios.filter(e => e.id !== estacionToDelete.id))
      
      // Cerrar diálogo
      setEstacionToDelete(null)
    } catch (error) {
      console.error('Error deleting station:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar estación')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      if (activeTab === 'pendientes') {
        await fetchEstacionesPendientes(true)
      } else {
        await fetchEstacionesUsuarios(true)
      }
      toast.success('Datos actualizados correctamente')
    } catch (error) {
      console.error('Error refreshing:', error)
      toast.error('Error al actualizar los datos')
    } finally {
      setRefreshing(false)
    }
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'aprobado':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Aprobado</Badge>
      case 'rechazado':
        return <Badge variant="destructive">Rechazado</Badge>
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administración de Estaciones</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona estaciones pendientes y creadas por usuarios
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading || loadingUsuarios}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pendientes">
            Pendientes ({estaciones.length})
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            Estaciones de Usuarios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-6">
          {estaciones.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-xl font-medium text-muted-foreground">
                  No hay estaciones pendientes de moderación
                </p>
              </CardContent>
            </Card>
          ) : (
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

                      <div className="flex flex-col gap-2">
                        {estacion.googleMapsUrl && (
                          <a
                            href={estacion.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver en Google Maps
                          </a>
                        )}
                        <a
                          href={`/buscar?lat=${estacion.latitud}&lng=${estacion.longitud}&radius=2`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                        >
                          <Map className="h-4 w-4" />
                          Ver en Mapa DondeCargo
                        </a>
                      </div>

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
          )}
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          {loadingUsuarios ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : estacionesUsuarios.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-medium text-muted-foreground">
                  No hay estaciones creadas por usuarios
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-muted-foreground">
                {estacionesUsuarios.length} {estacionesUsuarios.length === 1 ? 'estación encontrada' : 'estaciones encontradas'}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {estacionesUsuarios.map((estacion) => (
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
                        {getEstadoBadge(estacion.estado)}
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

                        <div className="flex flex-col gap-2">
                          {estacion.googleMapsUrl && (
                            <a
                              href={estacion.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline text-sm"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver en Google Maps
                            </a>
                          )}
                          <a
                            href={`/buscar?lat=${estacion.latitud}&lng=${estacion.longitud}&radius=2`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                          >
                            <Map className="h-4 w-4" />
                            Ver en Mapa DondeCargo
                          </a>
                        </div>

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

                        <div className="flex flex-col gap-2 pt-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openEditDialog(estacion)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => openDeleteDialog(estacion)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                          {estacion.estado === 'aprobado' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              onClick={() => openModerateDialog(estacion, 'rechazar')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rechazar Estación
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para moderación */}
      <Dialog open={!!selectedEstacion} onOpenChange={(open) => !open && setSelectedEstacion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'aprobar' ? 'Aprobar' : 'Rechazar'} Estación
            </DialogTitle>
            <DialogDescription>
              {action === 'aprobar'
                ? '¿Estás seguro de que deseas aprobar esta estación? Será visible para todos los usuarios.'
                : (selectedEstacion && 'estado' in selectedEstacion && selectedEstacion.estado === 'aprobado')
                  ? '¿Estás seguro de que deseas rechazar esta estación aprobada? Dejará de ser visible para los usuarios.'
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
                  <Label htmlFor="reason">
                    Motivo del rechazo {('estado' in selectedEstacion && selectedEstacion.estado === 'aprobado') ? '(recomendado)' : '(opcional)'}
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      ('estado' in selectedEstacion && selectedEstacion.estado === 'aprobado')
                        ? "Explica por qué se rechaza esta estación aprobada. El usuario recibirá esta explicación..."
                        : "Explica por qué se rechaza esta estación..."
                    }
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

      {/* Diálogo de edición de estación */}
      <Dialog open={!!estacionToEdit} onOpenChange={(open) => !open && setEstacionToEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Estación</DialogTitle>
            <DialogDescription>
              Modifica los datos de la estación. Los cambios se guardarán inmediatamente.
            </DialogDescription>
          </DialogHeader>

          {estacionToEdit && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">Nombre de la estación *</Label>
                  <Input
                    id="edit-nombre"
                    value={editFormData.nombre}
                    onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                    placeholder="Ej: YPF Centro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-empresa">Empresa *</Label>
                  <Input
                    id="edit-empresa"
                    value={editFormData.empresa}
                    onChange={(e) => setEditFormData({ ...editFormData, empresa: e.target.value })}
                    placeholder="Ej: YPF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-direccion">Dirección *</Label>
                  <Input
                    id="edit-direccion"
                    value={editFormData.direccion}
                    onChange={(e) => setEditFormData({ ...editFormData, direccion: e.target.value })}
                    placeholder="Ej: Av. San Martín 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-localidad">Localidad *</Label>
                    <Input
                      id="edit-localidad"
                      value={editFormData.localidad}
                      onChange={(e) => setEditFormData({ ...editFormData, localidad: e.target.value })}
                      placeholder="Ej: Córdoba"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-provincia">Provincia *</Label>
                    <Input
                      id="edit-provincia"
                      value={editFormData.provincia}
                      onChange={(e) => setEditFormData({ ...editFormData, provincia: e.target.value })}
                      placeholder="Ej: Córdoba"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-telefono">Teléfono</Label>
                  <Input
                    id="edit-telefono"
                    value={editFormData.telefono}
                    onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                    placeholder="Ej: 351-1234567"
                  />
                </div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground">
                * Campos obligatorios
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEstacionToEdit(null)}
              disabled={editing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editing || !editFormData.nombre || !editFormData.empresa || !editFormData.direccion || !editFormData.localidad || !editFormData.provincia}
            >
              {editing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={!!estacionToDelete} onOpenChange={(open) => !open && setEstacionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar Estación
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong>permanente</strong> y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {estacionToDelete && (
            <div className="py-4">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
                <p className="font-medium text-red-900 dark:text-red-100">
                  {estacionToDelete.nombre}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {estacionToDelete.direccion}, {estacionToDelete.localidad}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Empresa: {estacionToDelete.empresa}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Al eliminar esta estación:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Se eliminarán todos los precios asociados</li>
                  <li>Se eliminarán los datos adicionales</li>
                  <li>Se eliminará el historial de precios</li>
                  <li>La estación no será visible para los usuarios</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEstacionToDelete(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar definitivamente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

