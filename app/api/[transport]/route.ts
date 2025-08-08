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
				searchStationsTool.schema,
				async ({ params }) => searchStationsTool.handler(params, userId)
			);
			
			server.tool(
				getStationDetailsTool.name,
				getStationDetailsTool.description,
				getStationDetailsTool.schema,
				async ({ params }) => getStationDetailsTool.handler(params, userId)
			);
			
			server.tool(
				findCheapestFuelTool.name,
				findCheapestFuelTool.description,
				findCheapestFuelTool.schema,
				async ({ params }) => findCheapestFuelTool.handler(params, userId)
			);
			
			server.tool(
				getPriceHistoryTool.name,
				getPriceHistoryTool.description,
				getPriceHistoryTool.schema,
				async ({ params }) => getPriceHistoryTool.handler(params, userId)
			);
			
			server.tool(
				getRegionalSummaryTool.name,
				getRegionalSummaryTool.description,
				getRegionalSummaryTool.schema,
				async ({ params }) => getRegionalSummaryTool.handler(params, userId)
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
