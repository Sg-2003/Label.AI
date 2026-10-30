import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { Task, LabelDefinition } from '../../types';
import { readableTextColor } from '../../utils/color';
import {
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Award,
  Flag,
  FileText,
  X,
  Database
} from 'lucide-react';

export const TasksManager: React.FC = () => {
  const { activeProject } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddGoldModal, setShowAddGoldModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Form states for gold task
  const [goldText, setGoldText] = useState<string>('');
  const [goldLabel, setGoldLabel] = useState<string>('');

  // Import state
  const [csvContent, setCsvContent] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">No project selected</div>;
  }

  const tasks = storage.getTasks(activeProject.id);

  // Filter & search
  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'completed' && t.status !== 'completed') return false;
    if (filterStatus === 'in_review' && t.status !== 'in_review') return false;
    if (filterStatus === 'pending' && t.status !== 'pending' && t.status !== 'in_progress') return false;
    if (filterStatus === 'gold' && !t.isGold) return false;
    if (filterStatus === 'flagged' && (!t.flags || t.flags.length === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const content = (t.data.text || t.data.imageUrl || '').toLowerCase();
      return content.includes(q) || t.id.toLowerCase().includes(q);
    }

    return true;
  });

  const handleAddGoldTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goldText.trim() || !goldLabel) return;

    storage.addGoldTask(activeProject.id, goldText.trim(), goldLabel);
    setGoldText('');
    setGoldLabel('');
    setShowAddGoldModal(false);
  };

  const handleImportCSV = () => {
    if (!csvContent.trim()) return;

    // Parse simple CSV line by line
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert('CSV must contain a header row and at least one data row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const textColIdx = headers.findIndex(h => h.includes('text') || h.includes('review') || h.includes('content') || h.includes('body'));
    const goldColIdx = headers.findIndex(h => h.includes('gold') || h.includes('label'));

    if (textColIdx === -1) {
      alert('Could not find a text column (expected header named "text", "review", or "content").');
      return;
    }

    const rowsToImport = lines.slice(1).map(line => {
      // Basic CSV split considering quotes
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      const text = parts[textColIdx] || '';
      const gold = goldColIdx !== -1 ? parts[goldColIdx] : undefined;
      return { text, goldLabel: gold };
    });

    const result = storage.importTasks(activeProject.id, rowsToImport);
    setImportStatus(`Successfully imported ${result.imported} task(s)! (${result.skipped} skipped)`);
    setTimeout(() => {
      setImportStatus(null);
      setShowImportModal(false);
      setCsvContent('');
    }, 2000);
  };

  const loadSampleDataset = () => {
    const sampleRows = [
      { text: "Spectacular visual direction and an unforgettable soundtrack made this an instant classic.", goldLabel: "Positive" },
      { text: "A confusing mess of plot holes that tested my endurance to sit through.", goldLabel: "Negative" },
      { text: "The presentation lasted one hour and forty-five minutes with a ten minute intermission.", goldLabel: "Neutral" },
      { text: "The lead actors had no chemistry whatsoever, making romantic scenes cringe-worthy.", goldLabel: "Negative" },
      { text: "An emotionally resonant journey with stellar sound engineering and poignant framing.", goldLabel: "Positive" }
    ];
    storage.importTasks(activeProject.id, sampleRows);
    alert('Imported 5 additional sample tasks!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tasks & Dataset Repository
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {tasks.length} total items
            </span>
          </div>
          <p className="text-xs text-slate-500">
            View dataset rows, inspect annotations, insert secret gold standard questions, and upload CSV batches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowAddGoldModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Add Gold Task</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Items', count: tasks.length },
            { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed' && !t.isGold).length },
            { id: 'in_review', label: 'In Review', count: tasks.filter(t => t.status === 'in_review' && !t.isGold).length },
            { id: 'pending', label: 'Pending', count: tasks.filter(t => (t.status === 'pending' || t.status === 'in_progress') && !t.isGold).length },
            { id: 'gold', label: 'Gold Standards', count: tasks.filter(t => t.isGold).length },
            { id: 'flagged', label: 'Flagged', count: tasks.filter(t => t.flags && t.flags.length > 0).length },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search task text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No tasks match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {filteredTasks.map((t) => {
              const matchingFinal = t.finalLabel ? activeProject.labels.find(l => l.name === t.finalLabel?.label) : null;
              const matchingGold = t.goldLabel ? activeProject.labels.find(l => l.name === t.goldLabel) : null;

              return (
                <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Left: Text & Badges */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {t.id}
                      </span>

                      {/* Status */}
                      {t.isGold ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Award className="w-3 h-3 text-amber-600" />
                          Gold Task (Ground Truth: <strong>{t.goldLabel}</strong>)
                        </span>
                      ) : t.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Finalized ({t.finalLabel?.method})
                        </span>
                      ) : t.status === 'in_review' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          In Review Queue
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {t.annotationCount} / {activeProject.overlapCount} Annotations
                        </span>
                      )}

                      {/* AI Suggestion tag */}
                      {t.aiSuggestion && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          AI: {t.aiSuggestion.label} ({Math.round(t.aiSuggestion.confidence * 100)}%)
                        </span>
                      )}

                      {/* Flags */}
                      {t.flags && t.flags.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <Flag className="w-3 h-3" /> Flagged
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                      {t.data.text}
                    </p>

                    {/* Annotators list */}
                    {t.annotatedBy.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <span>Annotated by:</span>
                        <div className="flex items-center gap-1">
                          {t.annotatedBy.map(uid => {
                            const u = storage.getUser(uid);
                            return (
                              <span key={uid} className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {u?.name || uid}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Final Decision Badge */}
                  <div className="shrink-0 flex items-center sm:flex-col sm:items-end gap-2">
                    {t.finalLabel ? (
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style={{
                          backgroundColor: matchingFinal?.color || '#0f172a',
                          color: matchingFinal ? readableTextColor(matchingFinal.color) : '#ffffff'
                        }}
                      >
                        {t.finalLabel.label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Unresolved
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Gold Standard Modal */}
      {showAddGoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setShowAddGoldModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Secret Gold Standard Task</h3>
                <p className="text-xs text-slate-500">Known-answer verification question (Phase 9 Tool 4)</p>
              </div>
            </div>

            <form onSubmit={handleAddGoldTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Task Text
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste unambiguous data example..."
                  value={goldText}
                  onChange={(e) => setGoldText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Ground Truth Correct Label
                </label>
                <select
                  required
                  value={goldLabel}
                  onChange={(e) => setGoldLabel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">Select known correct label...</option>
                  {activeProject.labels.map(l => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
                Annotators will be secretly tested against this question without knowing it's a test. Accuracy will be tallied in quality scorecards.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoldModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Gold Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Import Dataset (CSV)</h3>
                <p className="text-xs text-slate-500">Upload rows or paste comma-separated content</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  CSV Content
                </label>
                <button
                  onClick={loadSampleDataset}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Quick Load 5 Samples
                </button>
              </div>

              <textarea
                rows={7}
                placeholder={'text,gold_label\n"The movie was an utter masterwork of acting","Positive"\n"Terrible pacing and bad dialogue","Negative"'}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />

              <div className="text-[11px] text-slate-500 leading-relaxed">
                Header requirement: CSV must have a <code className="font-bold text-slate-700">text</code> column. Optionally include a <code className="font-bold text-slate-700">gold_label</code> column to automatically create gold tasks.
              </div>

              {importStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                  {importStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportCSV}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Parse & Import Tasks
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
