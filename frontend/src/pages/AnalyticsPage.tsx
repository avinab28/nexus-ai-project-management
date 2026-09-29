import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Users,
  Calendar,
  PieChart as PieIcon,
  Sparkles
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

export const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics(range);
        if (res.success && res.analytics) {
          setData(res.analytics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [range]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Analytics & Intelligence</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Holistic velocity telemetry, deadline accuracy, and resource efficiency.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10">
          {(['7d', '30d', '90d', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                range === r
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 uppercase">Task Completion Rate</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              {data.summary.taskCompletionRate}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {data.summary.completedTasks} of {data.summary.totalTasks} delivered
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 uppercase">Overdue Drift</span>
            <div className="text-3xl font-extrabold text-rose-400 mt-2">
              {data.summary.overduePercentage}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {data.summary.overdueTasks} tasks past deadline
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 uppercase">Avg Task Duration</span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-2">
              {data.summary.averageTaskDuration}h
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Actual logged hours per card</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Logged Time</span>
            <div className="text-3xl font-extrabold text-purple-300 mt-2">
              {data.summary.totalLoggedHours}h
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Engineering hours logged</span>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sprint Velocity */}
        <div className="lg:col-span-8 glass-dropdown rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Sprint Velocity Trend
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.velocityTrend || []}>
                <defs>
                  <linearGradient id="anComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
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
                <Area type="monotone" dataKey="completed" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#anComp)" />
                <Area type="monotone" dataKey="target" stroke="#06B6D4" strokeWidth={2} strokeDasharray="3 3" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="lg:col-span-4 glass-dropdown rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-400" />
            Priority Breakdown
          </h3>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.priorityBreakdown || []}>
                <XAxis dataKey="priority" stroke="#64748b" fontSize={11} tickLine={false} />
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
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(data?.priorityBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
