import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface ActiveTimer {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  color: string;
  startTime: string;
  currentElapsedSeconds: number;
}

interface TimeTrackerContextType {
  activeTimer: ActiveTimer | null;
  isRunning: boolean;
  startTimer: (taskId: string) => Promise<void>;
  stopTimer: (taskId: string) => Promise<void>;
  resetTimer: (taskId: string) => Promise<void>;
  formatTime: (seconds: number) => string;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined);

export const TimeTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Poll or check active timer on mount / auth change
  const fetchActiveTimer = async () => {
    if (!user) {
      setActiveTimer(null);
      return;
    }
    try {
      const res = await api.getActiveTimer();
      if (res.success && res.activeTimer) {
        const at = res.activeTimer;
        setActiveTimer({
          id: at.id,
          taskId: at.taskId,
          taskTitle: at.task.title,
          projectName: at.task.project.name,
          color: at.task.project.color,
          startTime: at.startTime,
          currentElapsedSeconds: at.currentElapsedSeconds
        });
      } else {
        setActiveTimer(null);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchActiveTimer();
  }, [user]);

  // Local ticker every second
  useEffect(() => {
    if (!activeTimer) return;
    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentElapsedSeconds: prev.currentElapsedSeconds + 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.id]);

  const startTimer = async (taskId: string) => {
    const res = await api.startTimer(taskId);
    if (res.success && res.entry) {
      const entry = res.entry;
      setActiveTimer({
        id: entry.id,
        taskId: entry.taskId,
        taskTitle: entry.task?.title || 'Active Task',
        projectName: 'Active Project',
        color: '#6366F1',
        startTime: entry.startTime,
        currentElapsedSeconds: 0
      });
    }
  };

  const stopTimer = async (taskId: string) => {
    await api.stopTimer(taskId);
    setActiveTimer(null);
  };

  const resetTimer = async (taskId: string) => {
    await api.resetTimer(taskId);
    setActiveTimer(null);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <TimeTrackerContext.Provider
      value={{
        activeTimer,
        isRunning: !!activeTimer,
        startTimer,
        stopTimer,
        resetTimer,
        formatTime
      }}
    >
      {children}
    </TimeTrackerContext.Provider>
  );
};

export const useTimeTracker = () => {
  const context = useContext(TimeTrackerContext);
  if (!context) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider');
  }
  return context;
};
