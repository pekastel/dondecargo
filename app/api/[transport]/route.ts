import { auth } from "@/lib/auth";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { withMcpAuth } from "better-auth/plugins";
import { env } from "@/lib/env";
import {
	searchStationsTool,
	getStationDetailsTool,
	findCheapestFuelTool,
	getPriceHistoryTool,
	getRegionalSummaryTool,
	createStationTool,
} from "@/lib/mcp-tools/fuel-price-tools";

const handler = withMcpAuth(auth, (req, session) => {
	const userId = session.userId;
	
	if (!userId) {
		throw new Error('User ID not available in session');
	}
	
	return createMcpHandler(
		(server) => {
			// Register fuel price search tools
			server.tool(
				searchStationsTool.name,
				searchStationsTool.description,
				searchStationsTool.schema as any,
				async (params: any) => searchStationsTool.handler(params as any)
			);

			server.tool(
				getStationDetailsTool.name,
				getStationDetailsTool.description,
				getStationDetailsTool.schema as any,
				async (params: any) => getStationDetailsTool.handler(params as any)
			);

			server.tool(
				findCheapestFuelTool.name,
				findCheapestFuelTool.description,
				findCheapestFuelTool.schema as any,
				async (params: any) => findCheapestFuelTool.handler(params as any)
			);

			server.tool(
				getPriceHistoryTool.name,
				getPriceHistoryTool.description,
				getPriceHistoryTool.schema as any,
				async (params: any) => getPriceHistoryTool.handler(params as any)
			);

			server.tool(
				getRegionalSummaryTool.name,
				getRegionalSummaryTool.description,
				getRegionalSummaryTool.schema as any,
				async (params: any) => getRegionalSummaryTool.handler(params as any)
			);

			server.tool(
				createStationTool.name,
				createStationTool.description,
				createStationTool.schema as any,
				async (params: any) => createStationTool.handler(params as any)
			);
		},
		{
			capabilities: {
				tools: {
					search_stations: {},
					get_station_details: {},
					find_cheapest_fuel: {},
					get_price_history: {},
					get_regional_summary: {},
					create_station: {},
				},
			},
		},
		{
			redisUrl: env.REDIS_URL,
			basePath: "/api",
			verboseLogs: true,
			maxDuration: 60,
		},
	)(req);
});

export { handler as GET, handler as POST, handler as DELETE };
