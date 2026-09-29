import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  Clock,
  Flame,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Task, Subtask } from '../types';
import { useTimeTracker } from '../context/TimeTrackerContext';
import { CountdownTimer } from '../components/common/CountdownTimer';

export const FocusModePage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTimer, isRunning, startTimer, stopTimer, resetTimer, formatTime } = useTimeTracker();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      const res = await api.getTasks({ status: 'IN_PROGRESS' });
      if (res.success && res.tasks?.length > 0) {
        setTasks(res.tasks);
        if (activeTimer) {
          const match = res.tasks.find((t: Task) => t.id === activeTimer.taskId);
          if (match) setSelectedTask(match);
          else setSelectedTask(res.tasks[0]);
        } else {
          setSelectedTask(res.tasks[0]);
        }
      } else {
        const allRes = await api.getTasks();
        if (allRes.success && allRes.tasks?.length > 0) {
          setTasks(allRes.tasks);
          setSelectedTask(allRes.tasks[0]);
        }
      }
    };

    fetchTasks();
  }, [activeTimer]);

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    try {
      const res = await api.toggleSubtask(selectedTask.id, subtaskId);
      if (res.success && res.subtask) {
        setSelectedTask(prev =>
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
      console.error(err);
    }
  };

  const handleTimerAction = () => {
    if (!selectedTask) return;
    if (isRunning && activeTimer?.taskId === selectedTask.id) {
      stopTimer(selectedTask.id);
    } else {
      startTimer(selectedTask.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#06080F] text-white flex flex-col justify-between p-6 sm:p-12 overflow-y-auto">
      {/* Top Exit & Mode Indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Focus Mode
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Distraction-Free Deep Work</span>
        </div>
      </div>

      {/* Main Focus Center */}
      <div className="max-w-2xl w-full mx-auto my-auto space-y-10 text-center py-8">
        {/* Project & Deadline Badge */}
        {selectedTask && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider"
              style={{ backgroundColor: selectedTask.project?.color || '#6366F1' }}
            >
              {selectedTask.project?.name || 'Project Work'}
            </span>
            <CountdownTimer deadline={selectedTask.deadline} isCompleted={selectedTask.status === 'DONE'} />
          </div>
        )}

        {/* Task Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {selectedTask?.title || 'No task selected for focus'}
        </h1>

        {/* Giant Digital Stopwatch */}
        <div className="py-6">
          <div className="inline-block px-10 sm:px-16 py-6 sm:py-8 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
            <div className="font-mono text-5xl sm:text-8xl font-black tracking-widest text-cyan-300">
              {formatTime(activeTimer?.currentElapsedSeconds || 0)}
            </div>
          </div>
        </div>

        {/* Stopwatch Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleTimerAction}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition flex items-center gap-2 ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" /> Pause Work
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Begin Deep Work
              </>
            )}
          </button>
        </div>

        {/* Progress Checklist */}
        {selectedTask?.subtasks && selectedTask.subtasks.length > 0 && (
          <div className="max-w-md mx-auto text-left space-y-3 pt-6 border-t border-white/10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
              Micro Steps Checklist
            </div>
            <div className="space-y-2">
              {selectedTask.subtasks.map(st => (
                <div
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={st.isCompleted}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span
                    className={`text-xs flex-1 transition ${
                      st.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {st.title}
                  </span>
                  {st.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Task Switcher */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-slate-500">
        <span>Switch Task: </span>
        <select
          value={selectedTask?.id || ''}
          onChange={e => {
            const match = tasks.find(t => t.id === e.target.value);
            if (match) setSelectedTask(match);
          }}
          className="bg-transparent border-b border-slate-700 text-slate-300 text-xs px-2 py-1 focus:outline-none"
        >
          {tasks.map(t => (
            <option key={t.id} value={t.id} className="bg-slate-900 text-white">
              {t.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
