'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2, Check, X, Trash2, ChevronDown } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Precio {
  id?: string
  tipoCombustible: string
  precio: number
  horario: 'diurno' | 'nocturno'
  fechaVigencia?: Date
}

interface PriceManagementPanelV2Props {
  estacionId: string
  preciosActuales: Precio[]
  onSuccess: () => void
  onCancel: () => void
}

const TIPOS_COMBUSTIBLE = [
  { value: 'nafta', label: 'Nafta', keywords: ['nafta', 'super'] },
  { value: 'nafta_premium', label: 'Nafta Premium', keywords: ['premium', 'infinia', 'v-power'] },
  { value: 'gasoil', label: 'Gasoil', keywords: ['diesel', 'gasoil', 'gasoleo'] },
  { value: 'gasoil_premium', label: 'Gasoil Premium', keywords: ['diesel premium', 'ultra'] },
  { value: 'gnc', label: 'GNC', keywords: ['gas', 'gnc', 'comprimido'] },
]

const HORARIOS = [
  { value: 'ambos', label: '💰 Mismo precio (Día y Noche)' },
  { value: 'diurno', label: '☀️ Solo Diurno' },
  { value: 'nocturno', label: '🌙 Solo Nocturno' },
]

export default function PriceManagementPanelV2({ 
  estacionId, 
  preciosActuales = [], 
  onSuccess, 
  onCancel 
}: PriceManagementPanelV2Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  
  // Nuevo precio
  const [comboOpen, setComboOpen] = useState(false)
  const [horarioOpen, setHorarioOpen] = useState(false)
  const [newTipo, setNewTipo] = useState<string>('')
  const [newPrice, setNewPrice] = useState<string>('')
  const [newHorario, setNewHorario] = useState<'diurno' | 'nocturno' | 'ambos'>('ambos')
  
  const priceInputRef = useRef<HTMLInputElement>(null)
  const newPriceInputRef = useRef<HTMLInputElement>(null)
  const comboButtonRef = useRef<HTMLButtonElement>(null)

  // Calcular combustibles ya cargados
  const combustiblesCargados = new Set(
    preciosActuales.map(p => p.tipoCombustible)
  )
  
  // Calcular combustibles disponibles (solo tipos no cargados completamente)
  const combustiblesDisponibles = TIPOS_COMBUSTIBLE.filter(tipo => {
    // Un combustible está disponible si no tiene AMBOS horarios cargados
    const tieneDiurno = preciosActuales.some(p => p.tipoCombustible === tipo.value && p.horario === 'diurno')
    const tieneNocturno = preciosActuales.some(p => p.tipoCombustible === tipo.value && p.horario === 'nocturno')
    
    return !(tieneDiurno && tieneNocturno)
  })

  // Determinar qué horarios están disponibles para el combustible seleccionado
  const horariosDisponibles = newTipo ? (() => {
    const tieneDiurno = preciosActuales.some(p => p.tipoCombustible === newTipo && p.horario === 'diurno')
    const tieneNocturno = preciosActuales.some(p => p.tipoCombustible === newTipo && p.horario === 'nocturno')
    
    if (!tieneDiurno && !tieneNocturno) {
      return HORARIOS // Todos disponibles
    } else if (tieneDiurno && !tieneNocturno) {
      return HORARIOS.filter(h => h.value === 'nocturno')
    } else if (!tieneDiurno && tieneNocturno) {
      return HORARIOS.filter(h => h.value === 'diurno')
    }
    return []
  })() : HORARIOS

  const startEdit = (precio: Precio) => {
    if (precio.id) {
      setEditingId(precio.id)
      setEditPrice(precio.precio)
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

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!newTipo || !newPrice) {
      toast.error('Completa combustible y precio')
      return
    }

    const precio = parseFloat(newPrice)
    if (precio <= 0 || isNaN(precio)) {
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

      const result = await response.json()
      toast.success(result.message || 'Precio agregado')
      
      // Reset form
      setNewTipo('')
      setNewPrice('')
      setNewHorario('ambos')
      setComboOpen(false)
      
      onSuccess()
      
      // Focus combo para siguiente carga
      setTimeout(() => comboButtonRef.current?.focus(), 100)
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
    if (e.key === 'Enter' && !e.shiftKey && newTipo && newPrice) {
      e.preventDefault()
      handleCreate()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  // Auto-focus precio cuando se selecciona combustible
  useEffect(() => {
    if (newTipo && !comboOpen) {
      newPriceInputRef.current?.focus()
      newPriceInputRef.current?.select()
    }
  }, [newTipo, comboOpen])

  // Ajustar horario automáticamente según disponibilidad
  useEffect(() => {
    if (newTipo && horariosDisponibles.length > 0) {
      // Si el horario actual no está disponible, seleccionar el primero disponible
      const horarioActualDisponible = horariosDisponibles.some(h => h.value === newHorario)
      if (!horarioActualDisponible) {
        setNewHorario(horariosDisponibles[0].value as any)
      }
    }
  }, [newTipo, horariosDisponibles, newHorario])

  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">💰 Gestión Rápida de Precios</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="text-xs h-7"
        >
          Cerrar
        </Button>
      </div>

      {/* Precios Existentes - Vista Compacta */}
      {preciosActuales.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Precios Cargados</Label>
          <div className="space-y-1.5">
            {TIPOS_COMBUSTIBLE.map(tipo => {
              const preciosDiurno = preciosActuales.filter(p => p.tipoCombustible === tipo.value && p.horario === 'diurno')
              const preciosNocturno = preciosActuales.filter(p => p.tipoCombustible === tipo.value && p.horario === 'nocturno')
              
              if (preciosDiurno.length === 0 && preciosNocturno.length === 0) return null
              
              const precioDiurno = preciosDiurno[0]
              const precioNocturno = preciosNocturno[0]
              
              return (
                <div key={tipo.value} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{tipo.label}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {precioDiurno && (
                        <div className="flex items-center gap-1.5">
                          <span>☀️</span>
                          {editingId === precioDiurno.id ? (
                            <Input
                              ref={priceInputRef}
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, precioDiurno.id!)}
                              className="h-6 w-20 text-xs"
                              disabled={loading}
                            />
                          ) : (
                            <span className="font-mono font-medium">${formatPrice(precioDiurno.precio)}</span>
                          )}
                        </div>
                      )}
                      {precioNocturno && (
                        <div className="flex items-center gap-1.5">
                          <span>🌙</span>
                          {editingId === precioNocturno.id ? (
                            <Input
                              ref={editingId === precioNocturno.id ? priceInputRef : undefined}
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, precioNocturno.id!)}
                              className="h-6 w-20 text-xs"
                              disabled={loading}
                            />
                          ) : (
                            <span className="font-mono font-medium">${formatPrice(precioNocturno.precio)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    {editingId === precioDiurno?.id || editingId === precioNocturno?.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdate(editingId!)}
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
                        {precioDiurno && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(precioDiurno)}
                            disabled={loading}
                            className="h-7 w-7 p-0"
                            title="Editar Diurno"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                        {precioNocturno && precioDiurno && (
                          <span className="text-muted-foreground">|</span>
                        )}
                        {precioNocturno && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(precioNocturno)}
                            disabled={loading}
                            className="h-7 w-7 p-0"
                            title="Editar Nocturno"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                        {(precioDiurno || precioNocturno) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (precioDiurno && precioNocturno) {
                                if (confirm('¿Eliminar ambos precios (diurno y nocturno)?')) {
                                  await handleDelete(precioDiurno.id!)
                                  await handleDelete(precioNocturno.id!)
                                }
                              } else {
                                await handleDelete((precioDiurno || precioNocturno)!.id!)
                              }
                            }}
                            disabled={loading}
                            className="h-7 w-7 p-0"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Formulario de Nuevo Precio - Ultra Compacto */}
      {combustiblesDisponibles.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground font-medium">
            ➕ Agregar Nuevo Precio
          </Label>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Combobox de Combustible - Buscable */}
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  ref={comboButtonRef}
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full sm:w-[200px] justify-between h-9 text-sm"
                  disabled={loading}
                >
                  {newTipo
                    ? getCombustibleLabel(newTipo)
                    : "Buscar combustible..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No encontrado</CommandEmpty>
                    <CommandGroup>
                      {combustiblesDisponibles.map((tipo) => (
                        <CommandItem
                          key={tipo.value}
                          value={tipo.keywords.join(' ')}
                          onSelect={() => {
                            setNewTipo(tipo.value)
                            setComboOpen(false)
                          }}
                          className="text-sm"
                        >
                          {tipo.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Input de Precio */}
            <Input
              ref={newPriceInputRef}
              type="number"
              step="0.01"
              placeholder="Precio (ej: 850.50)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={handleNewPriceKeyDown}
              disabled={loading || !newTipo}
              className="h-9 flex-1"
            />

            {/* Selector de Horario - Compacto */}
            <Popover open={horarioOpen} onOpenChange={setHorarioOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full sm:w-[180px] justify-between h-9 text-sm"
                  disabled={loading || !newTipo}
                >
                  {HORARIOS.find(h => h.value === newHorario)?.label || 'Horario'}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {horariosDisponibles.map((horario) => (
                        <CommandItem
                          key={horario.value}
                          value={horario.value}
                          onSelect={() => {
                            setNewHorario(horario.value as any)
                            setHorarioOpen(false)
                            newPriceInputRef.current?.focus()
                          }}
                          className="text-sm"
                        >
                          {horario.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Botón Agregar */}
            <Button 
              onClick={() => handleCreate()}
              disabled={loading || !newTipo || !newPrice}
              size="sm"
              className="h-9 px-4"
            >
              {loading ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>

          {/* Mensaje de ayuda dinámico */}
          {newTipo && horariosDisponibles.length === 1 && horariosDisponibles[0].value !== 'ambos' ? (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900">
              <span>ℹ️</span>
              <span>
                <strong>{getCombustibleLabel(newTipo)}</strong> ya tiene precio{' '}
                {horariosDisponibles[0].value === 'nocturno' ? 'diurno ☀️' : 'nocturno 🌙'}.
                Ahora cargarás el precio <strong>{horariosDisponibles[0].label}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-900">
              <span>⚡</span>
              <span>
                <strong>Tip:</strong> Escribe para buscar combustible →{' '}
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> →{' '}
                Precio →{' '}
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> para guardar
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-green-50 dark:bg-green-950/30">
          ✅ <strong>¡Completado!</strong> Todos los combustibles tienen precios cargados
        </div>
      )}
    </div>
  )
}

