import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { storage } from '../../services/storage';
import { Task, Annotation, LabelDefinition } from '../../types';
import { readableTextColor } from '../../utils/color';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  User,
  Flag,
  Check,
  ChevronRight,
  Filter
} from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const { currentUser, activeProject } = useAuth();
  const { resolveReview } = useRealtime();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'disagreed' | 'flagged'>('all');
  const [resolvedToast, setResolvedToast] = useState<string | null>(null);

  if (!activeProject) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        No project selected.
      </div>
    );
  }

  const tasks = storage.getTasks(activeProject.id);
  const annotations = storage.getAnnotations(activeProject.id);

  // Filter tasks in review queue
  const reviewTasks = tasks.filter(t => {
    if (t.isGold) return false;
    if (t.status !== 'in_review') return false;

    const hasFlags = t.flags && t.flags.length > 0;
    if (filterType === 'flagged') return hasFlags;
    if (filterType === 'disagreed') return !hasFlags;
    return true;
  });

  const activeTask = reviewTasks.find(t => t.id === selectedTaskId) || reviewTasks[0] || null;

  // Annotations for active task
  const activeTaskAnnotations = activeTask
    ? annotations.filter(a => a.taskId === activeTask.id)
    : [];

  const handleResolve = (labelName: string) => {
    if (!activeTask) return;
    resolveReview(activeTask.id, currentUser.id, labelName);
    setResolvedToast(`Resolved task in real-time with final label: "${labelName}"`);
    setTimeout(() => setResolvedToast(null), 2500);

    // Pick next task in queue
    const remaining = reviewTasks.filter(t => t.id !== activeTask.id);
    setSelectedTaskId(remaining[0]?.id || null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Senior Reviewer Queue
            </span>
            <span className="text-xs text-slate-400">• {activeProject.name}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Disagreement & Conflict Resolution
          </h1>
          <p className="text-xs text-slate-500">
            Tasks where annotator voting failed consensus or where flags were raised. Your decision is final.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            All Items ({tasks.filter(t => !t.isGold && t.status === 'in_review').length})
          </button>
          <button
            onClick={() => setFilterType('disagreed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'disagreed' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Disagreements
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'flagged' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Flagged Items
          </button>
        </div>
      </div>

      {reviewTasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Review Queue is Clear!</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            All submitted tasks in <strong className="font-semibold text-slate-800">{activeProject.name}</strong> either reached complete consensus, passed majority voting, or have already been reviewed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Queue List (4 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              {reviewTasks.length} Task(s) Requiring Attention
            </div>

            <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
              {reviewTasks.map((t) => {
                const taskAnns = annotations.filter(a => a.taskId === t.id);
                const isSelected = activeTask?.id === t.id;
                const isFlagged = t.flags && t.flags.length > 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/60 border-purple-400 shadow-sm ring-1 ring-purple-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Task #{t.id.slice(-6)}
                      </span>
                      {isFlagged ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <Flag className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Split Decision
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed mb-3">
                      {t.data.text}
                    </p>

                    {/* Compact Annotator votes row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {taskAnns.map((a, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                        >
                          {a.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Resolution Inspector (7 cols) */}
          {activeTask && (
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
              
              <div>
                
                {/* Task Header & Flags */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      ID: {activeTask.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Resolve Conflict
                    </h3>
                  </div>

                  {activeTask.aiSuggestion && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Model suggested: <strong>{activeTask.aiSuggestion.label}</strong> ({Math.round(activeTask.aiSuggestion.confidence * 100)}%)</span>
                    </div>
                  )}
                </div>

                {/* Flags alert if any */}
                {activeTask.flags && activeTask.flags.length > 0 && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 mb-1">
                      <Flag className="w-3.5 h-3.5 text-rose-600" />
                      <span>Annotator Flags Raised:</span>
                    </div>
                    {activeTask.flags.map((f, i) => (
                      <p key={i} className="text-xs text-rose-700 italic">
                        "{f.reason}"
                      </p>
                    ))}
                  </div>
                )}

                {/* Task Text Box */}
                <div className="mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Raw Task Text
                  </div>
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 text-sm sm:text-base leading-relaxed">
                    {activeTask.data.text}
                  </div>
                </div>

                {/* Side-by-Side Annotator Submissions */}
                <div className="mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Annotator Submissions ({activeTaskAnnotations.length} votes)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTaskAnnotations.map((ann) => {
                      const annotator = storage.getUser(ann.userId);
                      const matchingLabel = activeProject.labels.find(l => l.name === ann.label);

                      return (
                        <div
                          key={ann.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={annotator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300"
                              />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {annotator?.name || 'Annotator'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {ann.timeTakenSeconds}s
                            </span>
                          </div>

                          <div className="mt-1">
                            <span
                              className="inline-block text-xs font-bold px-3 py-1 rounded-lg"
                              style={{
                                backgroundColor: matchingLabel?.color || '#e2e8f0',
                                color: matchingLabel ? readableTextColor(matchingLabel.color) : '#0f172a'
                              }}
                            >
                              {ann.label}
                            </span>
                          </div>

                          {ann.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-2">
                              "{ann.notes}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Authoritative Final Label Decision Panel */}
              <div className="pt-6 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Select Authoritative Final Label:</span>
                  <span className="text-[11px] text-purple-600 font-semibold">Overrules annotator split</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeProject.labels.map((lbl) => (
                    <button
                      key={lbl.id}
                      onClick={() => handleResolve(lbl.name)}
                      className="h-12 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-xs hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                      style={{
                        backgroundColor: lbl.color,
                        color: readableTextColor(lbl.color)
                      }}
                    >
                      <span className="truncate">{lbl.name}</span>
                      <Check className="w-4 h-4 opacity-75" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Floating toast */}
      {resolvedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-150">
          <Check className="w-4 h-4 text-purple-400" />
          <span>{resolvedToast}</span>
        </div>
      )}

    </div>
  );
};
