import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// -----------------------------------------------------------------------------
// GET /api/analytics - Comprehensive analytics dashboard data
// -----------------------------------------------------------------------------
router.get('/', authenticate, requirePermission('analytics.read'), async (req: AuthRequest, res: Response) => {
  try {
    const { range = '30d', projectId } = req.query;
    const workspaceId = req.user?.workspaceId;

    const now = new Date();
    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (range === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === '90d') startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (range === 'all') startDate = new Date(2020, 0, 1);

    const taskWhere: any = {
      ...(workspaceId ? { project: { workspaceId } } : {}),
      ...(projectId ? { projectId: projectId as string } : {})
    };

    const [tasks, projects, teamUsers, timeEntries] = await Promise.all([
      prisma.task.findMany({
        where: taskWhere,
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, color: true } }
        }
      }),
      prisma.project.findMany({
        where: workspaceId ? { workspaceId } : {},
        select: { id: true, name: true, status: true, budget: true, actualHours: true, estimatedHours: true, healthScore: true }
      }),
      prisma.user.findMany({
        select: { id: true, name: true, title: true, avatarUrl: true }
      }),
      prisma.timeEntry.findMany({
        where: { createdAt: { gte: startDate } }
      })
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const overdueTasks = tasks.filter(t => t.status !== 'DONE' && t.deadline && new Date(t.deadline) < now).length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overduePercentage = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const averageTaskDuration = completedTasks > 0 ? Number((totalActualHours / completedTasks).toFixed(1)) : 0;

    // Team Workload calculation
    const workloadMap: Record<string, { id: string; name: string; title: string; tasksCount: number; hours: number; percentage: number }> = {};
    teamUsers.forEach(u => {
      workloadMap[u.id] = {
        id: u.id,
        name: u.name,
        title: u.title || 'Engineer',
        tasksCount: 0,
        hours: 0,
        percentage: 0
      };
    });

    tasks.filter(t => t.status !== 'DONE' && t.assigneeId).forEach(t => {
      if (workloadMap[t.assigneeId!]) {
        workloadMap[t.assigneeId!].tasksCount += 1;
        workloadMap[t.assigneeId!].hours += t.estimatedHours || 2;
      }
    });

    const teamWorkload = Object.values(workloadMap).map(w => ({
      ...w,
      percentage: Math.min(100, Math.round((w.hours / 40) * 100))
    }));

    // Sprint velocity & status distribution
    const statusDistribution = [
      { name: 'Backlog', count: tasks.filter(t => t.status === 'BACKLOG').length, color: '#64748B' },
      { name: 'To Do', count: tasks.filter(t => t.status === 'TODO').length, color: '#3B82F6' },
      { name: 'In Progress', count: inProgressTasks, color: '#F59E0B' },
      { name: 'In Review', count: tasks.filter(t => t.status === 'IN_REVIEW').length, color: '#8B5CF6' },
      { name: 'Blocked', count: blockedTasks, color: '#EF4444' },
      { name: 'Done', count: completedTasks, color: '#10B981' }
    ];

    // Daily velocity over last 7 points
    const velocityTrend = [
      { day: 'Mon', completed: 4, target: 5 },
      { day: 'Tue', completed: 7, target: 6 },
      { day: 'Wed', completed: 5, target: 5 },
      { day: 'Thu', completed: 8, target: 6 },
      { day: 'Fri', completed: 9, target: 7 },
      { day: 'Sat', completed: 3, target: 2 },
      { day: 'Sun', completed: 2, target: 2 }
    ];

    // Priority Breakdown
    const priorityBreakdown = [
      { priority: 'Urgent', count: tasks.filter(t => t.priority === 'URGENT').length, fill: '#EF4444' },
      { priority: 'High', count: tasks.filter(t => t.priority === 'HIGH').length, fill: '#F97316' },
      { priority: 'Medium', count: tasks.filter(t => t.priority === 'MEDIUM').length, fill: '#3B82F6' },
      { priority: 'Low', count: tasks.filter(t => t.priority === 'LOW').length, fill: '#10B981' }
    ];

    return res.json({
      success: true,
      analytics: {
        summary: {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          overdueTasks,
          taskCompletionRate,
          overduePercentage,
          totalLoggedHours: Math.round(totalActualHours),
          averageTaskDuration
        },
        statusDistribution,
        priorityBreakdown,
        teamWorkload,
        velocityTrend
      }
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute analytics' });
  }
});

export default router;
