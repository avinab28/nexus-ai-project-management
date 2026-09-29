import { Request, Response, NextFunction } from 'express';

export type RoleType = 'OWNER' | 'PROJECT_MANAGER' | 'EDITOR' | 'VIEWER';

export type PermissionName =
  | 'projects.read'
  | 'projects.create'
  | 'projects.update'
  | 'projects.delete'
  | 'tasks.read'
  | 'tasks.create'
  | 'tasks.update'
  | 'tasks.delete'
  | 'tasks.assign'
  | 'members.read'
  | 'members.invite'
  | 'members.remove'
  | 'analytics.read'
  | 'settings.manage'
  | 'time.track';

export const ROLE_PERMISSIONS: Record<RoleType, PermissionName[]> = {
  OWNER: [
    'projects.read',
    'projects.create',
    'projects.update',
    'projects.delete',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'tasks.delete',
    'tasks.assign',
    'members.read',
    'members.invite',
    'members.remove',
    'analytics.read',
    'settings.manage',
    'time.track'
  ],
  PROJECT_MANAGER: [
    'projects.read',
    'projects.create',
    'projects.update',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'tasks.delete',
    'tasks.assign',
    'members.read',
    'members.invite',
    'analytics.read',
    'time.track'
  ],
  EDITOR: [
    'projects.read',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'members.read',
    'analytics.read',
    'time.track'
  ],
  VIEWER: [
    'projects.read',
    'tasks.read',
    'members.read',
    'analytics.read'
  ]
};

export function hasPermission(role: RoleType, permission: PermissionName): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

export function requireRole(...allowedRoles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as RoleType;
    if (!userRole) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`,
        userRole
      });
    }

    next();
  };
}

export function requirePermission(permission: PermissionName) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as RoleType;
    if (!userRole) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${userRole}' lacks permission '${permission}'`,
        permission,
        userRole
      });
    }

    next();
  };
}
