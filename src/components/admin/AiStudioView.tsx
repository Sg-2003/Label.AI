import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { batchPrelabelTasks } from '../../services/api';
import { computePromptVersion } from '../../utils/promptBuilder';
import { Task, AiMode } from '../../types';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Coins,
  Shield,
  HelpCircle,
  FileCode,
  Gauge,
  Info
} from 'lucide-react';

export const AiStudioView: React.FC = () => {
  const { activeProject } = useAuth();
  const [isRunningBatch, setIsRunningBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchStats, setBatchStats] = useState<{ count: number; cost: number; tokens: number } | null>(null);

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">No project selected</div>;
  }

  const tasks = storage.getTasks(activeProject.id);
  const annotations = storage.getAnnotations(activeProject.id);
  const unannotatedTasks = tasks.filter(t => !t.isGold && t.annotationCount === 0);
  const tasksNeedingAi = unannotatedTasks.filter(t => !t.aiSuggestion);

  const promptVersion = computePromptVersion(activeProject);

  // Compute AI Evaluation against Gold standard tasks
  const goldTasksWithAi = tasks.filter(t => t.isGold && t.aiSuggestion && t.goldLabel);
  const aiGoldCorrect = goldTasksWithAi.filter(t => t.aiSuggestion!.label.toLowerCase() === t.goldLabel!.toLowerCase()).length;
  const aiGoldAccuracy = goldTasksWithAi.length > 0 ? Math.round((aiGoldCorrect / goldTasksWithAi.length) * 100) : null;

  // Anchoring Bias metric: Annotators who agreed with AI when AI was wrong on gold tasks
  let followedAiWhenWrongCount = 0;
  let totalEvaluatedBias = 0;
  goldTasksWithAi.forEach(t => {
    const isAiWrong = t.aiSuggestion!.label.toLowerCase() !== t.goldLabel!.toLowerCase();
    if (isAiWrong) {
      const taskAnns = annotations.filter(a => a.taskId === t.id);
      taskAnns.forEach(ann => {
        totalEvaluatedBias++;
        if (ann.label.toLowerCase() === t.aiSuggestion!.label.toLowerCase()) {
          followedAiWhenWrongCount++;
        }
      });
    }
  });

  const anchoringBiasRate = totalEvaluatedBias > 0
    ? Math.round((followedAiWhenWrongCount / totalEvaluatedBias) * 100)
    : 0;

  const handleModeChange = (mode: AiMode) => {
    storage.updateProject(activeProject.id, {
      aiMode: mode,
      aiEnabled: mode !== 'off'
    });
  };

  const handleRunBatch = async (limit: number = 10) => {
    const targetTasks = (tasksNeedingAi.length > 0 ? tasksNeedingAi : unannotatedTasks).slice(0, limit);
    if (targetTasks.length === 0) {
      alert('All unannotated tasks already have AI suggestions!');
      return;
    }

    setIsRunningBatch(true);
    setBatchProgress(10);

    try {
      setBatchProgress(30);
      const res = await batchPrelabelTasks(activeProject, targetTasks);
      setBatchProgress(80);

      // Save suggestions into storage
      if (res.results) {
        res.results.forEach(item => {
          storage.updateTaskAiSuggestion(item.taskId, item.aiSuggestion);
        });
      }

      setBatchStats({
        count: res.results?.length || targetTasks.length,
        cost: res.estimatedCostUsd || Number((targetTasks.length * 0.00015).toFixed(4)),
        tokens: res.estimatedTokens || targetTasks.length * 300
      });
      setBatchProgress(100);
    } catch (e) {
      console.error('Batch run failed:', e);
      alert('Failed to run batch pre-labeling.');
    } finally {
      setTimeout(() => {
        setIsRunningBatch(false);
        setBatchProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            LLM Assisted Annotation Engine
          </span>
          <span className="text-xs text-slate-400">• {activeProject.name}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          AI Pre-Labeling & Model Evaluation
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl">
          Powered by Gemini 2.5 Flash (<code className="text-indigo-600 font-mono">gemini-3.8-flash</code>). Automatically suggest high-confidence labels, monitor human anchoring bias, and audit cost (Phase 10).
        </p>
      </div>

      {/* Mode Control Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          AI Pre-Labeling Operating Mode
        </h3>
        <p className="text-xs text-slate-500 mb-6 max-w-2xl leading-relaxed">
          Showing AI predictions to humans speeds up throughput by ~2.5x, but introduces anchoring bias. Follow the Phase 10 rollout: test in <em>Hidden</em> mode first to benchmark accuracy, then switch to <em>Show</em>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Option: Off */}
          <div
            onClick={() => handleModeChange('off')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeProject.aiMode === 'off'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Disabled</span>
              {activeProject.aiMode === 'off' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </div>
            <div className="text-base font-bold text-slate-900 mb-1">AI Off</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              No AI suggestions generated or displayed. Pure manual human annotation baseline.
            </p>
          </div>

          {/* Option: Hidden */}
          <div
            onClick={() => handleModeChange('hidden')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeProject.aiMode === 'hidden'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Shadow Testing</span>
              {activeProject.aiMode === 'hidden' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </div>
            <div className="text-base font-bold text-slate-900 mb-1">Hidden Mode (Shadow)</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI pre-labels tasks in the backend, but annotators never see them. Zero bias; perfect for accuracy evaluation.
            </p>
          </div>

          {/* Option: Show */}
          <div
            onClick={() => handleModeChange('show')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeProject.aiMode === 'show'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">3. Active Copilot</span>
              {activeProject.aiMode === 'show' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </div>
            <div className="text-base font-bold text-slate-900 mb-1">Show to Annotators</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Suggestions appear in the Labeling Studio with confidence badges and 1-tap keyboard acceptance.
            </p>
          </div>

        </div>
      </div>

      {/* Batch Pre-labeling Runner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Model: gemini-3.8-flash</span>
              <span>•</span>
              <span className="font-mono">{promptVersion}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Execute Batch Pre-Labeling
            </h2>
            <p className="text-xs text-indigo-200/90 leading-relaxed">
              Classify unannotated rows with Gemini 2.5 Flash. Each task receives an AI label prediction, confidence probability (0.0 to 1.0), and concise reasoning.
            </p>

            <div className="pt-2 text-xs text-indigo-300 font-medium">
              Tasks needing AI: <strong className="text-white">{tasksNeedingAi.length}</strong> of {unannotatedTasks.length} unannotated tasks
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <button
              onClick={() => handleRunBatch(5)}
              disabled={isRunningBatch}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20"
            >
              Run 5 Tasks
            </button>
            <button
              onClick={() => handleRunBatch(15)}
              disabled={isRunningBatch}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              {isRunningBatch ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Predictions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Batch Pre-Label (All)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar when running */}
        {isRunningBatch && (
          <div className="mt-6 pt-4 border-t border-white/15">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-2">
              <span>Streaming Gemini Inference...</span>
              <span>{batchProgress}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${batchProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Batch Stats callout */}
        {batchStats && (
          <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-indigo-300">Generated:</span>
              <div className="font-bold text-white text-base mt-0.5">{batchStats.count} labels</div>
            </div>
            <div>
              <span className="text-indigo-300">Tokens Ingested:</span>
              <div className="font-bold text-white text-base mt-0.5">{batchStats.tokens.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-indigo-300">Est. API Cost:</span>
              <div className="font-bold text-emerald-400 text-base mt-0.5">${batchStats.cost.toFixed(4)}</div>
            </div>
          </div>
        )}
      </div>

      {/* AI Evaluation Metrics (Phase 10 Section 10) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Model Quality & Calibration Audit
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Comparing AI predictions against secret gold tasks to guarantee reliability before exposing labels to annotators.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              AI Accuracy on Gold Tasks
            </div>
            <div className="text-3xl font-black text-indigo-600 font-mono">
              {aiGoldAccuracy !== null ? `${aiGoldAccuracy}%` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {goldTasksWithAi.length} gold tasks evaluated with AI predictions
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Anchoring Bias Rate
            </div>
            <div className="text-3xl font-black text-amber-600 font-mono">
              {anchoringBiasRate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Annotators agreed with AI even when AI was factually wrong
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Prompt Version ID
            </div>
            <div className="text-xl font-bold text-slate-800 font-mono mt-1">
              {promptVersion}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Re-computes automatically if guidelines or examples change
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
