import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Calendar,
  GitBranch,
  Timer,
  Users,
  BarChart3,
  Bot,
  Activity,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Focus,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Task Board', path: '/tasks', icon: Kanban },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Timeline / Gantt', path: '/timeline', icon: GitBranch },
    { label: 'Time Tracking', path: '/time', icon: Timer },
    { label: 'Focus Mode', path: '/focus', icon: Focus },
    { label: 'Team Workload', path: '/team', icon: Users },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'AI Assistant', path: '/ai', icon: Bot, badge: 'AI' },
    { label: 'Activity Log', path: '/activity', icon: Activity },
    { label: 'Permissions & Roles', path: '/permissions', icon: ShieldCheck },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#090D16]/95 border-r border-white/10 backdrop-blur-2xl">
      {/* Mobile Drawer Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10">
        <span className="font-extrabold text-white text-base tracking-wider">NEXUS MENU</span>
        <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-indigo-500/10 text-white border border-indigo-500/30 shadow-lg shadow-indigo-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 tracking-wide">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Workspace & Collapse Toggle Button */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
            <div className="text-[11px] text-slate-400">Current Role</div>
            <div className="font-bold text-indigo-400 mt-0.5">{user?.role}</div>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex w-full items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition text-xs gap-2"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 sticky top-16 h-[calc(100vh-4rem)] z-20 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 h-full"
            onClick={e => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
