import React from 'react';
import { TaskStatus, PriorityLevel, ProjectStatus, ProjectHealthStatus } from '../../types';

interface StatusBadgeProps {
  status?: TaskStatus | ProjectStatus | string;
  type?: 'task' | 'priority' | 'project' | 'health';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'task', className = '' }) => {
  if (!status) return null;

  // Task Status Styles
  if (type === 'task') {
    const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
      BACKLOG: { label: 'Backlog', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
      TODO: { label: 'To Do', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
      IN_REVIEW: { label: 'In Review', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      BLOCKED: { label: 'Blocked', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
      DONE: { label: 'Done', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    };

    const c = config[status] || { label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border} ${className}`}>
        {c.label}
      </span>
    );
  }

  // Priority Styles
  if (type === 'priority') {
    const config: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
      LOW: { label: 'Low', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
      MEDIUM: { label: 'Medium', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
      HIGH: { label: 'High', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
      URGENT: { label: 'Urgent', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-500 animate-ping' },
    };

    const c = config[status] || config.MEDIUM;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  }

  // Project Health Styles
  if (type === 'health') {
    const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
      HEALTHY: { label: 'Healthy', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      AT_RISK: { label: 'At Risk', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
      CRITICAL: { label: 'Critical', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
    };

    const c = config[status] || config.HEALTHY;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border} ${className}`}>
        {c.label}
      </span>
    );
  }

  // Project Status Styles
  const projectConfig: Record<string, { label: string; bg: string; text: string }> = {
    PLANNING: { label: 'Planning', bg: 'bg-blue-500/15', text: 'text-blue-300' },
    ACTIVE: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
    ON_HOLD: { label: 'On Hold', bg: 'bg-amber-500/15', text: 'text-amber-300' },
    COMPLETED: { label: 'Completed', bg: 'bg-purple-500/15', text: 'text-purple-300' },
    ARCHIVED: { label: 'Archived', bg: 'bg-slate-500/15', text: 'text-slate-300' },
  };

  const p = projectConfig[status] || { label: status, bg: 'bg-slate-500/15', text: 'text-slate-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border border-white/5 ${p.bg} ${p.text} ${className}`}>
      {p.label}
    </span>
  );
};
