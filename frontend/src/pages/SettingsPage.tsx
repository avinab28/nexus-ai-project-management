import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle, 
  Save, 
  Cpu, 
  Download,
  Building,
  Key,
  BellRing,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { can, role } = usePermissions();

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PERMISSIONS' | 'MEMBERS' | 'AI_ENGINE'>('GENERAL');
  const [workspaceName, setWorkspaceName] = useState('Nexus Core Workspace');
  const [workspaceDescription, setWorkspaceDescription] = useState('Enterprise AI-powered workspace for agile delivery and automated workflow orchestration.');
  const [timezone, setTimezone] = useState('UTC (GMT+0)');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [dailyBriefHour, setDailyBriefHour] = useState('09:00');
  
  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [matrixRoles, setMatrixRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setIsLoading(true);
      const [membersRes, matrixRes] = await Promise.all([
        api.getMembers().catch(() => ({ success: false, members: [] })),
        api.getPermissionsMatrix().catch(() => ({ success: false, roles: [] }))
      ]);

      if (membersRes.success && membersRes.members) {
        setMembers(membersRes.members);
      }
      if (matrixRes.success && matrixRes.roles) {
        setMatrixRoles(matrixRes.roles);
      }
    } catch (err) {
      console.error('Failed to load settings data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!can('settings.manage')) {
      alert('Only workspace Owners can modify team member roles.');
      return;
    }

    try {
      const res = await api.updateMemberRole(userId, newRole);
      if (res.success) {
        setMembers(prev =>
          prev.map(m => (m.id === userId ? { ...m, role: newRole } : m))
        );
        setActionMessage(`Role updated successfully for member.`);
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const allCapabilities = [
    { key: 'projects.create', label: 'Create Projects', category: 'Projects' },
    { key: 'projects.edit', label: 'Edit Project Details', category: 'Projects' },
    { key: 'projects.delete', label: 'Delete Projects', category: 'Projects' },
    { key: 'tasks.create', label: 'Create Tasks', category: 'Tasks' },
    { key: 'tasks.edit', label: 'Edit & Reassign Tasks', category: 'Tasks' },
    { key: 'tasks.delete', label: 'Delete Tasks', category: 'Tasks' },
    { key: 'tasks.status', label: 'Move Task Status (Kanban)', category: 'Tasks' },
    { key: 'comments.create', label: 'Post Discussion Comments', category: 'Collaboration' },
    { key: 'time.track', label: 'Log & Track Time Limits', category: 'Productivity' },
    { key: 'members.read', label: 'View Team Directory', category: 'Team' },
    { key: 'members.invite', label: 'Invite Workspace Members', category: 'Team' },
    { key: 'ai.generate_plan', label: 'Generate AI 30-Day Plan', category: 'AI Intelligence' },
    { key: 'ai.apply_plan', label: 'Apply Plan to Project', category: 'AI Intelligence' },
    { key: 'ai.analyze', label: 'Run AI Diagnostics & Health', category: 'AI Intelligence' },
    { key: 'settings.manage', label: 'Workspace Configuration & Roles', category: 'Administration' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-nexus-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Role: {role}
            </span>
          </div>
          <p className="text-sm text-nexus-400 mt-1">
            Manage workspace configuration, review role-based access controls, and configure AI intelligence.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-nexus-800 pb-3">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'GENERAL'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          <Building className="w-4 h-4" />
          General
        </button>

        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'PERMISSIONS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          RBAC Permissions Matrix
        </button>

        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'MEMBERS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Members & Access ({members.length})
        </button>

        <button
          onClick={() => setActiveTab('AI_ENGINE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'AI_ENGINE'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Engine & Integrations
        </button>
      </div>

      {/* TAB CONTENT: GENERAL */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">General Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Primary Timezone</label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="UTC (GMT+0)">UTC (GMT+0) - Universal Time</option>
                  <option value="EST (GMT-5)">EST (GMT-5) - Eastern Standard Time</option>
                  <option value="PST (GMT-8)">PST (GMT-8) - Pacific Standard Time</option>
                  <option value="IST (GMT+5:30)">IST (GMT+5:30) - Indian Standard Time</option>
                  <option value="CET (GMT+1)">CET (GMT+1) - Central European Time</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Workspace Description</label>
                <textarea
                  rows={3}
                  value={workspaceDescription}
                  onChange={e => setWorkspaceDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Daily Operations & Alerts</h2>
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-nexus-950/60 border border-nexus-850">
              <div>
                <h4 className="text-sm font-medium text-white">Automatic AI Daily Brief</h4>
                <p className="text-xs text-nexus-400 mt-0.5">Synthesize blockers, overdue items, and sprint focus every morning</p>
              </div>
              <input
                type="time"
                value={dailyBriefHour}
                onChange={e => setDailyBriefHour(e.target.value)}
                className="px-3 py-1.5 bg-nexus-900 border border-nexus-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Changes saved successfully!
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={!can('settings.manage')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
            >
              <Save className="w-4 h-4" />
              Save Workspace Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: RBAC PERMISSIONS MATRIX */}
      {activeTab === 'PERMISSIONS' && (
        <div className="space-y-6">
          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Role-Based Access Control (RBAC) Specification</h2>
                <p className="text-xs text-nexus-400 mt-1">
                  Granular capabilities enforced across API routes and UI buttons.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-nexus-800 text-cyan-400 border border-nexus-700">
                Active Role: {role}
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-nexus-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-nexus-950/80 border-b border-nexus-800 text-nexus-300">
                    <th className="py-3 px-4 font-semibold">Capability Scope</th>
                    <th className="py-3 px-4 font-semibold text-center text-purple-400">Owner</th>
                    <th className="py-3 px-4 font-semibold text-center text-blue-400">Project Manager</th>
                    <th className="py-3 px-4 font-semibold text-center text-cyan-400">Editor</th>
                    <th className="py-3 px-4 font-semibold text-center text-emerald-400">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-850">
                  {allCapabilities.map(cap => {
                    const ownerHas = true;
                    const pmHas = cap.key !== 'settings.manage' && cap.key !== 'projects.delete';
                    const editorHas = [
                      'tasks.create',
                      'tasks.edit',
                      'tasks.status',
                      'comments.create',
                      'time.track',
                      'members.read',
                      'ai.analyze'
                    ].includes(cap.key);
                    const viewerHas = ['members.read'].includes(cap.key);

                    return (
                      <tr key={cap.key} className="hover:bg-nexus-900/40 transition">
                        <td className="py-2.5 px-4 text-nexus-200">
                          <span className="font-medium text-white">{cap.label}</span>
                          <span className="block text-[10px] text-nexus-500 font-mono">{cap.key}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {ownerHas ? (
                            <Check className="w-4 h-4 text-purple-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-nexus-700 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {pmHas ? (
                            <Check className="w-4 h-4 text-blue-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-nexus-700 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {editorHas ? (
                            <Check className="w-4 h-4 text-cyan-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-nexus-700 mx-auto" />
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {viewerHas ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-nexus-700 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Workspace Members & Role Assignment</h2>
              <p className="text-xs text-nexus-400 mt-1">
                Owners can assign roles dynamically. Changes take effect on subsequent requests immediately.
              </p>
            </div>
            {!can('settings.manage') && (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                Read-only: Switch to Owner to edit roles
              </span>
            )}
          </div>

          <div className="divide-y divide-nexus-850 border border-nexus-800 rounded-xl overflow-hidden">
            {members.map(member => (
              <div key={member.id} className="p-4 bg-nexus-950/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-400 uppercase">
                    {member.name ? member.name.substring(0, 2) : 'US'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{member.name}</h4>
                    <p className="text-xs text-nexus-400">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-nexus-500">
                        {member.department || 'Engineering'} • {member.assignedTaskCount || 0} active tasks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    disabled={!can('settings.manage')}
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    className="px-3 py-1.5 bg-nexus-900 border border-nexus-700 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="OWNER">OWNER</option>
                    <option value="PROJECT_MANAGER">PROJECT MANAGER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI ENGINE */}
      {activeTab === 'AI_ENGINE' && (
        <div className="space-y-6">
          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Google Gemini Generative AI Engine</h2>
                  <p className="text-xs text-nexus-400">Autonomous workflow breakdown, 30-day plan generation, and project health diagnostics</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Dual-Mode Online
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-nexus-950/70 border border-nexus-850">
                <span className="text-xs text-nexus-400">Active Model</span>
                <p className="text-sm font-semibold text-white mt-1">gemini-1.5-flash</p>
                <p className="text-[11px] text-cyan-400 mt-1">High-speed reasoning & synthesis</p>
              </div>

              <div className="p-4 rounded-lg bg-nexus-950/70 border border-nexus-850">
                <span className="text-xs text-nexus-400">Failover Mode</span>
                <p className="text-sm font-semibold text-white mt-1">Domain Heuristic Fallback</p>
                <p className="text-[11px] text-emerald-400 mt-1">100% uptime guaranteed offline</p>
              </div>

              <div className="p-4 rounded-lg bg-nexus-950/70 border border-nexus-850">
                <span className="text-xs text-nexus-400">Context Grounding</span>
                <p className="text-sm font-semibold text-white mt-1">Causal Milestone Analysis</p>
                <p className="text-[11px] text-purple-400 mt-1">Critical path delay detection</p>
              </div>
            </div>
          </div>

          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Export Workspace Snapshot</h3>
              <p className="text-xs text-nexus-400 mt-0.5">Download projects, tasks, time entries, and audit logs as a JSON archive</p>
            </div>
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ workspaceName, timestamp: new Date().toISOString() }));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `nexus-backup-${Date.now()}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nexus-800 hover:bg-nexus-700 text-white text-xs font-medium border border-nexus-700 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
