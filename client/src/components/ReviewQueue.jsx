import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  MessageSquare,
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function ReviewQueue({ project, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [finalLabel, setFinalLabel] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadQueue = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const queue = await api.getReviewQueue(project._id);
      setTasks(queue);
      if (queue.length > 0) {
        setSelectedTask(queue[0]);
        setFinalLabel(queue[0].annotations?.[0]?.label || '');
      } else {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [project?._id]);

  const handleDecision = async (decision) => {
    if (!selectedTask || submitting) return;

    if (decision !== 'rejected' && !finalLabel) {
      alert('Please select or enter the final approved label');
      return;
    }

    setSubmitting(true);
    try {
      await api.reviewTask(selectedTask._id, {
        decision,
        finalLabel,
        comments
      });

      setMessage(`Task successfully ${decision}!`);
      setTimeout(() => setMessage(''), 3000);
      setComments('');

      // Reload queue
      loadQueue();
    } catch (err) {
      console.error('Review decision failed:', err);
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading review queue...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert color="var(--accent-cyan)" />
            Review Queue & Conflict Resolution
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Resolve label disagreements and ties for <strong>"{project?.name}"</strong>
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadQueue}>
          <RefreshCw size={14} /> Refresh ({tasks.length})
        </button>
      </div>

      {message && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--accent-emerald)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          color: '#6ee7b7',
          marginBottom: '20px',
          fontWeight: 600
        }}>
          {message}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>No Disagreements in Queue</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            All task annotations have achieved clear consensus agreement!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Left: Task List in review */}
          <div className="glass-panel" style={{ padding: '16px', maxHeight: '700px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Pending Tasks ({tasks.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.map((t) => {
                const isSelected = selectedTask?._id === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => {
                      setSelectedTask(t);
                      setFinalLabel(t.annotations?.[0]?.label || '');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-elevated)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.data.text}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>{t.annotations?.length || 0} votes</span>
                      <span style={{ color: 'var(--accent-amber)' }}>Disagreement</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Inspection & Decision Console */}
          {selectedTask && (
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Task Content to Review
              </div>

              <div style={{
                fontSize: '1.15rem',
                lineHeight: 1.6,
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                marginBottom: '24px'
              }}>
                "{selectedTask.data.text}"
              </div>

              {/* Conflicting Annotations Breakdown */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                  Submitted Annotator Votes ({selectedTask.annotations?.length || 0}):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedTask.annotations?.map((ann) => (
                    <div
                      key={ann._id}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                        {ann.userId?.name || 'Annotator'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                          {ann.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ★ {ann.confidence}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer Action Area */}
              <div style={{
                background: 'var(--bg-elevated)',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                  Expert Reviewer Decision
                </div>

                {/* Final Label Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Select / Override Final Label:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {project.labels?.map((lbl) => (
                      <button
                        key={lbl.name}
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setFinalLabel(lbl.name)}
                        style={{
                          background: finalLabel === lbl.name ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: finalLabel === lbl.name ? '#fff' : 'var(--text-main)',
                          border: finalLabel === lbl.name ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                        }}
                      >
                        {lbl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments / Notes */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Review Decision Notes (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarcasm identified in review text, marked as Negative."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={submitting}
                    onClick={() => handleDecision('approved')}
                  >
                    <Check size={16} /> Approve "{finalLabel}"
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={submitting}
                    onClick={() => handleDecision('overridden')}
                  >
                    <Sparkles size={16} /> Override with "{finalLabel}"
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={submitting}
                    onClick={() => handleDecision('rejected')}
                  >
                    <RotateCcw size={16} /> Reject & Re-queue Task
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
