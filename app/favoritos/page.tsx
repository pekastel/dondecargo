'use client'

import React, { useEffect, useState } from 'react'
import { authClient } from '@/lib/authClient'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { getCompanyLogoPath } from '@/lib/companyLogos'

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis favoritos</h1>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const logo = getCompanyLogoPath(it.empresa || '')
            return (
              <Card key={it.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt={it.empresa || ''} className="w-10 h-10 object-contain p-0.5" onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none'
                    }} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.nombre}</div>
                    <div className="text-xs text-muted-foreground truncate">{it.empresa} • {it.direccion}, {it.localidad}, {it.provincia}</div>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/estacion/${it.estacionId}`}>Ver</Link>
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
