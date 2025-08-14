'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Edit2, Trash2, Save, X } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { authClient } from '@/lib/authClient'
import { toast } from 'sonner'
import { Comentario } from '@/drizzle/schema'

interface ComentarioWithUser extends Comentario {
  usuario: {
    id: string
    name: string | null
    image: string | null
  }
}

interface StationCommentsProps {
  estacionId: string
}

export function StationComments({ estacionId }: StationCommentsProps) {
  const [comentarios, setComentarios] = useState<ComentarioWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [editingText, setEditingText] = useState('')
  const { data: session } = authClient.useSession()

  const fetchComentarios = async () => {
    try {
      const response = await fetch(`/api/comentarios?estacionId=${estacionId}`)
      if (response.ok) {
        const data = await response.json()
        setComentarios(data)
      }
    } catch (error) {
      console.error('Error fetching comentarios:', error)
      toast.error('Error al cargar comentarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComentarios()
  }, [estacionId])

  const handleSubmitComentario = async () => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para comentar')
      return
    }

    if (!nuevoComentario.trim()) {
      toast.error('El comentario no puede estar vacío')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estacionId,
          comentario: nuevoComentario.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar comentario')
      }

      setNuevoComentario('')
      setShowForm(false)
      toast.success('Comentario agregado correctamente')
      await fetchComentarios()
    } catch (error) {
      console.error('Error submitting comentario:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar comentario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComentario = async (comentarioId: string) => {
    if (!editingText.trim()) {
      toast.error('El comentario no puede estar vacío')
      return
    }

    try {
      const response = await fetch(`/api/comentarios/${comentarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comentario: editingText.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar comentario')
      }

      setEditing(null)
      setEditingText('')
      toast.success('Comentario actualizado correctamente')
      await fetchComentarios()
    } catch (error) {
      console.error('Error updating comentario:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar comentario')
    }
  }

  const handleDeleteComentario = async (comentarioId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return
    }

    try {
      const response = await fetch(`/api/comentarios/${comentarioId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar comentario')
      }

      toast.success('Comentario eliminado correctamente')
      await fetchComentarios()
    } catch (error) {
      console.error('Error deleting comentario:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar comentario')
    }
  }

  // Normaliza entradas tipo Date o string ISO a un objeto Date
  const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d))

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const d = toDate(date)
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace menos de 1 hora'
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
    
    return d.toLocaleDateString('es-AR')
  }

  const userComment = comentarios.find(c => c.usuarioId === session?.user?.id)

  if (loading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Comentarios
          {comentarios.length > 0 && (
            <span className="text-sm text-muted-foreground">({comentarios.length})</span>
          )}
        </h2>
        
        {session?.user && !userComment && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : 'Agregar Comentario'}
          </Button>
        )}
      </div>

      {/* Form para nuevo comentario */}
      {showForm && session?.user && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-start gap-3">
            <UserAvatar
              userId={session.user.id}
              name={session.user.name || undefined}
              email={session.user.email || undefined}
              image={session.user.image || undefined}
              size="md"
            />
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Escribe tu comentario sobre esta estación..."
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                maxLength={144}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {nuevoComentario.length}/144 caracteres
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowForm(false)
                      setNuevoComentario('')
                    }}
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitComentario}
                    disabled={submitting || !nuevoComentario.trim()}
                  >
                    {submitting ? 'Enviando...' : 'Enviar Comentario'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {comentarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aún no hay comentarios en esta estación.</p>
            {session?.user && (
              <p className="text-xs mt-1">¡Sé el primero en comentar!</p>
            )}
          </div>
        ) : (
          comentarios.map((comentario) => (
            <div
              key={comentario.id}
              className="flex items-start gap-3 p-3 border rounded-lg bg-background/50"
            >
              <UserAvatar
                userId={comentario.usuario.id}
                name={comentario.usuario.name || undefined}
                image={comentario.usuario.image || undefined}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comentario.usuario.name || 'Usuario'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comentario.fechaCreacion)}
                    </span>
                    {toDate(comentario.fechaActualizacion).getTime() !== toDate(comentario.fechaCreacion).getTime() && (
                      <span className="text-xs text-muted-foreground">(editado)</span>
                    )}
                  </div>
                  
                  {session?.user?.id === comentario.usuarioId && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(comentario.id)
                          setEditingText(comentario.comentario)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComentario(comentario.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {editing === comentario.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      maxLength={144}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {editingText.length}/144 caracteres
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(null)
                            setEditingText('')
                          }}
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditComentario(comentario.id)}
                          disabled={!editingText.trim()}
                        >
                          <Save className="h-4 w-4" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words break-all">
                    {comentario.comentario}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mensaje para usuarios no logueados */}
      {!session?.user && (
        <div className="mt-4 p-3 border rounded-lg bg-muted/20 text-center">
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">
              Inicia sesión
            </a>{' '}
            para agregar tu comentario sobre esta estación.
          </p>
        </div>
      )}
    </Card>
  )
}