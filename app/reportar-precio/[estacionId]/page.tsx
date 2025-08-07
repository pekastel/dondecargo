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
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4" />
              <div className="grid gap-4">
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </Card>
        </div>
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
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSkeleton />}>
        <PriceReportPage station={station} />
      </Suspense>
    </div>
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