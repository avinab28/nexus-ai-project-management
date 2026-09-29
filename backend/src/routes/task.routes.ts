import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/activity.service.js';
import { calculateProjectHealth } from '../services/health.service.js';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  assigneeId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE']).default('TODO'),
  startDate: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  estimatedHours: z.number().optional().default(2.0),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.string()).optional()
});

// -----------------------------------------------------------------------------
// GET /api/tasks - List tasks with flexible filters (projectId, status, assignee)
// -----------------------------------------------------------------------------
router.get('/', authenticate, requirePermission('tasks.read'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, status, assigneeId, priority, search } = req.query;

    const where: any = {};
    if (projectId) where.projectId = projectId as string;
    if (status && status !== 'ALL') where.status = status as any;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (priority) where.priority = priority as any;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true } },
        subtasks: { orderBy: { order: 'asc' } },
        _count: {
          select: {
            comments: true,
            attachments: true,
            timeEntries: true
          }
        },
        precededBy: {
          include: {
            predecessor: { select: { id: true, title: true, status: true } }
          }
        },
        succeeds: {
          include: {
            successor: { select: { id: true, title: true, status: true } }
          }
        }
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
    });

    const enriched = tasks.map(t => ({
      ...t,
      tags: JSON.parse(t.tags || '[]')
    }));

    return res.json({ success: true, tasks: enriched });
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tasks' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/tasks/:id - Detailed single task view
// -----------------------------------------------------------------------------
router.get('/:id', authenticate, requirePermission('tasks.read'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, title: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, color: true, workspaceId: true } },
        subtasks: { orderBy: { order: 'asc' } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, role: true } },
            replies: {
              include: { user: { select: { id: true, name: true, avatarUrl: true } } }
            }
          },
          where: { parentId: null },
          orderBy: { createdAt: 'asc' }
        },
        timeEntries: {
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          include: { uploader: { select: { name: true } } }
        },
        precededBy: {
          include: { predecessor: { select: { id: true, title: true, status: true, deadline: true } } }
        },
        succeeds: {
          include: { successor: { select: { id: true, title: true, status: true, deadline: true } } }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.json({
      success: true,
      task: {
        ...task,
        tags: JSON.parse(task.tags || '[]')
      }
    });
  } catch (error: any) {
    console.error('Fetch task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch task details' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/tasks - Create new task
// -----------------------------------------------------------------------------
router.post('/', authenticate, requirePermission('tasks.create'), async (req: AuthRequest, res: Response) => {
  try {
    const parse = createTaskSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const data = parse.data;

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { workspaceId: true, name: true }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Referenced project does not exist' });
    }

    // Determine order (last in column)
    const taskCount = await prisma.task.count({
      where: { projectId: data.projectId, status: data.status as any }
    });

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        creatorId: req.user!.id,
        priority: data.priority as any,
        status: data.status as any,
        startDate: data.startDate ? new Date(data.startDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        estimatedHours: data.estimatedHours,
        order: taskCount,
        tags: JSON.stringify(data.tags)
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        subtasks: true
      }
    });

    // Create subtasks if provided
    if (data.subtasks && data.subtasks.length > 0) {
      await prisma.subtask.createMany({
        data: data.subtasks.map((st, idx) => ({
          title: st,
          taskId: task.id,
          order: idx,
          isCompleted: false
        }))
      });
    }

    // Notify assignee if not creator
    if (data.assigneeId && data.assigneeId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          title: 'Task Assigned',
          message: `${req.user!.name} assigned you to task "${task.title}".`,
          type: 'ASSIGNMENT',
          link: `/tasks/${task.id}`
        }
      });
    }

    // Log Activity
    await logActivity({
      workspaceId: project.workspaceId,
      projectId: data.projectId,
      taskId: task.id,
      userId: req.user!.id,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      details: `${req.user!.name} created task "${task.title}".`
    });

    // Refresh health asynchronously
    calculateProjectHealth(data.projectId).catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: {
        ...task,
        tags: data.tags
      }
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

// -----------------------------------------------------------------------------
// PUT /api/tasks/:id/status - Drag-and-drop Kanban status & order update
// -----------------------------------------------------------------------------
router.put('/:id/status', authenticate, requirePermission('tasks.update'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, order } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Target status is required' });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { workspaceId: true, name: true } } }
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const previousStatus = existingTask.status;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: status as any,
        ...(order !== undefined ? { order: Number(order) } : {})
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    // If status changed to DONE, send completion notification & log
    if (status === 'DONE' && previousStatus !== 'DONE') {
      await logActivity({
        workspaceId: existingTask.project.workspaceId,
        projectId: existingTask.projectId,
        taskId: id,
        userId: req.user!.id,
        action: 'TASK_COMPLETED',
        entityType: 'TASK',
        entityId: id,
        details: `${req.user!.name} completed task "${existingTask.title}".`
      });

      if (existingTask.creatorId !== req.user!.id) {
        await prisma.notification.create({
          data: {
            userId: existingTask.creatorId,
            title: 'Task Completed',
            message: `${req.user!.name} marked "${existingTask.title}" as DONE.`,
            type: 'COMPLETION',
            link: `/tasks/${id}`
          }
        });
      }
    } else if (previousStatus !== status) {
      await logActivity({
        workspaceId: existingTask.project.workspaceId,
        projectId: existingTask.projectId,
        taskId: id,
        userId: req.user!.id,
        action: 'STATUS_CHANGED',
        entityType: 'TASK',
        entityId: id,
        details: `${req.user!.name} changed status of "${existingTask.title}" from ${previousStatus} → ${status}.`
      });
    }

    calculateProjectHealth(existingTask.projectId).catch(console.error);

    return res.json({
      success: true,
      message: `Task moved to ${status}`,
      task: updatedTask
    });
  } catch (error: any) {
    console.error('Update task status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
});

// -----------------------------------------------------------------------------
// PUT /api/tasks/:id - Update task details
// -----------------------------------------------------------------------------
router.put('/:id', authenticate, requirePermission('tasks.update'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData: any = {};

    const fields = ['title', 'description', 'assigneeId', 'priority', 'status', 'estimatedHours', 'actualHours'];
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

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        subtasks: true
      }
    });

    calculateProjectHealth(updated.projectId).catch(console.error);

    return res.json({
      success: true,
      message: 'Task updated successfully',
      task: {
        ...updated,
        tags: JSON.parse(updated.tags || '[]')
      }
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/tasks/:id/subtasks - Add a subtask
// -----------------------------------------------------------------------------
router.post('/:id/subtasks', authenticate, requirePermission('tasks.update'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Subtask title cannot be empty' });
    }

    const count = await prisma.subtask.count({ where: { taskId: id } });

    const subtask = await prisma.subtask.create({
      data: {
        title: title.trim(),
        taskId: id,
        order: count,
        isCompleted: false
      }
    });

    return res.status(201).json({ success: true, subtask });
  } catch (error: any) {
    console.error('Add subtask error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add subtask' });
  }
});

// -----------------------------------------------------------------------------
// PUT /api/tasks/:id/subtasks/:subtaskId/toggle - Toggle subtask completion
// -----------------------------------------------------------------------------
router.put('/:id/subtasks/:subtaskId/toggle', authenticate, requirePermission('tasks.update'), async (req: AuthRequest, res: Response) => {
  try {
    const subtaskId = req.params.subtaskId as string;

    const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
    if (!subtask) {
      return res.status(404).json({ success: false, message: 'Subtask not found' });
    }

    const updated = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted: !subtask.isCompleted }
    });

    return res.json({ success: true, subtask: updated });
  } catch (error: any) {
    console.error('Toggle subtask error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle subtask' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/tasks/:id/comments - Add comment or reply with @mention alerts
// -----------------------------------------------------------------------------
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { workspaceId: true } } }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId: id,
        userId: req.user!.id,
        parentId: parentId || null
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } }
      }
    });

    // Check for @mentions (e.g., @Rahul or @admin)
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const matches = content.match(mentionRegex);
    if (matches) {
      // Find matching users by name prefix
      for (const match of matches) {
        const username = match.substring(1);
        const mentionedUser = await prisma.user.findFirst({
          where: {
            name: { contains: username }
          }
        });

        if (mentionedUser && mentionedUser.id !== req.user!.id) {
          await prisma.notification.create({
            data: {
              userId: mentionedUser.id,
              title: 'Mentioned in Comment',
              message: `${req.user!.name} mentioned you in task "${task.title}": "${content.substring(0, 80)}..."`,
              type: 'MENTION',
              link: `/tasks/${task.id}`
            }
          });
        }
      }
    }

    return res.status(201).json({ success: true, comment });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to post comment' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/tasks/:id/dependencies - Add task dependency with conflict validation
// -----------------------------------------------------------------------------
router.post('/:id/dependencies', authenticate, requirePermission('tasks.update'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { predecessorTaskId } = req.body;

    if (!predecessorTaskId) {
      return res.status(400).json({ success: false, message: 'Predecessor task ID is required' });
    }

    if (predecessorTaskId === id) {
      return res.status(400).json({ success: false, message: 'A task cannot depend on itself' });
    }

    // Validate impossible schedule (predecessor deadline > successor deadline)
    const [currTask, predTask] = await Promise.all([
      prisma.task.findUnique({ where: { id } }),
      prisma.task.findUnique({ where: { id: predecessorTaskId } })
    ]);

    if (!currTask || !predTask) {
      return res.status(404).json({ success: false, message: 'One or both tasks not found' });
    }

    let warning: string | null = null;
    if (currTask.deadline && predTask.deadline && new Date(predTask.deadline) > new Date(currTask.deadline)) {
      warning = `Schedule conflict: Predecessor task "${predTask.title}" has a deadline later than this task.`;
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        predecessorTaskId,
        successorTaskId: id
      }
    });

    return res.status(201).json({
      success: true,
      dependency,
      warning
    });
  } catch (error: any) {
    console.error('Dependency creation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create dependency' });
  }
});

// -----------------------------------------------------------------------------
// DELETE /api/tasks/:id - Delete task
// -----------------------------------------------------------------------------
router.delete('/:id', authenticate, requirePermission('tasks.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: { select: { workspaceId: true } } }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });

    await logActivity({
      workspaceId: task.project.workspaceId,
      projectId: task.projectId,
      userId: req.user!.id,
      action: 'TASK_DELETED',
      entityType: 'TASK',
      entityId: id,
      details: `${req.user!.name} deleted task "${task.title}".`
    });

    calculateProjectHealth(task.projectId).catch(console.error);

    return res.json({ success: true, message: `Task "${task.title}" deleted.` });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

export default router;
