import { z } from "zod";
import { FuelService } from "@/lib/services/fuel-service";
import { createMcpResponse, createMcpError } from "./utils";
import { FUEL_TYPES, FUEL_LABELS, FuelType, HorarioType } from "@/lib/types";

const fuelService = new FuelService();

export const searchStationsTool = {
  name: "search_stations",
  description: "Search gas stations by location, company, fuel type, and price range. Returns stations with current fuel prices.",
  schema: {
    lat: z.number().describe("Latitude for location-based search"),
    lng: z.number().describe("Longitude for location-based search"),
    radius: z.number().min(1).max(50).optional().default(10).describe("Search radius in kilometers (max 50km)"),
    empresa: z.string().optional().describe("Company name to filter by (can be comma-separated list)"),
    provincia: z.string().optional().describe("Province name to filter by"),
    localidad: z.string().optional().describe("City/locality name to filter by"),
    combustible: z.enum(FUEL_TYPES as [string, ...string[]]).optional().describe("Fuel type to filter by"),
    horario: z.enum(['diurno', 'nocturno']).optional().default('diurno').describe("Schedule: diurno (daytime) or nocturno (nighttime)"),
    precioMin: z.number().min(0).optional().describe("Minimum price filter"),
    precioMax: z.number().max(5000).optional().describe("Maximum price filter"),
    limit: z.number().min(1).max(100).optional().default(20).describe("Maximum number of results (max 100)"),
    offset: z.number().min(0).optional().default(0).describe("Offset for pagination"),
  },
  handler: async (params: {
    lat?: number;
    lng?: number;
    radius?: number;
    empresa?: string;
    provincia?: string;
    localidad?: string;
    combustible?: string;
    horario?: 'diurno' | 'nocturno';
    precioMin?: number;
    precioMax?: number;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const result = await fuelService.searchStations({
        ...params,
        combustible: params.combustible as FuelType | undefined
      });
      
      if (result.data.length === 0) {
        return createMcpResponse("No se encontraron estaciones con los criterios especificados.");
      }

      const stationList = result.data.map(station => {
        const distance = station.distancia ? ` (${station.distancia.toFixed(1)}km)` : '';
        const pricesText = station.precios.length > 0 
          ? station.precios.map(p => 
              `${FUEL_LABELS[p.tipoCombustible as FuelType] || p.tipoCombustible}: $${p.precio} (${p.fuente})`
            ).join(', ')
          : 'Sin precios disponibles';
        
        return `• ${station.nombre} - ${station.empresa}${distance}\\n  📍 ${station.direccion}, ${station.localidad}, ${station.provincia}\\n  💰 ${pricesText}`;
      }).join('\\n\\n');

      const locationInfo = params.lat && params.lng 
        ? `cerca de la ubicación (${params.lat}, ${params.lng}) en un radio de ${params.radius || 10}km`
        : '';
      
      const filterInfo = [
        params.empresa ? `empresa: ${params.empresa}` : '',
        params.provincia ? `provincia: ${params.provincia}` : '',
        params.localidad ? `localidad: ${params.localidad}` : '',
        params.combustible ? `combustible: ${FUEL_LABELS[params.combustible as FuelType]}` : '',
        params.precioMin ? `precio min: $${params.precioMin}` : '',
        params.precioMax ? `precio max: $${params.precioMax}` : '',
      ].filter(Boolean).join(', ');

      const summary = `Encontré ${result.data.length} estación(es) ${locationInfo}${filterInfo ? ` (filtros: ${filterInfo})` : ''}:`;

      return createMcpResponse(`${summary}\\n\\n${stationList}`);
    } catch (error) {
      return createMcpError(
        `Error buscando estaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  },
};

export const getStationDetailsTool = {
  name: "get_station_details",
  description: "Get detailed information and all fuel prices for a specific gas station by ID.",
  schema: {
    stationId: z.string().min(1, "Station ID is required"),
  },
  handler: async (params: { stationId: string }) => {
    try {
      const station = await fuelService.getStationDetails(params.stationId);
      
      if (!station) {
        return createMcpError("Estación no encontrada.");
      }

      const pricesText = station.precios.length > 0
        ? station.precios
            .reduce((groups: Record<string, Array<typeof station.precios[0]>>, price) => {
              if (!groups[price.horario]) groups[price.horario] = [];
              groups[price.horario].push(price);
              return groups;
            }, {})
        : {};

      let pricesDisplay = '';
      Object.entries(pricesText).forEach(([horario, prices]: [string, Array<typeof station.precios[0]>]) => {
        pricesDisplay += `\\n**${horario.charAt(0).toUpperCase() + horario.slice(1)}:**\\n`;
        prices.forEach(price => {
          const fuelLabel = FUEL_LABELS[price.tipoCombustible as FuelType] || price.tipoCombustible;
          const sourceText = price.fuente === 'oficial' ? 'Oficial' : 'Usuario';
          pricesDisplay += `  ${fuelLabel}: $${price.precio} (${sourceText})\\n`;
        });
      });

      if (!pricesDisplay) {
        pricesDisplay = '\\nSin precios disponibles';
      }

      const stationInfo = `**${station.nombre}** - ${station.empresa}\\n` +
        `📍 ${station.direccion}\\n` +
        `🏙️ ${station.localidad}, ${station.provincia}\\n` +
        `🗺️ Coordenadas: ${station.latitud}, ${station.longitud}\\n` +
        `📅 Actualizada: ${station.fechaActualizacion?.toLocaleString() || 'No disponible'}\\n` +
        `💰 **Precios:**${pricesDisplay}`;

      return createMcpResponse(stationInfo);
    } catch (error) {
      return createMcpError(
        `Error obteniendo detalles de estación: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  },
};

export const findCheapestFuelTool = {
  name: "find_cheapest_fuel",
  description: "Find the cheapest fuel prices for a specific fuel type in an area.",
  schema: {
    fuelType: z.enum(FUEL_TYPES as [string, ...string[]]).describe("Type of fuel to search for"),
    lat: z.number().optional().describe("Latitude for location-based search"),
    lng: z.number().optional().describe("Longitude for location-based search"),
    radius: z.number().min(1).max(50).optional().default(20).describe("Search radius in kilometers (max 50km)"),
    horario: z.enum(['diurno', 'nocturno']).optional().default('diurno').describe("Schedule: diurno (daytime) or nocturno (nighttime)"),
    limit: z.number().min(1).max(20).optional().default(10).describe("Maximum number of results (max 20)"),
  },
  handler: async (params: {
    fuelType: string;
    lat?: number;
    lng?: number;
    radius?: number;
    horario?: 'diurno' | 'nocturno';
    limit?: number;
  }) => {
    try {
      const result = await fuelService.findCheapestFuel(
        params.fuelType as FuelType,
        params.lat,
        params.lng,
        params.radius,
        params.horario as HorarioType,
        params.limit
      );
      
      if (result.length === 0) {
        return createMcpResponse(`No se encontraron precios para ${FUEL_LABELS[params.fuelType as FuelType]} en la zona especificada.`);
      }

      const cheapestList = result.map((station, index) => {
        const price = station.precios[0]; // Should only have one price per station
        const distance = station.distancia ? ` (${station.distancia.toFixed(1)}km)` : '';
        const sourceText = price.fuente === 'oficial' ? 'Oficial' : 'Usuario';
        
        return `${index + 1}. **$${price.precio}** - ${station.nombre} (${station.empresa})${distance}\\n` +
               `   📍 ${station.direccion}, ${station.localidad}\\n` +
               `   📊 Fuente: ${sourceText}, Reportado: ${price.fechaReporte?.toLocaleDateString() || 'N/A'}`;
      }).join('\\n\\n');

      const locationInfo = params.lat && params.lng 
        ? `cerca de la ubicación (${params.lat}, ${params.lng}) en un radio de ${params.radius || 20}km`
        : 'en el área de búsqueda';

      const summary = `🔍 **Los ${result.length} precios más baratos de ${FUEL_LABELS[params.fuelType as FuelType]} (${params.horario})** ${locationInfo}:`;

      return createMcpResponse(`${summary}\\n\\n${cheapestList}`);
    } catch (error) {
      return createMcpError(
        `Error buscando combustible más barato: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  },
};

export const getPriceHistoryTool = {
  name: "get_price_history",
  description: "Get historical fuel price data for a specific gas station.",
  schema: {
    stationId: z.string().min(1, "Station ID is required"),
    fuelType: z.enum(FUEL_TYPES as [string, ...string[]]).optional().describe("Specific fuel type to get history for"),
    horario: z.enum(['diurno', 'nocturno']).optional().default('diurno').describe("Schedule: diurno (daytime) or nocturno (nighttime)"),
    days: z.number().min(1).max(90).optional().default(30).describe("Number of days of history to retrieve (max 90)"),
  },
  handler: async (params: {
    stationId: string;
    fuelType?: string;
    horario?: 'diurno' | 'nocturno';
    days?: number;
  }) => {
    try {
      // First get station details for context
      const station = await fuelService.getStationDetails(params.stationId);
      if (!station) {
        return createMcpError("Estación no encontrada.");
      }

      const history = await fuelService.getPriceHistory(
        params.stationId,
        params.fuelType as FuelType | undefined,
        params.horario as HorarioType,
        params.days
      );
      
      if (history.length === 0) {
        const fuelInfo = params.fuelType ? ` de ${FUEL_LABELS[params.fuelType as FuelType]}` : '';
        return createMcpResponse(`No se encontró historial de precios${fuelInfo} para esta estación en los últimos ${params.days} días.`);
      }

      // Group by fuel type
      const historyByFuel = history.reduce((groups: Record<string, typeof history>, item) => {
        if (!groups[item.tipoCombustible]) groups[item.tipoCombustible] = [];
        groups[item.tipoCombustible].push(item);
        return groups;
      }, {});

      let historyDisplay = '';
      Object.entries(historyByFuel).forEach(([fuelType, prices]) => {
        const fuelLabel = FUEL_LABELS[fuelType as FuelType] || fuelType;
        historyDisplay += `\\n**${fuelLabel}:**\\n`;
        
        prices.slice(0, 10).forEach(price => { // Limit to 10 most recent
          const sourceText = price.fuente === 'oficial' ? 'Oficial' : 'Usuario';
          historyDisplay += `  $${price.precio} - ${price.fechaVigencia.toLocaleDateString()} (${sourceText})\\n`;
        });
      });

      const summary = `📊 **Historial de precios (${params.horario})** - ${station.nombre}\\n` +
        `📍 ${station.direccion}, ${station.localidad}\\n` +
        `📅 Últimos ${params.days} días:`;

      return createMcpResponse(`${summary}${historyDisplay}`);
    } catch (error) {
      return createMcpError(
        `Error obteniendo historial de precios: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  },
};

export const getRegionalSummaryTool = {
  name: "get_regional_summary",
  description: "Get a regional summary of fuel stations and average prices by province, locality, and company.",
  schema: {
    provincia: z.string().optional().describe("Province name to filter summary by"),
  },
  handler: async (params: { provincia?: string }) => {
    try {
      const summary = await fuelService.getRegionalSummary(params.provincia);
      
      if (summary.length === 0) {
        const provinciaText = params.provincia ? ` en ${params.provincia}` : '';
        return createMcpResponse(`No se encontraron datos para generar resumen regional${provinciaText}.`);
      }

      // Group by province and locality
      interface RegionSummary {
        provincia: string;
        localidad: string;
        companies: Set<string>;
        totalStations: number;
        fuelData: Record<string, { avg: number; stations: number }>;
      }
      
      const summaryByRegion = summary.reduce((groups: Record<string, RegionSummary>, item) => {
        const key = `${item.provincia} - ${item.localidad}`;
        if (!groups[key]) {
          groups[key] = {
            provincia: item.provincia,
            localidad: item.localidad,
            companies: new Set(),
            totalStations: 0,
            fuelData: {}
          };
        }
        groups[key].companies.add(item.empresa);
        groups[key].totalStations += item.totalEstaciones;
        
        const fuelLabel = FUEL_LABELS[item.tipoCombustible as FuelType] || item.tipoCombustible;
        groups[key].fuelData[fuelLabel] = {
          avg: item.precioPromedio,
          stations: item.totalEstaciones
        };
        
        return groups;
      }, {});

      let summaryDisplay = '';
      Object.entries(summaryByRegion).slice(0, 15).forEach(([, data]) => {
        const companiesText = Array.from(data.companies).slice(0, 3).join(', ');
        const moreCompanies = data.companies.size > 3 ? ` +${data.companies.size - 3} más` : '';
        
        summaryDisplay += `\\n**${data.localidad}, ${data.provincia}**\\n`;
        summaryDisplay += `  🏪 ${data.totalStations} estaciones - Empresas: ${companiesText}${moreCompanies}\\n`;
        
        Object.entries(data.fuelData).forEach(([fuel, info]) => {
          summaryDisplay += `  ⛽ ${fuel}: $${info.avg.toFixed(2)} promedio\\n`;
        });
      });

      const provinciaText = params.provincia ? ` en ${params.provincia}` : ' nacional';
      const summaryTitle = `📊 **Resumen regional${provinciaText}:**`;

      return createMcpResponse(`${summaryTitle}${summaryDisplay}`);
    } catch (error) {
      return createMcpError(
        `Error obteniendo resumen regional: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  },
};

export const createStationTool = {
  name: "create_station",
  description: "Create a new gas station in the system. Requires authentication. The station will be pending approval by admin.",
  schema: {
    googleMapsUrl: z.string().url("Must be a valid Google Maps URL"),
    nombre: z.string().min(3).max(200).describe("Station name"),
    empresa: z.string().min(2).max(100).describe("Company/Brand name"),
    direccion: z.string().min(5).max(300).describe("Street address"),
    localidad: z.string().min(2).max(100).describe("City/locality"),
    provincia: z.string().min(2).max(100).describe("Province"),
    cuit: z.string().optional().describe("Tax ID (optional)"),
    telefono: z.string().max(50).optional().describe("Phone number (optional)"),
    servicios: z.object({
      tienda: z.boolean().optional(),
      banios: z.boolean().optional(),
      lavadero: z.boolean().optional(),
      wifi: z.boolean().optional(),
      restaurante: z.boolean().optional(),
      estacionamiento: z.boolean().optional(),
    }).optional().describe("Available services"),
  },
  handler: async (params: {
    googleMapsUrl: string;
    nombre: string;
    empresa: string;
    direccion: string;
    localidad: string;
    provincia: string;
    cuit?: string;
    telefono?: string;
    servicios?: {
      tienda?: boolean;
      banios?: boolean;
      lavadero?: boolean;
      wifi?: boolean;
      restaurante?: boolean;
      estacionamiento?: boolean;
    };
  }) => {
    try {
      // This would need to be called with authentication context
      // For now, return an error indicating authentication is required
      return createMcpError(
        "La creación de estaciones requiere autenticación. Por favor, usa la interfaz web en /crear-estacion para dar de alta una estación."
      );
      
      // TODO: Implement authenticated MCP tool call when auth context is available
      // const response = await fetch('/api/estaciones/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(params),
      // });
    } catch (error) {
      return createMcpError(
        `Error creando estación: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  },
};