import React, { useState } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, X } from 'lucide-react';

const PRESET_COLORS = [
  '#10B981', // emerald
  '#EF4444', // red
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#6B7280'  // gray
];

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [overlapCount, setOverlapCount] = useState(3);
  const [labels, setLabels] = useState([
    { name: 'Positive', color: '#10B981', shortcutKey: '1' },
    { name: 'Negative', color: '#EF4444', shortcutKey: '2' },
    { name: 'Neutral', color: '#6B7280', shortcutKey: '3' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddLabel = () => {
    const nextKey = (labels.length + 1).toString();
    const nextColor = PRESET_COLORS[labels.length % PRESET_COLORS.length];
    setLabels([...labels, { name: '', color: nextColor, shortcutKey: nextKey }]);
  };

  const handleRemoveLabel = (index) => {
    if (labels.length <= 2) {
      setError('A project requires at least 2 classification labels');
      return;
    }
    setLabels(labels.filter((_, idx) => idx !== index));
  };

  const handleLabelChange = (index, field, value) => {
    const updated = [...labels];
    updated[index][field] = value;
    setLabels(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const emptyLabel = labels.find((l) => !l.name.trim());
    if (emptyLabel) {
      setError('All labels must have a name');
      return;
    }

    setLoading(true);
    try {
      const project = await api.createProject({
        name,
        description,
        guidelines,
        overlapCount: Number(overlapCount),
        labels: labels.map((l, idx) => ({
          name: l.name.trim(),
          color: l.color,
          shortcutKey: l.shortcutKey || (idx + 1).toString()
        }))
      });
      onProjectCreated(project);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
              Create Annotation Project
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure task consensus parameters and label taxonomy
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: '0.85rem',
            color: '#fda4af',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Project Name *
            </label>
            <input
              type="text"
              placeholder="e.g. LLM Prompt Safety Classifier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Explain the purpose and domain of this labeling project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Overlap Count (Annotations per task)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={overlapCount}
                onChange={(e) => setOverlapCount(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Requires {overlapCount} human votes for consensus
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Task Type
              </label>
              <select disabled value="text_classification">
                <option value="text_classification">Text Classification</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Annotation Guidelines & Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Provide clear rules for annotators on how to handle edge cases and ambiguous text..."
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
            />
          </div>

          {/* Labels Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Classification Labels ({labels.length})
              </label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddLabel}>
                <Plus size={14} /> Add Label
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {labels.map((label, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--bg-elevated)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {/* Color pill */}
                  <input
                    type="color"
                    value={label.color}
                    onChange={(e) => handleLabelChange(idx, 'color', e.target.value)}
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: '0',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: 'none'
                    }}
                  />

                  {/* Name */}
                  <input
                    type="text"
                    placeholder="Label name (e.g. Toxic)"
                    value={label.name}
                    onChange={(e) => handleLabelChange(idx, 'name', e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                    required
                  />

                  {/* Hotkey */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Key:</span>
                    <input
                      type="text"
                      maxLength={1}
                      value={label.shortcutKey}
                      onChange={(e) => handleLabelChange(idx, 'shortcutKey', e.target.value)}
                      style={{
                        width: '36px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        padding: '6px',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemoveLabel(idx)}
                    style={{ padding: '6px', color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
