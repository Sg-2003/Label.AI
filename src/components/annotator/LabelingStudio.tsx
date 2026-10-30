import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { storage } from '../../services/storage';
import { Task, LabelDefinition } from '../../types';
import { readableTextColor } from '../../utils/color';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flag,
  SkipForward,
  Info,
  Clock,
  Flame,
  Check,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Keyboard,
  PartyPopper
} from 'lucide-react';
import { CvatCanvasStudio } from '../cvat/CvatCanvasStudio';


interface LabelingStudioProps {
  onOpenGuidelines?: () => void;
  onOpenShortcuts?: () => void;
}

export const LabelingStudio: React.FC<LabelingStudioProps> = ({ onOpenShortcuts }) => {
  const { currentUser, activeProject, activeProjectId } = useAuth();
  const { submitAnnotation, flagTask } = useRealtime();
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [doneByYou, setDoneByYou] = useState<number>(0);
  const [availableForYou, setAvailableForYou] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);
  const [showFlagModal, setShowFlagModal] = useState<boolean>(false);
  const [flagReason, setFlagReason] = useState<string>('Ambiguous text or unclear guidelines');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<number>(Date.now());
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'gold' } | null>(null);

  // Load next task
  const loadNext = () => {
    if (!activeProject) return;
    const result = storage.getNextTask(activeProject.id, currentUser.id);
    setCurrentTask(result.task);
    setDoneByYou(result.doneByYou);
    setAvailableForYou(result.availableForYou);
    setSelectedLabel(null);
    setTaskStartTime(Date.now());
  };

  useEffect(() => {
    loadNext();
  }, [activeProjectId, currentUser.id]);

  // Handle label submission
  const handleSubmit = (labelName: string) => {
    if (!currentTask || isSubmitting) return;
    setIsSubmitting(true);
    setSelectedLabel(labelName);

    const timeTaken = Math.max(1, Math.round((Date.now() - taskStartTime) / 1000));
    
    setTimeout(() => {
      try {
        const result = submitAnnotation(
          currentTask.id,
          currentUser.id,
          labelName,
          timeTaken
        );

        setSessionCount(prev => prev + 1);
        
        // Subtle feedback toast
        setFeedbackToast({
          message: `Label "${labelName}" recorded in real-time`,
          type: 'success'
        });

        setTimeout(() => setFeedbackToast(null), 2200);

        loadNext();
      } catch (err) {
        console.error('Submit error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }, 180);
  };

  // Skip task
  const handleSkip = () => {
    if (!currentTask) return;
    storage.skipTask(currentTask.id, currentUser.id);
    setFeedbackToast({ message: 'Task skipped', type: 'info' });
    setTimeout(() => setFeedbackToast(null), 1800);
    loadNext();
  };

  // Flag task
  const handleFlag = () => {
    if (!currentTask) return;
    flagTask(currentTask.id, currentUser.id, flagReason);
    setShowFlagModal(false);
    setFeedbackToast({ message: 'Task flagged and broadcast to reviewer in real-time', type: 'info' });
    setTimeout(() => setFeedbackToast(null), 2200);
    loadNext();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!activeProject || !currentTask || isSubmitting) return;

      // 1. Check numbers 1-9 for labels
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= activeProject.labels.length) {
        e.preventDefault();
        handleSubmit(activeProject.labels[num - 1].name);
        return;
      }

      // Check custom shortcut keys defined on labels
      const matchedByShortcut = activeProject.labels.find(
        l => l.shortcutKey && l.shortcutKey.toLowerCase() === e.key.toLowerCase()
      );
      if (matchedByShortcut) {
        e.preventDefault();
        handleSubmit(matchedByShortcut.name);
        return;
      }

      // 2. Enter / Tab to accept AI Suggestion
      if ((e.key === 'Enter' || e.key === 'Tab') && activeProject.aiMode === 'show' && currentTask.aiSuggestion) {
        e.preventDefault();
        handleSubmit(currentTask.aiSuggestion.label);
        return;
      }

      // 3. 's' or 'S' to skip
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSkip();
        return;
      }

      // 4. 'f' or 'F' to flag
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setShowFlagModal(true);
        return;
      }

      // 5. 'g' or 'G' for guidelines
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setShowGuidelines(prev => !prev);
        return;
      }

      // 6. '?' for shortcuts
      if (e.key === '?') {
        e.preventDefault();
        onOpenShortcuts?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProject, currentTask, isSubmitting, taskStartTime]);

  if (!activeProject) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">No project selected.</p>
      </div>
    );
  }

  // Finished queue / No tasks available
  if (!currentTask) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10 mb-6">
          <PartyPopper className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Queue Completed!
        </h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
          You have labeled all available tasks in <strong className="text-slate-900 font-semibold">{activeProject.name}</strong>. 
          New items will appear when other annotators finish their overlap allocations or when more data is imported.
        </p>

        <div className="inline-flex items-center gap-6 px-6 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs mb-8">
          <div className="text-center">
            <div className="text-2xl font-black text-indigo-600">{doneByYou}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed by you</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-600">{sessionCount}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">This session</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <div className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-amber-500" />
              {currentUser.stats.streak || 1}
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Day streak</div>
          </div>
        </div>

        <div>
          <button
            onClick={loadNext}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Check for New Tasks
          </button>
        </div>
      </div>
    );
  }

  // CVAT / Computer Vision Image Bounding Box Mode
  if (activeProject.taskType === 'image_bounding_box') {
    return (
      <CvatCanvasStudio
        task={currentTask}
        labels={activeProject.labels}
        onComplete={() => {
          setSessionCount(prev => prev + 1);
          setFeedbackToast({
            message: 'Bounding box frame submitted in real-time',
            type: 'success'
          });
          setTimeout(() => setFeedbackToast(null), 2200);
          loadNext();
        }}
        onSkip={handleSkip}
        onFlag={() => setShowFlagModal(true)}
        onOpenGuidelines={() => setShowGuidelines(true)}
      />
    );
  }

  const aiSuggestedLabel = activeProject.aiMode === 'show' ? currentTask.aiSuggestion : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Top Header: Progress & Guidelines Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {activeProject.name}
          </span>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{doneByYou} labeled</span>
            <span className="text-slate-400">({availableForYou} left in queue)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sessionCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>+{sessionCount} this session</span>
            </div>
          )}

          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              showGuidelines
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Guidelines (G)</span>
          </button>
        </div>
      </div>

      {/* Guidelines Drawer */}
      {showGuidelines && (
        <div className="my-4 p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Annotation Guidelines & Rules
            </h4>
            <button
              onClick={() => setShowGuidelines(false)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mb-4">
            {activeProject.guidelines}
          </p>

          {activeProject.aiExamples && activeProject.aiExamples.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Reference Examples
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeProject.aiExamples.map((ex, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-xl border border-indigo-100 text-xs">
                    <div className="font-medium text-slate-800 italic mb-1">"{ex.text}"</div>
                    <div className="font-bold text-indigo-600">→ {ex.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area: Centered Task Card with max 65ch width for reading comfort */}
      <div className="my-auto py-8">
        
        {/* AI Suggestion Banner (Phase 10: Show Mode) */}
        {aiSuggestedLabel && (
          <div className="max-w-2xl mx-auto mb-4 p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    AI Suggestion:
                  </span>
                  <span className="text-xs font-black text-indigo-700 px-2 py-0.5 rounded-md bg-white border border-indigo-200">
                    {aiSuggestedLabel.label}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    ({Math.round(aiSuggestedLabel.confidence * 100)}% confidence)
                  </span>
                </div>
                {aiSuggestedLabel.rationale && (
                  <p className="text-[11px] text-slate-600 italic mt-0.5 max-w-md">
                    "{aiSuggestedLabel.rationale}"
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSubmit(aiSuggestedLabel.label)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>Accept</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-indigo-800 text-indigo-100 rounded">Enter</kbd>
            </button>
          </div>
        )}

        {/* Task Card Container */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-8 sm:p-10 relative">
          
          {/* Metadata pill if present */}
          {currentTask.data.meta && Object.keys(currentTask.data.meta).length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {Object.entries(currentTask.data.meta).map(([k, v]) => (
                <span key={k} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {k}: <strong className="text-slate-700">{String(v)}</strong>
                </span>
              ))}
            </div>
          )}

          {/* Text to Annotate with strict max 65ch per Phase 12 guidelines */}
          <div className="max-w-[65ch] text-slate-900 text-lg sm:text-xl font-normal leading-relaxed tracking-normal select-text">
            {currentTask.data.text}
          </div>

          {/* Label Buttons Palette */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Select Category (Press 1 - {activeProject.labels.length})</span>
              <span className="text-[10px] font-normal text-slate-400">Keyboard enabled</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeProject.labels.map((lbl, idx) => {
                const textColor = readableTextColor(lbl.color);
                const isAI = aiSuggestedLabel?.label.toLowerCase() === lbl.name.toLowerCase();

                return (
                  <button
                    key={lbl.id || idx}
                    onClick={() => handleSubmit(lbl.name)}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: lbl.color,
                      color: textColor,
                    }}
                    className="h-12 px-4 rounded-xl font-bold text-sm flex items-center justify-between shadow-xs hover:brightness-110 active:scale-95 transition-all relative overflow-hidden group cursor-pointer"
                  >
                    <span className="truncate">{lbl.name}</span>
                    
                    <div className="flex items-center gap-1.5">
                      {isAI && (
                        <Sparkles className="w-3.5 h-3.5 opacity-90 animate-spin" style={{ animationDuration: '4s' }} />
                      )}
                      <kbd
                        style={{
                          backgroundColor: textColor === '#ffffff' ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.4)',
                          color: textColor
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                      >
                        {lbl.shortcutKey || (idx + 1)}
                      </kbd>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Action Footer: Skip, Flag, Shortcuts */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 text-xs text-slate-500">
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 hover:text-slate-800 transition-colors font-medium px-2 py-1 rounded-md hover:bg-slate-100"
          >
            <SkipForward className="w-3.5 h-3.5 text-slate-400" />
            <span>Skip Task (S)</span>
          </button>

          <button
            onClick={() => setShowFlagModal(true)}
            className="flex items-center gap-1.5 hover:text-rose-600 transition-colors font-medium px-2 py-1 rounded-md hover:bg-rose-50"
          >
            <Flag className="w-3.5 h-3.5 text-rose-500" />
            <span>Flag Issue (F)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-400">
            Press <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded font-mono">?</kbd> for help
          </span>
        </div>

      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Flag Task for Review</h3>
                <p className="text-xs text-slate-500">Send this item directly to senior reviewer queue</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {[
                'Ambiguous text or unclear guidelines',
                'Corrupted, malformed, or foreign language data',
                'Contains private personal information (PII)',
                'Multiple contradictory labels could apply'
              ].map((reason) => (
                <label
                  key={reason}
                  onClick={() => setFlagReason(reason)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    flagReason === reason
                      ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="flagReason"
                    checked={flagReason === reason}
                    onChange={() => setFlagReason(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Flag & Move Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast.message}</span>
        </div>
      )}

    </div>
  );
};
