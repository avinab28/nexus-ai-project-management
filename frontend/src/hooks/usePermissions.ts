import { useAuth } from '../context/AuthContext';
import { PermissionName, RoleType } from '../types';

export function usePermissions() {
  const { user, hasPermission } = useAuth();

  const isOwner = user?.role === 'OWNER';
  const isProjectManager = user?.role === 'PROJECT_MANAGER' || isOwner;
  const isEditor = user?.role === 'EDITOR' || isProjectManager;
  const isViewer = user?.role === 'VIEWER';

  const canCreateProject = hasPermission('projects.create');
  const canUpdateProject = hasPermission('projects.update');
  const canDeleteProject = hasPermission('projects.delete');

  const canCreateTask = hasPermission('tasks.create');
  const canUpdateTask = hasPermission('tasks.update');
  const canDeleteTask = hasPermission('tasks.delete');
  const canAssignTask = hasPermission('tasks.assign');

  const canManageMembers = hasPermission('members.invite') || hasPermission('members.remove');
  const canManageSettings = hasPermission('settings.manage');
  const canTrackTime = hasPermission('time.track');

  return {
    userRole: user?.role as RoleType,
    role: (user?.role || 'VIEWER') as RoleType,
    permissions: user?.permissions || [],
    can: (permission: any) => hasPermission(permission as PermissionName),
    isOwner,
    isProjectManager,
    isEditor,
    isViewer,
    hasPermission,
    canCreateProject,
    canUpdateProject,
    canDeleteProject,
    canCreateTask,
    canUpdateTask,
    canDeleteTask,
    canAssignTask,
    canManageMembers,
    canManageSettings,
    canTrackTime
  };
}
