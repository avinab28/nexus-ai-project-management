import { prisma } from '../config/db.js';

export interface HealthAnalysisResult {
  score: number; // 0 - 100
  status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  reason: string;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    approachingDeadlines: number;
    completionRate: number;
    estimatedHours: number;
    actualHours: number;
    hoursVariancePercentage: number;
  };
  recommendations: string[];
}

export async function calculateProjectHealth(projectId: string): Promise<HealthAnalysisResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          deadline: true,
          estimatedHours: true,
          actualHours: true
        }
      }
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const tasks = project.tasks;
  const totalTasks = tasks.length;
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  if (totalTasks === 0) {
    return {
      score: 100,
      status: 'HEALTHY',
      reason: 'Project has just been initialized and has no overdue tasks or pending blockers.',
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0,
        overdueTasks: 0,
        approachingDeadlines: 0,
        completionRate: 100,
        estimatedHours: 0,
        actualHours: 0,
        hoursVariancePercentage: 0
      },
      recommendations: ['Create initial task breakdown and milestone plan to begin execution.']
    };
  }

  let completedTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;
  let overdueTasks = 0;
  let approachingDeadlines = 0;
  let totalEstimated = 0;
  let totalActual = 0;

  for (const t of tasks) {
    totalEstimated += t.estimatedHours || 0;
    totalActual += t.actualHours || 0;

    if (t.status === 'DONE') {
      completedTasks++;
    } else {
      if (t.status === 'IN_PROGRESS') inProgressTasks++;
      if (t.status === 'BLOCKED') blockedTasks++;

      if (t.deadline) {
        const d = new Date(t.deadline);
        if (d < now) {
          overdueTasks++;
        } else if (d <= threeDaysFromNow) {
          approachingDeadlines++;
        }
      }
    }
  }

  const completionRate = Math.round((completedTasks / totalTasks) * 100);
  const hoursVariancePercentage = totalEstimated > 0
    ? Math.round(((totalActual - totalEstimated) / totalEstimated) * 100)
    : 0;

  // Base score calculation
  let score = 100;
  const penaltyReasons: string[] = [];
  const recommendations: string[] = [];

  // 1. Overdue tasks penalty (heavy)
  if (overdueTasks > 0) {
    const penalty = Math.min(45, overdueTasks * 15);
    score -= penalty;
    penaltyReasons.push(`${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} past deadline`);
    recommendations.push(`Immediately review and re-estimate or reassign the ${overdueTasks} overdue task(s).`);
  }

  // 2. Blocked tasks penalty
  if (blockedTasks > 0) {
    const penalty = Math.min(30, blockedTasks * 12);
    score -= penalty;
    penaltyReasons.push(`${blockedTasks} task${blockedTasks > 1 ? 's are' : ' is'} currently blocked`);
    recommendations.push(`Clear dependencies and unblock team members waiting on external sign-offs.`);
  }

  // 3. Approaching deadlines with low progress
  if (approachingDeadlines > 0 && completionRate < 50) {
    score -= 10;
    penaltyReasons.push(`${approachingDeadlines} upcoming deadline${approachingDeadlines > 1 ? 's' : ''} with overall completion under 50%`);
    recommendations.push(`Focus sprint capacity on the ${approachingDeadlines} tasks due within 72 hours.`);
  }

  // 4. Hours budget overrun
  if (hoursVariancePercentage > 20) {
    score -= 10;
    penaltyReasons.push(`Actual logged hours exceed initial estimate by ${hoursVariancePercentage}%`);
    recommendations.push(`Audit task scope creep to align with budgeted project hours.`);
  }

  score = Math.max(10, Math.min(100, score));

  let status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL' = 'HEALTHY';
  let reason = 'Project is progressing smoothly with all deadlines on schedule and zero active blockers.';

  if (score < 50 || overdueTasks >= 2 || blockedTasks >= 3) {
    status = 'CRITICAL';
    reason = `Project is in CRITICAL status because ${penaltyReasons.join(', ')}. Immediate remediation required.`;
  } else if (score < 80 || overdueTasks > 0 || blockedTasks > 0) {
    status = 'AT_RISK';
    reason = `Project is AT RISK because ${penaltyReasons.join(', ')}.`;
  }

  // Update in database for fast retrieval
  await prisma.project.update({
    where: { id: projectId },
    data: {
      healthScore: score,
      healthStatus: status,
      healthReason: reason
    }
  });

  return {
    score,
    status,
    reason,
    metrics: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      approachingDeadlines,
      completionRate,
      estimatedHours: totalEstimated,
      actualHours: totalActual,
      hoursVariancePercentage
    },
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain current sprint velocity and continue regular milestone check-ins.']
  };
}
