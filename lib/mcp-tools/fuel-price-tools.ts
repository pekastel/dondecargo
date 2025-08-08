import { z } from "zod";
import { FuelService } from "@/lib/services/fuel-service";
import { createMcpResponse, createMcpError } from "./utils";
import { FUEL_TYPES, FUEL_LABELS, FuelType, HorarioType } from "@/lib/types";

const fuelService = new FuelService();

export const searchStationsTool = {
  name: "search_stations",
  description: "Search gas stations by location, company, fuel type, and price range. Returns stations with current fuel prices.",
  schema: {
    lat: z.number().optional().describe("Latitude for location-based search"),
    lng: z.number().optional().describe("Longitude for location-based search"),
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
    combustible?: FuelType;
    horario?: HorarioType;
    precioMin?: number;
    precioMax?: number;
    limit?: number;
    offset?: number;
  }, _userId: string) => {
    try {
      const result = await fuelService.searchStations(params);
      
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
        params.combustible ? `combustible: ${FUEL_LABELS[params.combustible]}` : '',
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
  handler: async (params: { stationId: string }, _userId: string) => {
    try {
      const station = await fuelService.getStationDetails(params.stationId);
      
      if (!station) {
        return createMcpError("Estación no encontrada.");
      }

      const pricesText = station.precios.length > 0
        ? station.precios
            .reduce((groups: Record<string, unknown[]>, price) => {
              if (!groups[price.horario]) groups[price.horario] = [];
              groups[price.horario].push(price);
              return groups;
            }, {})
        : {};

      let pricesDisplay = '';
      Object.entries(pricesText).forEach(([horario, prices]: [string, unknown[]]) => {
        pricesDisplay += `\\n**${horario.charAt(0).toUpperCase() + horario.slice(1)}:**\\n`;
        prices.forEach(price => {
          const fuelLabel = FUEL_LABELS[price.tipoCombustible as FuelType] || price.tipoCombustible;
          const validatedIcon = price.esValidado ? '✅' : '⚠️';
          const sourceText = price.fuente === 'oficial' ? 'Oficial' : 'Usuario';
          pricesDisplay += `  ${fuelLabel}: $${price.precio} ${validatedIcon} (${sourceText})\\n`;
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
    fuelType: FuelType;
    lat?: number;
    lng?: number;
    radius?: number;
    horario?: HorarioType;
    limit?: number;
  }, _userId: string) => {
    try {
      const result = await fuelService.findCheapestFuel(
        params.fuelType,
        params.lat,
        params.lng,
        params.radius,
        params.horario,
        params.limit
      );
      
      if (result.length === 0) {
        return createMcpResponse(`No se encontraron precios para ${FUEL_LABELS[params.fuelType]} en la zona especificada.`);
      }

      const cheapestList = result.map((station, index) => {
        const price = station.precios[0]; // Should only have one price per station
        const distance = station.distancia ? ` (${station.distancia.toFixed(1)}km)` : '';
        const validatedIcon = price.esValidado ? '✅' : '⚠️';
        const sourceText = price.fuente === 'oficial' ? 'Oficial' : 'Usuario';
        
        return `${index + 1}. **$${price.precio}** ${validatedIcon} - ${station.nombre} (${station.empresa})${distance}\\n` +
               `   📍 ${station.direccion}, ${station.localidad}\\n` +
               `   📊 Fuente: ${sourceText}, Reportado: ${price.fechaReporte?.toLocaleDateString() || 'N/A'}`;
      }).join('\\n\\n');

      const locationInfo = params.lat && params.lng 
        ? `cerca de la ubicación (${params.lat}, ${params.lng}) en un radio de ${params.radius || 20}km`
        : 'en el área de búsqueda';

      const summary = `🔍 **Los ${result.length} precios más baratos de ${FUEL_LABELS[params.fuelType]} (${params.horario})** ${locationInfo}:`;

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
    fuelType?: FuelType;
    horario?: HorarioType;
    days?: number;
  }, _userId: string) => {
    try {
      // First get station details for context
      const station = await fuelService.getStationDetails(params.stationId);
      if (!station) {
        return createMcpError("Estación no encontrada.");
      }

      const history = await fuelService.getPriceHistory(
        params.stationId,
        params.fuelType,
        params.horario,
        params.days
      );
      
      if (history.length === 0) {
        const fuelInfo = params.fuelType ? ` de ${FUEL_LABELS[params.fuelType]}` : '';
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
          const validatedIcon = price.esValidado ? '✅' : '⚠️';
          const sourceText = price.fuente === 'oficial' ? 'Oficial' : 'Usuario';
          historyDisplay += `  $${price.precio} ${validatedIcon} - ${price.fechaVigencia.toLocaleDateString()} (${sourceText})\\n`;
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
  handler: async (params: { provincia?: string }, _userId: string) => {
    try {
      const summary = await fuelService.getRegionalSummary(params.provincia);
      
      if (summary.length === 0) {
        const provinciaText = params.provincia ? ` en ${params.provincia}` : '';
        return createMcpResponse(`No se encontraron datos para generar resumen regional${provinciaText}.`);
      }

      // Group by province and locality
      const summaryByRegion = summary.reduce((groups: Record<string, unknown>, item) => {
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
      Object.entries(summaryByRegion).slice(0, 15).forEach(([, data]: [string, Record<string, unknown>]) => {
        const companiesText = Array.from(data.companies).slice(0, 3).join(', ');
        const moreCompanies = data.companies.size > 3 ? ` +${data.companies.size - 3} más` : '';
        
        summaryDisplay += `\\n**${data.localidad}, ${data.provincia}**\\n`;
        summaryDisplay += `  🏪 ${data.totalStations} estaciones - Empresas: ${companiesText}${moreCompanies}\\n`;
        
        Object.entries(data.fuelData as Record<string, { avg: number; stations: number }>).forEach(([fuel, info]) => {
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