import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendContactMessageEmail } from '@/lib/email'

const ContactSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(3, 'Asunto demasiado corto').max(120, 'Asunto demasiado largo'),
  message: z.string().min(10, 'Mensaje demasiado corto').max(2000, 'Mensaje demasiado largo'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = ContactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await sendContactMessageEmail(parsed.data)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en /api/contacto:', err)
    return NextResponse.json(
      { error: 'No se pudo enviar el mensaje' },
      { status: 500 }
    )
  }
}
