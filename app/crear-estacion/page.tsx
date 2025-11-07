import { CreateStationForm } from '@/components/estacion/CreateStationForm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/drizzle/connection'
import { estaciones } from '@/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Crear Estación de Servicio | DondeCargo',
  description: 'Da de alta tu estación de servicio en DondeCargo',
}

export default async function CrearEstacionPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/login?redirect=/crear-estacion')
  }

  // Verificar si el usuario tiene estaciones pendientes
  const pendientes = await db.select().from(estaciones).where(
    and(
      eq(estaciones.usuarioCreadorId, session.user.id),
      eq(estaciones.estado, 'pendiente')
    )
  )

  // Si tiene pendientes, redirigir a mis-estaciones
  if (pendientes.length > 0) {
    redirect('/mis-estaciones')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dar de Alta una Estación de Servicio</h1>
        <p className="text-muted-foreground">
          Completa el formulario para agregar tu estación a DondeCargo. Una vez enviada, será revisada por nuestro equipo antes de ser publicada.
        </p>
      </div>
      
      <CreateStationForm />
    </div>
  )
}

