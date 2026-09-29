import { prisma } from '../config/db.js';

export interface LogActivityParams {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  action: string;
  entityType: 'TASK' | 'PROJECT' | 'COMMENT' | 'AI_PLAN' | 'MEMBER' | 'MILESTONE';
  entityId: string;
  details: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        taskId: params.taskId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details
      }
    });
  } catch (err) {
    console.error('Failed to write activity log:', err);
    return null;
  }
}
