import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import EstacionesPendientesClient from '@/components/admin/EstacionesPendientesClient'

export default async function EstacionesPendientesPage() {
  // Verificar autenticación y rol en el servidor
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/login?redirect=/estaciones-pendientes')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return <EstacionesPendientesClient />
}

