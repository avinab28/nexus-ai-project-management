import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Kanban,
  Calendar,
  Clock,
  GitBranch,
  Bot,
  Users,
  Activity,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  DollarSign,
  Sparkles,
  BarChart3,
  List
} from 'lucide-react';
import { api } from '../services/api';
import { Project, Task, TaskStatus, PriorityLevel } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { usePermissions } from '../hooks/usePermissions';

export const ProjectWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const context = useOutletContext<{ openTaskModal?: (id: string) => void }>();
  const { canCreateTask, canUpdateTask } = usePermissions();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'list' | 'timeline' | 'milestones' | 'ai'>('kanban');

  // New task inline creation
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskColumn, setNewTaskColumn] = useState<TaskStatus>('TODO');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        api.getProject(id),
        api.getTasks({ projectId: id })
      ]);

      if (projRes.success && projRes.project) {
        setProject(projRes.project);
      }
      if (tasksRes.success) {
        setTasks(tasksRes.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load project workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskId) return;

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    setDraggingTaskId(null);

    try {
      await api.updateTaskStatus(taskId, targetStatus);
    } catch (err) {
      console.error('Drop failed:', err);
      loadProjectData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;

    try {
      const res = await api.createTask({
        title: newTaskTitle.trim(),
        projectId: id,
        status: newTaskColumn,
        priority: 'MEDIUM',
        estimatedHours: 4
      });

      if (res.success && res.task) {
        setTasks(prev => [...prev, res.task]);
        setNewTaskTitle('');
        setIsAddingTask(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400">Loading project workspace...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 space-y-3">
        <h2 className="text-lg font-bold text-white">Project not found</h2>
        <button onClick={() => navigate('/projects')} className="text-xs text-indigo-400">
          Back to Projects
        </button>
      </div>
    );
  }

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-500/40 text-slate-400' },
    { id: 'TODO', label: 'To Do', color: 'border-blue-500/40 text-blue-400' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/40 text-amber-400' },
    { id: 'IN_REVIEW', label: 'In Review', color: 'border-purple-500/40 text-purple-400' },
    { id: 'BLOCKED', label: 'Blocked', color: 'border-rose-500/40 text-rose-400' },
    { id: 'DONE', label: 'Done', color: 'border-emerald-500/40 text-emerald-400' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Overview Bar */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Portfolio
        </button>

        <div className="glass-dropdown p-6 rounded-2xl border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: project.color }}
              >
                {project.template}
              </span>
              <StatusBadge status={project.status} type="project" />
              <StatusBadge status={project.healthStatus} type="health" />
              <CountdownTimer deadline={project.deadline} isCompleted={project.status === 'COMPLETED'} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{project.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {project.description || 'No detailed description.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 text-xs">
            <div>
              <span className="text-slate-500 block">Health Score</span>
              <span className="text-xl font-extrabold text-cyan-400">{project.healthScore}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">Logged Hours</span>
              <span className="text-xl font-extrabold text-purple-300">
                {tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0).toFixed(1)}h
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Tasks</span>
              <span className="text-xl font-extrabold text-white">{tasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'kanban', label: 'Kanban Board', icon: Kanban },
          { id: 'list', label: 'List View', icon: List },
          { id: 'overview', label: 'Health & Telemetry', icon: Activity },
          { id: 'timeline', label: 'Timeline / Gantt', icon: GitBranch },
          { id: 'milestones', label: `Milestones (${project.milestones?.length || 0})`, icon: CheckCircle2 },
          { id: 'ai', label: 'AI Plan Engine', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KANBAN BOARD WITH DRAG & DROP */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Drag task cards between workflow columns to update status.</span>
            {canCreateTask && (
              <button
                onClick={() => setIsAddingTask(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            )}
          </div>

          {/* Quick inline task creation modal */}
          {isAddingTask && (
            <form onSubmit={handleCreateTask} className="p-4 rounded-xl glass-dropdown border border-indigo-500/30 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <select
                value={newTaskColumn}
                onChange={e => setNewTaskColumn(e.target.value as TaskStatus)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                {columns.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                  Create
                </button>
                <button type="button" onClick={() => setIsAddingTask(false)} className="px-3 py-2 rounded-xl text-xs text-slate-400">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col.id)}
                  className="bg-slate-950/40 rounded-2xl border border-white/5 p-3 flex flex-col min-h-[550px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.id === 'DONE' ? 'bg-emerald-400' : col.id === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-200">{col.label}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards Container */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {colTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => handleDragStart(e, task.id)}
                        onClick={() => context?.openTaskModal?.(task.id)}
                        className="glass-card p-3 rounded-xl border border-white/5 hover:border-indigo-500/40 cursor-grab active:cursor-grabbing transition space-y-2.5 group shadow-sm hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <StatusBadge status={task.priority} type="priority" />
                          <CountdownTimer deadline={task.deadline} isCompleted={task.status === 'DONE'} compact />
                        </div>

                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition line-clamp-2">
                          {task.title}
                        </h4>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                          <span>{task.subtasks?.length || 0} subtasks</span>
                          <span className="font-mono text-cyan-400">{task.actualHours.toFixed(1)}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIST VIEW */}
      {activeTab === 'list' && (
        <div className="glass-dropdown rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 font-bold text-xs uppercase text-slate-400">
            All Tasks ({tasks.length})
          </div>
          <div className="divide-y divide-white/5">
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => context?.openTaskModal?.(t.id)}
                className="p-3.5 hover:bg-white/5 cursor-pointer transition flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 flex-1">
                  <StatusBadge status={t.status} type="task" />
                  <span className="font-medium text-slate-200 hover:text-indigo-300">{t.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={t.priority} type="priority" />
                  <CountdownTimer deadline={t.deadline} isCompleted={t.status === 'DONE'} compact />
                  <span className="font-mono text-cyan-300">{t.actualHours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH & CAUSAL REASONING */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Health Diagnostic</h3>
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={project.healthStatus} type="health" />
                <span className="text-xs text-slate-400">Score: {project.healthScore}/100</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {project.healthReason || 'Project progressing nominally with no active regressions.'}
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resource Allocation</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Budget Pacing</span>
                <span className="font-bold text-emerald-400">${project.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Estimated Effort</span>
                <span className="font-bold text-slate-200">{project.estimatedHours} hours</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Actual Logged Hours</span>
                <span className="font-bold text-cyan-300">
                  {tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0).toFixed(1)} hours
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIMELINE / GANTT PREVIEW */}
      {activeTab === 'timeline' && (
        <div className="glass-dropdown p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Project Schedule & Drift</h3>
            <button onClick={() => navigate('/timeline')} className="text-xs text-indigo-400 font-semibold">
              Open Full Gantt View
            </button>
          </div>
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{t.title}</span>
                <div className="flex items-center gap-3">
                  <CountdownTimer deadline={t.deadline} isCompleted={t.status === 'DONE'} compact />
                  <StatusBadge status={t.status} type="task" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="glass-dropdown p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white">Project Milestones</h3>
          <div className="space-y-3">
            {project.milestones && project.milestones.length > 0 ? (
              project.milestones.map(m => (
                <div key={m.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{m.title}</span>
                      {m.isCompleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          Delivered
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">
                          In Flight
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{m.description}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                    {new Date(m.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No milestones created yet.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: AI PLAN ENGINE */}
      {activeTab === 'ai' && (
        <div className="glass-dropdown p-6 rounded-2xl border border-indigo-500/30 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">AI Project Plan Engine</h3>
            </div>
            <button
              onClick={() => navigate('/ai')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Open AI Copilot
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Generate 30-day plans or break down deliverables directly into this project using Gemini AI.
          </p>
        </div>
      )}
    </div>
  );
};
