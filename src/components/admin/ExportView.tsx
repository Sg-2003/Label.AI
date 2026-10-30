import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { Download, FileJson, FileSpreadsheet, Copy, Check, Sparkles, Filter } from 'lucide-react';

export const ExportView: React.FC = () => {
  const { activeProject } = useAuth();
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeOnlyCompleted, setIncludeOnlyCompleted] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">No project selected</div>;
  }

  const tasks = storage.getTasks(activeProject.id);
  const annotations = storage.getAnnotations(activeProject.id);

  // Filter tasks (excluding gold standard tasks per Phase 9 & 11)
  const eligibleTasks = tasks.filter(t => {
    if (t.isGold) return false;
    if (includeOnlyCompleted) return t.status === 'completed';
    return true;
  });

  // Prepare JSON dataset
  const jsonExportData = {
    projectId: activeProject.id,
    projectName: activeProject.name,
    taskType: activeProject.taskType,
    exportedAt: new Date().toISOString(),
    totalTasks: eligibleTasks.length,
    tasks: eligibleTasks.map(t => {
      const taskAnns = annotations.filter(a => a.taskId === t.id);
      return {
        id: t.id,
        text: t.data.text,
        status: t.status,
        finalLabel: t.finalLabel ? {
          label: t.finalLabel.label,
          method: t.finalLabel.method,
          resolvedAt: t.finalLabel.resolvedAt
        } : null,
        aiSuggestion: t.aiSuggestion ? {
          label: t.aiSuggestion.label,
          confidence: t.aiSuggestion.confidence,
          model: t.aiSuggestion.model
        } : null,
        annotations: taskAnns.map(a => ({
          userId: a.userId,
          label: a.label,
          timeTakenSeconds: a.timeTakenSeconds,
          usedAiSuggestion: a.usedAiSuggestion
        })),
        meta: t.data.meta || {}
      };
    })
  };

  const jsonString = JSON.stringify(jsonExportData, null, 2);

  // Prepare CSV dataset
  const csvHeaders = ['task_id', 'text', 'final_label', 'resolution_method', 'ai_label', 'ai_confidence', 'votes_count'];
  const csvRows = eligibleTasks.map(t => {
    const rawContent = t.data.text || t.data.imageUrl || '';
    const textEscaped = `"${rawContent.replace(/"/g, '""')}"`;
    return [

      t.id,
      textEscaped,
      t.finalLabel?.label || 'UNRESOLVED',
      t.finalLabel?.method || 'none',
      t.aiSuggestion?.label || '',
      t.aiSuggestion?.confidence || '',
      t.annotationCount
    ].join(',');
  });
  const csvString = [csvHeaders.join(','), ...csvRows].join('\n');

  const handleDownload = () => {
    const content = format === 'json' ? jsonString : csvString;
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const filename = `${activeProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_dataset.${format}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const content = format === 'json' ? jsonString : csvString;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Dataset Exporter
            </span>
            <span className="text-xs text-slate-400">• {activeProject.name}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Export Labeled Dataset
          </h1>
          <p className="text-xs text-slate-500">
            Export verified labels formatted for fine-tuning LLMs, PyTorch/TensorFlow training, or Hugging Face.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download {format.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Format Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 mr-1">File Format:</span>
          <button
            onClick={() => setFormat('json')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              format === 'json' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON (Full Object)</span>
          </button>
          <button
            onClick={() => setFormat('csv')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              format === 'csv' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV (Tabular)</span>
          </button>
        </div>

        {/* Filter completed only checkbox */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={includeOnlyCompleted}
            onChange={(e) => setIncludeOnlyCompleted(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Export only finalized & agreed tasks ({eligibleTasks.length} items)</span>
        </label>

      </div>

      {/* Code / Data Preview Box */}
      <div className="bg-slate-900 rounded-3xl p-6 text-slate-300 font-mono text-xs overflow-hidden border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-slate-400 mb-4">
          <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-400">
            Preview Output ({eligibleTasks.length} rows)
          </span>
          <span className="text-[11px] font-mono">
            {format === 'json' ? 'application/json' : 'text/csv'}
          </span>
        </div>

        <pre className="max-h-96 overflow-y-auto leading-relaxed select-all">
          {format === 'json' ? jsonString.slice(0, 3000) : csvString.slice(0, 2000)}
          {((format === 'json' && jsonString.length > 3000) || (format === 'csv' && csvString.length > 2000)) && (
            <span className="text-slate-500 italic block mt-2">
              ... ({format === 'json' ? jsonString.length : csvString.length} total bytes truncated for preview)
            </span>
          )}
        </pre>
      </div>

    </div>
  );
};
