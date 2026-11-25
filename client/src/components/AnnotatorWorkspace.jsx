import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Clock,
  SkipForward,
  CheckCircle,
  HelpCircle,
  Award,
  AlertTriangle,
  Sparkles,
  Flame,
  RefreshCw
} from 'lucide-react';
import TimeTrackerWidget from './TimeTrackerWidget';

export default function AnnotatorWorkspace({ project, onUpdateStats }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confidence, setConfidence] = useState(5);
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [goldNotification, setGoldNotification] = useState(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [emptyQueue, setEmptyQueue] = useState(false);
  const [timelogTrigger, setTimelogTrigger] = useState(0);

  const timerRef = useRef(null);

  // Load next task for this project
  const loadNextTask = useCallback(async () => {
    setLoading(true);
    setTimeSpent(0);
    setGoldNotification(null);
    try {
      const nextTask = await api.getNextTask(project._id);
      if (!nextTask) {
        setTask(null);
        setEmptyQueue(true);
      } else {
        setTask(nextTask);
        setEmptyQueue(false);
      }
    } catch (err) {
      console.error('Failed to load next task:', err);
    } finally {
      setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    let active = true;
    api.getNextTask(project._id)
      .then((nextTask) => {
        if (!active) return;
        setTimeSpent(0);
        setGoldNotification(null);
        if (!nextTask) {
          setTask(null);
          setEmptyQueue(true);
        } else {
          setTask(nextTask);
          setEmptyQueue(false);
        }
      })
      .catch((err) => console.error('Failed to load next task:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [project._id]);

  // Stopwatch timer for current task
  useEffect(() => {
    if (task && !emptyQueue) {
      timerRef.current = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [task, emptyQueue]);

  // Submit annotation handler
  const handleAnnotate = useCallback(async (labelName) => {
    if (!task || submitting) return;

    setSubmitting(true);
    try {
      const result = await api.submitAnnotation(task._id, {
        label: labelName,
        confidence,
        timeSpentSeconds: timeSpent
      });

      setSessionCount((prev) => prev + 1);
      setTimelogTrigger((prev) => prev + 1);
      if (onUpdateStats) onUpdateStats();

      // Check for gold standard feedback
      if (result.goldFeedback) {
        if (result.goldFeedback.isCorrect) {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.6 }
          });
          setGoldNotification({
            isCorrect: true,
            message: `🌟 Verified Benchmark Match! You correctly identified "${labelName}".`
          });
        } else {
          setGoldNotification({
            isCorrect: false,
            message: `⚠️ Benchmark Check: The standard reference label was "${task.goldLabel}".`
          });
        }
        // Small pause to read feedback then load next
        setTimeout(() => {
          loadNextTask();
        }, 1800);
      } else {
        loadNextTask();
      }
    } catch (err) {
      console.error('Failed to submit annotation:', err);
    } finally {
      setSubmitting(false);
    }
  }, [task, submitting, confidence, timeSpent, onUpdateStats, loadNextTask]);

  // Skip current task
  const handleSkip = useCallback(async () => {
    if (!task || submitting) return;
    setSubmitting(true);
    try {
      await api.skipTask(task._id);
      setTimelogTrigger((prev) => prev + 1);
      loadNextTask();
    } catch (err) {
      console.error('Failed to skip task:', err);
    } finally {
      setSubmitting(false);
    }
  }, [task, submitting, loadNextTask]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // Escape to skip
      if (e.key === 'Escape') {
        handleSkip();
        return;
      }

      // Tab to accept AI recommendation
      if (e.key === 'Tab' && task?.aiSuggestion?.label) {
        e.preventDefault();
        handleAnnotate(task.aiSuggestion.label);
        return;
      }

      // 1-9 to label
      if (project && project.labels) {
        const matchingLabel = project.labels.find(
          (l) => l.shortcutKey === e.key || String(project.labels.indexOf(l) + 1) === e.key
        );
        if (matchingLabel) {
          handleAnnotate(matchingLabel.name);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, project, handleAnnotate, handleSkip]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !task) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading next task from queue...</p>
      </div>
    );
  }

  if (emptyQueue) {
    return (
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '60px auto', padding: '48px 32px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--accent-emerald)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <CheckCircle size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>All Caught Up!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
          There are currently no more pending tasks available for you in <strong>"{project.name}"</strong>.
        </p>
        <button className="btn btn-primary" onClick={loadNextTask}>
          <RefreshCw size={15} /> Check for New Tasks
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '24px auto', padding: '0 20px' }}>
      {/* Daily Time Tracker Widget */}
      <TimeTrackerWidget refreshTrigger={timelogTrigger} />

      {/* Top Workspace Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '12px 18px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{project.name}</span>
          <span className="badge badge-annotator">Overlap: {project.overlapCount}x</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Session streak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Flame size={16} color="var(--accent-amber)" />
            <span style={{ color: 'var(--text-dim)' }}>Session:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{sessionCount}</span>
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            background: 'var(--bg-secondary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)'
          }}>
            <Clock size={14} color="var(--accent-cyan)" />
            <span>{formatTimer(timeSpent)}</span>
          </div>

          {/* Guidelines Toggle */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowGuidelines(!showGuidelines)}
          >
            <HelpCircle size={15} />
            Guidelines
          </button>
        </div>
      </div>

      {/* Guidelines Drawer */}
      {showGuidelines && project.guidelines && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '20px',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          color: '#e2e8f0',
          position: 'relative'
        }}>
          <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--accent-cyan)' }}>
            Annotation Rules & Guidelines:
          </strong>
          {project.guidelines}
        </div>
      )}

      {/* Gold standard toast feedback */}
      {goldNotification && (
        <div style={{
          background: goldNotification.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          border: `1px solid ${goldNotification.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-amber)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: goldNotification.isCorrect ? '#6ee7b7' : '#fcd34d',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {goldNotification.isCorrect ? <Award size={20} /> : <AlertTriangle size={20} />}
          <span>{goldNotification.message}</span>
        </div>
      )}

      {/* Main Task Inspection Card */}
      <div className="glass-panel" style={{ padding: '36px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
            Text Classification Sample #{task?._id?.slice(-6)}
          </span>
          {task?.isGoldStandard && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              Benchmark Task
            </span>
          )}
        </div>

        {/* Text Subject Area */}
        <div style={{
          fontSize: '1.25rem',
          lineHeight: 1.7,
          color: '#ffffff',
          fontWeight: 500,
          padding: '24px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          minHeight: '120px',
          marginBottom: '20px'
        }}>
          "{task?.data?.text}"
        </div>

        {/* Metadata Chips if present */}
        {task?.data?.metadata && Object.keys(task.data.metadata).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {Object.entries(task.data.metadata).map(([key, val]) => (
              <div key={key} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)'
              }}>
                <span style={{ color: 'var(--text-dim)' }}>{key}: </span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{String(val)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Confidence selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Annotation Confidence:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className="btn btn-sm"
                onClick={() => setConfidence(lvl)}
                style={{
                  background: confidence === lvl ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: confidence === lvl ? '#fff' : 'var(--text-muted)',
                  border: confidence === lvl ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  padding: '4px 10px',
                  fontSize: '0.75rem'
                }}
              >
                ★ {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assist Pre-label Suggestion */}
      {task?.aiSuggestion?.label && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.12))',
          border: '1px solid var(--border-glow)',
          marginBottom: '14px',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                AI Pre-Label Recommendation
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>"{task.aiSuggestion.label}"</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  ({Math.round(task.aiSuggestion.confidence * 100)}% match)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleAnnotate(task.aiSuggestion.label)}
            disabled={submitting}
            style={{ padding: '8px 14px' }}
          >
            Accept Suggestion <span className="kbd" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Tab</span>
          </button>
        </div>
      )}

      {/* Dynamic Label Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Select Class (Use hotkeys 1-9 to label instantly):
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleSkip} disabled={submitting}>
            <SkipForward size={14} />
            Skip Task <span className="kbd" style={{ marginLeft: '4px' }}>Esc</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
          gap: '12px'
        }}>
          {project?.labels?.map((label, idx) => {
            const hotkey = label.shortcutKey || (idx + 1).toString();
            return (
              <button
                key={label.name}
                type="button"
                disabled={submitting}
                onClick={() => handleAnnotate(label.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border-subtle)`,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = label.color || 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${label.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: label.color || 'var(--accent-primary)'
                  }} />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    {label.name}
                  </span>
                </div>

                <span className="kbd" style={{ fontSize: '0.8rem', padding: '3px 8px' }}>
                  {hotkey}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
