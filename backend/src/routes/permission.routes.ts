import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { ROLE_PERMISSIONS, RoleType } from '../middleware/rbac.js';

const router = Router();

// GET /api/permissions/matrix - Get granular permission matrix
router.get('/matrix', authenticate, (req: AuthRequest, res: Response) => {
  const roles = [
    {
      role: 'OWNER',
      name: 'Workspace Owner',
      description: 'Unrestricted administrative access to all projects, organizational settings, members, and billing.',
      permissions: ROLE_PERMISSIONS.OWNER
    },
    {
      role: 'PROJECT_MANAGER',
      name: 'Project Manager / Team Leader',
      description: 'Can create projects, orchestrate teams, assign tasks, manage schedules, and review productivity.',
      permissions: ROLE_PERMISSIONS.PROJECT_MANAGER
    },
    {
      role: 'EDITOR',
      name: 'Editor / Developer',
      description: 'Can create and modify tasks, update progress status, contribute comments, and track working time.',
      permissions: ROLE_PERMISSIONS.EDITOR
    },
    {
      role: 'VIEWER',
      name: 'Viewer / Stakeholder',
      description: 'Read-only access to projects, tasks, timelines, and analytical reports.',
      permissions: ROLE_PERMISSIONS.VIEWER
    }
  ];

  return res.json({
    success: true,
    roles,
    userRole: req.user?.role,
    userPermissions: ROLE_PERMISSIONS[req.user?.role as RoleType] || []
  });
});

export default router;
