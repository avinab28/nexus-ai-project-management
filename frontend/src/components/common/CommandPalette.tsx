import React, { useState, useEffect, useRef } from 'react';
import { Search, FolderKanban, CheckSquare, User, MessageSquare, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (taskId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectTask }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    projects: any[];
    tasks: any[];
    users: any[];
    comments: any[];
  }>({ projects: [], tasks: [], users: [], comments: [] });

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ projects: [], tasks: [], users: [], comments: [] });
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via custom event if needed
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], users: [], comments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        if (res.success && res.results) {
          setResults(res.results);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.projects.length + results.tasks.length + results.users.length + results.comments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md transition-all">
      <div
        className="w-full max-w-2xl glass-dropdown rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search projects, tasks, members..."
            className="w-full bg-transparent text-sm md:text-base text-white placeholder-slate-400 focus:outline-none"
          />
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-white/5 rounded border border-white/10">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!query && (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-300">Quick Navigation</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  { label: 'All Projects', path: '/projects' },
                  { label: 'Task Board', path: '/tasks' },
                  { label: 'Time Tracking', path: '/time' },
                  { label: 'Team Workload', path: '/team' },
                  { label: 'AI Assistant', path: '/ai' },
                  { label: 'Analytics', path: '/analytics' }
                ].map(nav => (
                  <button
                    key={nav.path}
                    onClick={() => {
                      navigate(nav.path);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-white/5 transition"
                  >
                    {nav.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && totalResults === 0 && !loading && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No results found for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for keywords like "Vector", "OCR", "Sprint", or "AI"</p>
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Projects</div>
              <div className="space-y-1">
                {results.projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      navigate(`/projects/${p.id}`);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer group transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500">{p.status} • {p.priority} Priority</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tasks</div>
              <div className="space-y-1">
                {results.tasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (onSelectTask) {
                        onSelectTask(t.id);
                      } else {
                        navigate(`/tasks`);
                      }
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer group transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200 group-hover:text-blue-300 transition">
                          {t.title}
                        </div>
                        <div className="text-xs text-slate-500">{t.status} • {t.priority}</div>
                      </div>
                    </div>
                    <CornerDownLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          {results.users.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Team Members</div>
              <div className="space-y-1">
                {results.users.map(u => (
                  <div
                    key={u.id}
                    onClick={() => {
                      navigate('/team');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer group transition"
                  >
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-200 group-hover:text-purple-300 transition">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-500">{u.title || u.role} • {u.email}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">↵</kbd> select</span>
          </div>
          <span>NEXUS Global Command Palette</span>
        </div>
      </div>
    </div>
  );
};
