import { auth } from "@/lib/auth";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { withMcpAuth } from "better-auth/plugins";
import { env } from "@/lib/env";

// Import MCP tools
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

const handler = withMcpAuth(auth, (req, session) => {
	const userId = session.userId;
	
	if (!userId) {
		throw new Error('User ID not available in session');
	}
	
	return createMcpHandler(
		(server) => {
			// Client management tools
			server.tool(
				createClientTool.name,
				createClientTool.description,
				createClientTool.schema,
				async (params) => createClientTool.handler(params, userId)
			);
			
			server.tool(
				listClientsTool.name,
				listClientsTool.description,
				listClientsTool.schema,
				async (params) => listClientsTool.handler(params, userId)
			);
			
			server.tool(
				updateClientTool.name,
				updateClientTool.description,
				updateClientTool.schema,
				async (params) => updateClientTool.handler(params, userId)
			);
			
			server.tool(
				deactivateClientTool.name,
				deactivateClientTool.description,
				deactivateClientTool.schema,
				async (params) => deactivateClientTool.handler(params, userId)
			);
			
			// Project management tools
			server.tool(
				createProjectTool.name,
				createProjectTool.description,
				createProjectTool.schema,
				async (params) => createProjectTool.handler(params, userId)
			);
			
			server.tool(
				listProjectsTool.name,
				listProjectsTool.description,
				listProjectsTool.schema,
				async (params) => listProjectsTool.handler(params, userId)
			);
			
			server.tool(
				updateProjectTool.name,
				updateProjectTool.description,
				updateProjectTool.schema,
				async (params) => updateProjectTool.handler(params, userId)
			);
			
			server.tool(
				deactivateProjectTool.name,
				deactivateProjectTool.description,
				deactivateProjectTool.schema,
				async (params) => deactivateProjectTool.handler(params, userId)
			);
			
			// Time tracking tools
			server.tool(
				startTimeTrackingTool.name,
				startTimeTrackingTool.description,
				startTimeTrackingTool.schema,
				async (params) => startTimeTrackingTool.handler(params, userId)
			);
			
			server.tool(
				stopTimeTrackingTool.name,
				stopTimeTrackingTool.description,
				stopTimeTrackingTool.schema,
				async (params) => stopTimeTrackingTool.handler(params, userId)
			);
			
			server.tool(
				getActiveTimeEntryTool.name,
				getActiveTimeEntryTool.description,
				getActiveTimeEntryTool.schema,
				async (params) => getActiveTimeEntryTool.handler(params, userId)
			);
			
			server.tool(
				addManualTimeEntryTool.name,
				addManualTimeEntryTool.description,
				addManualTimeEntryTool.schema,
				async (params) => addManualTimeEntryTool.handler(params, userId)
			);
			
			server.tool(
				updateTimeEntryTool.name,
				updateTimeEntryTool.description,
				updateTimeEntryTool.schema,
				async (params) => updateTimeEntryTool.handler(params, userId)
			);
			
			// Reporting tools
			server.tool(
				listTimeEntresTool.name,
				listTimeEntresTool.description,
				listTimeEntresTool.schema,
				async (params) => listTimeEntresTool.handler(params, userId)
			);
			
			server.tool(
				getTimeSummaryTool.name,
				getTimeSummaryTool.description,
				getTimeSummaryTool.schema,
				async (params) => getTimeSummaryTool.handler(params, userId)
			);
			
			server.tool(
				calculateEarningsTool.name,
				calculateEarningsTool.description,
				calculateEarningsTool.schema,
				async (params) => calculateEarningsTool.handler(params, userId)
			);
		},
		{
			capabilities: {
				tools: {
					// Client management
					[createClientTool.name]: { description: createClientTool.description },
					[listClientsTool.name]: { description: listClientsTool.description },
					[updateClientTool.name]: { description: updateClientTool.description },
					[deactivateClientTool.name]: { description: deactivateClientTool.description },
					
					// Project management
					[createProjectTool.name]: { description: createProjectTool.description },
					[listProjectsTool.name]: { description: listProjectsTool.description },
					[updateProjectTool.name]: { description: updateProjectTool.description },
					[deactivateProjectTool.name]: { description: deactivateProjectTool.description },
					
					// Time tracking
					[startTimeTrackingTool.name]: { description: startTimeTrackingTool.description },
					[stopTimeTrackingTool.name]: { description: stopTimeTrackingTool.description },
					[getActiveTimeEntryTool.name]: { description: getActiveTimeEntryTool.description },
					[addManualTimeEntryTool.name]: { description: addManualTimeEntryTool.description },
					[updateTimeEntryTool.name]: { description: updateTimeEntryTool.description },
					
					// Reporting
					[listTimeEntresTool.name]: { description: listTimeEntresTool.description },
					[getTimeSummaryTool.name]: { description: getTimeSummaryTool.description },
					[calculateEarningsTool.name]: { description: calculateEarningsTool.description },
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
