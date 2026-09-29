# NEXUS — AI Project Management & Workflow Control Platform

![NEXUS Cover](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

> **Next-generation full-stack project management, workflow automation, and AI execution platform built for high-velocity engineering and product teams.**

---

## 🚀 Key Highlights & Capabilities

- 🤖 **AI Autonomous Project Planning**: Generate comprehensive 30-day agile plans with milestones, phases, and task breakdowns via Google Gemini 1.5 Flash (with resilient offline heuristic fallbacks). Apply any AI plan to your database in 1 click.
- ⚡ **Explainable Causal Health Diagnostics**: Algorithmic project health scoring (0-100) that isolates overdue tasks, blocked dependencies, and critical milestone delays with actionable remediation recommendations.
- 📋 **Interactive Kanban Board**: Drag-and-drop task status workflow across Backlog, To Do, In Progress, In Review, Blocked, and Done with instantaneous backend persistence.
- ⏱️ **Integrated Live Stopwatch & Time Tracking**: Start, pause, and reset task timers with persistent database logging. Real-time persistent active timer in the top navigation bar (`00:42:18`).
- ⏳ **Dynamic Countdown Timers**: Real-time relative countdown to deadlines with pulsing visual alarms when tasks become overdue.
- 🔗 **Task Dependency Graph Engine**: Predecessor and successor dependency tracking with cyclic dependency prevention and schedule inversion warnings.
- 📅 **Unified Timeline & Calendar**: Interactive Gantt-style timeline milestones and monthly calendar view aggregating deadlines, reviews, and releases.
- 🎯 **Focus & Pomodoro Mode**: Distraction-free execution interface with integrated 25-minute Pomodoro timer, ambient sounds, and active task spotlight.
- 📊 **Executive Analytics & Velocity Reports**: Recharts-powered sprint velocity, cumulative burndown curves, workload distribution, and task cycle times.
- 🔐 **Granular Role-Based Access Control (RBAC)**: 15 discrete capability scopes across 4 personas (`OWNER`, `PROJECT_MANAGER`, `EDITOR`, `VIEWER`) enforced at both the API gateway and UI levels.
- ⚡ **1-Click Demo Persona Switcher**: Instant switching between Owner, PM, Developer, and Stakeholder personas directly on the login screen or via the navbar dropdown.
- ⌨️ **Global Command Palette (`CTRL + K`)**: Keyboard-first navigation, instant project search, and direct action triggers.
- 🌐 **Three.js 3D Visualizations**: Geometric particle network hero header and interactive 3D pulsing AI orb.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Dark Command-Center Theme with Glassmorphism)
- **3D Graphics**: Three.js
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Router**: React Router v6

### Backend
- **Runtime**: Node.js + Express + TypeScript
- **ORM**: Prisma ORM (Dual-mode: SQLite for zero-setup local dev, PostgreSQL for production)
- **Authentication**: Stateless JWT + bcrypt password hashing
- **Security**: Granular RBAC middleware, Helmet headers, CORS policy
- **AI Engine**: Official `@google/generative-ai` SDK (Gemini 1.5 Flash) + Domain Heuristic Fallback Engine

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.x or v20.x+
- **npm**: v9.x+

### 2. Install Dependencies
```bash
# Monorepo root
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
cd ..
```

### 3. Initialize Database & Seed Demo Data
```bash
cd backend
npx prisma db push
npm run seed
cd ..
```

### 4. Run Both Servers Concurrently
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

---

## 👥 Demo Accounts & Personas

For immediate testing, use the **1-Click Persona Buttons** on `http://localhost:5173/login`:

| Persona | Email | Password | Permissions & Role |
|---|---|---|---|
| 👑 **Workspace Owner** | `admin@nexus.ai` | `password123` | Full administrative control, delete projects, manage billing and member roles |
| 🎯 **Project Manager** | `pm@nexus.ai` | `password123` | Create projects, assign tasks, plan schedules, generate AI plans |
| 💻 **Editor / Developer**| `dev@nexus.ai` | `password123` | Create/edit tasks, drag-and-drop Kanban, track time limits, post comments |
| 👁️ **Viewer / Stakeholder**| `viewer@nexus.ai` | `password123` | Read-only inspection of projects, tasks, timeline, calendar, and analytics |

---

## 📁 Repository Directory Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Active schema (SQLite)
│   │   ├── schema.postgresql.prisma   # PostgreSQL production schema
│   │   ├── dev.db                     # Local SQLite database
│   │   └── seed.ts                    # Realistic demo data seeder
│   ├── src/
│   │   ├── config/db.ts               # Prisma singleton client
│   │   ├── middleware/                # JWT auth and RBAC permission checks
│   │   ├── routes/                    # Express REST endpoints
│   │   ├── services/                  # AI, health diagnostics, and audit services
│   │   └── server.ts                  # Main entry point and global search
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/                # 3D visuals, layout, modals, countdowns
│   │   ├── context/                   # Auth and live stopwatch contexts
│   │   ├── hooks/                     # usePermissions declarative RBAC hook
│   │   ├── pages/                     # 18 full-featured application views
│   │   ├── services/api.ts            # Type-safe API client
│   │   ├── types/index.ts             # Domain interfaces
│   │   └── App.tsx                    # React Router configuration
│   └── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md                # System topology and flow diagrams
│   ├── API_DOCUMENTATION.md           # REST API endpoint reference
│   ├── RBAC_SPECIFICATION.md          # 15 capability scopes and matrix
│   └── DEPLOYMENT_GUIDE.md            # Docker, PostgreSQL, and cloud hosting
├── docker-compose.yml                 # Multi-container production deployment
└── README.md
```

---

## 🤖 AI Assistant Capabilities

1. **30-Day Project Synthesizer**: Input high-level project goals to get milestone breakdown, task distribution, and risk mitigation strategies.
2. **Apply to Database**: Convert any generated AI plan directly into persisted projects and tasks with single-click orchestration.
3. **Task Decomposer**: Break complex or ambiguous tickets into atomic subtasks with realistic hour estimations.
4. **Causal Project Health Engine**: Computes health status with explainable reasons (e.g., *"Sprint health is At Risk: 2 tasks are overdue on the critical path, blocking Milestone 2"*).
5. **AI Daily Executive Brief**: Delivers a daily synthesis of accomplishments, active blockers, and high-priority action items.

---

## 📄 License
MIT License. Built with precision for modern software engineering teams.
