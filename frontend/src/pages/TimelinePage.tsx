import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { Task, Project } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CountdownTimer } from '../components/common/CountdownTimer';

export const TimelinePage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [tasksRes, projsRes] = await Promise.all([
          api.getTasks(),
          api.getProjects()
        ]);
        if (tasksRes.success) setTasks(tasksRes.tasks || []);
        if (projsRes.success) setProjects(projsRes.projects || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTasks = tasks.filter(t =>
    selectedProject === 'ALL' ? true : t.projectId === selectedProject
  );

  // Weeks range
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Timeline & Gantt</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Cinematic schedule orchestration, dependencies, and critical path conflict detection.
          </p>
        </div>

        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Dependency Invariant Notice */}
      <div className="p-4 rounded-2xl glass-card border border-indigo-500/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Dependency Engine Active</div>
            <div className="text-[11px] text-slate-400">
              Tasks linked with Finish-to-Start invariants enforce realistic sprint delivery.
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Research</span>
          <ArrowRight className="w-3 h-3 text-cyan-400" />
          <span>Architecture</span>
          <ArrowRight className="w-3 h-3 text-cyan-400" />
          <span>Integration</span>
          <ArrowRight className="w-3 h-3 text-cyan-400" />
          <span>Verification</span>
        </div>
      </div>

      {/* Gantt Timeline View */}
      <div className="glass-dropdown rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Timeline Header Columns */}
        <div className="grid grid-cols-12 border-b border-white/10 bg-slate-950/60 py-3 px-4 text-xs font-bold text-slate-400">
          <div className="col-span-4">Task Deliverable</div>
          <div className="col-span-8 grid grid-cols-6 text-center">
            {weeks.map(w => (
              <span key={w} className="text-slate-400">{w}</span>
            ))}
          </div>
        </div>

        {/* Task Rows */}
        <div className="divide-y divide-white/5">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No tasks in current view.</div>
          ) : (
            filteredTasks.map((task, idx) => {
              // Simulated position across the 6 weeks based on index or dates
              const startWeek = idx % 4;
              const durationWeeks = Math.max(1, ((idx + 2) % 3) + 1);

              return (
                <div key={task.id} className="grid grid-cols-12 items-center py-3.5 px-4 hover:bg-white/[0.02] transition">
                  {/* Task Metadata */}
                  <div className="col-span-4 pr-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {task.title}
                      </span>
                      <StatusBadge status={task.priority} type="priority" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{task.project?.name}</span>
                      <span>•</span>
                      <CountdownTimer deadline={task.deadline} isCompleted={task.status === 'DONE'} compact />
                    </div>
                  </div>

                  {/* Gantt Bar Lane */}
                  <div className="col-span-8 grid grid-cols-6 relative h-9 items-center">
                    <div className="absolute inset-0 grid grid-cols-6 divide-x divide-white/5 pointer-events-none" />

                    {/* Draggable Gantt Bar */}
                    <div
                      className={`relative z-10 h-7 rounded-lg px-2 flex items-center justify-between text-[11px] font-semibold text-white shadow-md transition group cursor-pointer ${
                        task.status === 'DONE'
                          ? 'bg-emerald-600/80 border border-emerald-400/50'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-indigo-600/80 border border-indigo-400/50 shadow-indigo-600/20'
                          : task.status === 'BLOCKED'
                          ? 'bg-rose-600/80 border border-rose-400/50 animate-pulse'
                          : 'bg-slate-700/80 border border-slate-500/50'
                      }`}
                      style={{
                        gridColumnStart: startWeek + 1,
                        gridColumnEnd: `span ${durationWeeks}`
                      }}
                    >
                      <span className="truncate">{task.status.replace('_', ' ')}</span>
                      <span className="font-mono text-[10px] opacity-80">{task.actualHours}h</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
