import { Request, Response, NextFunction } from 'express';

export type RoleType = 'OWNER' | 'PROJECT_MANAGER' | 'EDITOR' | 'VIEWER' | string;

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

export const ROLE_PERMISSIONS: Record<string, PermissionName[]> = {
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

// Dynamic in-memory registry for any custom roles added by the user
export const DYNAMIC_ROLE_REGISTRY: Record<string, {
  name: string;
  description: string;
  color: string;
  permissions: PermissionName[];
  isSystem: boolean;
}> = {
  OWNER: {
    name: 'Workspace Owner',
    description: 'Unrestricted administrative access to all projects, organizational settings, members, and billing.',
    color: '#a855f7',
    permissions: ROLE_PERMISSIONS.OWNER,
    isSystem: true
  },
  PROJECT_MANAGER: {
    name: 'Project Manager / Team Leader',
    description: 'Can create projects, orchestrate teams, assign tasks, manage schedules, and review productivity.',
    color: '#3b82f6',
    permissions: ROLE_PERMISSIONS.PROJECT_MANAGER,
    isSystem: true
  },
  EDITOR: {
    name: 'Editor / Developer',
    description: 'Can create and modify tasks, update progress status, contribute comments, and track working time.',
    color: '#06b6d4',
    permissions: ROLE_PERMISSIONS.EDITOR,
    isSystem: true
  },
  VIEWER: {
    name: 'Viewer / Stakeholder',
    description: 'Read-only access to projects, tasks, timelines, and analytical reports.',
    color: '#10b981',
    permissions: ROLE_PERMISSIONS.VIEWER,
    isSystem: true
  }
};

export function registerCustomRole(
  key: string,
  name: string,
  description: string,
  color: string,
  permissions: PermissionName[]
) {
  const normalizedKey = key.toUpperCase().trim();
  ROLE_PERMISSIONS[normalizedKey] = permissions;
  DYNAMIC_ROLE_REGISTRY[normalizedKey] = {
    name,
    description,
    color: color || '#06b6d4',
    permissions,
    isSystem: false
  };
}

export function removeCustomRole(key: string): boolean {
  const normalizedKey = key.toUpperCase().trim();
  if (DYNAMIC_ROLE_REGISTRY[normalizedKey]?.isSystem) {
    return false; // Cannot delete core system roles
  }
  delete ROLE_PERMISSIONS[normalizedKey];
  delete DYNAMIC_ROLE_REGISTRY[normalizedKey];
  return true;
}

export function hasPermission(role: string, permission: PermissionName): boolean {
  const normalizedRole = role.toUpperCase();
  const allowed = ROLE_PERMISSIONS[normalizedRole] || [];
  return allowed.includes(permission);
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role as string;
    if (!userRole) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    if (!normalizedAllowed.includes(userRole.toUpperCase())) {
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
    const userRole = (req as any).user?.role as string;
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
