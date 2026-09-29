import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  RotateCcw,
  Send,
  Plus,
  GitBranch,
  Tag,
  User,
  MessageSquare,
  FileText,
  Activity as ActivityIcon
} from 'lucide-react';
import { api } from '../../services/api';
import { Task, TaskStatus, PriorityLevel } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracker } from '../../context/TimeTrackerContext';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose, onTaskUpdated }) => {
  const { user } = useAuth();
  const { activeTimer, startTimer, stopTimer, formatTime } = useTimeTracker();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'dependencies' | 'time'>('subtasks');

  // Form states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isCurrentTaskRunning = activeTimer?.taskId === taskId;

  const loadTask = async () => {
    try {
      setLoading(true);
      const res = await api.getTask(taskId);
      if (res.success && res.task) {
        setTask(res.task);
      }
    } catch (err) {
      console.error('Failed to load task:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      const res = await api.updateTaskStatus(task.id, newStatus);
      if (res.success) {
        setTask(prev => (prev ? { ...prev, status: newStatus } : null));
        onTaskUpdated?.();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    try {
      const res = await api.addSubtask(task.id, newSubtaskTitle.trim());
      if (res.success && res.subtask) {
        setTask(prev =>
          prev
            ? {
                ...prev,
                subtasks: [...(prev.subtasks || []), res.subtask]
              }
            : null
        );
        setNewSubtaskTitle('');
      }
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task) return;
    try {
      const res = await api.toggleSubtask(task.id, subtaskId);
      if (res.success && res.subtask) {
        setTask(prev =>
          prev
            ? {
                ...prev,
                subtasks: (prev.subtasks || []).map(st =>
                  st.id === subtaskId ? { ...st, isCompleted: res.subtask.isCompleted } : st
                )
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;
    try {
      setSubmittingComment(true);
      const res = await api.addComment(task.id, newComment.trim());
      if (res.success && res.comment) {
        setTask(prev =>
          prev
            ? {
                ...prev,
                comments: [...(prev.comments || []), res.comment]
              }
            : null
        );
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-3xl glass-dropdown rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {task?.project && (
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: task.project.color }}
                >
                  {task.project.name}
                </span>
              )}
              {task && <StatusBadge status={task.priority} type="priority" />}
              {task && <StatusBadge status={task.status} type="task" />}
              {task && <CountdownTimer deadline={task.deadline} isCompleted={task.status === 'DONE'} />}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              {loading ? 'Loading task details...' : task?.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : task ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Quick Status Switcher & Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5">
              {/* Status Select */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Workflow Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'] as TaskStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        task.status === st
                          ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Time Tracker Action */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Time Tracker
                </label>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-base font-bold text-cyan-300 bg-slate-950 px-3 py-1 rounded-lg border border-white/10">
                    {isCurrentTaskRunning
                      ? formatTime(activeTimer?.currentElapsedSeconds || 0)
                      : `${task.actualHours || 0}h / ${task.estimatedHours || 0}h`}
                  </div>

                  {isCurrentTaskRunning ? (
                    <button
                      onClick={() => stopTimer(task.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-500/20"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Stop Timer
                    </button>
                  ) : (
                    <button
                      onClick={() => startTimer(task.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Start Timer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</div>
                <div className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                  {task.description}
                </div>
              </div>
            )}

            {/* Assignee & Dates Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Assignee</span>
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  {task.assignee?.avatarUrl ? (
                    <img src={task.assignee.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="truncate">{task.assignee?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Deadline</span>
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Estimated Hours</span>
                <div className="font-medium text-slate-200">{task.estimatedHours} hrs</div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-500 block mb-1">Actual Tracked</span>
                <div className="font-medium text-cyan-300">{task.actualHours.toFixed(1)} hrs</div>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {[
                { id: 'subtasks', label: `Subtasks (${task.subtasks?.length || 0})` },
                { id: 'comments', label: `Comments (${task.comments?.length || 0})` },
                { id: 'dependencies', label: 'Dependencies' },
                { id: 'time', label: 'Time Entries' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: Subtasks Checklist */}
            {activeTab === 'subtasks' && (
              <div className="space-y-3">
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a new subtask checklist item..."
                    className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </form>

                <div className="space-y-1.5">
                  {task.subtasks?.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No subtasks yet. Add steps above to break down this work.
                    </div>
                  ) : (
                    task.subtasks?.map(st => (
                      <div
                        key={st.id}
                        onClick={() => handleToggleSubtask(st.id)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 cursor-pointer transition group"
                      >
                        <input
                          type="checkbox"
                          checked={st.isCompleted}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <span
                          className={`text-xs flex-1 transition ${
                            st.isCompleted
                              ? 'line-through text-slate-500'
                              : 'text-slate-300 group-hover:text-white'
                          }`}
                        >
                          {st.title}
                        </span>
                        {st.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Comments Thread with @mentions */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment... Tip: mention team members like @Rahul or @Sarah"
                    rows={2}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post Comment
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {task.comments?.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    task.comments?.map(c => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {c.user.avatarUrl ? (
                              <img src={c.user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                                {c.user.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-semibold text-slate-200">{c.user.name}</span>
                            <span className="text-[10px] text-indigo-400 uppercase font-medium">{c.user.role}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString()} at{' '}
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 pl-8 leading-relaxed whitespace-pre-wrap">{c.content}</p>

                        {/* Nested Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="pl-8 pt-2 space-y-2 border-t border-white/5 mt-2">
                            {c.replies.map(r => (
                              <div key={r.id} className="p-2.5 rounded-lg bg-black/20 text-xs">
                                <div className="font-semibold text-slate-300">{r.user.name}</div>
                                <p className="text-slate-400 mt-0.5">{r.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Dependencies */}
            {activeTab === 'dependencies' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Task dependencies prevent schedule conflicts and identify blocking bottlenecks across the workflow.
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Depends On (Predecessors)</div>
                  {task.precededBy && task.precededBy.length > 0 ? (
                    task.precededBy.map(dep => (
                      <div key={dep.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{dep.predecessor?.title}</span>
                        <StatusBadge status={dep.predecessor?.status} type="task" />
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 p-2">This task has no predecessor requirements.</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocks (Successors)</div>
                  {task.succeeds && task.succeeds.length > 0 ? (
                    task.succeeds.map(dep => (
                      <div key={dep.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{dep.successor?.title}</span>
                        <StatusBadge status={dep.successor?.status} type="task" />
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 p-2">No tasks are currently waiting on this task.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Time Entries */}
            {activeTab === 'time' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recorded Work Sessions</div>
                {task.timeEntries && task.timeEntries.length > 0 ? (
                  task.timeEntries.map(entry => (
                    <div key={entry.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-slate-200 font-medium">{entry.description || 'Working session'}</div>
                        <div className="text-[10px] text-slate-500">{new Date(entry.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="font-mono font-bold text-cyan-300">
                        {formatTime(entry.durationSeconds)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No individual sessions recorded. Use the Start Timer button above to track your work.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
