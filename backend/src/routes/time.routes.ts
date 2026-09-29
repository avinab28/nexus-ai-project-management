import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// -----------------------------------------------------------------------------
// POST /api/tasks/:id/timer/start - Start or resume a timer for a task
// -----------------------------------------------------------------------------
router.post('/tasks/:id/start', authenticate, requirePermission('time.track'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Check if there is already an active running timer for this user across any task
    const running = await prisma.timeEntry.findFirst({
      where: { userId, isRunning: true }
    });

    if (running) {
      // Automatically stop existing running timer to prevent overlap
      const now = new Date();
      const elapsedSeconds = Math.round((now.getTime() - new Date(running.startTime).getTime()) / 1000);
      const totalDuration = running.durationSeconds + elapsedSeconds;

      await prisma.timeEntry.update({
        where: { id: running.id },
        data: {
          endTime: now,
          durationSeconds: totalDuration,
          isRunning: false
        }
      });

      // Update actual hours on previous task
      await prisma.task.update({
        where: { id: running.taskId },
        data: { actualHours: { increment: elapsedSeconds / 3600 } }
      });
    }

    // Create new running entry for current task
    const entry = await prisma.timeEntry.create({
      data: {
        taskId: id,
        userId,
        startTime: new Date(),
        isRunning: true,
        durationSeconds: 0
      },
      include: {
        task: { select: { id: true, title: true, projectId: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Timer started',
      entry
    });
  } catch (error: any) {
    console.error('Timer start error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start timer' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/tasks/:id/timer/stop - Stop active timer and commit duration
// -----------------------------------------------------------------------------
router.post('/tasks/:id/stop', authenticate, requirePermission('time.track'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const running = await prisma.timeEntry.findFirst({
      where: { taskId: id, userId, isRunning: true }
    });

    if (!running) {
      return res.status(400).json({ success: false, message: 'No active timer found for this task' });
    }

    const now = new Date();
    const elapsedSeconds = Math.round((now.getTime() - new Date(running.startTime).getTime()) / 1000);
    const finalDuration = running.durationSeconds + elapsedSeconds;

    const updated = await prisma.timeEntry.update({
      where: { id: running.id },
      data: {
        endTime: now,
        durationSeconds: finalDuration,
        isRunning: false
      }
    });

    // Update actual hours on task and project
    const hoursLogged = finalDuration / 3600;
    const task = await prisma.task.update({
      where: { id },
      data: { actualHours: { increment: hoursLogged } },
      select: { projectId: true, actualHours: true }
    });

    await prisma.project.update({
      where: { id: task.projectId },
      data: { actualHours: { increment: hoursLogged } }
    });

    return res.json({
      success: true,
      message: 'Timer stopped and hours logged',
      entry: updated,
      totalTaskHours: task.actualHours
    });
  } catch (error: any) {
    console.error('Timer stop error:', error);
    return res.status(500).json({ success: false, message: 'Failed to stop timer' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/tasks/:id/timer/reset - Reset current timer
// -----------------------------------------------------------------------------
router.post('/tasks/:id/reset', authenticate, requirePermission('time.track'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    await prisma.timeEntry.deleteMany({
      where: { taskId: id, userId, isRunning: true }
    });

    return res.json({ success: true, message: 'Active timer reset' });
  } catch (error: any) {
    console.error('Timer reset error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset timer' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/time/active - Get user's current running timer if any
// -----------------------------------------------------------------------------
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const running = await prisma.timeEntry.findFirst({
      where: { userId: req.user!.id, isRunning: true },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            deadline: true,
            status: true,
            project: { select: { id: true, name: true, color: true } }
          }
        }
      }
    });

    if (!running) {
      return res.json({ success: true, activeTimer: null });
    }

    const elapsedSeconds = Math.round((Date.now() - new Date(running.startTime).getTime()) / 1000);

    return res.json({
      success: true,
      activeTimer: {
        ...running,
        currentElapsedSeconds: running.durationSeconds + elapsedSeconds
      }
    });
  } catch (error: any) {
    console.error('Fetch active timer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check active timer' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/time/stats - Summary for daily, weekly, project hours
// -----------------------------------------------------------------------------
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayEntries, weekEntries, allEntries] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { userId, createdAt: { gte: startOfToday } }
      }),
      prisma.timeEntry.findMany({
        where: { userId, createdAt: { gte: startOfWeek } },
        include: { task: { select: { project: { select: { name: true, color: true } } } } }
      }),
      prisma.timeEntry.findMany({
        where: { userId },
        include: {
          task: {
            select: {
              title: true,
              project: { select: { name: true, color: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      })
    ]);

    const dailySeconds = todayEntries.reduce((acc, e) => acc + e.durationSeconds, 0);
    const weeklySeconds = weekEntries.reduce((acc, e) => acc + e.durationSeconds, 0);

    // Group weekly by project
    const projectBreakdownMap: Record<string, { name: string; color: string; seconds: number }> = {};
    weekEntries.forEach(e => {
      const proj = e.task?.project;
      const key = proj?.name || 'Unassigned';
      if (!projectBreakdownMap[key]) {
        projectBreakdownMap[key] = {
          name: key,
          color: proj?.color || '#6366F1',
          seconds: 0
        };
      }
      projectBreakdownMap[key].seconds += e.durationSeconds;
    });

    const projectBreakdown = Object.values(projectBreakdownMap).map(p => ({
      ...p,
      hours: Number((p.seconds / 3600).toFixed(1))
    }));

    return res.json({
      success: true,
      stats: {
        dailyHours: Number((dailySeconds / 3600).toFixed(1)),
        weeklyHours: Number((weeklySeconds / 3600).toFixed(1)),
        projectBreakdown,
        recentEntries: allEntries.map(e => ({
          id: e.id,
          taskTitle: e.task.title,
          projectName: e.task.project.name,
          color: e.task.project.color,
          durationFormatted: formatDuration(e.durationSeconds),
          durationSeconds: e.durationSeconds,
          createdAt: e.createdAt,
          description: e.description
        }))
      }
    });
  } catch (error: any) {
    console.error('Time stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve time stats' });
  }
});

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default router;
