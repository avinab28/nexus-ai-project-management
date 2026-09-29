import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  AlertTriangle,
  FileCheck,
  Plus,
  RefreshCw,
  FolderKanban
} from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';
import { AIOrb3D } from '../components/3d/AIOrb3D';

export const AIAssistantPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: any }>>([
    {
      role: 'assistant',
      content: {
        type: 'TEXT_RESPONSE',
        title: 'NEXUS Autonomous Copilot Initialized',
        summary:
          'I am your AI Project Management Copilot powered by Google Gemini. Ask me to generate full 30-day project blueprints, detect blocking dependencies, evaluate team workload, or break down features into engineering subtasks.'
      }
    }
  ]);

  // Projects list for plan import target
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTargetProject, setSelectedTargetProject] = useState<string>('');

  // Generated Plan state for review modal/drawer
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSavedSuccess, setPlanSavedSuccess] = useState(false);

  // Smart breakdown input
  const [breakdownInput, setBreakdownInput] = useState('Build enterprise authentication & SSO system');
  const [breakdownItems, setBreakdownItems] = useState<any[]>([]);
  const [breakingDown, setBreakingDown] = useState(false);

  useEffect(() => {
    api.getProjects().then(res => {
      if (res.success && res.projects?.length > 0) {
        setProjects(res.projects);
        setSelectedTargetProject(res.projects[0].id);
      }
    });
  }, []);

  const handleSendQuery = async (promptText?: string) => {
    const textToSend = promptText || query;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      // Check if user is asking to create a project plan
      if (textToSend.toLowerCase().includes('plan') || textToSend.toLowerCase().includes('blueprint')) {
        const planRes = await api.generateAIPlan(textToSend);
        if (planRes.success && planRes.plan) {
          setActivePlan(planRes.plan);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: {
                type: 'PLAN_GENERATED',
                title: planRes.plan.title,
                summary: planRes.plan.overview,
                plan: planRes.plan
              }
            }
          ]);
        }
      } else {
        const res = await api.queryAssistant(textToSend);
        if (res.success && res.result) {
          setMessages(prev => [...prev, { role: 'assistant', content: res.result }]);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: {
            type: 'TEXT_RESPONSE',
            title: 'Execution Error',
            summary: 'Failed to process request. Please retry.'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdown = async () => {
    if (!breakdownInput.trim() || breakingDown) return;
    try {
      setBreakingDown(true);
      const res = await api.breakDownTask(breakdownInput.trim());
      if (res.success && res.items) {
        setBreakdownItems(res.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBreakingDown(false);
    }
  };

  const handleApplyPlanToProject = async () => {
    if (!activePlan || !selectedTargetProject) return;
    try {
      setSavingPlan(true);
      const res = await api.applyAIPlan(selectedTargetProject, activePlan.phases);
      if (res.success) {
        setPlanSavedSuccess(true);
        setTimeout(() => setPlanSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with 3D Orb visualizer */}
      <div className="relative overflow-hidden rounded-3xl glass-dropdown border border-indigo-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Systems Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            NEXUS AI Project Copilot
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Direct natural language orchestration for project planning, invariant checking, risk discovery, and instant feature breakdown.
          </p>
        </div>

        {/* 3D Orb Canvas */}
        <div className="w-48 h-48 shrink-0 relative flex items-center justify-center">
          <AIOrb3D isThinking={loading} />
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          'Create a 30-day plan for building an AI SaaS application',
          'Show me overdue tasks',
          'Which tasks are blocking the project?',
          'Who has the highest workload?',
          'Summarize project progress',
          'Which deadlines are at risk?'
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(prompt)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-slate-300 hover:text-white border border-white/5 text-xs font-medium shrink-0 transition"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Chat & Generation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chat Stream */}
        <div className="lg:col-span-7 glass-dropdown rounded-2xl border border-white/10 flex flex-col h-[650px] shadow-2xl overflow-hidden">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-cyan-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl max-w-xl space-y-2 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-900/80 border border-white/10 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {typeof m.content === 'string' ? (
                    <div>{m.content}</div>
                  ) : (
                    <div className="space-y-3">
                      {m.content.title && (
                        <div className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {m.content.title}
                        </div>
                      )}
                      <p className="text-slate-300">{m.content.summary}</p>

                      {/* If it contains a list of items (e.g. overdue tasks or blocked tasks) */}
                      {m.content.items && (
                        <div className="space-y-1.5 pt-2 border-t border-white/10">
                          {m.content.items.map((item: any, iIdx: number) => (
                            <div
                              key={iIdx}
                              className="p-2 rounded-lg bg-white/5 flex items-center justify-between text-[11px]"
                            >
                              <span className="font-semibold text-white">{item.title || item.name}</span>
                              <span className="text-slate-400">{item.assignee || item.healthStatus || 'Active'}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* If plan was generated */}
                      {m.content.plan && (
                        <button
                          onClick={() => setActivePlan(m.content.plan)}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Review & Import Blueprint ({m.content.plan.phases?.length || 0} Phases)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-cyan-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-slate-400 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Synthesizing roadmap & evaluating invariants...</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={e => { e.preventDefault(); handleSendQuery(); }} className="p-3 border-t border-white/10 bg-slate-950/60 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask AI Copilot to generate plans, audit workloads, or inspect risks..."
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right: Plan Inspector or Smart Breakdown Widget */}
        <div className="lg:col-span-5 space-y-6">
          {/* SMART BREAKDOWN WIDGET */}
          <div className="glass-dropdown rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Smart Task Breakdown</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Input any feature or user story to generate granular, sequenced engineering subtasks.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={breakdownInput}
                onChange={e => setBreakdownInput(e.target.value)}
                placeholder="e.g. Build authentication system"
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleBreakdown}
                disabled={breakingDown || !breakdownInput.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 transition"
              >
                {breakingDown ? 'Breaking...' : 'Breakdown'}
              </button>
            </div>

            {/* Breakdown Items List */}
            {breakdownItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5 max-h-56 overflow-y-auto">
                {breakdownItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.title}</span>
                      <span className="font-mono text-[10px] text-cyan-300">{item.estimatedHours}h</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIVE GENERATED PLAN INSPECTOR */}
          {activePlan && (
            <div className="glass-dropdown rounded-2xl border border-indigo-500/30 p-5 space-y-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase text-cyan-400">Plan Blueprint</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activePlan.totalEstimatedDays || 30} Days Total
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{activePlan.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activePlan.overview}</p>
              </div>

              {/* Target Project Dropdown & Import */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Import Into Project:
                </label>
                <select
                  value={selectedTargetProject}
                  onChange={e => setSelectedTargetProject(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleApplyPlanToProject}
                  disabled={savingPlan}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  {savingPlan ? 'Importing Tasks...' : 'Accept & Save to Project'}
                </button>

                {planSavedSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-semibold">
                    ✓ Plan tasks and milestones successfully imported into project!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
