# NEXUS System Architecture & Design Specification

## 1. High-Level Architecture Overview

**NEXUS** is an AI-powered project management and workflow orchestration platform architected around high performance, resilient data persistence, deterministic role-based security, and autonomous AI reasoning.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      User Browser                      │
                    │   React 19 + TypeScript + Vite + Tailwind CSS + 3D    │
                    └───────────────────────────┬────────────────────────────┘
                                                │ HTTPS / WebSocket / REST
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                   Vite Reverse Proxy                   │
                    │             (Dev: :5173 ➜ API Proxy: :5000)            │
                    │        (Prod: Nginx / Cloudflare CDN Static Host)       │
                    └───────────────────────────┬────────────────────────────┘
                                                │ RESTful API Calls
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                   Node.js / Express                    │
                    │           TypeScript RESTful API Gateway               │
                    ├────────────────────────────────────────────────────────┤
                    │ • JWT Authentication & Session Token Validator         │
                    │ • Granular RBAC Middleware (15 permission scopes)      │
                    │ • Global Search Query Aggregator                       │
                    │ • Audit & Activity Event Logger                        │
                    │ • Automated Causal Project Health Engine               │
                    │ • Task Dependency Graph Conflict Checker               │
                    └───────────┬───────────────────────────────┬────────────┘
                                │                               │
                    Prisma ORM  │                               │ Google GenAI SDK
                    Queries     │                               │ + Fallback Engine
                                ▼                               ▼
┌───────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│             Database Layer                    │ │           AI Inference               │
│ • Local Dev: SQLite (`dev.db`)                │ │ • Google Gemini 1.5 Flash API        │
│ • Production: PostgreSQL 16+                  │ │ • Grounded Heuristic Fallback Engine │
│   (Neon / Supabase / AWS RDS / Docker)        │ │ • 30-Day Plan Synthesizer            │
└───────────────────────────────────────────────┘ └──────────────────────────────────────┘
```

---

## 2. Directory Structure & Monorepo Layout

```
nexus-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Active schema (SQLite local dual-mode)
│   │   ├── schema.postgresql.prisma   # Production PostgreSQL schema (Enums, native arrays)
│   │   ├── dev.db                     # Local SQLite database file
│   │   └── seed.ts                    # Realistic demo database seeder
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                  # Prisma Client singleton
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT authentication & session extraction
│   │   │   └── rbac.ts                # Granular 15-permission capability gate
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # Login, register, demo 1-click persona switch
│   │   │   ├── project.routes.ts      # Projects CRUD & pulse metrics
│   │   │   ├── task.routes.ts         # Tasks, subtasks, dependencies, comments
│   │   │   ├── time.routes.ts         # Live timer start/stop/reset, timesheets
│   │   │   ├── calendar.routes.ts     # Aggregated calendar deadlines & events
│   │   │   ├── analytics.routes.ts    # Velocity, burndown, workload, status mix
│   │   │   ├── ai.routes.ts           # 30-day plans, task breakdown, causal health
│   │   │   ├── workspace.routes.ts    # Workspace members, roles, organizations
│   │   │   ├── notification.routes.ts # Unread filter & mark all read
│   │   │   ├── activity.routes.ts     # Audit trail stream & search
│   │   │   └── permission.routes.ts   # RBAC capability matrix
│   │   ├── services/
│   │   │   ├── ai.service.ts          # Gemini SDK integration + heuristic generator
│   │   │   ├── health.service.ts      # Causal explainability & risk assessment
│   │   │   └── activity.service.ts    # Immutable activity event recorder
│   │   └── server.ts                  # Express server entry point & search aggregator
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/
│   │   │   │   ├── Hero3DCanvas.tsx   # Three.js 3D geometric network visualization
│   │   │   │   └── AIOrb3D.tsx        # Pulsing interactive 3D energy orb
│   │   │   ├── common/
│   │   │   │   ├── CommandPalette.tsx # Global CTRL+K instant modal
│   │   │   │   ├── CountdownTimer.tsx # Dynamic deadline timer with overdue pulsing
│   │   │   │   └── StatusBadge.tsx    # Color-coded status & priority tags
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx      # Protected layout with sidebar & command center
│   │   │   │   ├── Navbar.tsx         # Persona switcher, active stopwatch, alerts
│   │   │   │   └── Sidebar.tsx        # Navigation menu with project quick-links
│   │   │   └── tasks/
│   │   │       └── TaskDetailModal.tsx# Comprehensive subtasks, comments, deps modal
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # User state, JWT storage, instant demo switch
│   │   │   └── TimeTrackerContext.tsx # Live global stopwatch state (`00:42:18`)
│   │   ├── hooks/
│   │   │   └── usePermissions.ts      # Declarative `can('tasks.create')` check hook
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx        # Hero with Three.js, feature grid, live metrics
│   │   │   ├── LoginPage.tsx          # Credentials form + 1-click RBAC persona selector
│   │   │   ├── RegisterPage.tsx       # Team signup & workspace initialization
│   │   │   ├── DashboardPage.tsx      # Pulse overview, charts, recent activities
│   │   │   ├── ProjectsPage.tsx       # Grid/list of projects, health indicators
│   │   │   ├── ProjectWorkspacePage.tsx # Single project workspace hub
│   │   │   ├── TaskBoardPage.tsx      # Kanban board with drag-and-drop status sync
│   │   │   ├── CalendarPage.tsx       # Interactive monthly schedule & deadlines
│   │   │   ├── TimelinePage.tsx       # Gantt timeline & milestone schedule
│   │   │   ├── TimeTrackingPage.tsx   # Stopwatch timer, logged time entries
│   │   │   ├── FocusModePage.tsx      # Pomodoro focus mode & distraction-free UI
│   │   │   ├── TeamPage.tsx           # Workload capacity, member directory
│   │   │   ├── AnalyticsPage.tsx      # Recharts velocity, burndown, cycle time
│   │   │   ├── AIAssistantPage.tsx    # 30-day plan generator, causal health analyzer
│   │   │   ├── NotificationsPage.tsx  # Unread badges, notification stream
│   │   │   ├── ActivityLogPage.tsx    # Comprehensive workspace audit log
│   │   │   ├── SettingsPage.tsx       # RBAC permissions matrix viewer & config
│   │   │   └── ProfilePage.tsx        # Account details & active granted permissions
│   │   ├── services/
│   │   │   └── api.ts                 # Type-safe Fetch API client wrapper
│   │   ├── types/
│   │   │   └── index.ts               # Core domain TypeScript definitions
│   │   ├── App.tsx                    # React Router configuration
│   │   ├── main.tsx                   # React 19 root bootstrap
│   │   └── index.css                  # Tailwind styles & dark command-center theme
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── RBAC_SPECIFICATION.md
│   └── DEPLOYMENT_GUIDE.md
├── docker-compose.yml
├── .env.example
├── package.json                       # Monorepo root scripts (`npm run dev`)
└── README.md
```

---

## 3. Data Flow & State Management

1. **Authentication Flow**:
   - Client sends credentials or demo persona role (`OWNER`, `PROJECT_MANAGER`, `EDITOR`, `VIEWER`) to `/api/auth/login` or `/api/auth/demo-login`.
   - Backend issues a signed HMAC SHA-256 JWT containing `{ id, email, role, workspaceId }`.
   - Frontend `AuthContext` stores the JWT in `localStorage` and populates the reactive user session.
   - Subsequent requests attach the Bearer token via `src/services/api.ts`.

2. **Live Time Tracking Engine**:
   - Users can start a timer on any task via Kanban cards, the task detail modal, or `/time`.
   - Backend records the start timestamp in `TimeEntry` with `isRunning: true`.
   - Global `TimeTrackerContext` polls and increments the active seconds locally every 1,000ms.
   - Navbar renders the real-time stopwatch badge (`00:42:18`).
   - Stopping the timer updates `endTime`, calculates duration in seconds, and appends to the project's cumulative hours.

3. **Autonomous AI Engine**:
   - When a prompt is submitted (e.g. "Design an AI Customer Support Assistant in 30 days"), the backend calls the Google Generative AI SDK (`gemini-1.5-flash`).
   - If an API key is absent or network fails, the resilient `ai.service.ts` domain heuristic engine generates a structured, phased execution plan with milestones, tasks, and estimated hours.
   - Users can preview the phased breakdown and click **"Apply Plan to Project"** to materialize actual projects, tasks, and deadlines into the database in one transaction.
