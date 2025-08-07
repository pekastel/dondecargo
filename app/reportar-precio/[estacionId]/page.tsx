import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/drizzle/connection'
import { estaciones, precios } from '@/drizzle/schema'
import { PriceReportPage } from '@/components/reportar-precio/PriceReportPage'
import { Card } from '@/components/ui/card'

interface PageProps {
  params: {
    estacionId: string
  }
}

async function getStationWithPrices(id: string) {
  try {
    // Get station details
    const station = await db
      .select()
      .from(estaciones)
      .where(eq(estaciones.id, id))
      .limit(1)

    if (station.length === 0) {
      return null
    }

    // Get current prices
    const currentPrices = await db
      .select()
      .from(precios)
      .where(eq(precios.estacionId, id))

    return {
      ...station[0],
      precios: currentPrices,
    }
  } catch (error) {
    console.error('Error fetching station:', error)
    return null
  }
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-2xl mx-auto p-4">
        <Card className="mt-6 p-6">
          <div className="space-y-6">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default async function ReportarPrecioPage({ params }: PageProps) {
  const { estacionId } = params
  
  const station = await getStationWithPrices(estacionId)
  
  if (!station) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PriceReportPage station={station} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { estacionId } = params
  const station = await getStationWithPrices(estacionId)
  
  if (!station) {
    return {
      title: 'Estación no encontrada - DondeCargo',
    }
  }

  return {
    title: `Reportar precio - ${station.nombre} - DondeCargo`,
    description: `Reporta el precio actual de combustibles en ${station.nombre}, ${station.empresa} ubicada en ${station.direccion}`,
  }
}