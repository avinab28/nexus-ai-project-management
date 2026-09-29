import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/activity - Workspace activity logs
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string || req.user?.workspaceId;
    const projectId = req.query.projectId as string;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (projectId) where.projectId = projectId;

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
        project: { select: { id: true, name: true, color: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json({ success: true, activities });
  } catch (error: any) {
    console.error('Fetch activities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
  }
});

export default router;
