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
 import { useFuelPreference } from '@/lib/stores/useFuelPreference'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

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
  const selectedFuelType = useFuelPreference((s) => s.selectedFuelType)
  const setSelectedFuelType = useFuelPreference((s) => s.setSelectedFuelType)
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'diurno' | 'nocturno'>('diurno')

  

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

        const toStation = (fav: FavoritoItem, detail: { nombre?: string; empresa?: string; direccion?: string; localidad?: string; provincia?: string; latitud?: number; longitud?: number; precios?: Array<{ tipoCombustible: string; precio: string | number; horario: string; [key: string]: unknown }>; [key: string]: unknown } | null): Station => ({
          id: fav.estacionId,
          nombre: fav.nombre || detail?.nombre || '',
          empresa: fav.empresa || detail?.empresa || '',
          direccion: fav.direccion || detail?.direccion || '',
          localidad: fav.localidad || detail?.localidad || '',
          provincia: fav.provincia || detail?.provincia || '',
          latitud: (fav.latitud ?? detail?.latitud) || 0,
          longitud: (fav.longitud ?? detail?.longitud) || 0,
          precios: Array.isArray(detail?.precios)
            ? detail.precios.map((p: { tipoCombustible: string; precio: string | number; horario: string; [key: string]: unknown }) => ({
                tipoCombustible: p.tipoCombustible as FuelType,
                precio: typeof p.precio === 'string' ? parseFloat(p.precio) : Number(p.precio),
                horario: p.horario as 'diurno' | 'nocturno',
                fechaActualizacion: new Date((p.fechaVigencia as string | number | Date) || (p.fechaActualizacion as string | number | Date) || Date.now()),
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
    <div className="container mx-auto px-2 py-2 lg:px-4 lg:py-4">
      <div className="flex items-center justify-between mb-3 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold">Mis favoritos</h1>
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center rounded-full border bg-muted/30 p-0.5"
            aria-label="Seleccionar horario"
            role="tablist"
          >
            <Button
              variant={selectedTimeOfDay === 'diurno' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeOfDay('diurno')}
              title="Precios diurnos"
              aria-pressed={selectedTimeOfDay === 'diurno'}
              role="tab"
              className="h-5 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3 rounded-full"
            >
              Día
            </Button>
            <Button
              variant={selectedTimeOfDay === 'nocturno' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeOfDay('nocturno')}
              title="Precios nocturnos"
              aria-pressed={selectedTimeOfDay === 'nocturno'}
              role="tab"
              className="h-5 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3 rounded-full"
            >
              Noche
            </Button>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex h-7 w-7 text-muted-foreground"
                aria-label="Ayuda: seleccionar horario"
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">Ayuda</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Actualiza los precios en mapa y lista</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" asChild className="h-5 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3">
            <Link href="/buscar">Buscar estaciones</Link>
          </Button>
        </div>
      </div>

      {/* Prominent Fuel Type Selector */}
      <div className="mb-3 lg:mb-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Precio destacado (según horario):</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FUEL_LABELS).map(([fuel, label]) => (
              <Button
                key={fuel}
                variant={selectedFuelType === (fuel as FuelType) ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFuelType(fuel as FuelType)}
                className="h-5 sm:h-8 text-[12px] sm:text-xs px-2 sm:px-3"
              >
                {label}
              </Button>
            ))}
          </div>
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 lg:gap-4">
          {/* Map column */}
          <div className="xl:col-span-8 2xl:col-span-9">
            <div className="relative h-[380px] sm:h-[440px] lg:h-[560px] rounded-md border overflow-hidden">
              <div className="absolute top-2 left-2 z-[400] text-xs px-2 py-1 rounded border bg-background/90 backdrop-blur">
                {selectedTimeOfDay === 'diurno' ? 'Precios: Día' : 'Precios: Noche'}
              </div>
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
                selectedTimeOfDay={selectedTimeOfDay}
              />
            </div>
          </div>

          {/* List column */}
          <div className="xl:col-span-4 2xl:col-span-3">
            <div className="rounded-md border divide-y max-h-[560px] overflow-y-auto bg-background">
              <div className="flex items-center justify-between p-2 px-3 text-xs text-muted-foreground bg-muted/40">
                Mostrando precios: {selectedTimeOfDay === 'diurno' ? 'Día' : 'Noche'}
              </div>
              {stations.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No hay estaciones para mostrar.</div>
              ) : (
                stations.map((station) => {
                  const horarioPrices = (station.precios || []).filter(p => p.horario === selectedTimeOfDay)
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
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {horarioPrices.length > 0 ? (
                              horarioPrices.map((p, idx) => (
                                <span key={`${station.id}-${p.tipoCombustible}-${idx}`} className="text-[11px] px-1.5 py-0.5 rounded border bg-muted">
                                  {FUEL_LABELS[p.tipoCombustible]}: {formatCurrency(p.precio)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin precios {selectedTimeOfDay}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
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
