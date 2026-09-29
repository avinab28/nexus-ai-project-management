import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Kanban,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  FolderKanban
} from 'lucide-react';
import { api } from '../services/api';
import { Task, TaskStatus, PriorityLevel, Project } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { usePermissions } from '../hooks/usePermissions';

export const TaskBoardPage: React.FC = () => {
  const context = useOutletContext<{ openTaskModal?: (id: string) => void }>();
  const { canCreateTask } = usePermissions();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // New task modal
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjId, setNewTaskProjId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('MEDIUM');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('TODO');
  const [newTaskHours, setNewTaskHours] = useState(3);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projsRes] = await Promise.all([
        api.getTasks(),
        api.getProjects()
      ]);
      if (tasksRes.success) setTasks(tasksRes.tasks || []);
      if (projsRes.success) {
        setProjects(projsRes.projects || []);
        if (projsRes.projects?.length > 0 && !newTaskProjId) {
          setNewTaskProjId(projsRes.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

    // Optimistic UI
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    setDraggingTaskId(null);

    try {
      await api.updateTaskStatus(taskId, targetStatus);
    } catch (err) {
      console.error('Failed to update status on drop:', err);
      loadData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProjId) return;

    try {
      const res = await api.createTask({
        title: newTaskTitle.trim(),
        projectId: newTaskProjId,
        priority: newTaskPriority,
        status: newTaskStatus,
        estimatedHours: Number(newTaskHours)
      });

      if (res.success && res.task) {
        setTasks(prev => [res.task, ...prev]);
        setNewTaskTitle('');
        setIsNewTaskOpen(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchesProject = selectedProject === 'ALL' || t.projectId === selectedProject;
    const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const columns: { id: TaskStatus; label: string }[] = [
    { id: 'BACKLOG', label: 'Backlog' },
    { id: 'TODO', label: 'To Do' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'IN_REVIEW', label: 'In Review' },
    { id: 'BLOCKED', label: 'Blocked' },
    { id: 'DONE', label: 'Done' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Enterprise Kanban</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Real-time drag-and-drop workflow execution with relational database persistence.
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/5">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col.id)}
                className="bg-slate-950/40 rounded-2xl border border-white/5 p-3 flex flex-col min-h-[600px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        col.id === 'DONE'
                          ? 'bg-emerald-400'
                          : col.id === 'IN_PROGRESS'
                          ? 'bg-amber-400'
                          : col.id === 'BLOCKED'
                          ? 'bg-rose-400 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-200">{col.label}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      onClick={() => context?.openTaskModal?.(task.id)}
                      className="glass-card p-3 rounded-xl border border-white/5 hover:border-indigo-500/40 cursor-grab active:cursor-grabbing transition space-y-2.5 group shadow-sm hover:shadow-xl"
                    >
                      {/* Priority & Countdown Urgency */}
                      <div className="flex items-start justify-between gap-1">
                        <StatusBadge status={task.priority} type="priority" />
                        <CountdownTimer deadline={task.deadline} isCompleted={task.status === 'DONE'} compact />
                      </div>

                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Project Tag */}
                      {task.project && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {task.project.name}
                          </span>
                        </div>
                      )}

                      {/* Footer: Subtasks & Time */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                        <span>{task.subtasks?.length || 0} subtasks</span>
                        <div className="flex items-center gap-1 font-mono text-cyan-300 font-semibold">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{task.actualHours.toFixed(1)}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div
            className="w-full max-w-md glass-dropdown rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-white">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Project *</label>
                <select
                  value={newTaskProjId}
                  onChange={e => setNewTaskProjId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as PriorityLevel)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={newTaskStatus}
                    onChange={e => setNewTaskStatus(e.target.value as TaskStatus)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Estimated Hours</label>
                <input
                  type="number"
                  value={newTaskHours}
                  onChange={e => setNewTaskHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
