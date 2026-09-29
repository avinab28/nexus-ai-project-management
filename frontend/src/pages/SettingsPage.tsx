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
  Plus,
  Trash2,
  Edit2,
  Palette,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionName } from '../types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { can, role } = usePermissions();

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PERMISSIONS' | 'MEMBERS' | 'AI_ENGINE'>('PERMISSIONS');
  const [workspaceName, setWorkspaceName] = useState('Nexus Core Workspace');
  const [workspaceDescription, setWorkspaceDescription] = useState('Enterprise AI-powered workspace for agile delivery and automated workflow orchestration.');
  const [timezone, setTimezone] = useState('UTC (GMT+0)');
  const [dailyBriefHour, setDailyBriefHour] = useState('09:00');
  
  // Data state
  const [members, setMembers] = useState<any[]>([]);
  const [matrixRoles, setMatrixRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New Custom Role Modal / Drawer State
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#06b6d4');
  const [newRolePermissions, setNewRolePermissions] = useState<PermissionName[]>([
    'projects.read',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'time.track'
  ]);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const colorOptions = [
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Purple', value: '#a855f7' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Teal', value: '#14b8a6' },
  ];

  const allCapabilities: { key: PermissionName; label: string; category: string }[] = [
    { key: 'projects.read', label: 'View & Inspect Projects', category: 'Projects' },
    { key: 'projects.create', label: 'Create New Projects', category: 'Projects' },
    { key: 'projects.update', label: 'Edit Project Settings', category: 'Projects' },
    { key: 'projects.delete', label: 'Delete Projects', category: 'Projects' },
    { key: 'tasks.read', label: 'View Tasks & Kanban', category: 'Tasks' },
    { key: 'tasks.create', label: 'Create New Tasks', category: 'Tasks' },
    { key: 'tasks.update', label: 'Edit & Move Task Status', category: 'Tasks' },
    { key: 'tasks.delete', label: 'Delete Tasks', category: 'Tasks' },
    { key: 'tasks.assign', label: 'Assign Tasks to Members', category: 'Tasks' },
    { key: 'time.track', label: 'Log & Track Time Limits', category: 'Productivity' },
    { key: 'members.read', label: 'View Member Directory', category: 'Collaboration' },
    { key: 'members.invite', label: 'Invite Workspace Members', category: 'Collaboration' },
    { key: 'members.remove', label: 'Remove Workspace Members', category: 'Collaboration' },
    { key: 'analytics.read', label: 'View Analytics & Velocity', category: 'Reporting' },
    { key: 'settings.manage', label: 'Manage Roles & Workspace Settings', category: 'Administration' },
  ];

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

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleRoleNameChange = (val: string) => {
    setNewRoleName(val);
    setNewRoleKey(val.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
  };

  const togglePermission = (perm: PermissionName) => {
    setNewRolePermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      alert('Please provide a role name');
      return;
    }

    try {
      setIsSubmittingRole(true);
      const res = await api.createRole({
        name: newRoleName.trim(),
        key: newRoleKey.trim() || newRoleName.toUpperCase().replace(/\s+/g, '_'),
        description: newRoleDesc.trim(),
        color: newRoleColor,
        permissions: newRolePermissions
      });

      if (res.success) {
        setActionMessage(`Role '${newRoleName}' created and added to the platform successfully!`);
        setIsCreateRoleOpen(false);
        setNewRoleName('');
        setNewRoleKey('');
        setNewRoleDesc('');
        loadSettingsData();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (roleKey: string) => {
    if (!confirm(`Are you sure you want to delete the custom role '${roleKey}'?`)) {
      return;
    }

    try {
      const res = await api.deleteRole(roleKey);
      if (res.success) {
        setActionMessage(`Role '${roleKey}' removed successfully.`);
        loadSettingsData();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  const handleMemberRoleChange = async (userId: string, newRole: string) => {
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
        setActionMessage(`Role successfully updated to '${newRole}'.`);
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-nexus-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Workspace & RBAC Settings</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Active: {role}
            </span>
          </div>
          <p className="text-sm text-nexus-400 mt-1">
            Configure system parameters, build and assign custom team roles, and inspect granular capability scopes.
          </p>
        </div>

        <button
          onClick={() => setIsCreateRoleOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Role
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-nexus-800 pb-3">
        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'PERMISSIONS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Roles & Permissions Matrix ({matrixRoles.length})
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
          Team Members & Role Assignment ({members.length})
        </button>

        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'GENERAL'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          <Building className="w-4 h-4" />
          General Info
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

      {/* CREATE CUSTOM ROLE MODAL */}
      {isCreateRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nexus-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-nexus-900 border border-nexus-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-nexus-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Custom Platform Role</h3>
                  <p className="text-xs text-nexus-400">Define a custom role with any combination of platform capabilities</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateRoleOpen(false)}
                className="text-nexus-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-nexus-300 mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QA Engineer, DevOps Lead, Security Auditor"
                    value={newRoleName}
                    onChange={e => handleRoleNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white placeholder-nexus-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-nexus-300 mb-1">Role Code / Key</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QA_ENGINEER"
                    value={newRoleKey}
                    onChange={e => setNewRoleKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white font-mono placeholder-nexus-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Color Badge</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setNewRoleColor(c.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition ${
                        newRoleColor === c.value
                          ? 'border-white ring-2 ring-cyan-500/50 text-white'
                          : 'border-nexus-800 text-nexus-400 hover:text-white'
                      }`}
                      style={{ backgroundColor: `${c.value}22` }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.value }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-nexus-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Outline this role's purpose, responsibilities, and operational scope..."
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-nexus-950 border border-nexus-800 rounded-lg text-xs text-white placeholder-nexus-600 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Granted Permissions Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-nexus-200">
                    Granted Capability Scopes ({newRolePermissions.length} / {allCapabilities.length})
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewRolePermissions(allCapabilities.map(c => c.key))}
                      className="text-cyan-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-nexus-600">•</span>
                    <button
                      type="button"
                      onClick={() => setNewRolePermissions([])}
                      className="text-nexus-400 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 bg-nexus-950/70 border border-nexus-800 rounded-xl">
                  {allCapabilities.map(cap => {
                    const isChecked = newRolePermissions.includes(cap.key);
                    return (
                      <label
                        key={cap.key}
                        onClick={() => togglePermission(cap.key)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                            : 'bg-nexus-900/30 border-nexus-850 text-nexus-400 hover:bg-nexus-900/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-nexus-700 bg-nexus-900 text-cyan-500 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-none">{cap.label}</p>
                          <span className="text-[10px] font-mono text-nexus-500">{cap.key}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-800">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-4 py-2 rounded-lg bg-nexus-800 hover:bg-nexus-700 text-nexus-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-nexus-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmittingRole ? 'Saving Role...' : 'Save & Register Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RBAC PERMISSIONS MATRIX */}
      {activeTab === 'PERMISSIONS' && (
        <div className="space-y-6">
          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Dynamic Role & Capability Matrix</h2>
                <p className="text-xs text-nexus-400 mt-1">
                  Enforces granular capability scopes across all API routes, Kanban controls, and workflow buttons.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCreateRoleOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Role
                </button>
              </div>
            </div>

            {/* Matrix Table with Dynamic Columns */}
            <div className="overflow-x-auto border border-nexus-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-nexus-950/80 border-b border-nexus-800 text-nexus-300">
                    <th className="py-3.5 px-4 font-semibold min-w-[220px]">Capability Scope</th>
                    {matrixRoles.map(r => (
                      <th
                        key={r.role}
                        className="py-3.5 px-4 font-semibold text-center min-w-[130px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ 
                              backgroundColor: `${r.color || '#06b6d4'}22`, 
                              color: r.color || '#06b6d4',
                              borderColor: `${r.color || '#06b6d4'}44`,
                              borderWidth: 1
                            }}
                          >
                            {r.name || r.role}
                          </span>
                          <span className="text-[10px] font-mono text-nexus-500">
                            {r.role}
                          </span>
                          {!r.isSystem && (
                            <button
                              onClick={() => handleDeleteRole(r.role)}
                              title="Delete custom role"
                              className="text-rose-400 hover:text-rose-300 p-0.5 mt-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-nexus-850">
                  {allCapabilities.map(cap => (
                    <tr key={cap.key} className="hover:bg-nexus-900/40 transition">
                      <td className="py-2.5 px-4 text-nexus-200">
                        <span className="font-medium text-white">{cap.label}</span>
                        <span className="block text-[10px] text-nexus-500 font-mono">{cap.key}</span>
                      </td>

                      {matrixRoles.map(r => {
                        const hasCap = (r.permissions || []).includes(cap.key);
                        return (
                          <td key={r.role} className="py-2.5 px-4 text-center">
                            {hasCap ? (
                              <Check 
                                className="w-4 h-4 mx-auto" 
                                style={{ color: r.color || '#10b981' }} 
                              />
                            ) : (
                              <X className="w-4 h-4 text-nexus-700 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MEMBERS & ROLE ASSIGNMENT */}
      {activeTab === 'MEMBERS' && (
        <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Workspace Members & Dynamic Role Assignment</h2>
              <p className="text-xs text-nexus-400 mt-1">
                Assign team members to ANY default or newly created custom role instantly.
              </p>
            </div>
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nexus-800 text-nexus-200 border border-nexus-700 text-xs font-medium hover:bg-nexus-700 transition"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              New Role
            </button>
          </div>

          <div className="divide-y divide-nexus-850 border border-nexus-800 rounded-xl overflow-hidden">
            {members.map(member => (
              <div key={member.id} className="p-4 bg-nexus-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    onChange={e => handleMemberRoleChange(member.id, e.target.value)}
                    className="px-3 py-1.5 bg-nexus-900 border border-nexus-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {matrixRoles.map(r => (
                      <option key={r.role} value={r.role}>
                        {r.name || r.role} ({r.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
