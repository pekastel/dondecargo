import { Metadata } from 'next'
import MisEstacionesClient from '@/components/dashboard/MisEstacionesClient'

export const metadata: Metadata = {
  title: 'Mis Estaciones | DondeCargo',
  description: 'Gestiona tus estaciones de servicio y precios',
}

export default function MisEstacionesPage() {
  return <MisEstacionesClient />
}

