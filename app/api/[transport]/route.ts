import { auth } from "@/lib/auth";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { withMcpAuth } from "better-auth/plugins";
import { env } from "@/lib/env";

// TODO: Implement fuel price MCP tools
// These are placeholder imports that need to be replaced with actual fuel price tools
// For now, commenting out to fix build
/*
import {
	createClientTool,
	listClientsTool,
	updateClientTool,
	deactivateClientTool,
} from "@/lib/mcp-tools/client-tools";
import {
	createProjectTool,
	listProjectsTool,
	updateProjectTool,
	deactivateProjectTool,
} from "@/lib/mcp-tools/project-tools";
import {
	startTimeTrackingTool,
	stopTimeTrackingTool,
	getActiveTimeEntryTool,
	addManualTimeEntryTool,
	updateTimeEntryTool,
} from "@/lib/mcp-tools/time-tracking-tools";
import {
	listTimeEntresTool,
	getTimeSummaryTool,
	calculateEarningsTool,
} from "@/lib/mcp-tools/report-tools";
*/

const handler = withMcpAuth(auth, (req, session) => {
	const userId = session.userId;
	
	if (!userId) {
		throw new Error('User ID not available in session');
	}
	
	return createMcpHandler(
		(server) => {
			// TODO: Add fuel price MCP tools here
			// For now, creating a basic MCP server without tools
			// Future fuel price tools will be:
			// - list_stations: Get gas stations near location
			// - get_station_prices: Get current prices for a station  
			// - report_price: Report a new fuel price
			// - confirm_price: Confirm a user-reported price
			// - get_price_history: Get historical prices for a fuel type
		},
		{
			capabilities: {
				tools: {
					// TODO: Add fuel price tools capabilities here
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
