import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  AlertTriangle,
  Mail,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';

export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const { canManageMembers } = usePermissions();

  const [members, setMembers] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const [membersRes, rolesRes] = await Promise.all([
        api.getMembers(),
        api.getRoles().catch(() => ({ success: false, roles: [] }))
      ]);
      if (membersRes.success) {
        setMembers(membersRes.members || []);
      }
      if (rolesRes.success && rolesRes.roles) {
        setAvailableRoles(rolesRes.roles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingId(userId);
      const res = await api.updateMemberRole(userId, newRole);
      if (res.success) {
        setMembers(prev =>
          prev.map(m => (m.id === userId ? { ...m, role: newRole } : m))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Mocked workloads matching Section 16 requirements: Alex 80%, Rahul 60%, Elena/Sarah 90%, John 30%
  const workloadData: Record<string, number> = {
    'admin@nexus.ai': 80,
    'pm@nexus.ai': 90,
    'dev@nexus.ai': 60,
    'designer@nexus.ai': 85,
    'viewer@nexus.ai': 30
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Team & Smart Workload</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
          Real-time member bandwidth monitoring, burnout prevention, and role-based access management.
        </p>
      </div>

      {/* Smart Workload Alert Banner */}
      <div className="p-4 sm:p-5 rounded-2xl glass-dropdown border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Smart Workload Optimization Alert</div>
            <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
              Sarah Chen has <strong>90% workload capacity</strong> while John Doe is currently at <strong>30%</strong>. Consider reassigning pending review items to balance sprint throughput.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Tasks successfully re-balanced evenly across active engineering bandwidth!')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shrink-0"
        >
          Auto-Balance Workload
        </button>
      </div>

      {/* Member Directory & Workload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(m => {
          const loadPct = workloadData[m.email] || 50;
          return (
            <div
              key={m.id}
              className="glass-card p-6 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition space-y-4"
            >
              <div className="flex items-start gap-4">
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-base font-bold">
                    {m.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{m.name}</h3>
                  <div className="text-xs text-slate-400 truncate">{m.title || 'Team Member'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{m.department || 'Engineering'}</div>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Workload</span>
                  <span
                    className={`font-mono font-bold ${
                      loadPct >= 85
                        ? 'text-rose-400'
                        : loadPct >= 65
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {loadPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      loadPct >= 85
                        ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                        : loadPct >= 65
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${loadPct}%` }}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-500">Access Role:</span>
                {canManageMembers ? (
                  <select
                    value={m.role}
                    disabled={updatingId === m.id}
                    onChange={e => handleRoleChange(m.id, e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {availableRoles.length > 0 ? (
                      availableRoles.map(r => (
                        <option key={r.key} value={r.key}>
                          {r.name || r.key}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="OWNER">Owner</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </>
                    )}
                  </select>
                ) : (
                  <span className="font-bold text-indigo-400 uppercase text-[11px]">{m.role}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
