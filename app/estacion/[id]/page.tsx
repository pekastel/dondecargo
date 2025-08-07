import { Metadata } from 'next'
import { StationDetailClient } from '@/components/StationDetailClient'
import { notFound } from 'next/navigation'

interface PageProps {
  params: { id: string }
}

// Fetch real station data from API
async function getStation(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/estaciones/${id}`, {
      cache: 'no-store' // Always fetch fresh data
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const station = await response.json()
    
    // Add some default values for fields that might not be in the database yet
    return {
      ...station,
      servicios: station.servicios || [],
      formasPago: station.formasPago || null,
      horarios: station.horarios || null,
      telefono: station.telefono || null,
      rating: station.rating || null,
      reviewCount: station.reviewCount || 0,
      // Transform prices to match expected format
      precios: station.precios.map((precio: any) => ({
        ...precio,
        precio: parseFloat(precio.precio)
      }))
    }
  } catch (error) {
    console.error('Error fetching station:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const station = await getStation(id)
  
  if (!station) {
    return {
      title: 'Estación no encontrada - DondeCargo',
      description: 'La estación que buscas no existe o ha sido eliminada.'
    }
  }

  return {
    title: `${station.nombre} - ${station.direccion} | DondeCargo`,
    description: `Precios actualizados de combustibles en ${station.nombre}, ${station.direccion}. Nafta desde $${Math.min(...station.precios.map(p => p.precio))}.`,
    openGraph: {
      title: `${station.nombre} - Precios de Combustibles`,
      description: `Precios actualizados: ${station.precios.map(p => `${p.tipoCombustible} $${p.precio}`).join(', ')}`,
      type: 'article',
      locale: 'es_AR',
      siteName: 'DondeCargo',
    },
    other: {
      'business:contact_data:street_address': station.direccion,
      'business:contact_data:locality': station.localidad,
      'business:contact_data:region': station.provincia,
      'business:contact_data:country_name': 'Argentina',
    }
  }
}

export default async function EstacionPage({ params }: PageProps) {
  const { id } = await params
  const station = await getStation(id)

  if (!station) {
    notFound()
  }

  return <StationDetailClient station={station} />
}

export const dynamic = 'force-dynamic'