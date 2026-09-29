import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Key, 
  Save, 
  Award,
  Lock,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { role, permissions } = usePermissions();

  const [name, setName] = useState(user?.name || 'Alexander Wright');
  const [title, setTitle] = useState(user?.title || 'Principal Solutions Architect');
  const [department, setDepartment] = useState(user?.department || 'Engineering & Product Architecture');
  const [bio, setBio] = useState(user?.bio || 'Building scalable cloud workflows, distributed data pipelines, and mission-critical AI-orchestrated execution systems.');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-nexus-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Profile & Account</h1>
          <p className="text-sm text-nexus-400 mt-1">
            Manage your personal profile details, inspect assigned role capabilities, and view personal metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-1 mx-auto shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full rounded-full bg-nexus-950 flex items-center justify-center font-bold text-2xl text-cyan-400 uppercase">
                  {name ? name.substring(0, 2) : 'US'}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-nexus-950" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">{name}</h2>
              <p className="text-xs text-nexus-400 mt-0.5">{user?.email || 'admin@nexus.ai'}</p>
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {role}
                </span>
              </div>
            </div>

            <div className="border-t border-nexus-850 pt-4 text-left space-y-2.5 text-xs text-nexus-300">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-nexus-500" />
                <span>{title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-nexus-500" />
                <span>{department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-nexus-500" />
                <span>Active Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-nexus-400">Activity Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-nexus-950/60 rounded-lg border border-nexus-850">
                <span className="text-2xl font-bold text-cyan-400">14</span>
                <p className="text-[11px] text-nexus-400 mt-0.5">Tasks Completed</p>
              </div>
              <div className="p-3 bg-nexus-950/60 rounded-lg border border-nexus-850">
                <span className="text-2xl font-bold text-emerald-400">38.5h</span>
                <p className="text-[11px] text-nexus-400 mt-0.5">Tracked Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Role Capabilities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          <form onSubmit={handleSave} className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Profile Details</h2>
              {saved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-nexus-300 mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-nexus-950 border border-nexus-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-nexus-950 font-medium text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                <Save className="w-4 h-4" />
                Update Profile
              </button>
            </div>
          </form>

          {/* Role Capabilities Granted */}
          <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Active Granted Permissions</h3>
                <p className="text-xs text-nexus-400 mt-0.5">Scopes authorized under your active {role} session</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-nexus-950 px-2.5 py-1 rounded border border-nexus-800">
                {permissions.length} Scopes Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {permissions.map((perm: string) => (
                <div key={perm} className="flex items-center gap-2 p-2 rounded-lg bg-nexus-950/60 border border-nexus-850">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-mono text-nexus-300">{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
