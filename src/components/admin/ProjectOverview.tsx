import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Archive,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

interface ProjectOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ onNavigateTab }) => {
  const { activeProject, setActiveProjectId } = useAuth();

  if (!activeProject) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        No project selected.
      </div>
    );
  }

  const tasks = storage.getTasks(activeProject.id);
  const annotations = storage.getAnnotations(activeProject.id);
  const metrics = storage.getMetrics(activeProject.id);
  const healthIssues = storage.getHealthIssues(activeProject.id);

  const normalTasks = tasks.filter(t => !t.isGold);
  const completedTasks = normalTasks.filter(t => t.status === 'completed');
  const inReviewTasks = normalTasks.filter(t => t.status === 'in_review');
  const pendingTasks = normalTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  // Label distribution among completed tasks
  const labelCounts: Record<string, number> = {};
  completedTasks.forEach(t => {
    if (t.finalLabel?.label) {
      labelCounts[t.finalLabel.label] = (labelCounts[t.finalLabel.label] || 0) + 1;
    }
  });

  const annotators = activeProject.members.filter(m => m.role === 'annotator');
  const reviewers = activeProject.members.filter(m => m.role === 'reviewer');

  const handleToggleStatus = () => {
    if (activeProject.status === 'active') {
      storage.setProjectStatus(activeProject.id, 'paused');
    } else if (activeProject.status === 'paused' || activeProject.status === 'draft') {
      const res = storage.activateProject(activeProject.id);
      if (!res.success) {
        alert(`Cannot activate project: ${res.error}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Project Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
              activeProject.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : activeProject.status === 'draft'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {activeProject.status}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Overlap: {activeProject.overlapCount}x per item
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Majority: {activeProject.majorityPolicy}
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              AI: {activeProject.aiMode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            {activeProject.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {activeProject.guidelines}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
              activeProject.status === 'active'
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {activeProject.status === 'active' ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Labeling</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Activate Project</span>
              </>
            )}
          </button>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Manage Tasks
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Completed Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-black text-slate-900">{completedTasks.length}</span>
            <span className="text-xs font-medium text-slate-400">of {normalTasks.length} tasks</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            {metrics.completionRate}% finished dataset
          </div>
        </div>

        {/* Card 2: Annotation Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Annotation Work</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-black text-indigo-600">{annotations.filter(a => !a.isGold).length}</span>
            <span className="text-xs font-medium text-slate-400">of {normalTasks.length * activeProject.overlapCount} needed</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${metrics.annotationProgressRate}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            {metrics.annotationProgressRate}% overlap collected
          </div>
        </div>

        {/* Card 3: Agreement / Kappa */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleiss' Kappa (κ)</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black text-purple-600">
              {metrics.fleissKappa !== null ? metrics.fleissKappa.toFixed(2) : '—'}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              {metrics.kappaInterpretation}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            {metrics.observedAgreement}% raw observed agreement
          </div>
        </div>

        {/* Card 4: Review Queue & Disagreement */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Review Queue</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black text-amber-600">{inReviewTasks.length}</span>
            <span className="text-xs font-medium text-slate-400">items in review</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2">
            {metrics.disagreementRate}% annotator disagreement rate
          </div>
        </div>

      </div>

      {/* Main Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Task Distribution & Label Share (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Breakdown card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Dataset Pipeline Distribution
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800">Completed & Finalized</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">{completedTasks.length}</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">
                  {metrics.consensusTasksCount} by consensus, {metrics.majorityTasksCount} by majority
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-xs font-semibold text-amber-800">In Review Queue</span>
                <div className="text-2xl font-black text-amber-700 mt-1">{inReviewTasks.length}</div>
                <div className="text-[11px] text-amber-600 mt-0.5">Disagreements or flags</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Pending Annotation</span>
                <div className="text-2xl font-black text-slate-800 mt-1">{pendingTasks.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Awaiting annotator turns</div>
              </div>
            </div>

            {/* Label Class Breakdown */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Finalized Label Distribution
              </h4>
              {completedTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tasks completed yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeProject.labels.map((lbl) => {
                    const count = labelCounts[lbl.name] || 0;
                    const pct = completedTasks.length > 0 ? Math.round((count / completedTasks.length) * 100) : 0;

                    return (
                      <div key={lbl.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-2 text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                            {lbl.name}
                          </span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: lbl.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Quick Team Roster Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Assigned Team ({activeProject.members.length} members)
                </h4>
                <p className="text-xs text-slate-500">
                  {annotators.length} Annotator(s), {reviewers.length} Reviewer(s)
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('users')}
              className="px-3.5 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              Manage Members →
            </button>
          </div>

        </div>

        {/* Right: Project Health Alerts & Action Cards (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Project Health Diagnostics
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Phase 11 Rules
              </span>
            </div>

            {healthIssues.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <div className="text-xs font-bold text-emerald-900">All Systems Healthy</div>
                <p className="text-[11px] text-emerald-700 mt-0.5">No critical bottlenecks detected.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {healthIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-2xl border ${
                      issue.severity === 'critical'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : issue.severity === 'warning'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      {issue.severity === 'critical' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{issue.title}</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90 mb-3">
                      {issue.message}
                    </p>
                    <button
                      onClick={() => {
                        if (issue.actionKey === 'open_review') onNavigateTab('review-queue');
                        else if (issue.actionKey === 'add_gold') onNavigateTab('tasks');
                        else if (issue.actionKey === 'assign_members') onNavigateTab('users');
                        else onNavigateTab('metrics');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 shadow-xs hover:bg-slate-50 transition-colors border border-slate-200/80"
                    >
                      {issue.actionText} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Pre-labeling Summary Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl border border-indigo-100 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-indigo-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider">AI Pre-Labeling Engine</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Gemini 2.5 Flash pre-labels data with confidence scores to accelerate human annotation velocity.
            </p>
            <button
              onClick={() => onNavigateTab('ai-studio')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Open AI Pre-Labeling Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
