import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { Clock, CheckCircle, Sparkles, FolderGit2 } from 'lucide-react';

export const AnnotatorHistory: React.FC = () => {
  const { currentUser, activeProject } = useAuth();
  const allAnnotations = storage.getAnnotations(activeProject?.id)
    .filter(a => a.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Your Annotation History</h1>
          <p className="text-xs text-slate-500">
            {allAnnotations.length} item(s) labeled in {activeProject?.name || 'current project'}
          </p>
        </div>
      </div>

      {allAnnotations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 mb-1">No Annotations Yet</h3>
          <p className="text-xs text-slate-500">Go to the Labeling Studio to label your first task!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allAnnotations.map((ann) => {
            const task = storage.getTask(ann.taskId);
            return (
              <div
                key={ann.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="text-sm font-medium text-slate-800 leading-relaxed line-clamp-2">
                    {task?.data?.text || 'Task text unavailable'}
                  </span>
                  <div className="shrink-0 flex items-center gap-2">
                    {ann.usedAiSuggestion && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        AI Matched
                      </span>
                    )}
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {ann.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span>{new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span>Took {ann.timeTakenSeconds}s</span>
                  {ann.notes && (
                    <>
                      <span>•</span>
                      <span className="text-slate-600 italic">"{ann.notes}"</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
