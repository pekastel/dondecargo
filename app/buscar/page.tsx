'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MapSearchClient } from '@/components/MapSearchClient'

function BuscarPageContent() {
  const searchParams = useSearchParams()
  
  // Extract initial coordinates from URL
  const initialCoords = (() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius')

    if (lat && lng) {
      const parsedLat = parseFloat(lat)
      const parsedLng = parseFloat(lng)
      const parsedRadius = radius ? parseInt(radius) : 5

      // Validate coordinates
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && 
          parsedLat >= -90 && parsedLat <= 90 && 
          parsedLng >= -180 && parsedLng <= 180) {
        return {
          location: { lat: parsedLat, lng: parsedLng },
          radius: Math.max(1, Math.min(50, parsedRadius))
        }
      }
    }
    return null
  })()

  return <MapSearchClient initialCoords={initialCoords} />
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

