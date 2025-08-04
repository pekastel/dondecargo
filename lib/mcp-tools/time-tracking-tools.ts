import { z } from "zod";
import { TimeEntryService } from "../services/time-entries";

const timeEntryService = new TimeEntryService();

export const startTimeTrackingTool = {
  name: "start_time_tracking",
  description: "Start tracking time for a project",
  schema: {
    projectId: z.string().min(1, "Project ID is required"),
    description: z.string().min(1, "Description is required"),
  },
  handler: async (params: { projectId: string; description: string }, userId: string) => {
    try {
      const timeEntry = await timeEntryService.startTimeTracking(userId, params.projectId, params.description);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Time tracking started successfully:\n- Entry ID: ${timeEntry.id}\n- Project ID: ${timeEntry.projectId}\n- Description: ${timeEntry.description}\n- Started at: ${timeEntry.startTime.toLocaleString()}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error starting time tracking: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const stopTimeTrackingTool = {
  name: "stop_time_tracking",
  description: "Stop the currently active time tracking",
  schema: {
    entryId: z.string().optional(),
  },
  handler: async (params: { entryId?: string }, userId: string) => {
    try {
      const timeEntry = await timeEntryService.stopTimeTracking(userId, params.entryId);
      
      if (!timeEntry) {
        return {
          content: [{ type: "text" as const, text: "No active time entry found to stop." }],
          isError: true,
        };
      }

      const hours = Math.floor(timeEntry.durationMinutes! / 60);
      const minutes = timeEntry.durationMinutes! % 60;

      return {
        content: [{ 
          type: "text" as const, 
          text: `Time tracking stopped successfully:\n- Entry ID: ${timeEntry.id}\n- Description: ${timeEntry.description}\n- Duration: ${hours}h ${minutes}m (${timeEntry.durationMinutes} minutes)\n- Started: ${timeEntry.startTime.toLocaleString()}\n- Ended: ${timeEntry.endTime!.toLocaleString()}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error stopping time tracking: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const getActiveTimeEntryTool = {
  name: "get_active_time_entry",
  description: "Get the currently active time entry if any",
  schema: {} as Record<string, never>,
  handler: async (params: Record<string, never>, userId: string) => {
    try {
      const activeEntry = await timeEntryService.getActiveTimeEntry(userId);
      
      if (!activeEntry) {
        return {
          content: [{ type: "text" as const, text: "No active time tracking session found." }],
        };
      }

      const currentTime = new Date();
      const elapsedMinutes = Math.round((currentTime.getTime() - activeEntry.startTime.getTime()) / (1000 * 60));
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = elapsedMinutes % 60;

      return {
        content: [{ 
          type: "text" as const, 
          text: `Active time tracking:\n- Entry ID: ${activeEntry.id}\n- Project ID: ${activeEntry.projectId}\n- Description: ${activeEntry.description}\n- Started: ${activeEntry.startTime.toLocaleString()}\n- Elapsed time: ${hours}h ${minutes}m (${elapsedMinutes} minutes)` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error getting active time entry: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const addManualTimeEntryTool = {
  name: "add_manual_time_entry",
  description: "Add a manual time entry for completed work",
  schema: {
    projectId: z.string().min(1, "Project ID is required"),
    description: z.string().min(1, "Description is required"),
    startTime: z.string().datetime("Start time must be a valid ISO datetime"),
    endTime: z.string().datetime("End time must be a valid ISO datetime"),
  },
  handler: async (params: { projectId: string; description: string; startTime: string; endTime: string }, userId: string) => {
    try {
      const startTime = new Date(params.startTime);
      const endTime = new Date(params.endTime);
      
      const timeEntry = await timeEntryService.addManualTimeEntry(
        userId, 
        params.projectId, 
        params.description, 
        startTime, 
        endTime
      );

      const hours = Math.floor(timeEntry.durationMinutes! / 60);
      const minutes = timeEntry.durationMinutes! % 60;

      return {
        content: [{ 
          type: "text" as const, 
          text: `Manual time entry added successfully:\n- Entry ID: ${timeEntry.id}\n- Project ID: ${timeEntry.projectId}\n- Description: ${timeEntry.description}\n- Duration: ${hours}h ${minutes}m (${timeEntry.durationMinutes} minutes)\n- Started: ${timeEntry.startTime.toLocaleString()}\n- Ended: ${timeEntry.endTime!.toLocaleString()}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error adding manual time entry: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const updateTimeEntryTool = {
  name: "update_time_entry",
  description: "Update an existing time entry",
  schema: {
    entryId: z.string().min(1, "Entry ID is required"),
    description: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
  },
  handler: async (params: { entryId: string; description?: string; startTime?: string; endTime?: string }, userId: string) => {
    try {
      const { entryId, ...updateData } = params;
      
      // Convert string dates to Date objects
      const processedData: Record<string, unknown> = { ...updateData };
      if (updateData.startTime) processedData.startTime = new Date(updateData.startTime);
      if (updateData.endTime) processedData.endTime = new Date(updateData.endTime);
      
      const timeEntry = await timeEntryService.updateTimeEntry(userId, entryId, processedData);
      
      if (!timeEntry) {
        return {
          content: [{ type: "text" as const, text: "Time entry not found or does not belong to you." }],
          isError: true,
        };
      }

      const hours = timeEntry.durationMinutes ? Math.floor(timeEntry.durationMinutes / 60) : 0;
      const minutes = timeEntry.durationMinutes ? timeEntry.durationMinutes % 60 : 0;

      return {
        content: [{ 
          type: "text" as const, 
          text: `Time entry updated successfully:\n- Entry ID: ${timeEntry.id}\n- Description: ${timeEntry.description}\n- Duration: ${hours}h ${minutes}m (${timeEntry.durationMinutes || 0} minutes)\n- Started: ${timeEntry.startTime.toLocaleString()}\n- Ended: ${timeEntry.endTime ? timeEntry.endTime.toLocaleString() : 'Still active'}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error updating time entry: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};