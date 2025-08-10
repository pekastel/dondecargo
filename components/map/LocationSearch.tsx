'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, MapPin, Target, Clock } from 'lucide-react'

interface LocationResult {
  id: string
  display_name: string
  lat: string
  lon: string
  type: string
}

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  placeholder?: string
  className?: string
}

export function LocationSearch({ onLocationSelect, placeholder = "Buscar dirección...", className }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dondecargo-recent-searches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {
        console.error('Error loading recent searches:', e)
      }
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 3) {
      setResults([])
      setShowResults(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const searchLocation = async (searchQuery: string) => {
    setLoading(true)
    try {
      // Using Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ar&limit=5&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (result: LocationResult) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    }
    
    onLocationSelect(location)
    setQuery(result.display_name.split(',')[0]) // Show shortened version
    setShowResults(false)
    
    // Save to recent searches
    const newRecentSearches = [
      result.display_name,
      ...recentSearches.filter(s => s !== result.display_name)
    ].slice(0, 5)
    
    setRecentSearches(newRecentSearches)
    localStorage.setItem('dondecargo-recent-searches', JSON.stringify(newRecentSearches))
  }

  const handleRecentSearchSelect = (address: string) => {
    setQuery(address.split(',')[0])
    searchLocation(address)
  }

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Reverse geocoding to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            )
            
            if (response.ok) {
              const data = await response.json()
              const location = {
                lat: latitude,
                lng: longitude,
                address: data.display_name || 'Mi ubicación actual'
              }
              
              onLocationSelect(location)
              setQuery('Mi ubicación actual')
              setShowResults(false)
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error)
            // Fallback: use coordinates without address
            onLocationSelect({
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            })
            setQuery('Mi ubicación actual')
          } finally {
            setLoading(false)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLoading(false)
          alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.')
        }
      )
    } else {
      alert('La geolocalización no está disponible en tu navegador.')
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || recentSearches.length > 0) {
              setShowResults(true)
            }
          }}
          className="pl-10 pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {query && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={useCurrentLocation}
            disabled={loading}
            className="h-6 w-6 p-0"
            title="Usar mi ubicación"
          >
            {loading ? (
              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
            ) : (
              <Target className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 p-2 shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && results.length === 0 && !loading && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Búsquedas recientes
              </div>
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleRecentSearchSelect(search)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{search.split(',').slice(0, 2).join(',')}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
              <span className="text-sm text-muted-foreground">Buscando...</span>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((result) => (
                <Button
                  key={result.id || result.display_name}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleLocationSelect(result)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">
                      {result.display_name.split(',')[0]}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {result.display_name.split(',').slice(1, 3).join(',').trim()}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && query.length >= 3 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResults(false)}
            >
              Cerrar
            </Button>
          </div>
        </Card>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}