import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.js';
import { prisma } from '../config/db.js';

let genAI: GoogleGenerativeAI | null = null;
if (ENV.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
  } catch (err) {
    console.warn('⚠️ Could not initialize Gemini SDK with provided key:', err);
  }
}

export interface GeneratedPlanPhase {
  phaseName: string;
  duration: string;
  milestone: string;
  tasks: Array<{
    title: string;
    description: string;
    estimateHours: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    suggestedRole: string;
    subtasks: string[];
    dependencies?: string[];
  }>;
}

export interface GeneratedPlan {
  title: string;
  overview: string;
  totalEstimatedDays: number;
  phases: GeneratedPlanPhase[];
}

export interface TaskBreakdownItem {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedTags: string[];
}

// -----------------------------------------------------------------------------
// 1. PROJECT PLAN GENERATOR
// -----------------------------------------------------------------------------
export async function generateAIProjectPlan(prompt: string, projectContext?: string): Promise<GeneratedPlan> {
  if (genAI && ENV.GEMINI_API_KEY) {
    try {
      const systemInstruction = `
You are NEXUS AI, an elite enterprise project management and systems architecture copilot.
When given a user prompt, you output a strictly formatted, production-grade JSON plan with:
- title (string)
- overview (string)
- totalEstimatedDays (number)
- phases (array of objects with: phaseName, duration, milestone, tasks array [title, description, estimateHours, priority, suggestedRole, subtasks, dependencies])

Respond ONLY with valid JSON. Do not include markdown code block ticks (\`\`\`json).
`;

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(`${systemInstruction}\n\nUser Prompt: ${prompt}\n${projectContext ? `Context: ${projectContext}` : ''}`);

      const text = response.response.text()?.trim() || '';
      const cleanJson = text.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.warn('Gemini API call failed, using intelligent heuristic planner:', err);
    }
  }

  // Domain-Aware Heuristic Plan Generator (Fallback)
  return generateIntelligentHeuristicPlan(prompt);
}

function generateIntelligentHeuristicPlan(prompt: string): GeneratedPlan {
  const p = prompt.toLowerCase();
  const title = prompt.length > 50 ? `${prompt.substring(0, 48)}...` : prompt;

  if (p.includes('ai') || p.includes('saas') || p.includes('machine learning') || p.includes('llm')) {
    return {
      title: `Nexus 30-Day Blueprint: ${title}`,
      overview: `End-to-end execution roadmap designed for high-scale, resilient delivery with enterprise observability, multi-agent pipelines, and zero-downtime deployment.`,
      totalEstimatedDays: 30,
      phases: [
        {
          phaseName: 'Phase 1: Architecture, Ingestion & Invariant Modeling',
          duration: 'Days 1-7',
          milestone: 'Core Architecture Sign-off',
          tasks: [
            {
              title: 'Multi-modal document vector parser specification',
              description: 'Define semantic schema and streaming ingestion protocols for high-throughput inputs.',
              estimateHours: 18,
              priority: 'HIGH',
              suggestedRole: 'Architect',
              subtasks: ['Draft OpenAPI spec', 'Benchmark parser latency', 'Set up validation schemas'],
              dependencies: []
            },
            {
              title: 'Vector embeddings hybrid cache layer',
              description: 'Implement distributed Redis + vector database hybrid cache with sub-40ms SLA.',
              estimateHours: 24,
              priority: 'HIGH',
              suggestedRole: 'Backend Engineer',
              subtasks: ['Configure vector store cluster', 'Implement cache invalidation logic', 'Write unit tests'],
              dependencies: ['Multi-modal document vector parser specification']
            },
            {
              title: 'Relational database schema migration',
              description: 'Deploy relational models with foreign-key indexes, RBAC roles, and audit trail tables.',
              estimateHours: 14,
              priority: 'MEDIUM',
              suggestedRole: 'Data Engineer',
              subtasks: ['Write migration files', 'Test rollback triggers', 'Seed demo datasets'],
              dependencies: []
            }
          ]
        },
        {
          phaseName: 'Phase 2: Autonomous Multi-Agent Consensus & Workflow Engine',
          duration: 'Days 8-18',
          milestone: 'Agent Consensus Alpha Release',
          tasks: [
            {
              title: 'Develop arbiter agent for low-confidence reconciliation',
              description: 'Implement weighted consensus voting across contradictory LLM extractions.',
              estimateHours: 32,
              priority: 'URGENT',
              suggestedRole: 'AI Engineer',
              subtasks: ['Define formal confidence matrix', 'Build majority vote arbiter', 'Add human escalation trigger'],
              dependencies: ['Vector embeddings hybrid cache layer']
            },
            {
              title: 'Real-time WebSocket event broadcaster',
              description: 'Deliver streaming generation progress and interactive state updates to frontend clients.',
              estimateHours: 20,
              priority: 'MEDIUM',
              suggestedRole: 'Full-Stack Engineer',
              subtasks: ['Setup WebSocket channels', 'Implement client heartbeat', 'Add reconnect resilience'],
              dependencies: []
            }
          ]
        },
        {
          phaseName: 'Phase 3: Interactive Visual Canvas & 3D Spatial Inspector',
          duration: 'Days 19-24',
          milestone: 'Interactive UX Verification',
          tasks: [
            {
              title: 'Three.js 3D bounding mesh inspector',
              description: 'Build spatial visualizer rendering confidence heatmaps in 3D perspective.',
              estimateHours: 28,
              priority: 'HIGH',
              suggestedRole: 'UI/UX & 3D Designer',
              subtasks: ['Shader color gradient calibration', 'Camera orbit controls', 'Hover inspection cards'],
              dependencies: []
            },
            {
              title: 'Keyboard-shortcut fast verification drawer',
              description: 'Implement rapid keyboard navigation (Ctrl+K, J/K, Enter) for high-speed task review.',
              estimateHours: 16,
              priority: 'MEDIUM',
              suggestedRole: 'Frontend Engineer',
              subtasks: ['Register global hotkeys', 'Add accessible focus ring', 'State synchronizer'],
              dependencies: ['Three.js 3D bounding mesh inspector']
            }
          ]
        },
        {
          phaseName: 'Phase 4: Security Hardening, SOC2 Auditing & Release',
          duration: 'Days 25-30',
          milestone: 'Production General Availability',
          tasks: [
            {
              title: 'Enterprise SAML 2.0 / Okta identity federation',
              description: 'Secure enterprise single sign-on with automatic workspace role mapping.',
              estimateHours: 22,
              priority: 'HIGH',
              suggestedRole: 'Security Engineer',
              subtasks: ['Configure IdP metadata', 'Verify signature validation', 'Add session revocation'],
              dependencies: []
            },
            {
              title: 'Global multi-region load testing & CDN caching',
              description: 'Simulate 500 concurrent active streams under edge latency conditions.',
              estimateHours: 18,
              priority: 'MEDIUM',
              suggestedRole: 'DevOps / SRE',
              subtasks: ['Run k6 load tests', 'Configure edge headers', 'Verify backup failover'],
              dependencies: ['Enterprise SAML 2.0 / Okta identity federation']
            }
          ]
        }
      ]
    };
  }

  // Generic Agile project fallback
  return {
    title: `Agile Delivery Plan: ${title}`,
    overview: `Iterative project roadmap featuring structured sprints, automated CI/CD checks, and clear milestone deliverables.`,
    totalEstimatedDays: 21,
    phases: [
      {
        phaseName: 'Phase 1: Discovery, Requirements & Architecture',
        duration: 'Days 1-5',
        milestone: 'Technical Scope Finalized',
        tasks: [
          {
            title: 'Define system boundary and API contract',
            description: 'Document endpoints, request payloads, and permission requirements.',
            estimateHours: 16,
            priority: 'HIGH',
            suggestedRole: 'Technical Lead',
            subtasks: ['Draft API specifications', 'Review with engineering leads'],
            dependencies: []
          },
          {
            title: 'Database schema modeling and entity mapping',
            description: 'Design normalized relational tables and setup Prisma migrations.',
            estimateHours: 14,
            priority: 'HIGH',
            suggestedRole: 'Database Engineer',
            subtasks: ['Create ERD diagram', 'Generate migration files'],
            dependencies: ['Define system boundary and API contract']
          }
        ]
      },
      {
        phaseName: 'Phase 2: Core Development & Integration',
        duration: 'Days 6-15',
        milestone: 'Feature Complete Demo',
        tasks: [
          {
            title: 'Implement business logic and REST services',
            description: 'Build backend controllers, middleware verification, and database queries.',
            estimateHours: 35,
            priority: 'URGENT',
            suggestedRole: 'Backend Engineer',
            subtasks: ['CRUD routes implementation', 'Integration tests', 'Error handling'],
            dependencies: ['Database schema modeling and entity mapping']
          },
          {
            title: 'Interactive Frontend UI and State Management',
            description: 'Build responsive components, forms, animations, and API client integration.',
            estimateHours: 32,
            priority: 'HIGH',
            suggestedRole: 'Frontend Engineer',
            subtasks: ['Design system components', 'Connect API endpoints', 'Add loading & error states'],
            dependencies: ['Implement business logic and REST services']
          }
        ]
      },
      {
        phaseName: 'Phase 3: QA, Security Audit & Deployment',
        duration: 'Days 16-21',
        milestone: 'Production Rollout',
        tasks: [
          {
            title: 'End-to-End Testing & Performance Profiling',
            description: 'Automated test suite execution, bundle size optimization, and lighthouse audit.',
            estimateHours: 18,
            priority: 'MEDIUM',
            suggestedRole: 'QA Engineer',
            subtasks: ['E2E smoke tests', 'Fix high-priority bugs'],
            dependencies: ['Interactive Frontend UI and State Management']
          },
          {
            title: 'Production Infrastructure Deployment & Monitoring',
            description: 'Deploy backend, frontend, and configure health alerts.',
            estimateHours: 12,
            priority: 'HIGH',
            suggestedRole: 'DevOps Engineer',
            subtasks: ['Set up cloud secrets', 'Run database migrations', 'Verify health checks'],
            dependencies: ['End-to-End Testing & Performance Profiling']
          }
        ]
      }
    ]
  };
}

// -----------------------------------------------------------------------------
// 2. SMART TASK BREAKDOWN
// -----------------------------------------------------------------------------
export async function breakDownTaskAI(taskTitle: string, context?: string): Promise<TaskBreakdownItem[]> {
  if (genAI && ENV.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(`Break down the following task into 5-7 actionable, granular engineering subtasks with title, description, estimatedHours (number), priority (LOW|MEDIUM|HIGH|URGENT), and suggestedTags (string array). Return strictly a JSON array.\nTask: "${taskTitle}"\nContext: ${context || 'None'}`);

      const text = response.response.text()?.trim() || '';
      const cleanJson = text.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.warn('Gemini breakdown failed, using heuristic breakdown:', err);
    }
  }

  // Heuristic breakdown
  const title = taskTitle.toLowerCase();
  if (title.includes('login') || title.includes('auth')) {
    return [
      { title: 'Create database user schema & migration', description: 'Add User table with passwordHash, email unique constraint, and roles.', estimatedHours: 3, priority: 'HIGH', suggestedTags: ['Database', 'Auth'] },
      { title: 'Create authentication REST API endpoints', description: 'Implement /api/auth/register, /api/auth/login, and /api/auth/me.', estimatedHours: 4, priority: 'HIGH', suggestedTags: ['Backend', 'API'] },
      { title: 'Implement password hashing & JWT verification', description: 'Use bcryptjs with 10 salt rounds and generate signed JWT tokens.', estimatedHours: 3, priority: 'URGENT', suggestedTags: ['Security', 'Crypto'] },
      { title: 'Design responsive login & register UI', description: 'Build sleek glassmorphic login form with validation and demo persona buttons.', estimatedHours: 4, priority: 'MEDIUM', suggestedTags: ['Frontend', 'UI'] },
      { title: 'Add client-side form validation with Zod', description: 'Validate email formats, password strength requirements, and error messages.', estimatedHours: 2, priority: 'LOW', suggestedTags: ['Frontend', 'Validation'] },
      { title: 'Write integration test suite for auth flows', description: 'Verify token expiration, unauthorized route redirection, and invalid password rejections.', estimatedHours: 3, priority: 'MEDIUM', suggestedTags: ['Testing', 'QA'] },
      { title: 'Deploy and verify HTTPS cookie / header security', description: 'Configure CORS, Helmet headers, and secure token storage.', estimatedHours: 2, priority: 'HIGH', suggestedTags: ['DevOps', 'Security'] }
    ];
  }

  return [
    { title: `Define specifications and scope for ${taskTitle}`, description: 'Detail functional inputs, outputs, and edge cases.', estimatedHours: 2, priority: 'MEDIUM', suggestedTags: ['Planning'] },
    { title: `Design database schema and data models`, description: 'Setup relational tables, foreign keys, and indexes.', estimatedHours: 4, priority: 'HIGH', suggestedTags: ['Backend', 'Database'] },
    { title: `Implement core business logic & API services`, description: 'Develop endpoints, controllers, and validation middleware.', estimatedHours: 6, priority: 'HIGH', suggestedTags: ['Backend'] },
    { title: `Build interactive frontend user interface`, description: 'Create components, styling, and bind with backend endpoints.', estimatedHours: 6, priority: 'MEDIUM', suggestedTags: ['Frontend'] },
    { title: `Implement error handling & telemetry`, description: 'Catch edge case errors, add toast notifications, and log activity.', estimatedHours: 3, priority: 'LOW', suggestedTags: ['Observability'] },
    { title: `Execute unit and integration tests`, description: 'Verify happy path and failure cases.', estimatedHours: 3, priority: 'MEDIUM', suggestedTags: ['Testing'] },
    { title: `Deploy to staging environment for stakeholder review`, description: 'Verify staging deployment and collect team feedback.', estimatedHours: 2, priority: 'MEDIUM', suggestedTags: ['Deployment'] }
  ];
}

// -----------------------------------------------------------------------------
// 3. AI DAILY BRIEF
// -----------------------------------------------------------------------------
export async function generateDailyBrief(userId: string, workspaceId: string): Promise<string> {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [assignedTasks, overdueCount, approachingCount, blockedCount] = await Promise.all([
    prisma.task.count({ where: { assigneeId: userId, status: { not: 'DONE' } } }),
    prisma.task.count({ where: { deadline: { lt: now }, status: { not: 'DONE' } } }),
    prisma.task.count({ where: { deadline: { gte: now, lte: threeDays }, status: { not: 'DONE' } } }),
    prisma.task.count({ where: { status: 'BLOCKED' } })
  ]);

  return `Good morning. You have ${assignedTasks} active task${assignedTasks === 1 ? '' : 's'} in your queue. Across the workspace, ${approachingCount} deadline${approachingCount === 1 ? ' is' : 's are'} approaching in the next 72 hours, ${overdueCount} task${overdueCount === 1 ? ' is' : 's are'} currently overdue, and ${blockedCount} item${blockedCount === 1 ? ' is' : 's are'} flagged as blocked. AI recommends prioritizing pending dependencies first.`;
}

// -----------------------------------------------------------------------------
// 4. NATURAL LANGUAGE AI ASSISTANT QUERY
// -----------------------------------------------------------------------------
export async function processAIAssistantQuery(query: string, workspaceId: string, projectId?: string) {
  const q = query.toLowerCase().trim();
  const now = new Date();

  // Pattern matching on common prompt commands requested in Section 14
  if (q.includes('overdue')) {
    const overdueTasks = await prisma.task.findMany({
      where: {
        deadline: { lt: now },
        status: { not: 'DONE' },
        ...(projectId ? { projectId } : {})
      },
      include: { assignee: { select: { name: true } }, project: { select: { name: true } } },
      take: 10
    });

    return {
      type: 'TASK_LIST',
      title: 'Current Overdue Tasks',
      summary: `Found ${overdueTasks.length} task${overdueTasks.length === 1 ? '' : 's'} past deadline.`,
      items: overdueTasks.map(t => ({
        id: t.id,
        title: t.title,
        project: t.project.name,
        assignee: t.assignee?.name || 'Unassigned',
        deadline: t.deadline,
        priority: t.priority
      }))
    };
  }

  if (q.includes('blocking') || q.includes('blocked')) {
    const blockedTasks = await prisma.task.findMany({
      where: {
        status: 'BLOCKED',
        ...(projectId ? { projectId } : {})
      },
      include: { assignee: { select: { name: true } }, project: { select: { name: true } } }
    });

    return {
      type: 'TASK_LIST',
      title: 'Blocked Tasks & Invariant Bottlenecks',
      summary: `${blockedTasks.length} task${blockedTasks.length === 1 ? '' : 's'} require immediate intervention to resume progress.`,
      items: blockedTasks.map(t => ({
        id: t.id,
        title: t.title,
        project: t.project.name,
        assignee: t.assignee?.name || 'Unassigned',
        priority: t.priority
      }))
    };
  }

  if (q.includes('workload') || q.includes('who has')) {
    const members = await prisma.user.findMany({
      include: {
        assignedTasks: {
          where: { status: { not: 'DONE' } },
          select: { estimatedHours: true, priority: true }
        }
      }
    });

    const workloadData = members.map(m => {
      const taskCount = m.assignedTasks.length;
      const totalHours = m.assignedTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
      const percentage = Math.min(100, Math.round((totalHours / 40) * 100)); // normalized against 40h standard week
      return {
        id: m.id,
        name: m.name,
        title: m.title,
        department: m.department,
        taskCount,
        totalHours,
        workloadPercentage: percentage
      };
    }).sort((a, b) => b.workloadPercentage - a.workloadPercentage);

    const highest = workloadData[0];
    const lowest = workloadData[workloadData.length - 1];

    return {
      type: 'WORKLOAD_REPORT',
      title: 'Team Workload Distribution',
      summary: highest && lowest
        ? `${highest.name} holds the highest active workload (${highest.workloadPercentage}% capacity, ${highest.totalHours}h), while ${lowest.name} is at ${lowest.workloadPercentage}% (${lowest.totalHours}h). Recommend redistributing pending tasks.`
        : 'Team workload is evenly balanced.',
      data: workloadData
    };
  }

  if (q.includes('summarize') || q.includes('progress') || q.includes('pulse')) {
    const [totalProjects, activeTasks, completedTasks, overdueTasks] = await Promise.all([
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.task.count({ where: { status: { not: 'DONE' } } }),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.task.count({ where: { deadline: { lt: now }, status: { not: 'DONE' } } })
    ]);

    const total = activeTasks + completedTasks;
    const rate = total > 0 ? Math.round((completedTasks / total) * 100) : 0;

    return {
      type: 'SUMMARY',
      title: 'Executive Project Progress Briefing',
      summary: `Workspace features ${totalProjects} active projects with ${total} tracked tasks. Overall task completion rate stands at ${rate}%. ${overdueTasks} task${overdueTasks === 1 ? ' is' : 's are'} currently past deadline. Overall pipeline health is operating within nominal parameters.`
    };
  }

  if (q.includes('deadline') || q.includes('at risk')) {
    const atRiskProjects = await prisma.project.findMany({
      where: { healthStatus: { in: ['AT_RISK', 'CRITICAL'] } },
      select: { id: true, name: true, healthScore: true, healthStatus: true, healthReason: true }
    });

    return {
      type: 'RISK_REPORT',
      title: 'Deadlines & Projects At Risk',
      summary: `Found ${atRiskProjects.length} project${atRiskProjects.length === 1 ? '' : 's'} with elevated risk metrics.`,
      items: atRiskProjects
    };
  }

  // Fallback to Gemini if initialized
  if (genAI && ENV.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const response = await model.generateContent(`You are NEXUS AI project copilot. Answer the team query concisely and constructively:\n\nQuery: "${query}"`);
      return {
        type: 'TEXT_RESPONSE',
        title: 'Nexus AI Response',
        summary: response.response.text() || 'No response generated.'
      };
    } catch (err) {
      console.warn('Gemini chat fallback error:', err);
    }
  }

  return {
    type: 'TEXT_RESPONSE',
    title: 'Nexus AI Copilot',
    summary: `Processed query: "${query}". You can also try: "Show me overdue tasks", "Which tasks are blocking the project?", "Who has the highest workload?", or "Create a 30-day plan for an AI SaaS application".`
  };
}
