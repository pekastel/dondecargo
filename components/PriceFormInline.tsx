'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2 } from 'lucide-react'

export interface PrecioFormData {
  tipoCombustible: string
  precio: string
  horario: 'diurno' | 'nocturno'
}

interface PriceFormInlineProps {
  precios: PrecioFormData[]
  onChange: (precios: PrecioFormData[]) => void
  disabled?: boolean
}

const TIPOS_COMBUSTIBLE = [
  { value: 'nafta', label: 'Nafta' },
  { value: 'nafta_premium', label: 'Nafta Premium' },
  { value: 'gasoil', label: 'Gasoil' },
  { value: 'gasoil_premium', label: 'Gasoil Premium' },
  { value: 'gnc', label: 'GNC' },
]

const HORARIOS = [
  { value: 'ambos', label: '💰 Mismo precio (Día y Noche)' },
  { value: 'diurno', label: '☀️ Solo Diurno' },
  { value: 'nocturno', label: '🌙 Solo Nocturno' },
]

export default function PriceFormInline({ precios, onChange, disabled = false }: PriceFormInlineProps) {
  const [newTipo, setNewTipo] = useState<string>('')
  const [newPrice, setNewPrice] = useState<string>('')
  const [newHorario, setNewHorario] = useState<'diurno' | 'nocturno' | 'ambos'>('ambos')
  
  const newPriceInputRef = useRef<HTMLInputElement>(null)

  // Calcular combustibles ya cargados
  const combustiblesCargados = new Set(precios.map(p => p.tipoCombustible))
  
  // Calcular combustibles disponibles (solo tipos no cargados completamente)
  const combustiblesDisponibles = TIPOS_COMBUSTIBLE.filter(tipo => {
    const tieneDiurno = precios.some(p => p.tipoCombustible === tipo.value && p.horario === 'diurno')
    const tieneNocturno = precios.some(p => p.tipoCombustible === tipo.value && p.horario === 'nocturno')
    
    return !(tieneDiurno && tieneNocturno)
  })

  // Determinar qué horarios están disponibles para el combustible seleccionado
  const horariosDisponibles = newTipo ? (() => {
    const tieneDiurno = precios.some(p => p.tipoCombustible === newTipo && p.horario === 'diurno')
    const tieneNocturno = precios.some(p => p.tipoCombustible === newTipo && p.horario === 'nocturno')
    
    if (!tieneDiurno && !tieneNocturno) {
      return HORARIOS // Todos disponibles
    } else if (tieneDiurno && !tieneNocturno) {
      return HORARIOS.filter(h => h.value === 'nocturno')
    } else if (!tieneDiurno && tieneNocturno) {
      return HORARIOS.filter(h => h.value === 'diurno')
    }
    return []
  })() : HORARIOS

  const getCombustibleLabel = (tipo: string) => {
    return TIPOS_COMBUSTIBLE.find(t => t.value === tipo)?.label || tipo
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const handleAddPrice = () => {
    if (!newTipo || !newPrice) {
      return
    }

    const precio = parseFloat(newPrice)
    if (precio <= 0 || isNaN(precio)) {
      return
    }

    // Si es "ambos", crear dos entradas
    if (newHorario === 'ambos') {
      const newPrecios = [
        ...precios,
        { tipoCombustible: newTipo, precio: newPrice, horario: 'diurno' as const },
        { tipoCombustible: newTipo, precio: newPrice, horario: 'nocturno' as const },
      ]
      onChange(newPrecios)
    } else {
      const newPrecios = [
        ...precios,
        { tipoCombustible: newTipo, precio: newPrice, horario: newHorario },
      ]
      onChange(newPrecios)
    }

    // Reset form
    setNewTipo('')
    setNewPrice('')
    setNewHorario('ambos')
  }

  const handleRemovePrice = (index: number) => {
    const newPrecios = precios.filter((_, i) => i !== index)
    onChange(newPrecios)
  }

  const handleRemoveCombustible = (tipoCombustible: string) => {
    const newPrecios = precios.filter(p => p.tipoCombustible !== tipoCombustible)
    onChange(newPrecios)
  }

  const handleNewPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && newTipo && newPrice) {
      e.preventDefault()
      handleAddPrice()
    }
  }

  // Auto-focus precio cuando se selecciona combustible
  useEffect(() => {
    if (newTipo) {
      setTimeout(() => {
        newPriceInputRef.current?.focus()
        newPriceInputRef.current?.select()
      }, 100)
    }
  }, [newTipo])

  // Ajustar horario automáticamente según disponibilidad
  useEffect(() => {
    if (newTipo && horariosDisponibles.length > 0) {
      const horarioActualDisponible = horariosDisponibles.some(h => h.value === newHorario)
      if (!horarioActualDisponible) {
        setNewHorario(horariosDisponibles[0].value as 'diurno' | 'nocturno' | 'ambos')
      }
    }
  }, [newTipo, horariosDisponibles, newHorario])

  return (
    <div className="space-y-4">
      {/* Precios Existentes - Vista Compacta */}
      {precios.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Precios Cargados</Label>
          <div className="space-y-1.5">
            {TIPOS_COMBUSTIBLE.map(tipo => {
              const preciosDiurno = precios.filter(p => p.tipoCombustible === tipo.value && p.horario === 'diurno')
              const preciosNocturno = precios.filter(p => p.tipoCombustible === tipo.value && p.horario === 'nocturno')
              
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
                          <span className="font-mono font-medium">${formatPrice(parseFloat(precioDiurno.precio))}</span>
                        </div>
                      )}
                      {precioNocturno && (
                        <div className="flex items-center gap-1.5">
                          <span>🌙</span>
                          <span className="font-mono font-medium">${formatPrice(parseFloat(precioNocturno.precio))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCombustible(tipo.value)}
                      disabled={disabled}
                      className="h-7 w-7 p-0"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Formulario de Nuevo Precio */}
      {combustiblesDisponibles.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground font-medium">
            ➕ Agregar Nuevo Precio
          </Label>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Selector de Combustible */}
            <Select 
              value={newTipo} 
              onValueChange={(value) => setNewTipo(value)}
              disabled={disabled}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm">
                <SelectValue placeholder="Seleccionar combustible" />
              </SelectTrigger>
              <SelectContent>
                {combustiblesDisponibles.map(tipo => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Input de Precio */}
            <Input
              ref={newPriceInputRef}
              type="number"
              step="0.01"
              placeholder="Precio (ej: 850.50)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={handleNewPriceKeyDown}
              disabled={disabled || !newTipo}
              className="h-9 flex-1"
            />

            {/* Selector de Horario */}
            <Select 
              value={newHorario} 
              onValueChange={(value) => {
                setNewHorario(value as 'diurno' | 'nocturno' | 'ambos')
                setTimeout(() => newPriceInputRef.current?.focus(), 100)
              }}
              disabled={disabled || !newTipo}
            >
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] h-9 text-sm">
                <SelectValue placeholder="Horario" />
              </SelectTrigger>
              <SelectContent>
                {horariosDisponibles.map(horario => (
                  <SelectItem key={horario.value} value={horario.value}>
                    {horario.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botón Agregar */}
            <Button 
              type="button"
              onClick={handleAddPrice}
              disabled={disabled || !newTipo || !newPrice}
              size="sm"
              className="h-9 px-4"
            >
              Agregar
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
                <strong>Tip:</strong> Seleccioná combustible →{' '}
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

