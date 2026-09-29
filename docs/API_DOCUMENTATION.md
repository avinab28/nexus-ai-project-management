# NEXUS RESTful API Documentation

All API routes are served under `/api` with JSON payloads. Authenticated routes require an `Authorization: Bearer <token>` header.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login`
Authenticates an existing user.
- **Request Body**:
  ```json
  {
    "email": "admin@nexus.ai",
    "password": "password123"
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "cm...",
      "name": "Alexander Wright",
      "email": "admin@nexus.ai",
      "role": "OWNER",
      "permissions": [...]
    }
  }
  ```

### `POST /api/auth/register`
Creates a new user, default organization, and workspace.
- **Request Body**:
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah@nexus.ai",
    "password": "securePassword123",
    "workspaceName": "Cyberdyne Systems"
  }
  ```

### `POST /api/auth/demo-login`
Instant 1-click authentication into predefined persona accounts.
- **Request Body**:
  ```json
  {
    "role": "OWNER" // "OWNER" | "PROJECT_MANAGER" | "EDITOR" | "VIEWER"
  }
  ```

### `GET /api/auth/me`
Retrieves current authenticated user profile, active workspace, and permissions.

---

## 2. Projects (`/api/projects`)

### `GET /api/projects`
List projects within active workspace.
- **Query Params**: `status` (`PLANNING` | `ACTIVE` | `ON_HOLD` | `COMPLETED` | `ARCHIVED`)
- **Permission**: `projects.read`

### `POST /api/projects`
Create a new project.
- **Permission**: `projects.create`
- **Request Body**:
  ```json
  {
    "name": "NextGen AI Search Engine",
    "description": "Semantic neural search engine",
    "color": "#6366F1",
    "startDate": "2026-10-01T00:00:00Z",
    "targetDate": "2026-12-15T00:00:00Z"
  }
  ```

### `GET /api/projects/:id`
Fetch single project with all tasks, milestones, and team members.

### `GET /api/projects/pulse`
High-level workspace pulse statistics (active count, overdue count, completed today).

---

## 3. Tasks & Dependencies (`/api/tasks`)

### `GET /api/tasks`
Query tasks with filtering.
- **Query Params**: `projectId`, `status`, `priority`, `assigneeId`, `search`

### `POST /api/tasks`
Create a new task.
- **Permission**: `tasks.create`
- **Request Body**:
  ```json
  {
    "projectId": "cm...",
    "title": "Build vector indexing pipeline",
    "priority": "HIGH",
    "status": "TODO",
    "deadline": "2026-10-10T18:00:00Z",
    "estimatedHours": 16,
    "tags": ["backend", "ai"]
  }
  ```

### `PUT /api/tasks/:id/status`
Move task status in Kanban workflow.
- **Permission**: `tasks.status`
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS",
    "order": 1
  }
  ```

### `POST /api/tasks/:id/dependencies`
Declare a task dependency relationship (Predecessor -> Successor).
- **Checks**: Cycle detection and schedule inversion warnings.

### `POST /api/tasks/:id/subtasks`
Add a checklist subtask item.

### `PUT /api/tasks/:id/subtasks/:subtaskId/toggle`
Toggle subtask completion state.

### `POST /api/tasks/:id/comments`
Add a discussion comment or reply.

---

## 4. Time Tracking (`/api/time`)

### `POST /api/time/tasks/:taskId/start`
Start active timer stopwatch for task. Automatically stops any currently running timer for the user.

### `POST /api/time/tasks/:taskId/stop`
Stops running timer and logs final duration.

### `POST /api/time/tasks/:taskId/reset`
Resets ongoing timer session.

### `GET /api/time/active`
Returns currently running timer for the authenticated user.

### `GET /api/time/stats`
Aggregated time statistics: total hours, today's hours, top project distribution.

---

## 5. AI Assistant & Diagnostics (`/api/ai`)

### `POST /api/ai/project-plan`
Generate a structured 30-day agile plan with milestones and task phases.
- **Permission**: `ai.generate_plan`
- **Request Body**:
  ```json
  {
    "prompt": "Launch an autonomous AI workflow engine in 30 days",
    "context": "4 engineers, PostgreSQL backend"
  }
  ```

### `POST /api/ai/apply-plan`
Materialize an AI generated plan into live database projects and tasks.
- **Permission**: `ai.apply_plan`

### `POST /api/ai/task-breakdown`
Decompose a complex task into 3-5 concrete actionable subtasks with time estimates.

### `GET /api/ai/project-health/:projectId`
Compute grounded causal health score (0-100) with explainable risk reasons.

### `GET /api/ai/daily-brief`
Generates daily executive briefing highlighting blockers, overdue tasks, and priorities.

---

## 6. Global Search (`/api/search`)

### `GET /api/search?q=query`
Searches simultaneously across projects, tasks, comments, and members.
