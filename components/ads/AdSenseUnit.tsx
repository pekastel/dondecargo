'use client'

import { useEffect, useRef } from 'react'
import { env } from '@/lib/env'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export type AdFormat = 'horizontal' | 'vertical' | 'rectangle' | 'auto'

interface AdSenseUnitProps {
  /** Ad slot ID from AdSense */
  slot: string
  /** Ad format/layout */
  format?: AdFormat
  /** Additional className for the container */
  className?: string
  /** Whether to show on mobile */
  showOnMobile?: boolean
  /** Whether to show on desktop */
  showOnDesktop?: boolean
}

/**
 * AdSense display ad unit component.
 * Renders a responsive ad unit that adapts to the container size.
 * 
 * Common formats:
 * - horizontal: Banner ads (728x90, 970x90)
 * - vertical: Skyscraper ads (160x600, 300x600)
 * - rectangle: Medium rectangle (300x250, 336x280)
 * - auto: Responsive auto-sized
 */
export function AdSenseUnit({
  slot,
  format = 'auto',
  className = '',
  showOnMobile = true,
  showOnDesktop = true,
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    // Skip if no publisher ID configured
    if (!env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID) {
      return
    }

    // Skip if already initialized
    if (isInitialized.current) {
      return
    }

    // Push ad to queue
    try {
      if (adRef.current && adRef.current.offsetWidth > 0) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        isInitialized.current = true
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  // Don't render if no publisher ID or no slot
  if (!env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || !slot) {
    return null
  }

  // Build responsive visibility classes
  const visibilityClasses = [
    !showOnMobile && 'hidden lg:block',
    !showOnDesktop && 'lg:hidden',
    showOnMobile && showOnDesktop && '',
  ]
    .filter(Boolean)
    .join(' ')

  // Format-specific styles
  const formatStyles: Record<AdFormat, string> = {
    horizontal: 'min-h-[90px] w-full',
    vertical: 'min-h-[600px] w-[336px]',
    rectangle: 'min-h-[250px] w-[300px]',
    auto: 'min-h-[100px] w-full',
  }

  return (
    <div
      className={`overflow-hidden ${visibilityClasses} ${className}`}
      aria-label="Publicidad"
    >
      <ins
        ref={adRef}
        className={`adsbygoogle block ${formatStyles[format]}`}
        style={{ display: 'block' }}
        data-ad-client={env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  )
}

interface TopStation {
  id: string
  nombre: string
  empresa: string
  precio: number
  distancia: number
}

interface SidebarStats {
  averagePrice: number
  priceChange?: number
  cheapestStation?: TopStation
  topStations: TopStation[]
}

/**
 * Floating sidebar ad wrapper for map search page.
 * Shows a vertical skyscraper ad on desktop with useful stats below.
 * Floats over the map to maximize viewing area.
 */
export function MapSidebarAd({ 
  slot,
  stats
}: { 
  slot?: string
  stats?: SidebarStats
}) {
  const adSlot = slot || env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_SIDEBAR
  
  // Don't render container if no ad slot configured
  if (!env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || !adSlot) {
    return null
  }

  return (
    <div className="hidden lg:block fixed right-4 top-32 w-[336px] z-[1100] pointer-events-auto">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-xl border border-border overflow-hidden">
        {/* Ad Section */}
        <div className="p-3 border-b border-border">
          <p className="text-[10px] text-muted-foreground text-center mb-2">Publicidad</p>
          <AdSenseUnit
            slot={adSlot}
            format="vertical"
            showOnMobile={false}
            showOnDesktop={true}
          />
        </div>
        
        {/* Stats Section */}
        {stats && (
          <div className="p-4 space-y-4">
            {/* Average Price */}
            {stats.averagePrice > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Promedio en zona</p>
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    maximumFractionDigits: 0
                  }).format(stats.averagePrice)}
                </p>
                {stats.priceChange !== undefined && (
                  <p className={`text-xs mt-1 ${stats.priceChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.priceChange > 0 ? '↑' : '↓'} {Math.abs(stats.priceChange).toFixed(1)}% vs. ayer
                  </p>
                )}
              </div>
            )}
            
            {/* Top 3 Cheapest Stations */}
            {stats.topStations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  🏆 Más baratas cerca
                </h4>
                <div className="space-y-2">
                  {stats.topStations.slice(0, 3).map((station, idx) => (
                    <a
                      key={station.id}
                      href={`/estacion/${station.id}`}
                      className="flex items-center gap-2 p-2 bg-muted/30 rounded hover:bg-muted/60 cursor-pointer transition-colors group"
                    >
                      <span className="text-xs font-bold text-primary min-w-[20px]">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {station.nombre}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {station.distancia.toFixed(1)}km • {station.empresa}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                          maximumFractionDigits: 0
                        }).format(station.precio)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Mobile footer ad for map search page.
 * Shows a horizontal banner ad on mobile only.
 */
export function MapMobileFooterAd({ slot }: { slot?: string }) {
  const adSlot = slot || env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_MOBILE
  
  // Don't render container if no ad slot configured
  if (!env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || !adSlot) {
    return null
  }

  return (
    <div className="lg:hidden w-full bg-card/80 backdrop-blur-sm border-t border-border py-2 px-4">
      <p className="text-[10px] text-muted-foreground text-center mb-1">Publicidad</p>
      <AdSenseUnit
        slot={adSlot}
        format="horizontal"
        showOnMobile={true}
        showOnDesktop={false}
      />
    </div>
  )
}

/**
 * Inline content ad for station detail page.
 * Shows a horizontal banner between content sections.
 */
export function InlineContentAd({ slot, className = '' }: { slot?: string; className?: string }) {
  const adSlot = slot || env.NEXT_PUBLIC_ADSENSE_SLOT_STATION_INLINE
  
  // Don't render container if no ad slot configured
  if (!env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || !adSlot) {
    return null
  }

  return (
    <div className={`w-full py-4 ${className}`}>
      <p className="text-[10px] text-muted-foreground text-center mb-1">Publicidad</p>
      <AdSenseUnit
        slot={adSlot}
        format="auto"
        showOnMobile={true}
        showOnDesktop={true}
        className="max-w-4xl mx-auto"
      />
    </div>
  )
}
