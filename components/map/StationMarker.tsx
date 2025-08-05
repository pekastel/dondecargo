'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export interface StationMarkerProps {
  station: {
    id: string
    nombre: string
    empresa: string
    direccion: string
    localidad: string
    precios: Array<{
      tipoCombustible: string
      precio: number
      horario: 'diurno' | 'nocturno'
    }>
  }
  isHovered?: boolean
  onClick?: () => void
}

const FUEL_LABELS: Record<string, string> = {
  nafta: 'Nafta',
  nafta_premium: 'Premium',
  gasoil: 'Gasoil',
  gasoil_premium: 'G.Premium',
  gnc: 'GNC'
}

const FUEL_ICONS: Record<string, string> = {
  nafta: '⛽',
  nafta_premium: '⛽',
  gasoil: '🚛',
  gasoil_premium: '🚛',
  gnc: '⚡'
}

function getCompanyLogoPath(empresa: string): string {
  const normalizedCompany = empresa.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  
  // Map common company names to logo filenames
  const logoMap: Record<string, string> = {
    'ypf': 'icono-ypf.png',
    'shell': 'icono-shell.png',
    'axion': 'icono-axion.png',
    'petrobras': 'icono-petrobras.png',
    'gulf': 'icono-gulf.png',
    'puma': 'icono-puma.png',
    'esso': 'icono-esso.png',
    'oil': 'icono-oil.png'
  }
  
  // Try to find exact match first
  const exactMatch = logoMap[normalizedCompany]
  if (exactMatch) {
    return `/logos/${exactMatch}`
  }
  
  // Try partial matches
  for (const [key, logo] of Object.entries(logoMap)) {
    if (normalizedCompany.includes(key) || key.includes(normalizedCompany)) {
      return `/logos/${logo}`
    }
  }
  
  // Default fallback
  return `/logos/icono-default.svg`
}

export function StationMarker({ station, isHovered = false, onClick }: StationMarkerProps) {
  const [imageError, setImageError] = useState(false)
  const lowestPrice = Math.min(...station.precios.map(p => p.precio))
  const mainFuel = station.precios.find(p => p.precio === lowestPrice)
  const logoPath = getCompanyLogoPath(station.empresa)
  
  return (
    <div className="station-marker-container relative group cursor-pointer" onClick={onClick}>
      {/* Floating Card - appears on hover or when explicitly hovered */}
      <div className={cn(
        "absolute z-50 bottom-full mb-3 left-1/2 -translate-x-1/2",
        "bg-white rounded-lg shadow-lg border border-gray-100",
        "px-4 py-3 min-w-[220px] max-w-[280px]",
        "transform transition-all duration-300 ease-in-out",
        "pointer-events-none select-none",
        isHovered || "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
      )}>
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-45"></div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Company Logo */}
          <div className="w-12 h-12 relative flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
            {!imageError ? (
              <Image 
                src={logoPath}
                alt={`${station.empresa} logo`}
                fill
                className="object-contain p-1"
                onError={() => setImageError(true)}
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                {station.empresa.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Station Details */}
          <div className="flex-grow min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 truncate mb-1">
              {station.nombre}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {mainFuel && FUEL_ICONS[mainFuel.tipoCombustible]} {mainFuel && FUEL_LABELS[mainFuel.tipoCombustible]}
              </span>
            </div>
            <p className="text-primary font-bold text-lg leading-none">
              ${lowestPrice.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Additional Prices Preview */}
        {station.precios.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {station.precios.slice(0, 3).map((precio, index) => (
                <div key={index} className="text-xs bg-gray-50 px-2 py-1 rounded">
                  {FUEL_ICONS[precio.tipoCombustible]} ${precio.precio}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Base Marker Pin */}
      <div className={cn(
        "w-8 h-8 rounded-full border-2 border-white",
        "bg-gradient-to-br from-blue-500 to-purple-600",
        "flex items-center justify-center",
        "text-white text-xs font-bold",
        "shadow-lg hover:scale-110 transition-all duration-200",
        "relative z-10"
      )}>
        {imageError ? (
          station.empresa.charAt(0)
        ) : (
          <div className="w-6 h-6 relative">
            <Image 
              src={logoPath}
              alt={`${station.empresa}`}
              fill
              className="object-contain rounded-full"
              onError={() => setImageError(true)}
              sizes="24px"
            />
          </div>
        )}
      </div>
      
      {/* Price Badge */}
      <div className={cn(
        "absolute -bottom-1 -right-1 z-20",
        "bg-white border border-gray-200 rounded-full",
        "px-2 py-0.5 text-xs font-semibold text-primary",
        "shadow-md min-w-[40px] text-center"
      )}>
        ${lowestPrice}
      </div>
    </div>
  )
}