import React from 'react';
import { X, Keyboard, CheckCircle2, ArrowRight } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 - 9', desc: 'Select label by number', context: 'Labeling Studio' },
    { key: 'Enter / Tab', desc: 'Accept AI Suggestion directly', context: 'Labeling Studio' },
    { key: 'S', desc: 'Skip current task', context: 'Labeling Studio' },
    { key: 'F', desc: 'Flag task for ambiguity/issues', context: 'Labeling Studio' },
    { key: 'G', desc: 'Toggle guidelines drawer', context: 'Labeling Studio' },
    { key: '?', desc: 'Open / close this shortcuts helper', context: 'Global' },
    { key: 'Esc', desc: 'Close open dialogs or drawers', context: 'Global' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Keyboard Shortcuts</h3>
            <p className="text-xs text-slate-500">Fast, mouse-free annotation workflow</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden mb-5">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-700">{sc.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-semibold font-mono text-slate-800 bg-white border border-slate-200 rounded-md shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 mb-5">
          <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Shortcuts are active whenever you are in the Labeling Studio. Ensure the task card or viewport is focused.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
