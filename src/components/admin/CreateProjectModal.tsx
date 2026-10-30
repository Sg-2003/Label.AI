import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { PRESET_LABEL_COLORS, getNextLabelColor, readableTextColor } from '../../utils/color';
import { LabelDefinition, AiExample, MajorityPolicy, AiMode } from '../../types';
import { X, Plus, Trash2, Sparkles, FolderPlus, ArrowRight } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [overlapCount, setOverlapCount] = useState<number>(3);
  const [majorityPolicy, setMajorityPolicy] = useState<MajorityPolicy>('auto');
  const [aiMode, setAiMode] = useState<AiMode>('show');
  
  const [labels, setLabels] = useState<LabelDefinition[]>([
    { id: '1', name: 'Positive', color: '#22c55e', shortcutKey: '1', description: 'Positive sentiment' },
    { id: '2', name: 'Negative', color: '#ef4444', shortcutKey: '2', description: 'Negative sentiment' },
    { id: '3', name: 'Neutral', color: '#64748b', shortcutKey: '3', description: 'Neutral or objective' }
  ]);

  const [newLabelName, setNewLabelName] = useState('');
  const [examples, setExamples] = useState<AiExample[]>([
    { text: 'A captivating and visually stunning experience.', label: 'Positive' },
    { text: 'Painfully slow and utterly predictable.', label: 'Negative' }
  ]);
  const [exText, setExText] = useState('');
  const [exLabel, setExLabel] = useState('');

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    const nextColor = getNextLabelColor(labels.length);
    const shortcut = String(labels.length + 1);
    const newLbl: LabelDefinition = {
      id: String(Date.now()),
      name: newLabelName.trim(),
      color: nextColor,
      shortcutKey: shortcut
    };
    setLabels([...labels, newLbl]);
    setNewLabelName('');
  };

  const handleRemoveLabel = (id: string) => {
    if (labels.length <= 2) {
      alert('Projects must have at least 2 labels.');
      return;
    }
    setLabels(labels.filter(l => l.id !== id));
  };

  const handleAddExample = () => {
    if (!exText.trim() || !exLabel) return;
    setExamples([...examples, { text: exText.trim(), label: exLabel }]);
    setExText('');
    setExLabel('');
  };

  const handleRemoveExample = (idx: number) => {
    setExamples(examples.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (labels.length < 2) {
      alert('Must have at least 2 labels.');
      return;
    }

    const currentUsers = storage.getUsers();
    const defaultAnnotators = currentUsers.filter(u => u.role === 'annotator').slice(0, 3);
    const defaultReviewer = currentUsers.find(u => u.role === 'reviewer') || currentUsers[0];

    const project = storage.createProject({
      name: name.trim(),
      description: description.trim() || 'Data annotation project',
      taskType: 'text_classification',
      labels,
      guidelines: guidelines.trim() || 'Label each item according to the category definitions.',
      overlapCount,
      majorityPolicy,
      aiEnabled: aiMode !== 'off',
      aiMode,
      aiModel: 'gemini-3.8-flash',
      aiExamples: examples,
      goldRate: 0.15,
      status: 'draft',
      members: [
        ...defaultAnnotators.map(a => ({ userId: a.id, role: 'annotator' as const, assignedAt: new Date().toISOString() })),
        { userId: defaultReviewer.id, role: 'reviewer' as const, assignedAt: new Date().toISOString() }
      ]
    });

    onCreated(project.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 relative my-8">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Annotation Project</h2>
            <p className="text-xs text-slate-500">Configure label schemas, guidelines, and consensus policies</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Legal Contract Clause Risk Analysis"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Short Description
              </label>
              <input
                type="text"
                placeholder="Brief one-line goal of the annotation task"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Annotation Guidelines *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Detailed instructions for annotators on how to handle ambiguous cases and edge cases..."
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white leading-relaxed"
              />
            </div>
          </div>

          {/* Labels Manager */}
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Label Taxonomy ({labels.length} classes)
                </h4>
                <p className="text-[11px] text-slate-500">Each label maps to a keyboard shortcut for fast annotation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add class label name..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLabel();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {labels.map((lbl, idx) => (
                <div
                  key={lbl.id}
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: lbl.color }}
                    />
                    <span className="text-xs font-bold text-slate-800">{lbl.name}</span>
                    <kbd className="px-1.5 py-0.2 bg-slate-100 text-[10px] text-slate-600 rounded font-mono font-bold">
                      {lbl.shortcutKey || (idx + 1)}
                    </kbd>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(lbl.id)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Overlap & Policies Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Overlap Count
              </label>
              <select
                value={overlapCount}
                onChange={(e) => setOverlapCount(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value={1}>1 (Single annotator)</option>
                <option value={2}>2 (Dual overlap)</option>
                <option value={3}>3 (Triple consensus - standard)</option>
                <option value={5}>5 (High agreement)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Majority Policy
              </label>
              <select
                value={majorityPolicy}
                onChange={(e) => setMajorityPolicy(e.target.value as MajorityPolicy)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="auto">Auto-Approve Majority</option>
                <option value="manual">Always Review Disagreement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                AI Pre-Labeling
              </label>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value as AiMode)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/50"
              >
                <option value="show">Show (AI Copilot)</option>
                <option value="hidden">Hidden (Shadow Mode)</option>
                <option value="off">Off (Manual Only)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Create Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
