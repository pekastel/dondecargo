'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, Check, X, Plus, Trash2 } from 'lucide-react'

interface Precio {
  id?: string
  tipoCombustible: string
  precio: number
  horario: 'diurno' | 'nocturno'
  fechaVigencia?: Date
}

interface PriceManagementPanelProps {
  estacionId: string
  preciosActuales: Precio[]
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

const HORARIOS = [
  { value: 'diurno', label: 'Diurno' },
  { value: 'nocturno', label: 'Nocturno' },
]

export default function PriceManagementPanel({ 
  estacionId, 
  preciosActuales = [], 
  onSuccess, 
  onCancel 
}: PriceManagementPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [editHorario, setEditHorario] = useState<'diurno' | 'nocturno'>('diurno')
  const [loading, setLoading] = useState(false)
  
  // Nuevo precio
  const [newTipo, setNewTipo] = useState<string>('')
  const [newPrice, setNewPrice] = useState<string>('')
  const [newHorario, setNewHorario] = useState<'diurno' | 'nocturno'>('diurno')
  
  const priceInputRef = useRef<HTMLInputElement>(null)
  const newPriceInputRef = useRef<HTMLInputElement>(null)

  // Calcular combustibles disponibles (no cargados)
  const combustiblesCargados = preciosActuales.map(p => `${p.tipoCombustible}-${p.horario}`)
  const combustiblesDisponibles = TIPOS_COMBUSTIBLE.flatMap(tipo => 
    HORARIOS.map(horario => ({
      value: tipo.value,
      horario: horario.value as 'diurno' | 'nocturno',
      label: `${tipo.label} (${horario.label})`,
      key: `${tipo.value}-${horario.value}`
    }))
  ).filter(combo => !combustiblesCargados.includes(combo.key))

  const startEdit = (precio: Precio) => {
    if (precio.id) {
      setEditingId(precio.id)
      setEditPrice(precio.precio)
      setEditHorario(precio.horario)
      setTimeout(() => priceInputRef.current?.select(), 100)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPrice(0)
  }

  const handleUpdate = async (precioId: string) => {
    if (editPrice <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/precios/${precioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precio: editPrice,
          horario: editHorario,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar')
      }

      toast.success('Precio actualizado')
      setEditingId(null)
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (precioId: string) => {
    if (!confirm('¿Eliminar este precio?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/precios/${precioId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar')
      }

      toast.success('Precio eliminado')
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTipo || !newPrice) {
      toast.error('Completa todos los campos')
      return
    }

    const precio = parseFloat(newPrice)
    if (precio <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/precios/crear-rapido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estacionId,
          tipoCombustible: newTipo,
          precio,
          horario: newHorario,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear')
      }

      toast.success('Precio agregado')
      setNewTipo('')
      setNewPrice('')
      setNewHorario('diurno')
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear')
    } finally {
      setLoading(false)
    }
  }

  const getCombustibleLabel = (tipo: string) => {
    return TIPOS_COMBUSTIBLE.find(t => t.value === tipo)?.label || tipo
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent, precioId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleUpdate(precioId)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const handleNewPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreate(e as any)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Gestión de Precios</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="text-xs"
        >
          Cerrar
        </Button>
      </div>

      {/* Precios Existentes - Tabla Editable */}
      {preciosActuales.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Precios Actuales</Label>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Combustible</th>
                  <th className="text-left p-2 font-medium">Horario</th>
                  <th className="text-left p-2 font-medium">Precio</th>
                  <th className="text-right p-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preciosActuales.map((precio) => (
                  <tr key={precio.id || `${precio.tipoCombustible}-${precio.horario}`} className="hover:bg-muted/30">
                    <td className="p-2">{getCombustibleLabel(precio.tipoCombustible)}</td>
                    <td className="p-2 capitalize">{precio.horario}</td>
                    <td className="p-2">
                      {editingId === precio.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={priceInputRef}
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => precio.id && handleKeyDown(e, precio.id)}
                            className="h-8 w-24"
                            disabled={loading}
                          />
                          <Select 
                            value={editHorario}
                            onValueChange={(v) => setEditHorario(v as 'diurno' | 'nocturno')}
                            disabled={loading}
                          >
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diurno">Diurno</SelectItem>
                              <SelectItem value="nocturno">Nocturno</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="font-mono">${formatPrice(precio.precio)}</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === precio.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => precio.id && handleUpdate(precio.id)}
                              disabled={loading}
                              className="h-7 w-7 p-0"
                              title="Guardar (Enter)"
                            >
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={loading}
                              className="h-7 w-7 p-0"
                              title="Cancelar (Esc)"
                            >
                              <X className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(precio)}
                              disabled={loading || !precio.id}
                              className="h-7 w-7 p-0"
                              title="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => precio.id && handleDelete(precio.id)}
                              disabled={loading || !precio.id}
                              className="h-7 w-7 p-0"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Presiona <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> para guardar, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> para cancelar
          </p>
        </div>
      )}

      {/* Formulario de Nuevo Precio */}
      {combustiblesDisponibles.length > 0 ? (
        <form onSubmit={handleCreate} className="space-y-3">
          <Label className="text-xs text-muted-foreground">Agregar Nuevo Precio</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Select 
                value={newTipo ? `${newTipo}-${newHorario}` : ''}
                onValueChange={(value) => {
                  const combo = combustiblesDisponibles.find(c => c.key === value)
                  if (combo) {
                    setNewTipo(combo.value)
                    setNewHorario(combo.horario)
                    // Focus precio input después de seleccionar
                    setTimeout(() => newPriceInputRef.current?.focus(), 100)
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar combustible" />
                </SelectTrigger>
                <SelectContent>
                  {combustiblesDisponibles.map((combo) => (
                    <SelectItem key={combo.key} value={combo.key}>
                      {combo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Input
                ref={newPriceInputRef}
                type="number"
                step="0.01"
                placeholder="850.50"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyDown={handleNewPriceKeyDown}
                disabled={loading || !newTipo}
                className="h-9"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading || !newTipo || !newPrice}
                size="sm"
                className="flex-1 h-9"
              >
                {loading ? (
                  'Guardando...'
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Usa <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> para navegar, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> para guardar
          </p>
        </form>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/20">
          ✅ Todos los tipos de combustible están cargados
        </div>
      )}
    </div>
  )
}

