export type RoleType = 'OWNER' | 'PROJECT_MANAGER' | 'EDITOR' | 'VIEWER';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export type ProjectHealthStatus = 'HEALTHY' | 'AT_RISK' | 'CRITICAL';

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  avatarUrl?: string | null;
  title?: string;
  department?: string;
  bio?: string;
  workspaceId?: string;
  workspaceName?: string;
  permissions?: PermissionName[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
  teamId?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  priority: PriorityLevel;
  status: ProjectStatus;
  budget: number;
  estimatedHours: number;
  actualHours: number;
  color: string;
  tags: string[];
  template: string;
  healthScore: number;
  healthStatus: ProjectHealthStatus;
  healthReason?: string;
  progressPercent?: number;
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  milestones?: Milestone[];
  events?: CalendarEvent[];
  aiPlans?: AIPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  taskId: string;
  order: number;
}

export interface TaskDependency {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  type: string;
  predecessor?: {
    id: string;
    title: string;
    status: TaskStatus;
    deadline?: string;
  };
  successor?: {
    id: string;
    title: string;
    status: TaskStatus;
    deadline?: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string | null;
  creatorId: string;
  priority: PriorityLevel;
  status: TaskStatus;
  startDate?: string | null;
  deadline?: string | null;
  estimatedHours: number;
  actualHours: number;
  order: number;
  tags: string[];
  assignee?: User | null;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  project?: {
    id: string;
    name: string;
    color: string;
    workspaceId?: string;
  };
  subtasks?: Subtask[];
  comments?: Comment[];
  timeEntries?: TimeEntry[];
  precededBy?: TaskDependency[];
  succeeds?: TaskDependency[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  };
  replies?: Comment[];
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string | null;
  durationSeconds: number;
  description?: string | null;
  isRunning: boolean;
  createdAt: string;
  taskTitle?: string;
  projectName?: string;
  color?: string;
  durationFormatted?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  rawId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'DEADLINE' | 'MEETING' | 'MILESTONE' | 'RELEASE' | 'REVIEW' | 'OVERDUE';
  color: string;
  projectId?: string;
  projectName?: string;
  location?: string;
  isCompleted?: boolean;
  isCustomEvent: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'COMPLETION' | 'DEADLINE_WARNING' | 'OVERDUE' | 'INVITATION' | 'MENTION' | 'COMMENT' | 'DEPENDENCY_BLOCKED' | 'AI_INSIGHT';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  };
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface AIPlan {
  id: string;
  prompt: string;
  title: string;
  overview: string;
  phasesJson: string;
  status: string;
  createdAt: string;
}

export interface ProjectPulse {
  activeProjectsCount: number;
  tasksCompletedToday: number;
  overdueTasksCount: number;
  upcomingDeadlinesCount: number;
  criticalProjectsCount: number;
  overallSystemHealth: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
}
