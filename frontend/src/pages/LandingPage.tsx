import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Zap,
  Kanban,
  Clock,
  BarChart3,
  Bot,
  Users,
  CheckCircle2,
  ChevronRight,
  Play,
  Activity,
  Flame,
  Globe
} from 'lucide-react';
import { Hero3DCanvas } from '../components/3d/Hero3DCanvas';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, demoLogin } = useAuth();

  const handleExplore = async () => {
    if (user) {
      navigate('/dashboard');
    } else {
      await demoLogin('OWNER');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      {/* Background Glows & Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-600/15 via-purple-600/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-40 right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-30 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-100 to-cyan-300 bg-clip-text text-transparent">
            NEXUS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#workflows" className="hover:text-white transition">Workflows</a>
          <a href="#ai" className="hover:text-white transition">AI Copilot</a>
          <a href="#roles" className="hover:text-white transition">RBAC Security</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            Start Building
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-20 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headlines & CTA */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Project Intelligence 2.0</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-[10px]">NEW</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
            AI-powered <span className="shimmer-text">control center</span> for your entire project.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0 font-normal">
            Plan projects, control workflows, manage deadlines, coordinate teams, track time and let AI organize the work. Built for engineering and product teams with mission-critical deadlines.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 transition flex items-center justify-center gap-2 group transform hover:-translate-y-0.5"
            >
              Start Building Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={handleExplore}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl glass-card hover:bg-white/10 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2 border border-white/10"
            >
              <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
              Explore Platform (Instant Demo)
            </button>
          </div>

          {/* Social Proof Stats */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0">
            <div>
              <div className="text-2xl font-extrabold text-white">99.8%</div>
              <div className="text-xs text-slate-400 mt-0.5">Deadline Precision</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-cyan-400">4.2x</div>
              <div className="text-xs text-slate-400 mt-0.5">Velocity Acceleration</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-400">Zero</div>
              <div className="text-xs text-slate-400 mt-0.5">Unmitigated Risk</div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Interactive Canvas & Floating Glass Cards */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] lg:min-h-[500px]">
          <Hero3DCanvas />

          {/* Floating UI Card 1: Project Health */}
          <div className="absolute top-4 left-0 sm:-left-4 glass-dropdown p-3.5 rounded-2xl border border-emerald-500/30 shadow-2xl backdrop-blur-xl animate-float">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Project Health 96%</div>
                <div className="text-[11px] text-emerald-400">HEALTHY • Zero regressions</div>
              </div>
            </div>
          </div>

          {/* Floating UI Card 2: Countdown Timer */}
          <div className="absolute bottom-6 right-0 sm:-right-4 glass-dropdown p-3.5 rounded-2xl border border-rose-500/30 shadow-2xl backdrop-blur-xl animate-float" style={{ animationDelay: '2s' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 animate-pulse">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Sprint Release Cutoff</div>
                <div className="text-[11px] text-rose-300 font-mono font-semibold">Due in 2d 14h 32m</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Platform Preview Section */}
      <section id="workflows" className="relative z-20 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Engineered for Velocity</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            The full-spectrum project operating system.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Every view is interconnected with live PostgreSQL database persistence. When a task is dragged, timers tick, or AI breaks down a feature, your entire team stays synchronized in real time.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
              <Kanban className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Intelligent Kanban Board</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Drag-and-drop workflow states across Backlog, To Do, In Progress, In Review, Blocked, and Done with instantaneous database updates.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Deadlines & Real Stopwatch</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Live countdown timers ("Due in 2d 14h 32m"), automated overdue warnings, and integrated task stopwatches with start, pause, and stop.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Google Gemini Copilot</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Generate 30-day accelerated blueprints, break down complex tasks into subtasks, and calculate project health with explainable causal reasoning.
            </p>
          </div>
        </div>
      </section>

      {/* RBAC Security Section */}
      <section id="roles" className="relative z-20 max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Enterprise Access Control</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Granular Role-Based Permissions (RBAC)
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enforced at both backend Express REST middleware and client-side hooks. Never rely on frontend authorization alone.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { role: 'OWNER', desc: 'Full unrestricted governance, workspace deletion, billing and ownership transfer.' },
                { role: 'PROJECT MANAGER', desc: 'Creates projects, manages team workload, schedules, deadlines, and velocity.' },
                { role: 'EDITOR', desc: 'Creates/moves tasks, updates progress, logs time, and contributes comments.' },
                { role: 'VIEWER', desc: 'Auditing and compliance role with read-only visibility into timelines and reports.' }
              ].map(r => (
                <div key={r.role} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white uppercase">{r.role}: </span>
                    <span className="text-xs text-slate-400">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="glass-dropdown p-6 rounded-2xl border border-indigo-500/20 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-white uppercase">Permission Matrix</span>
                <span className="text-[10px] text-cyan-400 font-mono">15 Granular Scopes</span>
              </div>
              <div className="space-y-2 text-xs">
                {['projects.create', 'projects.delete', 'tasks.update', 'tasks.assign', 'members.invite', 'analytics.read', 'settings.manage'].map(perm => (
                  <div key={perm} className="flex items-center justify-between py-1 border-b border-white/5 font-mono text-[11px]">
                    <span className="text-slate-300">{perm}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Enforced
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-[#06080E] py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px]">
              <div className="w-full h-full bg-[#0B0F19] rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="text-base font-extrabold tracking-wider text-white">NEXUS</span>
          </div>

          <p className="text-xs text-slate-500 text-center">
            &copy; 2026 NEXUS Technologies Global. Autonomous Project Management & Workflow Control.
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <button onClick={() => navigate('/login')} className="hover:text-white transition">Sign In</button>
            <button onClick={() => navigate('/register')} className="hover:text-white transition">Register</button>
            <button onClick={handleExplore} className="text-cyan-400 hover:text-cyan-300 font-semibold transition">Demo Access</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
