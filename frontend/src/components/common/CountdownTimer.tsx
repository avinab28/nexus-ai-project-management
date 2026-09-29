import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CountdownTimerProps {
  deadline?: string | null;
  isCompleted?: boolean;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline, isCompleted, compact = false }) => {
  const [timeText, setTimeText] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'soon' | 'overdue'>('normal');

  useEffect(() => {
    if (!deadline) {
      setTimeText('No deadline');
      return;
    }

    const calculate = () => {
      const target = new Date(deadline).getTime();
      const now = Date.now();
      const diff = target - now;

      if (isCompleted) {
        setTimeText('Completed');
        setIsOverdue(false);
        setUrgencyLevel('normal');
        return;
      }

      if (diff <= 0) {
        // OVERDUE
        setIsOverdue(true);
        setUrgencyLevel('overdue');
        const absDiff = Math.abs(diff);
        const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeText(`OVERDUE — ${days}d ${hours}h`);
        } else {
          setTimeText(`OVERDUE — ${hours}h ${mins}m`);
        }
      } else {
        setIsOverdue(false);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days <= 1) {
          setUrgencyLevel('soon');
        } else {
          setUrgencyLevel('normal');
        }

        if (days > 0) {
          setTimeText(`Due in ${days}d ${hours}h ${mins}m`);
        } else if (hours > 0) {
          setTimeText(`Due in ${hours}h ${mins}m`);
        } else {
          setTimeText(`Due in ${mins}m`);
        }
      }
    };

    calculate();
    const interval = setInterval(calculate, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, [deadline, isCompleted]);

  if (!deadline) return null;

  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Done
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse ${
          compact ? 'text-[11px]' : ''
        }`}
      >
        <AlertTriangle className="w-3 h-3 text-rose-400" />
        {timeText}
      </span>
    );
  }

  if (urgencyLevel === 'soon') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 ${
          compact ? 'text-[11px]' : ''
        }`}
      >
        <Clock className="w-3 h-3 text-amber-400" />
        {timeText}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-slate-400 ${
        compact ? 'text-[11px]' : ''
      }`}
    >
      <Clock className="w-3 h-3 text-slate-500" />
      {timeText}
    </span>
  );
};
