import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NEXUS Database Seeding...');

  // Clean existing data
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.timeEntry.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.event.deleteMany({});
  if ((prisma as any).aIPlan) await (prisma as any).aIPlan.deleteMany({});
  else if ((prisma as any).aiPlan) await (prisma as any).aiPlan.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Organization & Workspace
  const org = await prisma.organization.create({
    data: {
      name: 'Nexus Technologies Global',
      slug: 'nexus-global',
      plan: 'ENTERPRISE',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'
    }
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Nexus Innovation Labs',
      slug: 'nexus-labs',
      description: 'Primary workspace for flagship engineering, AI systems, and product innovation.',
      organizationId: org.id
    }
  });

  // 2. Create Users
  const alex = await prisma.user.create({
    data: {
      email: 'admin@nexus.ai',
      passwordHash,
      name: 'Alex Rivera',
      title: 'Founder & Chief Architect',
      department: 'Executive Engineering',
      role: 'OWNER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      bio: 'Pioneering intelligent workflow automation, distributed architectures, and autonomous AI agents.'
    }
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'pm@nexus.ai',
      passwordHash,
      name: 'Sarah Chen',
      title: 'Lead Project Manager',
      department: 'Product & Operations',
      role: 'PROJECT_MANAGER',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
      bio: 'Agile delivery lead specializing in high-velocity tech sprints and cross-functional team synergy.'
    }
  });

  const rahul = await prisma.user.create({
    data: {
      email: 'dev@nexus.ai',
      passwordHash,
      name: 'Rahul Sharma',
      title: 'Senior Full-Stack AI Engineer',
      department: 'Engineering',
      role: 'EDITOR',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      bio: 'Full-stack builder passionate about React, Node.js, vector databases, and real-time WebSockets.'
    }
  });

  const elena = await prisma.user.create({
    data: {
      email: 'designer@nexus.ai',
      passwordHash,
      name: 'Elena Rostova',
      title: 'Principal UI/UX & 3D Designer',
      department: 'Product Design',
      role: 'EDITOR',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      bio: 'Crafting futuristic interactive interfaces, Three.js 3D web visualizations, and glassmorphic designs.'
    }
  });

  const john = await prisma.user.create({
    data: {
      email: 'viewer@nexus.ai',
      passwordHash,
      name: 'John Doe',
      title: 'Compliance & Audit Partner',
      department: 'Governance & Auditing',
      role: 'VIEWER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      bio: 'External reviewer monitoring project milestones, delivery compliance, and security posture.'
    }
  });

  // Create Workspace Memberships
  await prisma.membership.createMany({
    data: [
      { userId: alex.id, workspaceId: workspace.id, role: 'OWNER' },
      { userId: sarah.id, workspaceId: workspace.id, role: 'PROJECT_MANAGER' },
      { userId: rahul.id, workspaceId: workspace.id, role: 'EDITOR' },
      { userId: elena.id, workspaceId: workspace.id, role: 'EDITOR' },
      { userId: john.id, workspaceId: workspace.id, role: 'VIEWER' }
    ]
  });

  // 3. Create Teams
  const engTeam = await prisma.team.create({
    data: {
      name: 'Core AI & Distributed Systems',
      description: 'Engineers responsible for backend infrastructure, LLM integrations, and microservices.',
      workspaceId: workspace.id,
      leaderId: alex.id
    }
  });

  const designTeam = await prisma.team.create({
    data: {
      name: 'Product Experience & Design',
      description: 'UI/UX designers, 3D WebGL artists, and design system maintainers.',
      workspaceId: workspace.id,
      leaderId: sarah.id
    }
  });

  await prisma.teamMember.createMany({
    data: [
      { teamId: engTeam.id, userId: alex.id, role: 'LEAD' },
      { teamId: engTeam.id, userId: rahul.id, role: 'SENIOR_ENGINEER' },
      { teamId: designTeam.id, userId: sarah.id, role: 'LEAD' },
      { teamId: designTeam.id, userId: elena.id, role: 'LEAD_DESIGNER' },
      { teamId: designTeam.id, userId: john.id, role: 'OBSERVER' }
    ]
  });

  // 4. Create Flagship Projects
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const project1 = await prisma.project.create({
    data: {
      name: 'AI Document Intelligence Platform',
      description: 'Enterprise multi-agent LLM platform for automated multimodal ingestion, vector parsing, and compliance auditing.',
      workspaceId: workspace.id,
      ownerId: alex.id,
      teamId: engTeam.id,
      startDate: new Date(now.getTime() - 14 * day),
      deadline: new Date(now.getTime() + 21 * day),
      priority: 'HIGH',
      status: 'ACTIVE',
      budget: 54000,
      estimatedHours: 380,
      actualHours: 164,
      color: '#6366F1',
      tags: JSON.stringify(['AI/ML', 'Enterprise', 'LLM', 'High Priority', 'SOC2']),
      template: 'Software Development',
      healthScore: 92,
      healthStatus: 'HEALTHY',
      healthReason: 'Sprint velocity is on target. 64% of core milestones completed with zero blocking regressions.'
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'NextGen Workflow Automation Engine',
      description: 'Visual flowchart builder with condition branching, Webhook triggers, and autonomous task routing.',
      workspaceId: workspace.id,
      ownerId: sarah.id,
      teamId: engTeam.id,
      startDate: new Date(now.getTime() - 7 * day),
      deadline: new Date(now.getTime() + 12 * day),
      priority: 'URGENT',
      status: 'ACTIVE',
      budget: 38000,
      estimatedHours: 240,
      actualHours: 110,
      color: '#EC4899',
      tags: JSON.stringify(['Workflows', 'Automation', 'Visual Builder']),
      template: 'AI/ML Project',
      healthScore: 72,
      healthStatus: 'AT_RISK',
      healthReason: 'Approaching critical deadline: 2 upstream dependency tasks in progress, requiring QA bandwidth.'
    }
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Customer Experience Cloud 2.0',
      description: 'Unified omnichannel customer workspace with predictive sentiment analysis and instant resolution copilot.',
      workspaceId: workspace.id,
      ownerId: sarah.id,
      teamId: designTeam.id,
      startDate: new Date(now.getTime() + 2 * day),
      deadline: new Date(now.getTime() + 45 * day),
      priority: 'MEDIUM',
      status: 'PLANNING',
      budget: 29000,
      estimatedHours: 190,
      actualHours: 12,
      color: '#10B981',
      tags: JSON.stringify(['Customer Care', 'UI/UX', 'Mobile Responsive']),
      template: 'Startup',
      healthScore: 96,
      healthStatus: 'HEALTHY',
      healthReason: 'Initial discovery and UX wireframes completed ahead of schedule.'
    }
  });

  // Assign Project Members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: alex.id, role: 'OWNER' },
      { projectId: project1.id, userId: sarah.id, role: 'PROJECT_MANAGER' },
      { projectId: project1.id, userId: rahul.id, role: 'EDITOR' },
      { projectId: project1.id, userId: elena.id, role: 'EDITOR' },
      { projectId: project1.id, userId: john.id, role: 'VIEWER' },
      { projectId: project2.id, userId: sarah.id, role: 'PROJECT_MANAGER' },
      { projectId: project2.id, userId: rahul.id, role: 'EDITOR' },
      { projectId: project3.id, userId: elena.id, role: 'EDITOR' }
    ]
  });

  // 5. Create Milestones for Project 1
  await prisma.milestone.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'M1: Architecture Blueprint & Model Benchmark',
        description: 'Complete technical spec, latency benchmarking on Gemini 1.5/Flash, and database schema definition.',
        dueDate: new Date(now.getTime() - 7 * day),
        isCompleted: true
      },
      {
        projectId: project1.id,
        title: 'M2: Core Agent Pipeline Integration',
        description: 'Real-time document parser, OCR bounding box visualizer, and vector embeddings cache.',
        dueDate: new Date(now.getTime() + 5 * day),
        isCompleted: false
      },
      {
        projectId: project1.id,
        title: 'M3: SOC2 Compliance & End-to-End Security',
        description: 'Role-based access token verification, field-level encryption, and external penetration audit.',
        dueDate: new Date(now.getTime() + 16 * day),
        isCompleted: false
      },
      {
        projectId: project1.id,
        title: 'M4: Global Multi-Region Production Rollout',
        description: 'Final load testing, edge CDN caching, customer pilot onboarding.',
        dueDate: new Date(now.getTime() + 21 * day),
        isCompleted: false
      }
    ]
  });

  // 6. Create Tasks for Project 1 (Across all Kanban Statuses)
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Vector Embeddings Hybrid Cache Layer',
      description: 'Implement Redis + Qdrant hybrid retrieval cache to achieve sub-40ms semantic similarity queries.',
      projectId: project1.id,
      assigneeId: rahul.id,
      creatorId: alex.id,
      priority: 'HIGH',
      status: 'DONE',
      startDate: new Date(now.getTime() - 8 * day),
      deadline: new Date(now.getTime() - 2 * day),
      estimatedHours: 24,
      actualHours: 21,
      order: 0,
      tags: JSON.stringify(['Backend', 'Vector DB', 'Performance'])
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Build Multi-Agent Conflict Resolution Protocol',
      description: 'Develop consensus voting mechanism when extractor agents encounter ambiguous unstructured tables.',
      projectId: project1.id,
      assigneeId: alex.id,
      creatorId: sarah.id,
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      startDate: new Date(now.getTime() - 3 * day),
      deadline: new Date(now.getTime() + 2 * day + 14 * 60 * 60 * 1000 + 32 * 60 * 1000), // Due in 2d 14h 32m
      estimatedHours: 36,
      actualHours: 19.5,
      order: 1,
      tags: JSON.stringify(['AI Agents', 'Consensus', 'Architecture'])
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Interactive 3D Document Bounding-Box Inspector',
      description: 'Develop WebGL / Three.js canvas tool allowing operators to inspect OCR confidence heatmaps in 3D perspective.',
      projectId: project1.id,
      assigneeId: elena.id,
      creatorId: sarah.id,
      priority: 'HIGH',
      status: 'IN_REVIEW',
      startDate: new Date(now.getTime() - 4 * day),
      deadline: new Date(now.getTime() + 3 * day),
      estimatedHours: 28,
      actualHours: 26,
      order: 2,
      tags: JSON.stringify(['UI/UX', 'Three.js', 'Frontend'])
    }
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Implement Automated Human-in-the-Loop Feedback Loop',
      description: 'Create active learning pipeline where low-confidence extractions are routed to verification queue.',
      projectId: project1.id,
      assigneeId: rahul.id,
      creatorId: alex.id,
      priority: 'MEDIUM',
      status: 'TODO',
      startDate: new Date(now.getTime()),
      deadline: new Date(now.getTime() + 7 * day),
      estimatedHours: 32,
      actualHours: 0,
      order: 3,
      tags: JSON.stringify(['Feedback Loop', 'Active Learning'])
    }
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Enterprise SSO & SAML 2.0 Integration',
      description: 'Connect Okta and Azure AD enterprise identity federation with automatic role mapping.',
      projectId: project1.id,
      assigneeId: rahul.id,
      creatorId: sarah.id,
      priority: 'HIGH',
      status: 'BLOCKED',
      startDate: new Date(now.getTime() - 2 * day),
      deadline: new Date(now.getTime() + 4 * day),
      estimatedHours: 20,
      actualHours: 4,
      order: 4,
      tags: JSON.stringify(['Security', 'Auth', 'SSO'])
    }
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Audit Logging & SOC2 Type II Telemetry Exporter',
      description: 'Export all user actions, document views, and AI generation prompts to tamper-proof S3 audit trail.',
      projectId: project1.id,
      assigneeId: john.id,
      creatorId: alex.id,
      priority: 'LOW',
      status: 'BACKLOG',
      startDate: new Date(now.getTime() + 5 * day),
      deadline: new Date(now.getTime() + 18 * day),
      estimatedHours: 16,
      actualHours: 0,
      order: 5,
      tags: JSON.stringify(['Compliance', 'Telemetry'])
    }
  });

  const task7 = await prisma.task.create({
    data: {
      title: 'Legacy Data Migration & Schema Harmonizer',
      description: 'Sanitize and convert 1.2M historical PDF metadata records into the new relational graph format.',
      projectId: project1.id,
      assigneeId: rahul.id,
      creatorId: alex.id,
      priority: 'URGENT',
      status: 'TODO',
      startDate: new Date(now.getTime() - 1 * day),
      deadline: new Date(now.getTime() - 4 * 60 * 60 * 1000 - 12 * 60 * 1000), // OVERDUE by 4h 12m!
      estimatedHours: 18,
      actualHours: 8,
      order: 6,
      tags: JSON.stringify(['Migration', 'Data', 'Overdue'])
    }
  });

  // 7. Subtasks for Task 2 (Conflict Resolution Protocol)
  await prisma.subtask.createMany({
    data: [
      { title: 'Define formal JSON schema for agent confidence scores', isCompleted: true, taskId: task2.id, order: 0 },
      { title: 'Implement Weighted Majority Voting algorithm', isCompleted: true, taskId: task2.id, order: 1 },
      { title: 'Construct fallback escalation trigger to human supervisor', isCompleted: true, taskId: task2.id, order: 2 },
      { title: 'Stress test edge cases with 5 concurrent contradictory LLM outputs', isCompleted: false, taskId: task2.id, order: 3 },
      { title: 'Benchmark latency overhead under 250ms SLA target', isCompleted: false, taskId: task2.id, order: 4 }
    ]
  });

  // Subtasks for Task 3 (3D Inspector)
  await prisma.subtask.createMany({
    data: [
      { title: 'Set up Three.js scene with orbit controls and bounding mesh shaders', isCompleted: true, taskId: task3.id, order: 0 },
      { title: 'Map 2D OCR coordinates to 3D spatial layer plane', isCompleted: true, taskId: task3.id, order: 1 },
      { title: 'Add hover tooltip displaying confidence score & detected font family', isCompleted: false, taskId: task3.id, order: 2 }
    ]
  });

  // 8. Task Dependencies
  await prisma.taskDependency.createMany({
    data: [
      { predecessorTaskId: task1.id, successorTaskId: task2.id, type: 'FINISH_TO_START' },
      { predecessorTaskId: task2.id, successorTaskId: task4.id, type: 'FINISH_TO_START' },
      { predecessorTaskId: task5.id, successorTaskId: task6.id, type: 'FINISH_TO_START' }
    ]
  });

  // 9. Comments & Collaboration
  const comment1 = await prisma.comment.create({
    data: {
      content: 'The weighted voting benchmark looks phenomenal! Latency test on Gemini 1.5 Flash returned an average of 185ms.',
      taskId: task2.id,
      userId: rahul.id
    }
  });

  await prisma.comment.create({
    data: {
      content: '@Rahul Sharma Great work. Please make sure the fallback escalation triggers an immediate websocket event to the supervisor panel.',
      taskId: task2.id,
      userId: sarah.id,
      parentId: comment1.id
    }
  });

  await prisma.comment.create({
    data: {
      content: 'Three.js bounding box shader now supports dynamic color tinting based on OCR confidence: green (>95%), amber (70-95%), red (<70%). Ready for review!',
      taskId: task3.id,
      userId: elena.id
    }
  });

  // 10. Time Entries
  await prisma.timeEntry.createMany({
    data: [
      {
        taskId: task1.id,
        userId: rahul.id,
        startTime: new Date(now.getTime() - 4 * day),
        endTime: new Date(now.getTime() - 4 * day + 4 * 3600 * 1000),
        durationSeconds: 14400,
        description: 'Benchmarked Qdrant vs Redis similarity search indices',
        isRunning: false
      },
      {
        taskId: task2.id,
        userId: alex.id,
        startTime: new Date(now.getTime() - 2 * day),
        endTime: new Date(now.getTime() - 2 * day + 3 * 3600 * 1000 + 1800 * 1000),
        durationSeconds: 12600,
        description: 'Engineered multi-agent voting protocol and unit tests',
        isRunning: false
      },
      {
        taskId: task2.id,
        userId: alex.id,
        startTime: new Date(now.getTime() - 42 * 60 * 1000 - 18 * 1000),
        endTime: null,
        durationSeconds: 2538, // 00:42:18
        description: 'Active live debugging session on conflict arbitration',
        isRunning: true
      },
      {
        taskId: task3.id,
        userId: elena.id,
        startTime: new Date(now.getTime() - 1 * day),
        endTime: new Date(now.getTime() - 1 * day + 5 * 3600 * 1000),
        durationSeconds: 18000,
        description: '3D shader pipeline and color gradient calibration',
        isRunning: false
      }
    ]
  });

  // 11. Calendar Events
  await prisma.event.createMany({
    data: [
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        title: 'Sprint 14 Retrospective & Milestone Review',
        description: 'Reviewing M1 completion, vector latency metrics, and setting up M2 agent pipeline tasks.',
        startTime: new Date(now.getTime() + 1 * day + 10 * 3600 * 1000),
        endTime: new Date(now.getTime() + 1 * day + 11 * 3600 * 1000),
        type: 'MEETING',
        location: 'Nexus Virtual Room #1 (WebRTC)',
        createdById: sarah.id
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        title: 'M2: Core Agent Pipeline Integration Deadline',
        description: 'Target delivery cutoff for OCR inspector, vector cache, and conflict arbitration.',
        startTime: new Date(now.getTime() + 5 * day + 17 * 3600 * 1000),
        endTime: new Date(now.getTime() + 5 * day + 18 * 3600 * 1000),
        type: 'MILESTONE',
        location: 'Platform Core',
        createdById: alex.id
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        title: 'Task Overdue: Legacy Data Migration Cutoff',
        description: 'Historical PDF metadata ingestion cutoff window.',
        startTime: new Date(now.getTime() - 4 * 3600 * 1000),
        endTime: new Date(now.getTime() - 3 * 3600 * 1000),
        type: 'DEADLINE',
        location: 'Data Pipeline',
        createdById: alex.id
      },
      {
        workspaceId: workspace.id,
        projectId: project2.id,
        title: 'Workflow Automation Alpha Customer Showcase',
        description: 'Live demonstration of drag-and-drop workflow canvas for enterprise pilot partners.',
        startTime: new Date(now.getTime() + 8 * day + 14 * 3600 * 1000),
        endTime: new Date(now.getTime() + 8 * day + 15 * 3600 * 1000 + 30 * 60 * 1000),
        type: 'RELEASE',
        location: 'Main Auditorium & Stream',
        createdById: sarah.id
      }
    ]
  });

  // 12. Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        taskId: task1.id,
        userId: rahul.id,
        action: 'TASK_COMPLETED',
        entityType: 'TASK',
        entityId: task1.id,
        details: 'Rahul Sharma marked "Design Vector Embeddings Hybrid Cache Layer" as DONE.'
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        taskId: task2.id,
        userId: alex.id,
        action: 'STATUS_CHANGED',
        entityType: 'TASK',
        entityId: task2.id,
        details: 'Alex Rivera updated status from TODO → IN PROGRESS.'
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        taskId: task3.id,
        userId: elena.id,
        action: 'STATUS_CHANGED',
        entityType: 'TASK',
        entityId: task3.id,
        details: 'Elena Rostova moved "Interactive 3D Document Inspector" to IN REVIEW.'
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        taskId: task7.id,
        userId: alex.id,
        action: 'DEADLINE_PASSED',
        entityType: 'TASK',
        entityId: task7.id,
        details: 'System detected task "Legacy Data Migration & Schema Harmonizer" is OVERDUE by 4h 12m.'
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        taskId: task2.id,
        userId: sarah.id,
        action: 'COMMENT_ADDED',
        entityType: 'COMMENT',
        entityId: comment1.id,
        details: 'Sarah Chen replied to a comment on "Build Multi-Agent Conflict Resolution Protocol".'
      },
      {
        workspaceId: workspace.id,
        projectId: project1.id,
        userId: alex.id,
        action: 'AI_PLAN_GENERATED',
        entityType: 'AI_PLAN',
        entityId: project1.id,
        details: 'Nexus AI generated a comprehensive 30-day accelerated rollout plan.'
      }
    ]
  });

  // 13. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        title: 'Task Assigned',
        message: 'You have been assigned as lead on "Build Multi-Agent Conflict Resolution Protocol".',
        type: 'ASSIGNMENT',
        link: `/projects/${project1.id}/tasks/${task2.id}`,
        isRead: false
      },
      {
        userId: alex.id,
        title: 'Critical Deadline Alert',
        message: 'Task "Legacy Data Migration & Schema Harmonizer" is OVERDUE by 4h 12m.',
        type: 'OVERDUE',
        link: `/projects/${project1.id}/tasks/${task7.id}`,
        isRead: false
      },
      {
        userId: rahul.id,
        title: 'Approaching Deadline',
        message: 'Task "Implement Automated Human-in-the-Loop Feedback Loop" starts in 24 hours.',
        type: 'DEADLINE_WARNING',
        link: `/projects/${project1.id}/tasks/${task4.id}`,
        isRead: false
      },
      {
        userId: rahul.id,
        title: 'Mentioned in Task Discussion',
        message: 'Sarah Chen mentioned you in a comment on "Build Multi-Agent Conflict Resolution Protocol".',
        type: 'MENTION',
        link: `/projects/${project1.id}/tasks/${task2.id}`,
        isRead: true
      },
      {
        userId: alex.id,
        title: 'AI Workload Optimization Insight',
        message: 'Smart Workload Alert: Elena Rostova has 90% workload while John Doe is at 30%. Consider redistributing tasks.',
        type: 'AI_INSIGHT',
        link: '/team',
        isRead: false
      }
    ]
  });

  // 14. Seed AI Generated Plan
  const demoPhases = [
    {
      phaseName: 'Phase 1: Architecture, Ingestion & Invariant Modeling',
      duration: 'Days 1-7',
      milestone: 'Architecture Signoff',
      tasks: [
        { title: 'Multi-modal document vector parser specification', estimate: '18h', role: 'Architect' },
        { title: 'Zero-copy memory streaming pipeline for high-DPI PDFs', estimate: '24h', role: 'Backend Engineer' },
        { title: 'Database schema migration with indexed vector representations', estimate: '12h', role: 'Data Engineer' }
      ]
    },
    {
      phaseName: 'Phase 2: Autonomous Multi-Agent Consensus Engine',
      duration: 'Days 8-18',
      milestone: 'Agent Consensus Alpha',
      tasks: [
        { title: 'Implement Arbiter Agent for low-confidence OCR reconciliation', estimate: '32h', role: 'AI Engineer' },
        { title: 'Vector cache layer with sub-40ms P99 latency guarantee', estimate: '20h', role: 'Backend Engineer' },
        { title: 'Real-time WebSocket event broadcaster for live processing updates', estimate: '16h', role: 'Full-Stack Engineer' }
      ]
    },
    {
      phaseName: 'Phase 3: Interactive Visual Canvas & 3D Spatial Inspector',
      duration: 'Days 19-24',
      milestone: 'Interactive UX Verification',
      tasks: [
        { title: 'Three.js 3D bounding mesh inspector with confidence color gradients', estimate: '26h', role: 'UI/UX & 3D Designer' },
        { title: 'Keyboard-shortcut driven fast manual verification drawer', estimate: '14h', role: 'Frontend Engineer' }
      ]
    },
    {
      phaseName: 'Phase 4: Security Hardening, SOC2 Auditing & Release',
      duration: 'Days 25-30',
      milestone: 'Production General Availability',
      tasks: [
        { title: 'End-to-end SAML 2.0 / Okta enterprise identity provider federation', estimate: '20h', role: 'Security Engineer' },
        { title: 'SOC2 Type II telemetry logs automated backup pipeline', estimate: '12h', role: 'DevOps / SRE' },
        { title: 'Global load testing with 500 concurrent document streams', estimate: '16h', role: 'QA Lead' }
      ]
    }
  ];

  const aiPlanModel = (prisma as any).aIPlan || (prisma as any).aiPlan;
  await aiPlanModel.create({
    data: {
      workspaceId: workspace.id,
      projectId: project1.id,
      prompt: 'Create a 30-day plan for building an enterprise AI Document Intelligence Platform with multi-agent consensus and 3D visual verification.',
      title: '30-Day Enterprise AI Document Intelligence Accelerated Blueprint',
      overview: 'Comprehensive 4-phase execution plan delivering an enterprise-ready multimodal ingestion pipeline, autonomous agent arbitrator, 3D WebGL inspection UI, and enterprise SOC2 compliance.',
      phasesJson: JSON.stringify(demoPhases),
      status: 'GENERATED',
      createdById: alex.id
    }
  });

  console.log('✅ NEXUS Database successfully seeded with rich demo data!');
  console.log('------------------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  👑 OWNER:            admin@nexus.ai   / password123 (Alex Rivera)');
  console.log('  🎯 PROJECT MANAGER:  pm@nexus.ai      / password123 (Sarah Chen)');
  console.log('  💻 EDITOR (Dev):     dev@nexus.ai     / password123 (Rahul Sharma)');
  console.log('  🎨 EDITOR (Design):  designer@nexus.ai/ password123 (Elena Rostova)');
  console.log('  👁️ VIEWER:           viewer@nexus.ai  / password123 (John Doe)');
  console.log('------------------------------------------------------------');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
