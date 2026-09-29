import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleType } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: RoleType) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center cursor-pointer" onClick={() => navigate('/')}>
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shadow-xl shadow-indigo-500/30 mb-3">
          <div className="w-full h-full bg-[#0B0F19] rounded-[15px] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-100 to-cyan-300 bg-clip-text text-transparent">
          NEXUS
        </h1>
        <p className="text-xs text-slate-400 mt-1">Sign in to your AI Project Management Workspace</p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md glass-dropdown rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-8 relative z-10 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@nexus.ai"
                className="w-full bg-slate-900/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <span className="text-[11px] text-slate-500 hover:text-indigo-400 cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/70 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                Sign In to Platform
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Persona Selector */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Or Sign In Instantly via Demo Persona
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'OWNER' as RoleType, name: 'Alex Rivera', label: '👑 OWNER', desc: 'Full admin access' },
              { role: 'PROJECT_MANAGER' as RoleType, name: 'Sarah Chen', label: '🎯 PM / LEAD', desc: 'Project governance' },
              { role: 'EDITOR' as RoleType, name: 'Rahul Sharma', label: '💻 DEV / EDITOR', desc: 'Tasks & time tracking' },
              { role: 'VIEWER' as RoleType, name: 'John Doe', label: '👁️ AUDITOR', desc: 'Read-only viewer' }
            ].map(persona => (
              <button
                key={persona.role}
                type="button"
                onClick={() => handleDemoSignIn(persona.role)}
                disabled={loading}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 text-left transition group"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-300">
                  {persona.label}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{persona.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-400">Don't have an account? </span>
          <Link to="/register" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
            Create Workspace
          </Link>
        </div>
      </div>
    </div>
  );
};
