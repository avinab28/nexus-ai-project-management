import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  generateAIProjectPlan,
  breakDownTaskAI,
  generateDailyBrief,
  processAIAssistantQuery
} from '../services/ai.service.js';
import { calculateProjectHealth } from '../services/health.service.js';
import { logActivity } from '../services/activity.service.js';

const router = Router();

// -----------------------------------------------------------------------------
// POST /api/ai/project-plan - Generate a structured project roadmap
// -----------------------------------------------------------------------------
router.post('/project-plan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, projectId, context } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const plan = await generateAIProjectPlan(prompt, context);
    const workspaceId = req.user?.workspaceId;

    let savedPlan = null;
    if (workspaceId) {
      const aiPlanModel = (prisma as any).aIPlan || (prisma as any).aiPlan;
      savedPlan = await aiPlanModel.create({
        data: {
          prompt,
          title: plan.title,
          overview: plan.overview,
          phasesJson: JSON.stringify(plan.phases),
          workspaceId,
          projectId: projectId || null,
          createdById: req.user!.id
        }
      });

      if (projectId) {
        await logActivity({
          workspaceId,
          projectId,
          userId: req.user!.id,
          action: 'AI_PLAN_GENERATED',
          entityType: 'AI_PLAN',
          entityId: savedPlan.id,
          details: `Nexus AI generated project plan: "${plan.title}".`
        });
      }
    }

    return res.json({
      success: true,
      plan: {
        ...plan,
        id: savedPlan?.id
      }
    });
  } catch (error: any) {
    console.error('AI plan generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI project plan' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/ai/apply-plan - Commit generated AI Plan tasks directly to Project
// -----------------------------------------------------------------------------
router.post('/apply-plan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, phases } = req.body;

    if (!projectId || !phases || !Array.isArray(phases)) {
      return res.status(400).json({ success: false, message: 'Valid projectId and phases array required' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true, name: true }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Target project not found' });
    }

    let createdTasksCount = 0;
    const now = new Date();

    for (let pIdx = 0; pIdx < phases.length; pIdx++) {
      const phase = phases[pIdx];

      // Create milestone for phase
      const milestone = await prisma.milestone.create({
        data: {
          projectId,
          title: phase.milestone || phase.phaseName,
          description: `Deliverable for ${phase.phaseName}`,
          dueDate: new Date(now.getTime() + (pIdx + 1) * 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Create tasks for phase
      if (phase.tasks && Array.isArray(phase.tasks)) {
        for (let tIdx = 0; tIdx < phase.tasks.length; tIdx++) {
          const t = phase.tasks[tIdx];
          const task = await prisma.task.create({
            data: {
              title: t.title,
              description: t.description,
              projectId,
              creatorId: req.user!.id,
              priority: (t.priority || 'MEDIUM') as any,
              status: 'TODO',
              estimatedHours: t.estimateHours || 4,
              order: tIdx,
              deadline: new Date(now.getTime() + (pIdx + 1) * 6 * 24 * 60 * 60 * 1000),
              tags: JSON.stringify(['AI Generated', phase.phaseName.substring(0, 15)])
            }
          });

          // Create subtasks
          if (t.subtasks && Array.isArray(t.subtasks)) {
            await prisma.subtask.createMany({
              data: t.subtasks.map((st: string, stIdx: number) => ({
                title: st,
                taskId: task.id,
                order: stIdx,
                isCompleted: false
              }))
            });
          }

          createdTasksCount++;
        }
      }
    }

    // Refresh health
    await calculateProjectHealth(projectId);

    await logActivity({
      workspaceId: project.workspaceId,
      projectId,
      userId: req.user!.id,
      action: 'AI_PLAN_APPLIED',
      entityType: 'AI_PLAN',
      entityId: projectId,
      details: `${req.user!.name} applied AI Plan: imported ${createdTasksCount} tasks into project "${project.name}".`
    });

    return res.json({
      success: true,
      message: `Successfully generated and imported ${createdTasksCount} tasks into ${project.name}`
    });
  } catch (error: any) {
    console.error('Apply plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to apply AI plan to project' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/ai/task-breakdown - Smart breakdown of single task
// -----------------------------------------------------------------------------
router.post('/task-breakdown', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, context } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const items = await breakDownTaskAI(title, context);
    return res.json({ success: true, items });
  } catch (error: any) {
    console.error('Task breakdown error:', error);
    return res.status(500).json({ success: false, message: 'Failed to break down task' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/ai/project-health/:projectId - Live causal health reasoning
// -----------------------------------------------------------------------------
router.get('/project-health/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const health = await calculateProjectHealth(projectId);
    return res.json({ success: true, health });
  } catch (error: any) {
    console.error('Health calculation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute project health' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/ai/daily-brief - Personalized daily brief
// -----------------------------------------------------------------------------
router.get('/daily-brief', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const brief = await generateDailyBrief(req.user!.id, req.user?.workspaceId || '');
    return res.json({ success: true, brief });
  } catch (error: any) {
    console.error('Daily brief error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate daily brief' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/ai/query - Natural language assistant copilot
// -----------------------------------------------------------------------------
router.post('/query', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { query, projectId } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query cannot be empty' });
    }

    const result = await processAIAssistantQuery(query, req.user?.workspaceId || '', projectId);
    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('AI assistant query error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process AI query' });
  }
});

export default router;
