'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { authClient } from '@/lib/authClient'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getCompanyLogoPath } from '@/lib/companyLogos'
import { MapSearch } from '@/components/map/MapSearch'
import type { Station } from '@/components/MapSearchClient'
import { FUEL_LABELS, type FuelType } from '@/lib/types'

interface FavoritoItem {
  id: string
  estacionId: string
  fechaCreacion: string
  nombre: string | null
  empresa: string | null
  direccion: string | null
  localidad: string | null
  provincia: string | null
  latitud: number | null
  longitud: number | null
}

export default function FavoritosPage() {
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const [items, setItems] = useState<FavoritoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState<Station[]>([])
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null)

  useEffect(() => {
    if (!session?.user) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/favoritos')
        if (res.ok) {
          const data = await res.json()
          setItems(data.data || [])
        }
      } catch (e) {
        console.error('Error loading favorites', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session?.user])

  useEffect(() => {
    const loadStations = async () => {
      if (!session?.user) {
        setStations([])
        return
      }
      if (!items.length) {
        setStations([])
        return
      }
      try {
        const ids = items.map(i => i.estacionId)
        const concurrency = 5
        const results: Station[] = []

        const toStation = (fav: FavoritoItem, detail: any): Station => ({
          id: fav.estacionId,
          nombre: fav.nombre || detail?.nombre || '',
          empresa: fav.empresa || detail?.empresa || '',
          direccion: fav.direccion || detail?.direccion || '',
          localidad: fav.localidad || detail?.localidad || '',
          provincia: fav.provincia || detail?.provincia || '',
          latitud: (fav.latitud ?? detail?.latitud) || 0,
          longitud: (fav.longitud ?? detail?.longitud) || 0,
          precios: Array.isArray(detail?.precios)
            ? detail.precios.map((p: any) => ({
                tipoCombustible: p.tipoCombustible,
                precio: typeof p.precio === 'string' ? parseFloat(p.precio) : Number(p.precio),
                horario: p.horario,
                fechaActualizacion: new Date(p.fechaVigencia || p.fechaActualizacion || Date.now()),
              }))
            : [],
        })

        let idx = 0
        while (idx < ids.length) {
          const slice = ids.slice(idx, idx + concurrency)
          const batch = await Promise.all(
            slice.map(async (id) => {
              try {
                const r = await fetch(`/api/estaciones/${id}`)
                const detail = r.ok ? await r.json() : null
                const fav = items.find((i) => i.estacionId === id)!
                return toStation(fav, detail)
              } catch {
                const fav = items.find((i) => i.estacionId === id)!
                return toStation(fav, null)
              }
            })
          )
          results.push(...batch)
          idx += concurrency
        }
        setStations(results.filter(s => isFinite(s.latitud) && isFinite(s.longitud)))
      } catch (e) {
        console.error('Error loading favorite stations details', e)
        setStations([])
      }
    }
    loadStations()
  }, [items, session?.user])

  const formatCurrency = useCallback((value: number) => {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(value)
    } catch {
      return `$${Math.round(value)}`
    }
  }, [])

  const getDisplayPrice = useCallback((s: Station): { price: number | null; label: string } => {
    const precios = s.precios || []
    if (selectedFuelType) {
      const candidates = precios.filter((p) => p.tipoCombustible === selectedFuelType)
      if (candidates.length) {
        const min = candidates.reduce((acc, cur) => (cur.precio < acc ? cur.precio : acc), candidates[0].precio)
        return { price: min, label: FUEL_LABELS[selectedFuelType] }
      }
      return { price: null, label: FUEL_LABELS[selectedFuelType] }
    }
    const candidates = precios
    if (!candidates.length) return { price: null, label: 'Menor' }
    const minCandidate = candidates.reduce((min, cur) => (cur.precio < min.precio ? cur : min), candidates[0])
    return { price: minCandidate.precio, label: FUEL_LABELS[minCandidate.tipoCombustible] }
  }, [selectedFuelType])

  const mapCenterAndRadius = useMemo(() => {
    const coords = items
      .map(i => ({ lat: i.latitud, lng: i.longitud }))
      .filter((c): c is { lat: number; lng: number } => typeof c.lat === 'number' && typeof c.lng === 'number')
    if (coords.length === 0) return { center: null as { lat: number; lng: number } | null, radius: 5 }
    const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length
    const avgLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length
    const toRad = (d: number) => (d * Math.PI) / 180
    const R = 6371 // km
    const maxDist = coords.reduce((max, c) => {
      const dLat = toRad(c.lat - avgLat)
      const dLng = toRad(c.lng - avgLng)
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(avgLat)) * Math.cos(toRad(c.lat)) * Math.sin(dLng / 2) ** 2
      const d = 2 * R * Math.asin(Math.sqrt(a))
      return Math.max(max, d)
    }, 0)
    const radius = Math.max(1, Math.ceil(maxDist + 2)) // add margin
    return { center: { lat: avgLat, lng: avgLng }, radius }
  }, [items])

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="text-xl font-semibold mb-2">Favoritos</h1>
          <p className="text-muted-foreground mb-4">Iniciá sesión para ver tus estaciones guardadas.</p>
          <Button asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-3 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold">Mis favoritos</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/buscar">Buscar estaciones</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : items.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Todavía no guardaste estaciones.</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/buscar">Buscar estaciones</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Map column */}
          <div className="xl:col-span-8 2xl:col-span-9">
            <div className="relative h-[380px] sm:h-[440px] lg:h-[560px] rounded-md border overflow-hidden">
              <MapSearch
                stations={stations}
                center={mapCenterAndRadius.center}
                radius={mapCenterAndRadius.radius}
                loading={false}
                visible={true}
                selectedFuelType={selectedFuelType}
                currentLocation={null}
                onStationSelect={(station) => { router.push(`/estacion/${station.id}`) }}
                fitToStations
              />
            </div>
          </div>

          {/* List column */}
          <div className="xl:col-span-4 2xl:col-span-3">
            <div className="rounded-md border divide-y max-h-[560px] overflow-y-auto bg-background">
              {stations.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No hay estaciones para mostrar.</div>
              ) : (
                stations.map((station) => {
                  const display = getDisplayPrice(station)
                  return (
                    <div
                      key={station.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/estacion/${station.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow relative flex-shrink-0">
                          <img
                            src={getCompanyLogoPath(station.empresa)}
                            alt={station.empresa?.charAt(0)}
                            className="w-6 h-6 object-contain rounded-full"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement
                              img.style.display = 'none'
                              const p = img.parentElement
                              if (p) p.textContent = station.empresa?.charAt(0) || '—'
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm sm:text-base truncate max-w-[240px] sm:max-w-[360px]">{station.nombre}</h4>
                            <span className="hidden sm:inline text-xs border rounded px-1.5 py-0.5 text-muted-foreground">{station.empresa}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[420px]">{station.direccion}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[420px]">{station.localidad}, {station.provincia}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">{display.label}</div>
                          <div className="text-sm font-bold text-primary">{display.price !== null ? formatCurrency(display.price) : '—'}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => { e.stopPropagation(); router.push(`/estacion/${station.id}`) }}
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
