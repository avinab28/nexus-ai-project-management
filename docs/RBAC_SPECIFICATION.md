# NEXUS Role-Based Access Control (RBAC) Specification

NEXUS enforces fine-grained, deterministic permissions at both the **Express API Gateway** (`backend/src/middleware/rbac.ts`) and the **React UI Layer** (`frontend/src/hooks/usePermissions.ts`).

---

## 1. Persona Hierarchy & Definitions

| Persona | System Code | Scope Summary |
|---|---|---|
| 👑 **Workspace Owner** | `OWNER` | Complete control over workspace, all projects, permissions, billing, and member roles. |
| 🎯 **Project Manager** | `PROJECT_MANAGER` | Create & orchestrate projects, manage sprints, assign tasks, plan schedules, view analytics. |
| 💻 **Editor / Developer** | `EDITOR` | Create & modify tasks, move status in Kanban, track time limits, post comments. |
| 👁️ **Viewer / Stakeholder** | `VIEWER` | Read-only inspection of projects, tasks, timeline, calendar, and analytical summaries. |

---

## 2. Granular Permissions Matrix

| Capability Scope | Scope Key | Owner | Project Manager | Editor | Viewer |
|---|---|:---:|:---:|:---:|:---:|
| **Read Projects** | `projects.read` | ✅ | ✅ | ✅ | ✅ |
| **Create Projects** | `projects.create` | ✅ | ✅ | ❌ | ❌ |
| **Edit Project Settings** | `projects.update` | ✅ | ✅ | ❌ | ❌ |
| **Delete Project** | `projects.delete` | ✅ | ❌ | ❌ | ❌ |
| **Read Tasks** | `tasks.read` | ✅ | ✅ | ✅ | ✅ |
| **Create Tasks** | `tasks.create` | ✅ | ✅ | ✅ | ❌ |
| **Edit Tasks** | `tasks.update` | ✅ | ✅ | ✅ | ❌ |
| **Delete Tasks** | `tasks.delete` | ✅ | ✅ | ❌ | ❌ |
| **Move Status (Kanban)** | `tasks.status` | ✅ | ✅ | ✅ | ❌ |
| **Assign Tasks** | `tasks.assign` | ✅ | ✅ | ❌ | ❌ |
| **Track Working Time** | `time.track` | ✅ | ✅ | ✅ | ❌ |
| **Add Comments** | `comments.create` | ✅ | ✅ | ✅ | ❌ |
| **Generate AI Plans** | `ai.generate_plan` | ✅ | ✅ | ❌ | ❌ |
| **Apply AI Plans** | `ai.apply_plan` | ✅ | ✅ | ❌ | ❌ |
| **Run Health Diagnostics**| `ai.analyze` | ✅ | ✅ | ✅ | ❌ |
| **View Analytics** | `analytics.read` | ✅ | ✅ | ✅ | ✅ |
| **Read Members** | `members.read` | ✅ | ✅ | ✅ | ✅ |
| **Invite Members** | `members.invite` | ✅ | ✅ | ❌ | ❌ |
| **Manage Roles & Settings**| `settings.manage` | ✅ | ❌ | ❌ | ❌ |

---

## 3. Demo Persona Testing Accounts

For testing, review, and demonstration, 4 pre-seeded accounts can be accessed either via standard email/password or using the **1-Click Persona Selector** on the `/login` page:

* **👑 Owner**: `admin@nexus.ai` / `password123`
* **🎯 Project Manager**: `pm@nexus.ai` / `password123`
* **💻 Editor**: `dev@nexus.ai` / `password123`
* **👁️ Viewer**: `viewer@nexus.ai` / `password123`

When logged in, users can also instantly hot-swap their persona via the role dropdown in the top navbar.
