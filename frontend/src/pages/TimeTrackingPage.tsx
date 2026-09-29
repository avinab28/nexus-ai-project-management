import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Timer,
  Play,
  Square,
  RotateCcw,
  Clock,
  Calendar,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Focus,
  PieChart as PieIcon
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { api } from '../services/api';
import { Task } from '../types';
import { useTimeTracker } from '../context/TimeTrackerContext';

export const TimeTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTimer, isRunning, startTimer, stopTimer, resetTimer, formatTime } = useTimeTracker();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [stats, setStats] = useState<{
    dailyHours: number;
    weeklyHours: number;
    projectBreakdown: { name: string; color: string; hours: number }[];
    recentEntries: any[];
  }>({
    dailyHours: 0,
    weeklyHours: 0,
    projectBreakdown: [],
    recentEntries: []
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        api.getTasks(),
        api.getTimeStats()
      ]);
      if (tasksRes.success) {
        setTasks(tasksRes.tasks || []);
        if (tasksRes.tasks?.length > 0 && !selectedTaskId) {
          setSelectedTaskId(tasksRes.tasks[0].id);
        }
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load time data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isRunning]);

  const activeTask = tasks.find(t => t.id === (activeTimer?.taskId || selectedTaskId));

  const handleToggleTimer = () => {
    if (isRunning && activeTimer) {
      stopTimer(activeTimer.taskId);
    } else if (selectedTaskId) {
      startTimer(selectedTaskId);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Time Control & Logging</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Real-time task stopwatches, automated session logging, and project effort distribution.
          </p>
        </div>

        <button
          onClick={() => navigate('/focus')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition flex items-center gap-2"
        >
          <Focus className="w-4 h-4" />
          Enter Focus Mode
        </button>
      </div>

      {/* Main Stopwatch Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-dropdown border border-indigo-500/20 p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Session Telemetry</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Select Task to Track:</span>
            <select
              value={activeTimer?.taskId || selectedTaskId}
              disabled={isRunning}
              onChange={e => setSelectedTaskId(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-md w-full"
            >
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.project?.name || 'No project'})
                </option>
              ))}
            </select>
          </div>

          {activeTask && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>Status: <strong className="text-slate-200">{activeTask.status}</strong></span>
              <span>•</span>
              <span>Logged: <strong className="text-cyan-300">{activeTask.actualHours.toFixed(1)}h</strong></span>
              <span>•</span>
              <span>Estimate: <strong className="text-slate-200">{activeTask.estimatedHours}h</strong></span>
            </div>
          )}
        </div>

        {/* Big Digital Stopwatch Display */}
        <div className="flex flex-col items-center space-y-4">
          <div className="px-8 py-5 rounded-2xl bg-black/50 border border-white/10 shadow-inner flex items-center gap-3">
            {isRunning && <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />}
            <span className="font-mono text-4xl sm:text-6xl font-black tracking-widest text-cyan-300">
              {formatTime(activeTimer?.currentElapsedSeconds || 0)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isRunning ? (
              <button
                onClick={handleToggleTimer}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop Timer
              </button>
            ) : (
              <button
                onClick={handleToggleTimer}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Timer
              </button>
            )}

            {activeTimer && (
              <button
                onClick={() => resetTimer(activeTimer.taskId)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
                title="Reset active timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Today's Effort</span>
          <div className="text-3xl font-extrabold text-cyan-400 mt-2">{stats.dailyHours} hrs</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tracked since midnight</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">7-Day Effort</span>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">{stats.weeklyHours} hrs</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Sprint logged hours</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Active Projects</span>
          <div className="text-3xl font-extrabold text-purple-300 mt-2">{stats.projectBreakdown.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Receiving active development</span>
        </div>
      </div>

      {/* Breakdown Chart & Session Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Project Distribution Chart */}
        <div className="lg:col-span-5 glass-dropdown rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-cyan-400" />
            Effort by Project
          </h3>

          <div className="h-60 w-full flex items-center justify-center">
            {stats.projectBreakdown.length === 0 ? (
              <span className="text-xs text-slate-500">No time tracked in the last 7 days.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.projectBreakdown}
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {stats.projectBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            {stats.projectBreakdown.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-300">{p.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-200">{p.hours}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Logged Sessions */}
        <div className="lg:col-span-7 glass-dropdown rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Sessions</h3>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {stats.recentEntries.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No recorded sessions yet.</div>
            ) : (
              stats.recentEntries.map(e => (
                <div
                  key={e.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-200 block">{e.taskTitle}</span>
                    <span className="text-[10px] text-slate-400">
                      {e.projectName} • {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-cyan-300">{e.durationFormatted}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
