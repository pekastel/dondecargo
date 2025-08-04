import { z } from "zod";
import { ProjectService } from "../services/projects";

const projectService = new ProjectService();

export const createProjectTool = {
  name: "create_project",
  description: "Create a new project for a client",
  schema: {
    name: z.string().min(1, "Project name is required"),
    clientId: z.string().min(1, "Client ID is required"),
    description: z.string().optional(),
    hourlyRate: z.number().positive().optional(),
  },
  handler: async (params: { name: string; clientId: string; description?: string; hourlyRate?: number }, userId: string) => {
    try {
      const projectData = {
        ...params,
        hourlyRate: params.hourlyRate?.toString(),
      };
      const project = await projectService.createProject(userId, projectData);
      return {
        content: [{ 
          type: "text" as const, 
          text: `Project created successfully:\n- ID: ${project.id}\n- Name: ${project.name}\n- Client ID: ${project.clientId}\n- Description: ${project.description || 'None'}\n- Hourly Rate: ${project.hourlyRate ? `$${project.hourlyRate}` : 'None'}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const listProjectsTool = {
  name: "list_projects",
  description: "List all projects (shared across all users), optionally filtered by client",
  schema: {
    clientId: z.string().optional(),
    activeOnly: z.boolean().optional().default(true),
    withClient: z.boolean().optional().default(false),
  },
  handler: async (params: { clientId?: string; activeOnly?: boolean; withClient?: boolean }, userId: string) => {
    try {
      if (params.withClient) {
        const projectsWithClient = await projectService.getProjectsWithClient(userId, params.activeOnly);
        
        if (projectsWithClient.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No projects found." }],
          };
        }

        const projectList = projectsWithClient.map(({ project, client }) => 
          `- ${project.name} (ID: ${project.id}) - Client: ${client.name}${project.description ? ` - ${project.description}` : ''}${project.hourlyRate ? ` - $${project.hourlyRate}/hr` : ''}${!project.active ? ' [INACTIVE]' : ''}`
        ).join('\n');

        return {
          content: [{ 
            type: "text" as const, 
            text: `Available projects:\n${projectList}` 
          }],
        };
      } else {
        const projects = await projectService.listProjects(userId, params.clientId, params.activeOnly);
        
        if (projects.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No projects found." }],
          };
        }

        const projectList = projects.map(project => 
          `- ${project.name} (ID: ${project.id})${project.description ? ` - ${project.description}` : ''}${project.hourlyRate ? ` - $${project.hourlyRate}/hr` : ''}${!project.active ? ' [INACTIVE]' : ''}`
        ).join('\n');

        return {
          content: [{ 
            type: "text" as const, 
            text: `Available projects:\n${projectList}` 
          }],
        };
      }
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error listing projects: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const updateProjectTool = {
  name: "update_project",
  description: "Update an existing project",
  schema: {
    projectId: z.string().min(1, "Project ID is required"),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    clientId: z.string().optional(),
    hourlyRate: z.number().positive().optional(),
    active: z.boolean().optional(),
  },
  handler: async (params: { projectId: string; name?: string; description?: string; clientId?: string; hourlyRate?: number; active?: boolean }, userId: string) => {
    try {
      const { projectId, hourlyRate, ...restData } = params;
      const updateData = {
        ...restData,
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate.toString() }),
      };
      const project = await projectService.updateProject(userId, projectId, updateData);
      
      if (!project) {
        return {
          content: [{ type: "text" as const, text: "Project not found." }],
          isError: true,
        };
      }

      return {
        content: [{ 
          type: "text" as const, 
          text: `Project updated successfully:\n- ID: ${project.id}\n- Name: ${project.name}\n- Client ID: ${project.clientId}\n- Description: ${project.description || 'None'}\n- Hourly Rate: ${project.hourlyRate ? `$${project.hourlyRate}` : 'None'}\n- Active: ${project.active}` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error updating project: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};

export const deactivateProjectTool = {
  name: "deactivate_project",
  description: "Deactivate a project (soft delete)",
  schema: {
    projectId: z.string().min(1, "Project ID is required"),
  },
  handler: async (params: { projectId: string }, userId: string) => {
    try {
      const project = await projectService.deactivateProject(userId, params.projectId);
      
      if (!project) {
        return {
          content: [{ type: "text" as const, text: "Project not found." }],
          isError: true,
        };
      }

      return {
        content: [{ 
          type: "text" as const, 
          text: `Project "${project.name}" has been deactivated successfully.` 
        }],
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text" as const, 
          text: `Error deactivating project: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true,
      };
    }
  },
};