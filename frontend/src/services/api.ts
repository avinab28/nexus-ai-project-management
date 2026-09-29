const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('nexus_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('nexus_auth_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('nexus_auth_token');
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  register: (payload: { name: string; email: string; password: string; workspaceName?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  demoLogin: (role: 'OWNER' | 'PROJECT_MANAGER' | 'EDITOR' | 'VIEWER' | string) =>
    request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),

  getMe: () => request('/auth/me'),

  logout: () => {
    removeAuthToken();
    return request('/auth/logout', { method: 'POST' }).catch(() => {});
  },

  // Projects
  getProjects: (status?: string) =>
    request(`/projects${status ? `?status=${status}` : ''}`),

  getProject: (id: string) => request(`/projects/${id}`),

  getProjectPulse: () => request('/projects/pulse'),

  createProject: (data: any) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),

  updateProject: (id: string, data: any) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params: Record<string, string | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    return request(`/tasks?${query.toString()}`);
  },

  getTask: (id: string) => request(`/tasks/${id}`),

  createTask: (data: any) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  updateTask: (id: string, data: any) =>
    request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  updateTaskStatus: (id: string, status: string, order?: number) =>
    request(`/tasks/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, order }) }),

  deleteTask: (id: string) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),

  addSubtask: (taskId: string, title: string) =>
    request(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) }),

  toggleSubtask: (taskId: string, subtaskId: string) =>
    request(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, { method: 'PUT' }),

  addComment: (taskId: string, content: string, parentId?: string) =>
    request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) }),

  addDependency: (taskId: string, predecessorTaskId: string) =>
    request(`/tasks/${taskId}/dependencies`, { method: 'POST', body: JSON.stringify({ predecessorTaskId }) }),

  // Time Tracking
  startTimer: (taskId: string) =>
    request(`/time/tasks/${taskId}/start`, { method: 'POST' }),

  stopTimer: (taskId: string) =>
    request(`/time/tasks/${taskId}/stop`, { method: 'POST' }),

  resetTimer: (taskId: string) =>
    request(`/time/tasks/${taskId}/reset`, { method: 'POST' }),

  getActiveTimer: () => request('/time/active'),

  getTimeStats: () => request('/time/stats'),

  // Calendar
  getCalendarEvents: () => request('/calendar'),

  createCalendarEvent: (data: any) =>
    request('/calendar', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalytics: (range = '30d') => request(`/analytics?range=${range}`),

  // AI Assistant
  generateAIPlan: (prompt: string, projectId?: string, context?: string) =>
    request('/ai/project-plan', { method: 'POST', body: JSON.stringify({ prompt, projectId, context }) }),

  applyAIPlan: (projectId: string, phases: any[]) =>
    request('/ai/apply-plan', { method: 'POST', body: JSON.stringify({ projectId, phases }) }),

  breakDownTask: (title: string, context?: string) =>
    request('/ai/task-breakdown', { method: 'POST', body: JSON.stringify({ title, context }) }),

  getProjectHealth: (projectId: string) => request(`/ai/project-health/${projectId}`),

  getDailyBrief: () => request('/ai/daily-brief'),

  queryAssistant: (query: string, projectId?: string) =>
    request('/ai/query', { method: 'POST', body: JSON.stringify({ query, projectId }) }),

  // Notifications
  getNotifications: () => request('/notifications'),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),

  // Activity
  getActivities: (projectId?: string) =>
    request(`/activity${projectId ? `?projectId=${projectId}` : ''}`),

  // Workspaces & Members
  getWorkspaces: () => request('/workspaces'),

  getMembers: () => request('/workspaces/members'),

  updateMemberRole: (userId: string, role: string) =>
    request(`/workspaces/members/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  getPermissionsMatrix: () => request('/permissions/matrix'),

  getRoles: () => request('/permissions/roles'),

  createRole: (data: { name: string; key?: string; description?: string; color?: string; permissions: string[] }) =>
    request('/permissions/roles', { method: 'POST', body: JSON.stringify(data) }),

  updateRole: (key: string, data: any) =>
    request(`/permissions/roles/${key}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteRole: (key: string) =>
    request(`/permissions/roles/${key}`, { method: 'DELETE' }),

  // Global Search
  search: (q: string) => request(`/search?q=${encodeURIComponent(q)}`),
};
