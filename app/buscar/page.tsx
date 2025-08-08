import { Suspense } from 'react'
import { MapSearchClient } from '@/components/MapSearchClient'

function BuscarPageContent() {
  return <MapSearchClient />
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando mapa...</p>
      </div>
    </div>}>
      <BuscarPageContent />
    </Suspense>
  )
}

export const metadata = {
  title: 'Buscar Precios - DondeCargo',
  description: 'Encuentra los mejores precios de combustibles cerca de ti con nuestro mapa interactivo',
}