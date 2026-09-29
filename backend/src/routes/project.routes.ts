import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { calculateProjectHealth } from '../services/health.service.js';
import { logActivity } from '../services/activity.service.js';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  teamId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
  budget: z.number().optional().default(0),
  estimatedHours: z.number().optional().default(0),
  color: z.string().default('#6366F1'),
  tags: z.array(z.string()).default([]),
  template: z.string().default('Software Development'),
  workspaceId: z.string().optional()
});

// -----------------------------------------------------------------------------
// GET /api/projects - List all projects in active workspace
// -----------------------------------------------------------------------------
router.get('/', authenticate, requirePermission('projects.read'), async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string || req.user?.workspaceId;
    const status = req.query.status as string;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (status && status !== 'ALL') where.status = status;

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        team: { select: { id: true, name: true } },
        _count: {
          select: {
            tasks: true,
            milestones: true,
            members: true
          }
        },
        tasks: {
          select: {
            id: true,
            status: true,
            deadline: true,
            actualHours: true,
            estimatedHours: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Compute live completion percentage and counts
    const now = new Date();
    const enrichedProjects = projects.map(p => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter(t => t.status === 'DONE').length;
      const overdueTasks = p.tasks.filter(t => t.status !== 'DONE' && t.deadline && new Date(t.deadline) < now).length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...p,
        totalTasks,
        completedTasks,
        overdueTasks,
        progressPercent,
        tasks: undefined // exclude raw tasks for performance
      };
    });

    return res.json({ success: true, projects: enrichedProjects });
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve projects' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/projects/pulse - Live summary of active projects across workspace
// -----------------------------------------------------------------------------
router.get('/pulse', authenticate, requirePermission('projects.read'), async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string || req.user?.workspaceId;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeProjectsCount,
      tasksCompletedToday,
      overdueTasksCount,
      upcomingDeadlinesCount,
      criticalProjectsCount
    ] = await Promise.all([
      prisma.project.count({ where: { status: 'ACTIVE', ...(workspaceId ? { workspaceId } : {}) } }),
      prisma.task.count({
        where: {
          status: 'DONE',
          updatedAt: { gte: startOfToday },
          ...(workspaceId ? { project: { workspaceId } } : {})
        }
      }),
      prisma.task.count({
        where: {
          status: { not: 'DONE' },
          deadline: { lt: now },
          ...(workspaceId ? { project: { workspaceId } } : {})
        }
      }),
      prisma.task.count({
        where: {
          status: { not: 'DONE' },
          deadline: { gte: now, lte: sevenDaysFromNow },
          ...(workspaceId ? { project: { workspaceId } } : {})
        }
      }),
      prisma.project.count({
        where: {
          healthStatus: { in: ['CRITICAL', 'AT_RISK'] },
          ...(workspaceId ? { workspaceId } : {})
        }
      })
    ]);

    return res.json({
      success: true,
      pulse: {
        activeProjectsCount,
        tasksCompletedToday,
        overdueTasksCount,
        upcomingDeadlinesCount,
        criticalProjectsCount,
        overallSystemHealth: criticalProjectsCount > 0 ? (criticalProjectsCount > 2 ? 'CRITICAL' : 'AT_RISK') : 'HEALTHY'
      }
    });
  } catch (error: any) {
    console.error('Pulse fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve project pulse' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/projects/:id - Detailed project view
// -----------------------------------------------------------------------------
router.get('/:id', authenticate, requirePermission('projects.read'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, title: true } }
              }
            }
          }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, title: true, role: true } }
          }
        },
        milestones: {
          orderBy: { dueDate: 'asc' }
        },
        events: {
          orderBy: { startTime: 'asc' }
        },
        aiPlans: {
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        attachments: {
          include: { uploader: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Run live health check
    const health = await calculateProjectHealth(project.id);

    return res.json({
      success: true,
      project: {
        ...project,
        tags: JSON.parse(project.tags || '[]'),
        health
      }
    });
  } catch (error: any) {
    console.error('Fetch project detail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve project details' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/projects - Create a new project
// -----------------------------------------------------------------------------
router.post('/', authenticate, requirePermission('projects.create'), async (req: AuthRequest, res: Response) => {
  try {
    const parse = createProjectSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const data = parse.data;
    const workspaceId = data.workspaceId || req.user?.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required' });
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        workspaceId,
        ownerId: req.user!.id,
        teamId: data.teamId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        priority: data.priority as any,
        status: data.status as any,
        budget: data.budget,
        estimatedHours: data.estimatedHours,
        color: data.color,
        tags: JSON.stringify(data.tags),
        template: data.template,
        healthScore: 100,
        healthStatus: 'HEALTHY',
        healthReason: 'Newly created project initialized in healthy status.'
      }
    });

    // Auto add creator as project member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: req.user!.id,
        role: req.user!.role as any
      }
    });

    // Log Activity
    await logActivity({
      workspaceId,
      projectId: project.id,
      userId: req.user!.id,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      details: `${req.user!.name} created project "${project.name}" using template "${project.template}".`
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: {
        ...project,
        tags: data.tags
      }
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

// -----------------------------------------------------------------------------
// PUT /api/projects/:id - Update an existing project
// -----------------------------------------------------------------------------
router.put('/:id', authenticate, requirePermission('projects.update'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData: any = {};

    const fields = ['name', 'description', 'teamId', 'priority', 'status', 'budget', 'estimatedHours', 'color', 'template'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    if (req.body.startDate !== undefined) {
      updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    }
    if (req.body.deadline !== undefined) {
      updateData.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
    }
    if (req.body.tags !== undefined) {
      updateData.tags = JSON.stringify(req.body.tags);
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData
    });

    // Re-evaluate health
    await calculateProjectHealth(id);

    // Log Activity
    await logActivity({
      workspaceId: updated.workspaceId,
      projectId: updated.id,
      userId: req.user!.id,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: updated.id,
      details: `${req.user!.name} updated project details for "${updated.name}".`
    });

    return res.json({
      success: true,
      message: 'Project updated successfully',
      project: {
        ...updated,
        tags: JSON.parse(updated.tags || '[]')
      }
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update project' });
  }
});

// -----------------------------------------------------------------------------
// DELETE /api/projects/:id - Restricted to OWNER role
// -----------------------------------------------------------------------------
router.delete('/:id', authenticate, requirePermission('projects.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await prisma.project.delete({ where: { id } });

    // Log Activity
    await logActivity({
      workspaceId: project.workspaceId,
      userId: req.user!.id,
      action: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: id,
      details: `${req.user!.name} deleted project "${project.name}".`
    });

    return res.json({ success: true, message: `Project "${project.name}" was permanently deleted.` });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

export default router;
