'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const ContactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Asunto demasiado corto').max(120, 'Asunto demasiado largo'),
  message: z.string().min(10, 'Mensaje demasiado corto').max(2000, 'Mensaje demasiado largo'),
})

type ContactForm = z.infer<typeof ContactSchema>

export default function ContactoPage() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>({
    resolver: zodResolver(ContactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const msg = await res.json().catch(() => null)
        throw new Error(msg?.error || 'No se pudo enviar el mensaje')
      }

      toast.success('Mensaje enviado, gracias por contactarte')
      reset()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Contacto</h1>
      <p className="text-muted-foreground mb-8">¿Tenés consultas, sugerencias o querés reportar un problema? Escribinos.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Tu nombre" {...register('name')} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@email.com" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Asunto</Label>
          <Input id="subject" placeholder="¿Sobre qué trata?" {...register('subject')} />
          {errors.subject && <p className="text-sm text-red-600">{errors.subject.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensaje</Label>
          <Textarea id="message" rows={6} placeholder="Contanos en detalle..." {...register('message')} />
          {errors.message && <p className="text-sm text-red-600">{errors.message.message}</p>}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar mensaje'}
          </Button>
        </div>
      </form>
    </div>
  )
}
