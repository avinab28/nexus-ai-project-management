import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  Clock, 
  CheckCircle, 
  Layers, 
  ArrowRight,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import { api } from '../services/api';
import { ActivityItem } from '../types';

export const ActivityLogPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const res = await api.getActivities();
      if (res.success) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch activity log', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {action}
        </span>
      );
    }
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {action}
        </span>
      );
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {action}
        </span>
      );
    }
    if (act.includes('STATUS') || act.includes('MOVE')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-nexus-800 text-nexus-300 border border-nexus-700">
        {action}
      </span>
    );
  };

  const parseDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed)
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(', ');
      }
    } catch {
      // plain text details
    }
    return details;
  };

  const filteredActivities = activities.filter(item => {
    const matchesSearch =
      item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.project?.name && item.project.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction =
      actionFilter === 'ALL' || item.action.toUpperCase().includes(actionFilter);

    const matchesEntity =
      entityFilter === 'ALL' || item.entityType.toUpperCase() === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-nexus-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Audit & Activity Log</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-nexus-800 text-nexus-300 border border-nexus-700">
              {activities.length} entries
            </span>
          </div>
          <p className="text-sm text-nexus-400 mt-1">
            Complete workspace audit trail of task updates, project milestones, permission changes, and automated triggers.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-nexus-800 hover:bg-nexus-700 text-nexus-200 border border-nexus-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-xl bg-nexus-900/60 border border-nexus-800">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-nexus-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by user, action, project, or payload details..."
            className="w-full pl-9 pr-4 py-2 bg-nexus-950 border border-nexus-800 rounded-lg text-xs text-white placeholder-nexus-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-nexus-950 border border-nexus-800 rounded-lg text-xs text-nexus-300 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="STATUS">Status Change</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-nexus-950 border border-nexus-800 rounded-lg text-xs text-nexus-300 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="ALL">All Entities</option>
            <option value="TASK">Tasks</option>
            <option value="PROJECT">Projects</option>
            <option value="MILESTONE">Milestones</option>
            <option value="COMMENT">Comments</option>
          </select>
        </div>
      </div>

      {/* Activities Timeline / Table */}
      <div className="bg-nexus-900/40 border border-nexus-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center text-nexus-500 text-sm animate-pulse">
            Loading activity stream...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-10 h-10 text-nexus-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-nexus-300">No activity records found</h3>
            <p className="text-xs text-nexus-500 mt-1 max-w-sm mx-auto">
              No matching activity events in the audit log for the current search criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-nexus-850">
            {filteredActivities.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="p-4 hover:bg-nexus-900/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* User & Action details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-nexus-800 border border-nexus-700 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0 uppercase">
                    {item.user?.name ? item.user.name.substring(0, 2) : 'SY'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {item.user?.name || 'System / Automation'}
                      </span>
                      {getActionBadge(item.action)}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-nexus-950 text-nexus-400 border border-nexus-800">
                        {item.entityType}
                      </span>
                      {item.project && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-nexus-400 bg-nexus-950/80 px-2 py-0.5 rounded border border-nexus-800">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: item.project.color || '#06b6d4' }} 
                          />
                          {item.project.name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-nexus-300 font-mono bg-nexus-950/60 px-2.5 py-1.5 rounded border border-nexus-850/60 break-all">
                      {parseDetails(item.details)}
                    </p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-nexus-500 shrink-0 md:text-right pl-12 md:pl-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(item.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
