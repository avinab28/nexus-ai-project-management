import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  Play,
  Square,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracker } from '../../context/TimeTrackerContext';
import { api } from '../../services/api';
import { Notification, RoleType } from '../../types';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette, onToggleSidebar }) => {
  const { user, logout, demoLogin } = useAuth();
  const { activeTimer, stopTimer, formatTime } = useTimeTracker();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load notifications
  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkOneRead = async (id: string, link?: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (link) {
      navigate(link);
      setShowNotifications(false);
    }
  };

  return (
    <header className="h-16 border-b border-white/10 glass-panel sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger + Brand & Workspace */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
              NEXUS
            </span>
            <span className="hidden lg:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              AI Command
            </span>
          </div>
        </div>

        {/* Workspace Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-3 ml-2 border-l border-white/10 text-xs text-slate-400">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-slate-200 truncate max-w-[140px]">
            {user?.workspaceName || 'Nexus Labs'}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar (CTRL+K) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 text-slate-400 text-xs transition group shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition" />
            <span>Search projects, tasks, members...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 rounded border border-white/10 group-hover:border-indigo-500/30">
            CTRL + K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Stopwatch, AI Trigger, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Timer Pill if Running */}
        {activeTimer && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs shadow-lg shadow-indigo-900/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <div className="hidden sm:block text-slate-300 truncate max-w-[110px] font-medium">
              {activeTimer.taskTitle}
            </div>
            <span className="font-mono font-semibold text-cyan-300">
              {formatTime(activeTimer.currentElapsedSeconds)}
            </span>
            <button
              onClick={() => stopTimer(activeTimer.taskId)}
              title="Stop and log timer"
              className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        )}

        {/* AI Copilot Button */}
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-md transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 relative transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#090D16]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-dropdown rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkOneRead(n.id, n.link)}
                      className={`p-3 text-left hover:bg-white/5 transition cursor-pointer flex items-start gap-3 ${
                        !n.isRead ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-indigo-400" />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-200">{n.title}</div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-white/10 text-center bg-slate-950/40">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-slate-400 hover:text-indigo-300 font-medium"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Persona & Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-white/5 border border-white/5 transition"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-lg object-cover border border-white/10" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden lg:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-200 truncate max-w-[100px]">{user?.name}</div>
              <div className="text-[10px] text-indigo-400 font-medium uppercase">{user?.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 glass-dropdown rounded-2xl border border-white/10 shadow-2xl p-2 z-50">
              <div className="p-2.5 border-b border-white/10 mb-1">
                <div className="text-xs font-semibold text-white">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  <Shield className="w-3 h-3" />
                  {user?.role}
                </div>
              </div>

              {/* 1-Click Persona Switcher for Quick Demo Testing */}
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Demo Persona
              </div>
              <div className="space-y-0.5 mb-2">
                {[
                  { role: 'OWNER' as RoleType, name: 'Alex Rivera (Owner)' },
                  { role: 'PROJECT_MANAGER' as RoleType, name: 'Sarah Chen (PM)' },
                  { role: 'EDITOR' as RoleType, name: 'Rahul Sharma (Dev)' },
                  { role: 'VIEWER' as RoleType, name: 'John Doe (Viewer)' }
                ].map(persona => (
                  <button
                    key={persona.role}
                    onClick={() => {
                      demoLogin(persona.role);
                      setShowProfileMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      user?.role === persona.role
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{persona.name}</span>
                    {user?.role === persona.role && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-white/10 pt-1">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
