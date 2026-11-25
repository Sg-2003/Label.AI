import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  SkipForward,
  Timer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * TimeTrackerWidget — Labeler's daily stats panel.
 *
 * Shows today's real-time counters (annotations, approved, rejected, skipped,
 * active time).  Auto-refreshes every 30 seconds and when the parent signals
 * new activity via the `refreshTrigger` prop (increment it on each submit).
 *
 * Resets automatically at midnight UTC (the backend creates a fresh doc).
 */
export default function TimeTrackerWidget({ refreshTrigger = 0 }) {
  const [log, setLog] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fallbackDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchLog = useCallback(async () => {
    try {
      const data = await api.getMyTodayLog();
      setLog(data);
    } catch (err) {
      console.error('TimeTracker fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + whenever parent signals an annotation/review/skip
  useEffect(() => {
    let active = true;
    api.getMyTodayLog()
      .then((data) => {
        if (active) setLog(data);
      })
      .catch((err) => console.error('TimeTracker fetch error:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchLog, 30000);
    return () => clearInterval(interval);
  }, [fetchLog]);

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0m 0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !log) return null;

  const data = log || {
    totalAnnotations: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalSkipped: 0,
    totalActiveSeconds: 0,
    firstActionAt: null,
    lastActionAt: null,
    actions: []
  };

  const totalActions =
    data.totalAnnotations + data.totalApproved + data.totalRejected + data.totalSkipped;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '14px 18px',
        marginBottom: '20px',
        borderLeft: '3px solid var(--accent-cyan)'
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Timer size={18} color="var(--accent-cyan)" />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Today's Activity
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {data.date || fallbackDate}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Quick stat badges */}
          <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--accent-primary)'
              }}
            >
              <Tag size={13} />
              <strong>{data.totalAnnotations}</strong>
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--accent-emerald)'
              }}
            >
              <CheckCircle2 size={13} />
              <strong>{data.totalApproved}</strong>
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--accent-rose)'
              }}
            >
              <XCircle size={13} />
              <strong>{data.totalRejected}</strong>
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--accent-amber)'
              }}
            >
              <Clock size={13} />
              <strong>{formatDuration(data.totalActiveSeconds)}</strong>
            </span>
          </div>

          {expanded ? (
            <ChevronUp size={16} color="var(--text-dim)" />
          ) : (
            <ChevronDown size={16} color="var(--text-dim)" />
          )}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div style={{ marginTop: '16px' }}>
          {/* Stat Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            <StatCard
              icon={<Tag size={16} />}
              label="Annotated"
              value={data.totalAnnotations}
              color="var(--accent-primary)"
            />
            <StatCard
              icon={<CheckCircle2 size={16} />}
              label="Approved"
              value={data.totalApproved}
              color="var(--accent-emerald)"
            />
            <StatCard
              icon={<XCircle size={16} />}
              label="Rejected"
              value={data.totalRejected}
              color="var(--accent-rose)"
            />
            <StatCard
              icon={<SkipForward size={16} />}
              label="Skipped"
              value={data.totalSkipped}
              color="var(--accent-amber)"
            />
            <StatCard
              icon={<Clock size={16} />}
              label="Active Time"
              value={formatDuration(data.totalActiveSeconds)}
              color="var(--accent-cyan)"
            />
          </div>

          {/* Clock In/Out */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginBottom: '14px'
            }}
          >
            <span>
              Clock In: <strong style={{ color: '#fff' }}>{formatTime(data.firstActionAt)}</strong>
            </span>
            <span>
              Last Action: <strong style={{ color: '#fff' }}>{formatTime(data.lastActionAt)}</strong>
            </span>
            <span>
              Total Actions: <strong style={{ color: '#fff' }}>{totalActions}</strong>
            </span>
          </div>

          {/* Recent Actions Feed */}
          {data.actions && data.actions.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-dim)',
                  marginBottom: '8px'
                }}
              >
                Recent Actions (last 10)
              </div>
              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {[...data.actions]
                  .reverse()
                  .slice(0, 10)
                  .map((action, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.03)',
                        fontSize: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ActionBadge type={action.type} />
                        {action.label && (
                          <span style={{ color: 'var(--text-muted)' }}>
                            → <strong style={{ color: '#fff' }}>{action.label}</strong>
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', color: 'var(--text-dim)' }}>
                        {action.timeSpentSeconds > 0 && (
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            {action.timeSpentSeconds}s
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {new Date(action.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        textAlign: 'center'
      }}
    >
      <div style={{ color, marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{value}</div>
      <div
        style={{
          fontSize: '0.68rem',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          fontWeight: 600
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ActionBadge({ type }) {
  const configs = {
    annotation: { label: 'LABELED', bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
    review_approve: { label: 'APPROVED', bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
    review_reject: { label: 'REJECTED', bg: 'rgba(244,63,94,0.15)', color: '#fda4af', border: 'rgba(244,63,94,0.3)' },
    skip: { label: 'SKIPPED', bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)' }
  };
  const cfg = configs[type] || configs.annotation;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: '4px',
        fontSize: '0.65rem',
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        letterSpacing: '0.03em'
      }}
    >
      {cfg.label}
    </span>
  );
}

