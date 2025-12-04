/* eslint-disable @typescript-eslint/no-explicit-any */
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
			(server.tool as any)(
				searchStationsTool.name,
				searchStationsTool.description,
				searchStationsTool.paramsShape,
				async (params: any) => searchStationsTool.handler(params)
			);

			(server.tool as any)(
				getStationDetailsTool.name,
				getStationDetailsTool.description,
				getStationDetailsTool.paramsShape,
				async (params: any) => getStationDetailsTool.handler(params)
			);

			(server.tool as any)(
				findCheapestFuelTool.name,
				findCheapestFuelTool.description,
				findCheapestFuelTool.paramsShape,
				async (params: any) => findCheapestFuelTool.handler(params)
			);

			(server.tool as any)(
				getPriceHistoryTool.name,
				getPriceHistoryTool.description,
				getPriceHistoryTool.paramsShape,
				async (params: any) => getPriceHistoryTool.handler(params)
			);

			(server.tool as any)(
				getRegionalSummaryTool.name,
				getRegionalSummaryTool.description,
				getRegionalSummaryTool.paramsShape,
				async (params: any) => getRegionalSummaryTool.handler(params)
			);

			(server.tool as any)(
				createStationTool.name,
				createStationTool.description,
				createStationTool.paramsShape,
				async (params: any) => createStationTool.handler(params)
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
