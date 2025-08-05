'use client'

import { useState, useEffect, useRef } from 'react'
import { SearchFilters, FuelType } from '@/components/MapSearchClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { MapPin, Target, DollarSign, Clock, Building, Search, Loader2, X } from 'lucide-react'

interface MapFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  display_name: string
  class: string
  type: string
  importance: number
  lat: string
  lon: string
  boundingbox: [string, string, string, string]
}

const FUEL_TYPES: { id: FuelType; label: string; icon: string }[] = [
  { id: 'nafta', label: 'Nafta Super', icon: '⛽' },
  { id: 'nafta_premium', label: 'Nafta Premium', icon: '⛽' },
  { id: 'gasoil', label: 'Gasoil Común', icon: '🚛' },
  { id: 'gasoil_premium', label: 'Gasoil Premium', icon: '🚛' },
  { id: 'gnc', label: 'GNC', icon: '⚡' }
]

const COMPANIES = [
  'YPF', 'Shell', 'Axion Energy', 'Puma Energy', 'Trafigura', 'Petrobras', 'Esso'
]

export function MapFilters({ filters, onFiltersChange }: MapFiltersProps) {
  // Address search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const resultsRef = useRef<HTMLDivElement>(null)
  
  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  // Search addresses using Nominatim API
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    
    try {
      // Focus on Argentina for better results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=AR&limit=5&addressdetails=1&accept-language=es`
      )
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda')
      }
      
      const results: NominatimResult[] = await response.json()
      setSearchResults(results)
      setShowResults(results.length > 0)
    } catch (error) {
      console.error('Error searching address:', error)
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(query)
    }, 500) // 500ms debounce
  }

  // Handle address selection
  const selectAddress = (result: NominatimResult) => {
    setSearchQuery(result.display_name)
    setShowResults(false)
    updateFilters({
      location: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      }
    })
  }

  // Clear location
  const clearLocation = () => {
    setSearchQuery('')
    setShowResults(false)
    updateFilters({ location: undefined })
  }

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const toggleFuelType = (fuelType: FuelType) => {
    const newFuelTypes = filters.fuelTypes.includes(fuelType)
      ? filters.fuelTypes.filter(f => f !== fuelType)
      : [...filters.fuelTypes, fuelType]
    updateFilters({ fuelTypes: newFuelTypes })
  }

  const toggleCompany = (company: string) => {
    const newCompanies = filters.companies.includes(company)
      ? filters.companies.filter(c => c !== company)
      : [...filters.companies, company]
    updateFilters({ companies: newCompanies })
  }

  const handleRadiusChange = (value: number) => {
    updateFilters({ radius: Math.max(1, Math.min(50, value)) })
  }

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newPriceRange = {
      ...filters.priceRange,
      [type]: value
    }
    // Ensure min <= max
    if (type === 'min' && value > filters.priceRange.max) {
      newPriceRange.max = value
    }
    if (type === 'max' && value < filters.priceRange.min) {
      newPriceRange.min = value
    }
    updateFilters({ priceRange: newPriceRange })
  }

  return (
    <div className="space-y-6">
      {/* Location Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <Label className="font-medium">Ubicación</Label>
        </div>
        
        {/* Address Search */}
        <div className="relative" ref={resultsRef}>
          <div className="relative">
            <Input
              placeholder="🔍 Buscar dirección en Argentina..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="w-full pr-8"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            )}
            {!isSearching && searchQuery && (
              <Search className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg">
              <div className="p-2 space-y-1">
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                    onClick={() => selectAddress(result)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {result.display_name.split(',')[0]}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {result.display_name.split(',').slice(1).join(',').trim()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* No results message */}
          {showResults && searchResults.length === 0 && searchQuery.length >= 3 && !isSearching && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
              <div className="p-3 text-sm text-muted-foreground text-center">
                No se encontraron resultados para "{searchQuery}"
              </div>
            </Card>
          )}
        </div>

        {/* Current Location Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setSearchQuery('Mi ubicación actual')
                  setShowResults(false)
                  updateFilters({
                    location: {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    }
                  })
                },
                (error) => {
                  console.error('Error getting location:', error)
                  alert('No se pudo obtener la ubicación. Verifique los permisos del navegador.')
                }
              )
            } else {
              alert('La geolocalización no está disponible en este navegador.')
            }
          }}
        >
          <Target className="h-4 w-4 mr-2" />
          Usar mi ubicación
        </Button>
        
        {/* Current Location Display */}
        {filters.location && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div className="text-xs text-muted-foreground">
              📍 Ubicación: {filters.location.lat.toFixed(4)}, {filters.location.lng.toFixed(4)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocation}
              className="h-6 w-6 p-0 hover:bg-background"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Search Radius */}
      <div className="space-y-3">
        <Label className="font-medium flex items-center gap-2">
          📏 Radio de búsqueda
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="50"
              value={filters.radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">km</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={filters.radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <Separator />

      {/* Fuel Types */}
      <div className="space-y-3">
        <Label className="font-medium flex items-center gap-2">
          ⛽ Tipos de combustible
        </Label>
        <div className="space-y-2">
          {FUEL_TYPES.map(fuel => (
            <div key={fuel.id} className="flex items-center space-x-2">
              <Checkbox
                id={fuel.id}
                checked={filters.fuelTypes.includes(fuel.id)}
                onCheckedChange={() => toggleFuelType(fuel.id)}
              />
              <Label 
                htmlFor={fuel.id}
                className="text-sm cursor-pointer flex items-center gap-2"
              >
                <span>{fuel.icon}</span>
                {fuel.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <Label className="font-medium">Rango de precios</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="minPrice" className="text-xs text-muted-foreground">Mínimo</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="Min"
              value={filters.priceRange.min}
              onChange={(e) => handlePriceRangeChange('min', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Máximo</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Max"
              value={filters.priceRange.max}
              onChange={(e) => handlePriceRangeChange('max', parseInt(e.target.value) || 9999)}
            />
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          ${filters.priceRange.min} - ${filters.priceRange.max}
        </div>
      </div>

      <Separator />

      {/* Companies */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-primary" />
          <Label className="font-medium">Empresas</Label>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {COMPANIES.map(company => (
            <div key={company} className="flex items-center space-x-2">
              <Checkbox
                id={company}
                checked={filters.companies.includes(company)}
                onCheckedChange={() => toggleCompany(company)}
              />
              <Label 
                htmlFor={company}
                className="text-sm cursor-pointer"
              >
                {company}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Time of Day */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <Label className="font-medium">Horario</Label>
        </div>
        <RadioGroup
          value={filters.timeOfDay}
          onValueChange={(value: 'diurno' | 'nocturno') => updateFilters({ timeOfDay: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="diurno" id="diurno" />
            <Label htmlFor="diurno" className="text-sm">Actual (Diurno)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nocturno" id="nocturno" />
            <Label htmlFor="nocturno" className="text-sm">Nocturno</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}