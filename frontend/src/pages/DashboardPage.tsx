import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Flame,
  Sparkles,
  Bot,
  Users,
  ArrowRight,
  ShieldAlert,
  Play,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Project, Task, ProjectPulse } from '../types';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { StatusBadge } from '../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const context = useOutletContext<{ openTaskModal?: (id: string) => void }>();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pulse, setPulse] = useState<ProjectPulse | null>(null);
  const [dailyBrief, setDailyBrief] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [projRes, tasksRes, pulseRes, briefRes, analyticsRes] = await Promise.all([
          api.getProjects(),
          api.getTasks(),
          api.getProjectPulse(),
          api.getDailyBrief(),
          api.getAnalytics('7d')
        ]);

        if (projRes.success) setProjects(projRes.projects || []);
        if (tasksRes.success) setTasks(tasksRes.tasks || []);
        if (pulseRes.success) setPulse(pulseRes.pulse);
        if (briefRes.success) setDailyBrief(briefRes.brief);
        if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overdueTasks = tasks.filter(t => t.status !== 'DONE' && t.deadline && new Date(t.deadline) < new Date());
  const urgentTasks = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');

  // Filter tasks with deadlines for urgency center
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'DONE' && t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome & AI Daily Brief Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-dropdown border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Command Operational</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good day, <span className="shimmer-text">{user?.name}</span>.
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              {dailyBrief ||
                'Welcome to the NEXUS command center. Your project telemetry is synchronized with active sprints and deadlines.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/ai')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-cyan-300" />
              Ask AI Assistant
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-slate-200 text-xs font-semibold transition flex items-center gap-2 border border-white/10"
            >
              <FolderKanban className="w-4 h-4 text-slate-400" />
              View Kanban Board
            </button>
          </div>
        </div>

        {/* Live Project Pulse Ticker */}
        {pulse && (
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Completed Today</span>
              <span className="text-base font-bold text-emerald-400">{pulse.tasksCompletedToday} tasks</span>
            </div>
            <div>
              <span className="text-slate-500 block">Overdue Tasks</span>
              <span className="text-base font-bold text-rose-400">{pulse.overdueTasksCount} items</span>
            </div>
            <div>
              <span className="text-slate-500 block">72h Deadlines</span>
              <span className="text-base font-bold text-amber-400">{pulse.upcomingDeadlinesCount} pending</span>
            </div>
            <div>
              <span className="text-slate-500 block">System Health</span>
              <span className="text-base font-bold text-cyan-400">{pulse.overallSystemHealth}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Active Projects */}
        <div
          onClick={() => navigate('/projects')}
          className="glass-card p-5 rounded-2xl border border-white/10 hover:border-indigo-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Projects</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{projects.length}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>{projects.filter(p => p.status === 'ACTIVE').length} in active sprint</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Card 2: Tasks Completed / In Progress */}
        <div
          onClick={() => navigate('/tasks')}
          className="glass-card p-5 rounded-2xl border border-white/10 hover:border-cyan-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks Velocity</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-cyan-400">
            {completedTasks} <span className="text-sm font-normal text-slate-400">/ {totalTasks}</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>{inProgressTasks} in progress</span>
            <span className="font-semibold text-emerald-400">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% done
            </span>
          </div>
        </div>

        {/* Card 3: Upcoming Deadlines & Overdue */}
        <div
          onClick={() => navigate('/tasks')}
          className="glass-card p-5 rounded-2xl border border-white/10 hover:border-rose-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Deadlines</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition animate-pulse">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{overdueTasks.length}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>{upcomingDeadlines.length} due soon</span>
            <span className="font-semibold text-amber-400">Review Urgent</span>
          </div>
        </div>

        {/* Card 4: Hours Tracked */}
        <div
          onClick={() => navigate('/time')}
          className="glass-card p-5 rounded-2xl border border-white/10 hover:border-purple-500/40 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Tracked</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-300">
            {tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0).toFixed(1)}h
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Active stopwatch logging</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Main Charts & Urgency Center Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sprint Velocity Trend Chart */}
        <div className="lg:col-span-8 glass-dropdown rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Sprint Completion Velocity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tasks delivered versus estimated target velocity</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  analytics?.velocityTrend || [
                    { day: 'Mon', completed: 4, target: 5 },
                    { day: 'Tue', completed: 7, target: 6 },
                    { day: 'Wed', completed: 5, target: 5 },
                    { day: 'Thu', completed: 8, target: 6 },
                    { day: 'Fri', completed: 9, target: 7 },
                    { day: 'Sat', completed: 3, target: 2 },
                    { day: 'Sun', completed: 2, target: 2 }
                  ]
                }
              >
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="completed" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" />
                <Area type="monotone" dataKey="target" stroke="#06B6D4" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Urgency Center & Upcoming Deadlines */}
        <div className="lg:col-span-4 glass-dropdown rounded-2xl border border-white/10 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h3 className="text-base font-bold text-white tracking-wide">Urgency Center</h3>
              </div>
              <span className="text-[11px] text-slate-400">Live Countdowns</span>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Zero critical deadlines pending. All items delivered!
                </div>
              ) : (
                upcomingDeadlines.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (context?.openTaskModal) {
                        context.openTaskModal(t.id);
                      } else {
                        navigate('/tasks');
                      }
                    }}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer transition group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition line-clamp-1">
                        {t.title}
                      </span>
                      <StatusBadge status={t.priority} type="priority" />
                    </div>
                    <div className="flex items-center justify-between">
                      <CountdownTimer deadline={t.deadline} isCompleted={t.status === 'DONE'} compact />
                      <span className="text-[10px] text-slate-500 uppercase">{t.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 text-xs font-semibold transition border border-white/5 text-center block"
          >
            Open All Tasks Board
          </button>
        </div>
      </div>

      {/* Flagship Active Projects Preview */}
      <div className="glass-dropdown rounded-2xl border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Flagship Projects</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time health telemetry and budget pacing</p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            View All Projects ({projects.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {projects.map(proj => (
            <div
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/5 hover:border-indigo-500/30 cursor-pointer transition group space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                  style={{ backgroundColor: proj.color }}
                >
                  {proj.template}
                </span>
                <StatusBadge status={proj.healthStatus} type="health" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                  {proj.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-200">{proj.progressPercent || 0}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${proj.progressPercent || 0}%`,
                      backgroundColor: proj.color
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>{proj.totalTasks || 0} tasks</span>
                <CountdownTimer deadline={proj.deadline} compact />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
