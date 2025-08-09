import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const revalidate = 86400 // 24h

function normalizeBaseUrl(url: string): string {
  const withProtocol = /^https?:\/\//.test(url) ? url : `https://${url}`
  return withProtocol.replace(/\/$/, '')
}

function getBaseUrl(): string {
  const candidate = env.NEXT_PUBLIC_APP_URL
    ?? env.VERCEL_PROJECT_PRODUCTION_URL
    ?? env.VERCEL_URL
    ?? env.BASE_URL
  return normalizeBaseUrl(candidate)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl()

  const routes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  try {
    // Lazy import to avoid initializing DB at build time unless needed
    const [{ db }, { estaciones }] = await Promise.all([
      import('@/drizzle/connection'),
      import('@/drizzle/schema'),
    ])

    // Fetch all station ids and last update timestamps
    const stations = await db
      .select({ id: estaciones.id, fechaActualizacion: estaciones.fechaActualizacion })
      .from(estaciones)

    for (const s of stations) {
      routes.push({
        url: `${base}/estacion/${encodeURIComponent(s.id)}`,
        lastModified: s.fechaActualizacion ?? new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (error) {
    console.error('⚠️ Error generating sitemap, returning base only:', error)
  }

  return routes
}
