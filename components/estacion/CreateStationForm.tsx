'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, MapPin, Building2, Link as LinkIcon, Phone, Clock, Fuel } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { extractCompanyFromName } from '@/lib/services/google-maps-service'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
]

const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

const DIAS_SEMANA_DISPLAY = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miércoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sábado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

const TIPOS_COMBUSTIBLE = [
  { value: 'nafta', label: 'Nafta' },
  { value: 'nafta_premium', label: 'Nafta Premium' },
  { value: 'gasoil', label: 'Diesel' },
  { value: 'gasoil_premium', label: 'Diesel Premium' },
  { value: 'gnc', label: 'GNC' },
]

const formSchema = z.object({
  googleMapsUrl: z.string().url('Debe ser una URL válida').min(1, 'URL requerida'),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(200),
  empresa: z.string().min(2, 'La empresa debe tener al menos 2 caracteres').max(100),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(300),
  localidad: z.string().min(2, 'La localidad debe tener al menos 2 caracteres').max(100),
  provincia: z.string().min(1, 'Seleccione una provincia'),
  cuit: z.string().optional(),
  telefono: z.string().max(50).optional(),
})

type FormData = z.infer<typeof formSchema> & {
  tienda: boolean
  banios: boolean
  lavadero: boolean
  wifi: boolean
  restaurante: boolean
  estacionamiento: boolean
}

interface Precio {
  tipoCombustible: string
  precio: string
  horario: 'diurno' | 'nocturno'
}

interface NearbyStation {
  placeId: string
  name: string
  address: string
  distance: number
}

export function CreateStationForm() {
  const router = useRouter()
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [coordenadas, setCoordenadas] = useState<{ latitud: number; longitud: number } | null>(null)
  const [horarios, setHorarios] = useState<Record<string, string>>({})
  const [precios, setPrecios] = useState<Precio[]>([])
  const [validationStatus, setValidationStatus] = useState<{
    validated: boolean
    isGasStation: boolean | null
    message: string
  }>({ validated: false, isGasStation: null, message: '' })
  const [nearbyStations, setNearbyStations] = useState<NearbyStation[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [enrichingSelection, setEnrichingSelection] = useState(false)
  const [selectedProvincia, setSelectedProvincia] = useState('')
  const [horarioMode, setHorarioMode] = useState<'auto' | '24h' | 'mismo' | 'semana' | 'personalizado'>('auto')
  
  const {register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tienda: false,
      banios: false,
      lavadero: false,
      wifi: false,
      restaurante: false,
      estacionamiento: false,
    }
  })

  const googleMapsUrl = watch('googleMapsUrl')

  // Función auxiliar para auto-completar campos
  async function autoCompleteFields(enrichedData: any) {
    let autoCompletedFields: string[] = []
    
    // DEBUG: Log completo de enrichedData
    console.log('🔍 DEBUG enrichedData completo:', JSON.stringify(enrichedData, null, 2))
    console.log('🔍 DEBUG addressComponents:', enrichedData.addressComponents)
    
    // 1. Nombre (directo de Google)
    if (enrichedData.name) {
      setValue('nombre', enrichedData.name)
      autoCompletedFields.push('nombre')
    }
    
    // 2. Empresa (extraída del nombre)
    const extractedCompany = extractCompanyFromName(enrichedData.name)
    if (extractedCompany) {
      setValue('empresa', extractedCompany)
      autoCompletedFields.push('empresa')
      console.log(`🏢 Empresa detectada: ${extractedCompany}`)
    } else {
      console.log(`⚠️ No se pudo detectar empresa automáticamente. Por favor ingrésala manualmente.`)
    }
    
    // 3. Dirección (directa de Google)
    if (enrichedData.address) {
      setValue('direccion', enrichedData.address)
      autoCompletedFields.push('dirección')
    }
    
    // 4. Localidad (parseada correctamente)
    if (enrichedData.addressComponents?.locality) {
      setValue('localidad', enrichedData.addressComponents.locality)
      autoCompletedFields.push('localidad')
      console.log(`📍 Localidad: ${enrichedData.addressComponents.locality}`)
    } else {
      console.log(`⚠️ Localidad no detectada, por favor ingrésala manualmente`)
    }
    
    // 5. Provincia (parseada correctamente)
    if (enrichedData.addressComponents?.province) {
      const provinciaValue = enrichedData.addressComponents.province
      setSelectedProvincia(provinciaValue)
      setValue('provincia', provinciaValue, { 
        shouldValidate: true,
        shouldDirty: true 
      })
      autoCompletedFields.push('provincia')
      console.log(`📍 Provincia: ${provinciaValue}`)
    } else {
      console.log(`⚠️ Provincia no detectada, por favor selecciónala manualmente`)
    }
    
    // 6. Teléfono (si existe)
    if (enrichedData.phone) {
      setValue('telefono', enrichedData.phone)
      autoCompletedFields.push('teléfono')
    }
    
    // 7. Horarios (si existen)
    if (enrichedData.hours) {
      setHorarios(enrichedData.hours)
      autoCompletedFields.push('horarios')
    }
    
    // Log resumen de campos auto-completados
    console.log(`✅ Campos auto-completados (${autoCompletedFields.length}): ${autoCompletedFields.join(', ')}`)
    
    // Warnings específicos si faltan campos críticos
    const warnings = []
    if (!enrichedData.addressComponents?.locality) {
      warnings.push('Localidad no detectada - completá manualmente')
    }
    if (!enrichedData.addressComponents?.province) {
      warnings.push('Provincia no detectada - seleccioná manualmente')
    }
    if (!extractedCompany) {
      warnings.push('Empresa no detectada - ingresá la marca')
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️ Campos que necesitan atención:`, warnings)
    }
    
    return { completedFields: autoCompletedFields, warnings }
  }

  async function extractGoogleMapsData() {
    if (!googleMapsUrl) {
      toast.error('Ingresa una URL de Google Maps primero')
      return
    }

    setExtracting(true)
    setCoordenadas(null)
    setNearbyStations([])
    setSelectedPlaceId(null)
    setValidationStatus({ validated: false, isGasStation: null, message: '' })
    
    try {
      const response = await fetch('/api/estaciones/extract-google-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleMapsUrl }),
      })

      const data = await response.json()
      
      // Si la API retorna error (lugar no es estación de servicio)
      if (!response.ok) {
        // Caso 1: No es estación de servicio (400)
        if (data.isGasStation === false) {
          setValidationStatus({
            validated: true,
            isGasStation: false,
            message: data.error || 'Este lugar no es una estación de servicio'
          })
          toast.error(data.error || 'Este lugar no es una estación de servicio')
          return
        }
        
        // Caso 2: No se encontraron estaciones en el radio (404)
        if (response.status === 404) {
          const searchRadius = data.searchRadius || 300
          setValidationStatus({
            validated: false,
            isGasStation: null,
            message: data.error || `No se encontraron estaciones de servicio en un radio de ${searchRadius} metros`
          })
          toast.error(data.error || `No se encontraron estaciones en un radio de ${searchRadius} metros`, {
            description: data.details || `El punto debe corresponder a una estación o estar a menos de ${searchRadius}m de distancia.`,
            duration: 6000
          })
          return
        }
        
        // Caso 3: Otros errores
        throw new Error(data.error || 'Error al extraer datos')
      }
      
      // Si necesita selección (Nearby Search retornó opciones)
      if (data.needsSelection && data.nearbyStations) {
        console.log(`🏪 Found ${data.nearbyStations.length} nearby stations`)
        setCoordenadas(data.coordinates)
        setNearbyStations(data.nearbyStations)
        setValidationStatus({
          validated: true,
          isGasStation: true,
          message: `Encontramos ${data.nearbyStations.length} estación(es) cerca. Selecciona la tuya.`
        })
        toast.info(`Encontramos ${data.nearbyStations.length} estación(es) cerca. Selecciona la correcta.`)
        return
      }
      
      // Flujo directo con auto-completado
      setCoordenadas(data.coordinates)
      
      // Actualizar estado de validación
      setValidationStatus({
        validated: data.validated,
        isGasStation: data.isGasStation,
        message: data.validated && data.isGasStation 
          ? '✓ Estación de servicio verificada con Google Places API'
          : data.warning || 'Coordenadas extraídas (sin validación automática)'
      })
      
      // Auto-completar campos si hay datos enriquecidos
      if (data.enrichedData) {
        const result = await autoCompleteFields(data.enrichedData)
        
        if (result.completedFields.length > 0) {
          toast.success(`¡Auto-completados ${result.completedFields.length} campos desde Google Maps!`, {
            description: result.warnings.length > 0 
              ? `Atención: ${result.warnings.join(', ')}`
              : `Revisá los datos y completá lo que falta (CUIT, servicios)`
          })
          
          // Mostrar warnings adicionales si hay campos críticos faltantes
          if (result.warnings.length > 0) {
            setTimeout(() => {
              toast.warning('Algunos campos necesitan tu atención', {
                description: result.warnings.join(' • ')
              })
            }, 1500)
          }
        } else {
          toast.warning('No se pudieron auto-completar campos automáticamente')
        }
      } else if (data.placeData?.nombre) {
        setValue('nombre', data.placeData.nombre)
        toast.success('Coordenadas extraídas')
      } else {
        toast.success('Coordenadas extraídas')
      }
      
      // Mostrar warning si no hubo validación
      if (data.warning) {
        toast.info(data.warning, { duration: 5000 })
      }
    } catch (error) {
      console.error('Error extracting Google Maps data:', error)
      toast.error(error instanceof Error ? error.message : 'Error al extraer datos de Google Maps')
      setValidationStatus({
        validated: false,
        isGasStation: null,
        message: ''
      })
    } finally {
      setExtracting(false)
    }
  }

  async function handleConfirmSelection() {
    if (!selectedPlaceId) {
      toast.error('Selecciona una estación primero')
      return
    }

    setEnrichingSelection(true)
    
    try {
      const response = await fetch('/api/estaciones/enrich-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: selectedPlaceId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al obtener datos')
      }

      const data = await response.json()
      
      // Auto-completar campos
      const result = await autoCompleteFields(data.enrichedData)
      
      // Actualizar coordenadas con las precisas del lugar seleccionado
      if (data.enrichedData.coordinates) {
        setCoordenadas(data.enrichedData.coordinates)
      }
      
      // Limpiar selector
      setNearbyStations([])
      setSelectedPlaceId(null)
      
      setValidationStatus({
        validated: true,
        isGasStation: true,
        message: '✓ Estación de servicio verificada y datos auto-completados'
      })
      
      if (result.completedFields.length > 0) {
        toast.success(`¡Auto-completados ${result.completedFields.length} campos!`, {
          description: result.warnings.length > 0
            ? `Atención: ${result.warnings.join(', ')}`
            : 'Revisá los datos y completá lo que falta (CUIT, servicios)'
        })
        
        // Mostrar warnings adicionales si hay
        if (result.warnings.length > 0) {
          setTimeout(() => {
            toast.warning('Algunos campos necesitan tu atención', {
              description: result.warnings.join(' • ')
            })
          }, 1500)
        }
      } else {
        toast.warning('Estación seleccionada, pero algunos campos deben completarse manualmente')
      }
    } catch (error) {
      console.error('Error enriching selection:', error)
      toast.error(error instanceof Error ? error.message : 'Error al obtener datos de la estación')
    } finally {
      setEnrichingSelection(false)
    }
  }

  function addPrecio() {
    setPrecios([...precios, { tipoCombustible: 'nafta', precio: '', horario: 'diurno' }])
  }

  function removePrecio(index: number) {
    setPrecios(precios.filter((_, i) => i !== index))
  }

  function updatePrecio(index: number, field: keyof Precio, value: string) {
    const newPrecios = [...precios]
    newPrecios[index] = { ...newPrecios[index], [field]: value }
    setPrecios(newPrecios)
  }

  async function onSubmit(data: FormData) {
    if (!coordenadas) {
      toast.error('Primero debes extraer las coordenadas de Google Maps')
      return
    }
    
    // Bloquear submit si la validación falló
    if (validationStatus.validated && validationStatus.isGasStation === false) {
      toast.error('No se puede crear la estación: el lugar no es una estación de servicio')
      return
    }

    setSubmitting(true)
    
    try {
      // Construir servicios
      const servicios = {
        tienda: data.tienda,
        banios: data.banios,
        lavadero: data.lavadero,
        wifi: data.wifi,
        restaurante: data.restaurante,
        estacionamiento: data.estacionamiento,
      }

      // Construir precios validados
      const preciosValidados = precios
        .filter(p => p.precio && parseFloat(p.precio) > 0)
        .map(p => ({
          tipoCombustible: p.tipoCombustible,
          precio: parseFloat(p.precio),
          horario: p.horario,
        }))

      const payload = {
        googleMapsUrl: data.googleMapsUrl,
        nombre: data.nombre,
        empresa: data.empresa,
        direccion: data.direccion,
        localidad: data.localidad,
        provincia: data.provincia,
        cuit: data.cuit || undefined,
        telefono: data.telefono || undefined,
        horarios: Object.keys(horarios).length > 0 ? horarios : undefined,
        servicios: Object.values(servicios).some(v => v) ? servicios : undefined,
        precios: preciosValidados.length > 0 ? preciosValidados : undefined,
      }

      const response = await fetch('/api/estaciones/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear estación')
      }

      const result = await response.json()
      
      toast.success('¡Estación creada exitosamente! Está pendiente de aprobación.')
      toast.info('Redirigiendo a tu dashboard...')
      
      // Redirigir al dashboard de mis estaciones después de 2 segundos
      setTimeout(() => {
        router.push('/mis-estaciones')
      }, 2000)
    } catch (error) {
      console.error('Error creating station:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear la estación')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* URL de Google Maps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            URL de Google Maps
          </CardTitle>
          <CardDescription>
            Pega la URL de tu estación desde Google Maps para extraer automáticamente las coordenadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="googleMapsUrl">URL de Google Maps *</Label>
            <Input
              id="googleMapsUrl"
              placeholder="https://www.google.com/maps/place/..."
              {...register('googleMapsUrl')}
            />
            {errors.googleMapsUrl && (
              <p className="text-sm text-destructive">{errors.googleMapsUrl.message}</p>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={extractGoogleMapsData}
            disabled={extracting || !googleMapsUrl}
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extrayendo datos...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Extraer Coordenadas
              </>
            )}
          </Button>

          {/* Estado de Validación */}
          {validationStatus.isGasStation === false && (
            <div className="bg-destructive/10 border border-destructive p-4 rounded-md">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-destructive">
                    Este lugar no es una estación de servicio
                  </p>
                  <p className="text-sm text-destructive/80 mt-1">
                    {validationStatus.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Mensaje cuando no se encuentran estaciones en el radio */}
          {!validationStatus.validated && validationStatus.message.includes('No se encontraron estaciones') && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-700 dark:text-orange-400">
                    No se encontraron estaciones de servicio en el área
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                    {validationStatus.message}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-orange-600 dark:text-orange-500">
                    <p className="font-medium">📍 Requisitos:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>El punto debe ser una estación de servicio registrada en Google Maps</li>
                      <li>O estar a menos de 300 metros de una estación</li>
                    </ul>
                    <p className="font-medium mt-2">💡 Cómo solucionarlo:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>Busca el nombre de tu estación en Google Maps (ej: "YPF Ruta 9")</li>
                      <li>Haz clic en la estación en el mapa</li>
                      <li>Copia la URL completa desde la barra de direcciones</li>
                      <li>No uses un punto genérico en el mapa</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {validationStatus.isGasStation === true && coordenadas && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    ✓ Estación de servicio verificada
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    {validationStatus.message}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Coordenadas: {coordenadas.latitud.toFixed(6)}, {coordenadas.longitud.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {coordenadas && !validationStatus.validated && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                    Coordenadas extraídas (sin validación automática)
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                    {validationStatus.message || 'Por favor, verifica manualmente que la ubicación sea una estación de servicio.'}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Coordenadas: {coordenadas.latitud.toFixed(6)}, {coordenadas.longitud.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selector de estaciones cercanas */}
          {nearbyStations.length > 0 && (
            <Card className="mt-4 border-2 border-blue-500">
              <CardHeader>
                <CardTitle>Selecciona tu Estación</CardTitle>
                <CardDescription>
                  Encontramos {nearbyStations.length} estación(es) de servicio cerca de la ubicación proporcionada. 
                  Selecciona la correcta:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedPlaceId || ''} onValueChange={setSelectedPlaceId}>
                  {nearbyStations.map((station) => (
                    <div
                      key={station.placeId}
                      className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                        selectedPlaceId === station.placeId ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => setSelectedPlaceId(station.placeId)}
                    >
                      <RadioGroupItem value={station.placeId} className="mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">{station.name}</p>
                        <p className="text-sm text-muted-foreground">{station.address}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {station.distance} metros de distancia
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
                
                <Button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={!selectedPlaceId || enrichingSelection}
                  className="w-full"
                >
                  {enrichingSelection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Obteniendo datos...
                    </>
                  ) : (
                    'Confirmar y Auto-completar Datos'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Estación *</Label>
              <Input
                id="nombre"
                placeholder="YPF Av. Corrientes"
                {...register('nombre')}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa/Marca *</Label>
              <Input
                id="empresa"
                placeholder="YPF, Shell, Axion, etc."
                {...register('empresa')}
              />
              {errors.empresa && (
                <p className="text-sm text-destructive">{errors.empresa.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input
              id="direccion"
              placeholder="Av. Corrientes 1234"
              {...register('direccion')}
            />
            {errors.direccion && (
              <p className="text-sm text-destructive">{errors.direccion.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="localidad">Localidad *</Label>
              <Input
                id="localidad"
                placeholder="Buenos Aires"
                {...register('localidad')}
              />
              {errors.localidad && (
                <p className="text-sm text-destructive">{errors.localidad.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia *</Label>
              <Select 
                value={selectedProvincia} 
                onValueChange={(value) => {
                  setSelectedProvincia(value)
                  setValue('provincia', value, {
                    shouldValidate: true,
                    shouldDirty: true
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIAS.map((provincia) => (
                    <SelectItem key={provincia} value={provincia}>
                      {provincia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.provincia && (
                <p className="text-sm text-destructive">{errors.provincia.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT (opcional)</Label>
              <Input
                id="cuit"
                placeholder="20-12345678-9"
                {...register('cuit')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                placeholder="+54 11 1234-5678"
                {...register('telefono')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horarios de Atención */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios de Atención
          </CardTitle>
          <CardDescription>Configura los horarios de tu estación (opcional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Si hay horarios auto-completados de Google */}
          {horarioMode === 'auto' && Object.keys(horarios).length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  ✓ Horarios obtenidos de Google Maps
                </p>
                <Button 
                  type="button"
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setHorarioMode('personalizado')
                    setHorarios({})
                  }}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Editar
                </Button>
              </div>
              <div className="grid gap-1.5 text-sm">
                {Object.entries(horarios).map(([dia, horario]) => (
                  <div key={dia} className="flex justify-between items-center py-1 border-b border-blue-100 dark:border-blue-900 last:border-0">
                    <span className="capitalize font-medium text-blue-900 dark:text-blue-300">{dia}:</span>
                    <span className="text-blue-700 dark:text-blue-400">{horario}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Opciones rápidas */}
          {horarioMode !== 'auto' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  type="button"
                  variant={horarioMode === '24h' ? 'default' : 'outline'}
                  onClick={() => {
                    setHorarioMode('24h')
                    const horarios24h: Record<string, string> = {}
                    DIAS_SEMANA.forEach(dia => { horarios24h[dia] = '24 horas' })
                    setHorarios(horarios24h)
                  }}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-sm font-semibold">24 Horas</span>
                  <span className="text-xs opacity-80">Todos los días</span>
                </Button>
                
                <Button 
                  type="button"
                  variant={horarioMode === 'mismo' ? 'default' : 'outline'}
                  onClick={() => setHorarioMode('mismo')}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-sm font-semibold">Mismo Horario</span>
                  <span className="text-xs opacity-80">Todos los días</span>
                </Button>
                
                <Button 
                  type="button"
                  variant={horarioMode === 'semana' ? 'default' : 'outline'}
                  onClick={() => setHorarioMode('semana')}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-sm font-semibold">Lun-Vie + Sáb-Dom</span>
                  <span className="text-xs opacity-80">2 horarios</span>
                </Button>
                
                <Button 
                  type="button"
                  variant={horarioMode === 'personalizado' ? 'default' : 'outline'}
                  onClick={() => setHorarioMode('personalizado')}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  <span className="text-sm font-semibold">Personalizado</span>
                  <span className="text-xs opacity-80">Día por día</span>
                </Button>
              </div>

              {/* Mismo horario para todos los días */}
              {horarioMode === 'mismo' && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label>Horario para todos los días</Label>
                  <Input
                    placeholder="ej: 08:00-20:00"
                    onChange={(e) => {
                      const horarioUnificado: Record<string, string> = {}
                      DIAS_SEMANA.forEach(dia => { horarioUnificado[dia] = e.target.value })
                      setHorarios(horarioUnificado)
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este horario se aplicará de lunes a domingo
                  </p>
                </div>
              )}

              {/* Horario semana + fin de semana */}
              {horarioMode === 'semana' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Lunes a Viernes</Label>
                    <Input
                      placeholder="ej: 08:00-20:00"
                      onChange={(e) => {
                        const value = e.target.value
                        setHorarios(prev => ({
                          ...prev,
                          lunes: value,
                          martes: value,
                          miércoles: value,
                          jueves: value,
                          viernes: value
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sábado y Domingo</Label>
                    <Input
                      placeholder="ej: 09:00-18:00 o Cerrado"
                      onChange={(e) => {
                        const value = e.target.value
                        setHorarios(prev => ({
                          ...prev,
                          sábado: value,
                          domingo: value
                        }))
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Personalizado día por día */}
              {horarioMode === 'personalizado' && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Ingresa el horario para cada día
                  </p>
                  {DIAS_SEMANA_DISPLAY.map((dia) => (
                    <div key={dia.key} className="flex items-center gap-3">
                      <Label className="w-24 text-right">{dia.label}</Label>
                      <Input
                        placeholder="ej: 08:00-20:00"
                        value={horarios[dia.key] || ''}
                        onChange={(e) => setHorarios({
                          ...horarios,
                          [dia.key]: e.target.value
                        })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Servicios */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Disponibles</CardTitle>
          <CardDescription>Marca los servicios que ofrece tu estación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="tienda" {...register('tienda')} />
              <Label htmlFor="tienda" className="font-normal cursor-pointer">
                Tienda
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="banios" {...register('banios')} />
              <Label htmlFor="banios" className="font-normal cursor-pointer">
                Baños
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="lavadero" {...register('lavadero')} />
              <Label htmlFor="lavadero" className="font-normal cursor-pointer">
                Lavadero
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="wifi" {...register('wifi')} />
              <Label htmlFor="wifi" className="font-normal cursor-pointer">
                WiFi
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="restaurante" {...register('restaurante')} />
              <Label htmlFor="restaurante" className="font-normal cursor-pointer">
                Restaurante
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="estacionamiento" {...register('estacionamiento')} />
              <Label htmlFor="estacionamiento" className="font-normal cursor-pointer">
                Estacionamiento
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Precios (opcional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Precios Actuales (Opcional)
          </CardTitle>
          <CardDescription>Agrega los precios actuales de combustibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {precios.map((precio, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Combustible</Label>
                <Select
                  value={precio.tipoCombustible}
                  onValueChange={(value) => updatePrecio(index, 'tipoCombustible', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_COMBUSTIBLE.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Precio ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1250.50"
                  value={precio.precio}
                  onChange={(e) => updatePrecio(index, 'precio', e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Horario</Label>
                <Select
                  value={precio.horario}
                  onValueChange={(value) => updatePrecio(index, 'horario', value as 'diurno' | 'nocturno')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diurno">Diurno</SelectItem>
                    <SelectItem value="nocturno">Nocturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removePrecio(index)}
              >
                ×
              </Button>
            </div>
          ))}
          
          <Button type="button" variant="outline" onClick={addPrecio}>
            + Agregar Precio
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={
            submitting || 
            !coordenadas || 
            (validationStatus.validated && validationStatus.isGasStation === false)
          }
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Estación'
          )}
        </Button>
      </div>
    </form>
  )
}

