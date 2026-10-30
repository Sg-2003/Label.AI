import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { Project } from '../../types';
import {
  FolderGit2,
  Plus,
  Play,
  Pause,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Archive
} from 'lucide-react';

interface ProjectListProps {
  onOpenCreate: () => void;
  onSelectProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onOpenCreate, onSelectProject }) => {
  const { setActiveProjectId } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'paused' | 'completed'>('all');
  const projects = storage.getProjects();

  const filtered = projects.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Annotation Projects ({projects.length})
          </h1>
          <p className="text-xs text-slate-500">
            Manage data annotation pipelines, team memberships, and consensus quality parameters.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['all', 'active', 'draft', 'paused', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              filter === tab
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} ({tab === 'all' ? projects.length : projects.filter(p => p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((proj) => {
          const metrics = storage.getMetrics(proj.id);
          const tasks = storage.getTasks(proj.id);
          const normalTasks = tasks.filter(t => !t.isGold);

          return (
            <div
              key={proj.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    proj.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : proj.status === 'draft'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {proj.status}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <span>{proj.overlapCount}x overlap</span>
                    {proj.aiMode === 'show' && (
                      <span className="text-indigo-600 font-bold ml-1 flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 text-amber-500" /> AI
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {proj.description || proj.guidelines}
                </p>

                {/* Labels preview pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {proj.labels.slice(0, 4).map(l => (
                    <span
                      key={l.id}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: `${l.color}20`, color: l.color }}
                    >
                      {l.name}
                    </span>
                  ))}
                  {proj.labels.length > 4 && (
                    <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5">
                      +{proj.labels.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                {/* Progress bar */}
                <div className="mb-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600">Completion</span>
                    <span className="text-slate-900">{metrics.completionRate}% ({proj.counts.completed}/{normalTasks.length})</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${metrics.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <button
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    onSelectProject(proj.id);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
