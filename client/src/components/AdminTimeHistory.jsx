import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  SkipForward,
  Users,
  Search,
  ArrowLeft,
  Timer,
  User as UserIcon
} from 'lucide-react';

/**
 * AdminTimeHistory — Full-page admin panel to browse all employees'
 * daily time-tracker records with drill-down into individual user/date
 * action logs.
 */
export default function AdminTimeHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(daysAgo(7));
  const [endDate, setEndDate] = useState(todayStr());
  const [filterUserId, setFilterUserId] = useState('');

  // Drill-down state
  const [detailLog, setDetailLog] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getTimelogHistory(startDate, endDate, filterUserId || undefined);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load time history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.getTimelogHistory(startDate, endDate, filterUserId || undefined)
      .then((data) => {
        if (active) setLogs(data.logs || []);
      })
      .catch((err) => console.error('Failed to load time history:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setDetailLog(null);
    fetchHistory();
  };

  const viewDetail = async (userId, date) => {
    try {
      const log = await api.getUserDayLog(userId, date);
      setDetailLog(log);
    } catch (err) {
      console.error('Failed to load detail:', err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Aggregate summary across all visible logs
  const summary = logs.reduce(
    (acc, l) => {
      acc.totalAnnotations += l.totalAnnotations || 0;
      acc.totalApproved += l.totalApproved || 0;
      acc.totalRejected += l.totalRejected || 0;
      acc.totalSkipped += l.totalSkipped || 0;
      acc.totalActiveSeconds += l.totalActiveSeconds || 0;
      return acc;
    },
    { totalAnnotations: 0, totalApproved: 0, totalRejected: 0, totalSkipped: 0, totalActiveSeconds: 0 }
  );

  // If viewing a detail log
  if (detailLog) {
    return (
      <div style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 20px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setDetailLog(null)}
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={14} /> Back to Overview
        </button>

        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Detail Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                <UserIcon size={18} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} />
                {detailLog.userId?.name || 'Unknown User'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {detailLog.userId?.email} · {detailLog.date}
              </div>
            </div>
            <span
              className={`badge badge-${detailLog.userId?.role || 'annotator'}`}
            >
              {(detailLog.userId?.role || 'annotator').toUpperCase()}
            </span>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <SummaryCard icon={<Tag size={16} />} label="Annotated" value={detailLog.totalAnnotations} color="var(--accent-primary)" />
            <SummaryCard icon={<CheckCircle2 size={16} />} label="Approved" value={detailLog.totalApproved} color="var(--accent-emerald)" />
            <SummaryCard icon={<XCircle size={16} />} label="Rejected" value={detailLog.totalRejected} color="var(--accent-rose)" />
            <SummaryCard icon={<SkipForward size={16} />} label="Skipped" value={detailLog.totalSkipped} color="var(--accent-amber)" />
            <SummaryCard icon={<Clock size={16} />} label="Active Time" value={formatDuration(detailLog.totalActiveSeconds)} color="var(--accent-cyan)" />
          </div>

          {/* Clock In/Out */}
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            <span>Clock In: <strong style={{ color: '#fff' }}>{formatTime(detailLog.firstActionAt)}</strong></span>
            <span>Last Action: <strong style={{ color: '#fff' }}>{formatTime(detailLog.lastActionAt)}</strong></span>
          </div>

          {/* Full Action Log Table */}
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '10px' }}>
            Complete Action Log ({detailLog.actions?.length || 0} actions)
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Label</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {(detailLog.actions || []).map((action, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>
                      {new Date(action.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td style={tdStyle}>
                      <ActionBadge type={action.type} />
                    </td>
                    <td style={{ ...tdStyle, color: '#fff', fontWeight: 600 }}>
                      {action.label || '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {action.timeSpentSeconds > 0 ? `${action.timeSpentSeconds}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Timer size={24} color="var(--accent-cyan)" />
            Employee Time Tracker
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            CVAT-style daily work monitoring · Approvals, Rejections, Active Time
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <form
        onSubmit={handleSearch}
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <label style={labelStyle}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '160px' }}
          />
        </div>
        <div>
          <label style={labelStyle}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: '160px' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Filter by User ID (optional)</label>
          <input
            type="text"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            placeholder="Paste user ID to filter..."
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '10px 18px' }}>
          <Search size={14} /> Search
        </button>
      </form>

      {/* Aggregate Summary Ribbon */}
      {logs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <SummaryCard icon={<Users size={16} />} label="Records" value={logs.length} color="var(--text-muted)" />
          <SummaryCard icon={<Tag size={16} />} label="Annotations" value={summary.totalAnnotations} color="var(--accent-primary)" />
          <SummaryCard icon={<CheckCircle2 size={16} />} label="Approved" value={summary.totalApproved} color="var(--accent-emerald)" />
          <SummaryCard icon={<XCircle size={16} />} label="Rejected" value={summary.totalRejected} color="var(--accent-rose)" />
          <SummaryCard icon={<SkipForward size={16} />} label="Skipped" value={summary.totalSkipped} color="var(--accent-amber)" />
          <SummaryCard icon={<Clock size={16} />} label="Total Time" value={formatDuration(summary.totalActiveSeconds)} color="var(--accent-cyan)" />
        </div>
      )}

      {/* Results Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading time logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No time logs found for this date range.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Role</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Annotated</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Approved</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Rejected</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Skipped</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Active Time</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Clock In</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const userName = log.userId?.name || 'Unknown';
                const userEmail = log.userId?.email || '';
                const userRole = log.userId?.role || 'annotator';
                const uid = log.userId?._id || log.userId;
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => viewDetail(uid, log.date)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {log.date}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{userName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{userEmail}</div>
                    </td>
                    <td style={tdStyle}>
                      <span className={`badge badge-${userRole}`}>
                        {userRole.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {log.totalAnnotations}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {log.totalApproved}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: 'var(--accent-rose)' }}>
                      {log.totalRejected}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: 'var(--accent-amber)' }}>
                      {log.totalSkipped}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {formatDuration(log.totalActiveSeconds)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {formatTime(log.firstActionAt)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          background: 'var(--bg-elevated)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)'
                        }}
                      >
                        {log.actions?.length || 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ——————————— Helpers ——————————— */

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-dim)',
  marginBottom: '4px'
};

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-dim)'
};

const tdStyle = {
  padding: '10px 14px',
  color: 'var(--text-muted)'
};

function SummaryCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        textAlign: 'center'
      }}
    >
      <div style={{ color, marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 }}>
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

