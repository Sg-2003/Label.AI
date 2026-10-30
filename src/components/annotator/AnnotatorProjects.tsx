import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { FolderGit2, ArrowRight, CheckCircle2, Clock, Play, Sparkles } from 'lucide-react';

interface AnnotatorProjectsProps {
  onStartLabeling: (projectId: string) => void;
}

export const AnnotatorProjects: React.FC<AnnotatorProjectsProps> = ({ onStartLabeling }) => {
  const { currentUser, setActiveProjectId } = useAuth();
  const projects = storage.getProjects();

  // Find projects assigned to this user
  const myProjects = projects.filter(p => {
    return p.members.some(m => m.userId === currentUser.id && m.role === 'annotator');
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-900/10 mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            Annotator Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-sm text-emerald-50 leading-relaxed">
            You've completed <strong className="text-white font-bold">{currentUser.stats.totalLabeled}</strong> total annotations across projects with a <strong className="text-white font-bold">{currentUser.stats.streak} day</strong> streak!
          </p>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Projects Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">
          Your Assigned Projects ({myProjects.length})
        </h2>
      </div>

      {myProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">No Projects Assigned</h3>
          <p className="text-xs text-slate-500">Ask your project admin to add you as an annotator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myProjects.map((proj) => {
            const userAnnotations = storage.getAnnotations(proj.id).filter(a => a.userId === currentUser.id);
            const totalTasks = proj.counts.total;
            const userDone = userAnnotations.length;
            const progressPct = totalTasks > 0 ? Math.min(100, Math.round((userDone / totalTasks) * 100)) : 0;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Overlap: {proj.overlapCount}x
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      proj.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Labels preview */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-4">
                    {proj.labels.map((lbl) => (
                      <span
                        key={lbl.id}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${lbl.color}20`, color: lbl.color }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                    {proj.aiMode === 'show' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 flex items-center gap-1 border border-indigo-200">
                        <Sparkles className="w-2.5 h-2.5" /> AI Assisted
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">My Progress</span>
                      <span className="text-slate-900">{userDone} of {totalTasks} ({progressPct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      onStartLabeling(proj.id);
                    }}
                    disabled={proj.status !== 'active'}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      proj.status === 'active'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{proj.status === 'active' ? 'Start Labeling' : 'Project Paused'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
