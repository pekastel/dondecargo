'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReportCommentModalProps {
  isOpen: boolean
  onClose: () => void
  comentarioId: string
  onSuccess: () => void
}

const reportOptions = [
  { id: 'spam', label: 'Spam o contenido repetitivo', description: 'Contenido no deseado o repetitivo' },
  { id: 'contenido_inapropiado', label: 'Contenido inapropiado', description: 'Lenguaje ofensivo o inapropiado' },
  { id: 'informacion_falsa', label: 'Información falsa', description: 'Información incorrecta o engañosa' },
  { id: 'otro', label: 'Otro motivo', description: 'Otra razón no listada anteriormente' },
] as const

export function ReportCommentModal({ 
  isOpen, 
  onClose, 
  comentarioId, 
  onSuccess 
}: ReportCommentModalProps) {
  const [selectedMotivos, setSelectedMotivos] = useState<string[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMotivoChange = (motivoId: string, checked: boolean) => {
    if (checked) {
      setSelectedMotivos(prev => [...prev, motivoId])
    } else {
      setSelectedMotivos(prev => prev.filter(id => id !== motivoId))
    }
  }

  const handleSubmit = async () => {
    if (selectedMotivos.length === 0) {
      toast.error('Debes seleccionar al menos un motivo')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/comentarios/${comentarioId}/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivos: selectedMotivos,
          observaciones: observaciones.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar reporte')
      }

      // Reset form
      setSelectedMotivos([])
      setObservaciones('')
      
      onSuccess()
    } catch (error) {
      console.error('Error reporting comment:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar reporte')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedMotivos([])
      setObservaciones('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Reportar comentario
          </DialogTitle>
          <DialogDescription>
            Ayúdanos a mantener una comunidad segura. Selecciona el motivo del reporte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report reasons */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Motivo del reporte <span className="text-red-500">*</span>
            </Label>
            {reportOptions.map((option) => (
              <div key={option.id} className="flex items-start space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedMotivos.includes(option.id)}
                  onCheckedChange={(checked) => 
                    handleMotivoChange(option.id, checked as boolean)
                  }
                  disabled={isSubmitting}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Additional observations */}
          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-sm font-medium">
              Observaciones adicionales (opcional)
            </Label>
            <Textarea
              id="observaciones"
              placeholder="Proporciona más detalles sobre el problema..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              maxLength={288}
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Máximo 288 caracteres</span>
              <span>{observaciones.length}/288</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedMotivos.length === 0}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}