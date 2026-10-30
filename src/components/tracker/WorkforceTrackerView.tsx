import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { storage } from '../../services/storage';
import { WorkerLiveStatus, WorkerActivityLog, WorkerActionType } from '../../types';
import {
  Users,
  Activity,
  Clock,
  ShieldCheck,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Sparkles,
  Layers,
  Square,
  Eye,
  RefreshCw,
  Cpu,
  BarChart3,
  TrendingUp,
  Zap,
  UserCheck
} from 'lucide-react';

export const WorkforceTrackerView: React.FC = () => {
  const { currentUser, activeProject } = useAuth();
  const { activeMembers } = useRealtime();

  const [statuses, setStatuses] = useState<WorkerLiveStatus[]>([]);
  const [logs, setLogs] = useState<WorkerActivityLog[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const loadData = () => {
    setStatuses(storage.getWorkerStatuses());
    setLogs(storage.getWorkerLogs());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storage.subscribe(loadData);
    return unsubscribe;
  }, []);

  // Periodic refresh for live timers
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setStatuses(storage.getWorkerStatuses());
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Aggregate metrics
  const totalTasksToday = statuses.reduce((acc, s) => acc + s.todayTasksCompleted, 0);
  const totalBoxesToday = statuses.reduce((acc, s) => acc + s.todayBoxesDrawn, 0);
  const totalActiveMins = statuses.reduce((acc, s) => acc + s.todayActiveMinutes, 0);
  const totalIdleMins = statuses.reduce((acc, s) => acc + s.todayIdleMinutes, 0);
  const totalWorkMins = totalActiveMins + totalIdleMins;
  const overallEfficiency = totalWorkMins > 0 ? Math.round((totalActiveMins / totalWorkMins) * 100) : 92;

  // Filtered telemetry logs
  const filteredLogs = logs.filter(log => {
    if (selectedUserFilter !== 'all' && log.userId !== selectedUserFilter) return false;
    if (selectedActionFilter !== 'all') {
      if (selectedActionFilter === 'bbox' && !['box_created', 'box_deleted', 'box_resized'].includes(log.action)) return false;
      if (selectedActionFilter === 'submission' && log.action !== 'task_submitted') return false;
      if (selectedActionFilter === 'idle' && log.action !== 'idle_detected') return false;
      if (selectedActionFilter === 'ai' && log.action !== 'ai_accepted') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.taskId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const csvContent = storage.exportTelemetryLogsCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `labelloop_workforce_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: WorkerLiveStatus['status']) => {
    switch (status) {
      case 'active_labeling':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Labeling
          </span>
        );
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Reviewing Queue
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Idle (Reserved Task)
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Offline
          </span>
        );
    }
  };

  const getActionIcon = (action: WorkerActionType) => {
    switch (action) {
      case 'box_created':
      case 'box_resized':
        return <Square className="w-4 h-4 text-emerald-600" />;
      case 'box_deleted':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'task_submitted':
        return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
      case 'idle_detected':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'ai_accepted':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'conflict_resolved':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Workforce Activity & Telemetry Tracker
              </h1>
              <p className="text-xs text-slate-500">
                CVAT & JEBI-grade monitoring for team velocity, active vs. idle time, bounding box output, and live audit telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{autoRefresh ? 'Live Sync Active' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Boxes Drawn Today
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {totalBoxesToday}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Across computer vision perception tasks
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Square className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tasks Completed Today
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {totalTasksToday}
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">
              {statuses.filter(s => s.status !== 'offline').length} active operators
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Time Efficiency
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {overallEfficiency}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalActiveMins}m active / {totalIdleMins}m idle
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Benchmark Accuracy
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              93.2%
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secret gold test calibration
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Workforce Team Status Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-900">
              Workforce Operator Roster & Live Status
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            CVAT Task Leases & Active Session Tracking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Live Status</th>
                <th className="py-3 px-4">Current Task / Activity</th>
                <th className="py-3 px-4 text-center">Tasks Done</th>
                <th className="py-3 px-4 text-center">BBoxes Drawn</th>
                <th className="py-3 px-4 text-center">Active / Idle</th>
                <th className="py-3 px-4 text-center">Avg Velocity</th>
                <th className="py-3 px-4 text-center">Gold Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statuses.map((worker) => {
                const efficiency = worker.todayActiveMinutes + worker.todayIdleMinutes > 0
                  ? Math.round((worker.todayActiveMinutes / (worker.todayActiveMinutes + worker.todayIdleMinutes)) * 100)
                  : 100;

                return (
                  <tr key={worker.userId} className="hover:bg-slate-50/70 transition-colors">
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={worker.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={worker.userName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{worker.userName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{worker.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        worker.role === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : worker.role === 'reviewer'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {worker.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(worker.status)}
                    </td>

                    {/* Current Action */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 truncate max-w-xs">
                        {worker.lastAction}
                      </div>
                      {worker.currentTaskId && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Task #{worker.currentTaskId.slice(-6)} • {worker.currentTaskType || 'perception'}
                        </div>
                      )}
                    </td>

                    {/* Tasks Done */}
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {worker.todayTasksCompleted}
                    </td>

                    {/* BBoxes Drawn */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {worker.todayBoxesDrawn}
                      </span>
                    </td>

                    {/* Active / Idle */}
                    <td className="py-3 px-4 text-center">
                      <div className="font-semibold text-slate-800">
                        {worker.todayActiveMinutes}m / <span className="text-amber-600">{worker.todayIdleMinutes}m</span>
                      </div>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${efficiency}%` }}
                        />
                      </div>
                    </td>

                    {/* Velocity */}
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {worker.avgSecondsPerTask}s/task
                    </td>

                    {/* Accuracy */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-indigo-600">
                        {worker.goldAccuracyPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Telemetry Event Feed (CVAT / JEBI Audit Stream) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-black text-slate-900">
              Live Workforce Telemetry & Audit Stream
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              {filteredLogs.length} events
            </span>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit events..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* User Filter */}
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Operators</option>
              {statuses.map(s => (
                <option key={s.userId} value={s.userId}>{s.userName}</option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Actions</option>
              <option value="bbox">Bounding Boxes (Create/Resize/Del)</option>
              <option value="submission">Task Submissions</option>
              <option value="idle">Idle Detections</option>
              <option value="ai">AI Pre-label Accepts</option>
            </select>
          </div>
        </div>

        {/* Telemetry Event Stream Rows */}
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No telemetry events match your search filters.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const timeString = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {log.userName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({log.userRole})
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {log.projectName}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 mt-0.5">
                        {log.details}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                        <span>Task #{log.taskId.slice(-6)}</span>
                        {log.durationSeconds !== undefined && (
                          <span>Took {log.durationSeconds}s</span>
                        )}
                        <span>{timeString}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase flex-shrink-0">
                    {log.action.replace('_', ' ')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
