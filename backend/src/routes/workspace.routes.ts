import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

// -----------------------------------------------------------------------------
// GET /api/workspaces - User's workspaces
// -----------------------------------------------------------------------------
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id },
      include: {
        workspace: {
          include: {
            organization: true,
            _count: {
              select: { projects: true, memberships: true }
            }
          }
        }
      }
    });

    const workspaces = memberships.map(m => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      organizationName: m.workspace.organization.name,
      projectCount: m.workspace._count.projects,
      memberCount: m.workspace._count.memberships
    }));

    return res.json({ success: true, workspaces });
  } catch (error: any) {
    console.error('Workspaces fetch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch workspaces' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/workspaces/members - List members in workspace
// -----------------------------------------------------------------------------
router.get('/members', authenticate, requirePermission('members.read'), async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string || req.user?.workspaceId;

    const memberships = await prisma.membership.findMany({
      where: workspaceId ? { workspaceId } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            title: true,
            department: true,
            bio: true,
            _count: {
              select: { assignedTasks: true }
            }
          }
        }
      }
    });

    const members = memberships.map(m => ({
      id: m.user.id,
      membershipId: m.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      title: m.user.title,
      department: m.user.department,
      bio: m.user.bio,
      role: m.role,
      assignedTaskCount: m.user._count.assignedTasks
    }));

    return res.json({ success: true, members });
  } catch (error: any) {
    console.error('Fetch members error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
});

// -----------------------------------------------------------------------------
// PUT /api/workspaces/members/:userId/role - Change member role
// -----------------------------------------------------------------------------
router.put('/members/:userId/role', authenticate, requirePermission('settings.manage'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body;
    const workspaceId = req.user?.workspaceId;

    const normalizedRole = (role || '').toUpperCase().trim();
    const customRoleExists = await prisma.customRole.findFirst({ where: { key: normalizedRole } });
    if (!['OWNER', 'PROJECT_MANAGER', 'EDITOR', 'VIEWER'].includes(normalizedRole) && !customRoleExists) {
      return res.status(400).json({ success: false, message: `Invalid or unrecognized role: '${role}'. Please create the role first.` });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId }
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Member not found in workspace' });
    }

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { role: role as any }
    });

    // Also update global role on User table for convenience
    await prisma.user.update({
      where: { id: userId },
      data: { role: role as any }
    });

    return res.json({ success: true, message: 'Role updated successfully', membership: updated });
  } catch (error: any) {
    console.error('Update role error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update member role' });
  }
});

export default router;
