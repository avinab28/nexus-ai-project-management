import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(2, 'Event title is required'),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.enum(['DEADLINE', 'MEETING', 'MILESTONE', 'RELEASE', 'REVIEW']).default('MEETING'),
  projectId: z.string().optional().nullable(),
  location: z.string().optional()
});

// -----------------------------------------------------------------------------
// GET /api/calendar - Unified calendar feed with meetings, deadlines, and milestones
// -----------------------------------------------------------------------------
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string || req.user?.workspaceId;
    const now = new Date();

    // 1. Explicit Calendar Events
    const events = await prisma.event.findMany({
      where: workspaceId ? { workspaceId } : {},
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { name: true, avatarUrl: true } }
      }
    });

    // 2. Task Deadlines
    const tasksWithDeadlines = await prisma.task.findMany({
      where: {
        deadline: { not: null },
        ...(workspaceId ? { project: { workspaceId } } : {})
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { name: true, avatarUrl: true } }
      }
    });

    // 3. Project Milestones
    const milestones = await prisma.milestone.findMany({
      where: workspaceId ? { project: { workspaceId } } : {},
      include: {
        project: { select: { id: true, name: true, color: true } }
      }
    });

    // Merge and harmonize into a single event schema
    const unifiedFeed = [
      ...events.map(e => ({
        id: `event-${e.id}`,
        rawId: e.id,
        title: e.title,
        description: e.description,
        startTime: e.startTime,
        endTime: e.endTime,
        type: e.type,
        color: e.type === 'MEETING' ? '#3B82F6' : e.type === 'MILESTONE' ? '#8B5CF6' : '#10B981',
        projectId: e.projectId,
        projectName: e.project?.name,
        location: e.location,
        isCustomEvent: true
      })),
      ...tasksWithDeadlines.map(t => {
        const isOverdue = t.status !== 'DONE' && new Date(t.deadline!) < now;
        return {
          id: `task-deadline-${t.id}`,
          rawId: t.id,
          title: `Task Deadline: ${t.title}`,
          description: `Assigned to: ${t.assignee?.name || 'Unassigned'} • Status: ${t.status}`,
          startTime: t.deadline!,
          endTime: t.deadline!,
          type: isOverdue ? 'OVERDUE' : 'DEADLINE',
          color: isOverdue ? '#EF4444' : '#F59E0B',
          projectId: t.projectId,
          projectName: t.project.name,
          isCompleted: t.status === 'DONE',
          isCustomEvent: false
        };
      }),
      ...milestones.map(m => ({
        id: `milestone-${m.id}`,
        rawId: m.id,
        title: `Milestone: ${m.title}`,
        description: m.description || 'Project delivery milestone',
        startTime: m.dueDate,
        endTime: m.dueDate,
        type: 'MILESTONE',
        color: m.isCompleted ? '#10B981' : '#8B5CF6',
        projectId: m.projectId,
        projectName: m.project.name,
        isCompleted: m.isCompleted,
        isCustomEvent: false
      }))
    ];

    return res.json({ success: true, events: unifiedFeed });
  } catch (error: any) {
    console.error('Calendar feed error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve calendar events' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/calendar - Create new calendar meeting/event
// -----------------------------------------------------------------------------
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parse = createEventSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const data = parse.data;
    const workspaceId = req.user?.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Active workspace required' });
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        type: data.type as any,
        projectId: data.projectId,
        location: data.location,
        workspaceId,
        createdById: req.user!.id
      },
      include: {
        project: { select: { id: true, name: true, color: true } }
      }
    });

    return res.status(201).json({ success: true, event });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create calendar event' });
  }
});

export default router;
