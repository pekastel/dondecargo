import { z } from "zod";
import { TimeEntryService } from "../services/time-entries";

const timeEntryService = new TimeEntryService();

export const listTimeEntresTool = {
  name: "list_time_entries",
  description: "List time entries with optional filtering by project and date range",
  schema: {
    projectId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().int().positive().max(100).optional().default(20),
    withDetails: z.boolean().optional().default(false),
  },
  handler: async (params: { projectId?: string; startDate?: string; endDate?: string; limit?: number; withDetails?: boolean }, userId: string) => {
    try {
      const startDate = params.startDate ? new Date(params.startDate) : undefined;
      const endDate = params.endDate ? new Date(params.endDate) : undefined;
      
      if (params.withDetails) {
        const entries = await timeEntryService.getTimeEntriesWithDetails(userId, startDate, endDate, params.limit);
        
        if (entries.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No time entries found matching the criteria." }],
          };
        }

        const entriesList = entries.map(({ timeEntry, project, client }) => {
          const hours = timeEntry.durationMinutes ? Math.floor(timeEntry.durationMinutes / 60) : 0;
          const minutes = timeEntry.durationMinutes ? timeEntry.durationMinutes % 60 : 0;
          const status = timeEntry.isActive ? ' [ACTIVE]' : '';
          
          return `- ${timeEntry.description} (${client.name} > ${project.name})${status}\n  Duration: ${hours}h ${minutes}m | Started: ${timeEntry.startTime.toLocaleString()}${timeEntry.endTime ? ` | Ended: ${timeEntry.endTime.toLocaleString()}` : ''}`;
        }).join('\n');

        return {
          content: [{ 
            type: "text" as const, 
            text: `Time entries (${entries.length} found):\n${entriesList}` 
          }],
        };
      } else {
        const entries = await timeEntryService.listTimeEntries(userId, params.projectId, startDate, endDate, params.limit);
        
        if (entries.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No time entries found matching the criteria." }],
          };
        }

        const entriesList = entries.map(entry => {
          const hours = entry.durationMinutes ? Math.floor(entry.durationMinutes / 60) : 0;
          const minutes = entry.durationMinutes ? entry.durationMinutes % 60 : 0;
          const status = entry.isActive ? ' [ACTIVE]' : '';
          
          return `- ${entry.description}${status}\n  Duration: ${hours}h ${minutes}m | Project: ${entry.projectId} | Started: ${entry.startTime.toLocaleString()}`;
        }).join('\n');

        return {
          content: [{ 
            type: "text" as const, 
            text: `Time entries (${entries.length} found):\n${entriesList}` 
          }],
        };
      }
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error listing time entries: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const getTimeSummaryTool = {
  name: "get_time_summary",
  description: "Get a summary of time worked grouped by client and project for a date range",
  schema: {
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  },
  handler: async (params: { startDate?: string; endDate?: string }, userId: string) => {
    try {
      const startDate = params.startDate ? new Date(params.startDate) : undefined;
      const endDate = params.endDate ? new Date(params.endDate) : undefined;
      
      const summary = await timeEntryService.getTimeSummary(userId, startDate, endDate);
      
      if (summary.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No completed time entries found for the specified period." }],
        };
      }

      const dateRange = startDate || endDate 
        ? `\nPeriod: ${startDate ? startDate.toLocaleDateString() : 'Beginning'} - ${endDate ? endDate.toLocaleDateString() : 'Today'}`
        : '';

      const summaryList = summary.map(item => 
        `- ${item.clientName} > ${item.projectName}: ${item.totalHours}h (${item.entryCount} entries)`
      ).join('\n');

      const totalHours = summary.reduce((acc, item) => acc + Number(item.totalHours), 0);
      const totalEntries = summary.reduce((acc, item) => acc + Number(item.entryCount), 0);

      return {
        content: [{ 
          type: "text" as const, 
          text: `Time Summary${dateRange}:\n\n${summaryList}\n\nTotal: ${totalHours.toFixed(2)}h across ${totalEntries} entries` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error getting time summary: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const calculateEarningsTool = {
  name: "calculate_earnings",
  description: "Calculate potential earnings based on time worked and hourly rates",
  schema: {
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  },
  handler: async (params: { startDate?: string; endDate?: string }, userId: string) => {
    try {
      const startDate = params.startDate ? new Date(params.startDate) : undefined;
      const endDate = params.endDate ? new Date(params.endDate) : undefined;
      
      const entriesWithDetails = await timeEntryService.getTimeEntriesWithDetails(userId, startDate, endDate, 1000); // Get more entries for calculation
      
      if (entriesWithDetails.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No time entries found for the specified period." }],
        };
      }

      const earningsByProject = new Map<string, {
        clientName: string;
        projectName: string;
        totalHours: number;
        hourlyRate: number | null;
        earnings: number;
        entryCount: number;
      }>();

      entriesWithDetails.forEach(({ timeEntry, project, client }) => {
        if (!timeEntry.durationMinutes || timeEntry.isActive) return; // Skip active or incomplete entries
        
        const key = `${client.id}-${project.id}`;
        const hours = timeEntry.durationMinutes / 60;
        const hourlyRate = project.hourlyRate ? Number(project.hourlyRate) : null;
        const earnings = hourlyRate ? hours * hourlyRate : 0;
        
        if (earningsByProject.has(key)) {
          const existing = earningsByProject.get(key)!;
          existing.totalHours += hours;
          existing.earnings += earnings;
          existing.entryCount += 1;
        } else {
          earningsByProject.set(key, {
            clientName: client.name,
            projectName: project.name,
            totalHours: hours,
            hourlyRate,
            earnings,
            entryCount: 1,
          });
        }
      });

      const earningsArray = Array.from(earningsByProject.values());
      
      if (earningsArray.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No completed time entries found for earnings calculation." }],
        };
      }

      const dateRange = startDate || endDate 
        ? `\nPeriod: ${startDate ? startDate.toLocaleDateString() : 'Beginning'} - ${endDate ? endDate.toLocaleDateString() : 'Today'}`
        : '';

      const earningsList = earningsArray.map(item => {
        const rateInfo = item.hourlyRate 
          ? `$${item.hourlyRate}/hr = $${item.earnings.toFixed(2)}`
          : 'No rate set';
        return `- ${item.clientName} > ${item.projectName}: ${item.totalHours.toFixed(2)}h × ${rateInfo}`;
      }).join('\n');

      const totalHours = earningsArray.reduce((acc, item) => acc + item.totalHours, 0);
      const totalEarnings = earningsArray.reduce((acc, item) => acc + item.earnings, 0);
      const projectsWithRates = earningsArray.filter(item => item.hourlyRate !== null).length;

      return {
        content: [{ 
          type: "text" as const, 
          text: `Earnings Calculation${dateRange}:\n\n${earningsList}\n\nTotal: ${totalHours.toFixed(2)}h worked, $${totalEarnings.toFixed(2)} potential earnings\n(${projectsWithRates}/${earningsArray.length} projects have hourly rates set)` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error calculating earnings: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};