import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  Filter, 
  Trash2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Notification } from '../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'TASK' | 'AI' | 'DEADLINE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'AI_ALERT':
      case 'AI_SUGGESTION':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'DEADLINE_APPROACHING':
      case 'OVERDUE':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'TASK') return n.type.startsWith('TASK');
    if (filter === 'AI') return n.type.startsWith('AI');
    if (filter === 'DEADLINE') return n.type.includes('DEADLINE') || n.type.includes('OVERDUE');
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-nexus-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-nexus-400 mt-1">
            Stay up to date with project changes, deadline triggers, and AI intelligence alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-nexus-800 hover:bg-nexus-700 text-nexus-200 border border-nexus-700 transition"
          >
            <CheckCheck className="w-4 h-4 text-cyan-400" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-nexus-800 pb-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'ALL'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'UNREAD'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('TASK')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'TASK'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setFilter('AI')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'AI'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          AI Alerts
        </button>
        <button
          onClick={() => setFilter('DEADLINE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'DEADLINE'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-nexus-400 hover:text-white hover:bg-nexus-900'
          }`}
        >
          Deadlines
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-nexus-500 text-sm animate-pulse">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-nexus-800 bg-nexus-900/30">
            <Bell className="w-10 h-10 text-nexus-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-nexus-300">All caught up!</h3>
            <p className="text-xs text-nexus-500 mt-1 max-w-sm mx-auto">
              No notifications matching your filter. Notifications generated by deadlines, assignments, and AI insights will appear here.
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                notification.isRead
                  ? 'bg-nexus-900/30 border-nexus-850 hover:bg-nexus-900/60'
                  : 'bg-nexus-900/80 border-cyan-500/30 hover:border-cyan-500/50 shadow-lg shadow-cyan-950/20'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-nexus-800/80 border border-nexus-700/50 shrink-0">
                {getIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-semibold truncate ${notification.isRead ? 'text-nexus-300' : 'text-white'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-nexus-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(notification.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-nexus-400 mt-1 line-clamp-2">
                  {notification.message || (notification as any).content}
                </p>

                <div className="flex items-center gap-3 mt-2.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-nexus-800 text-nexus-400 border border-nexus-700">
                    {notification.type.replace(/_/g, ' ')}
                  </span>
                  {!notification.isRead && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Unread
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
