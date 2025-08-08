import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar Precios - DondeCargo',
  description: 'Encuentra los mejores precios de combustibles cerca de ti con nuestro mapa interactivo',
}

export default function BuscarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}