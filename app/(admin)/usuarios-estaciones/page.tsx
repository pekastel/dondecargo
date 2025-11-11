import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import UsuariosEstacionesClient from '@/components/admin/UsuariosEstacionesClient'

export default async function UsuariosEstacionesPage() {
  // Verificar autenticación y rol en el servidor
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/login?redirect=/usuarios-estaciones')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return <UsuariosEstacionesClient />
}

