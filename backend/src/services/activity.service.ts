import { prisma } from '../config/db.js';

export interface LogActivityParams {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  action: string;
  entityType: 'TASK' | 'PROJECT' | 'COMMENT' | 'AI_PLAN' | 'MEMBER' | 'MILESTONE' | 'ROLE' | string;
  entityId: string;
  details: string | Record<string, any>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const detailsStr = typeof params.details === 'object' 
      ? JSON.stringify(params.details) 
      : String(params.details);

    return await prisma.activityLog.create({
      data: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        taskId: params.taskId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: detailsStr
      }
    });
  } catch (err) {
    console.error('Failed to write activity log:', err);
    return null;
  }
}
