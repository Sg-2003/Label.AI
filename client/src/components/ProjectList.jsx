import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FolderPlus,
  UploadCloud,
  Download,
  BarChart2,
  Play,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Pause,
  Award,
  Users,
  ShieldCheck
} from 'lucide-react';

export default function ProjectList({
  user,
  onSelectProjectForAnnotation,
  onOpenCreateProject,
  onOpenUploadCSV
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStats, setSelectedStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleExport = async (projectId, format) => {
    setExportingId(projectId);
    try {
      await api.exportDataset(projectId, format, false);
      showNotification(`Dataset exported as ${format.toUpperCase()}`);
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setExportingId(null);
    }
  };

  const handleAIPrelabel = async (projectId) => {
    try {
      const res = await api.triggerAIPrelabel(projectId);
      showNotification(`Generated AI suggestions for ${res.count} tasks!`);
      loadProjects();
    } catch (err) {
      alert(err.message || 'AI pre-labeling failed');
    }
  };

  const handleToggleStatus = async (project) => {
    const nextStatus = project.status === 'paused' ? 'active' : 'paused';
    try {
      await api.updateProjectStatus(project._id, nextStatus);
      showNotification(`Project status updated to "${nextStatus}"`);
      loadProjects();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleViewStats = async (projectId) => {
    setStatsLoading(true);
    try {
      const stats = await api.getProjectStats(projectId);
      setSelectedStats(stats);
    } catch (err) {
      alert(err.message || 'Failed to fetch project stats');
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={36} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading projects...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Annotation Projects
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage datasets, annotation taxonomies, consensus quality, and exports
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadProjects}>
            <RefreshCw size={14} /> Refresh
          </button>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={onOpenCreateProject}>
              <FolderPlus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--accent-emerald)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          color: '#6ee7b7',
          marginBottom: '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {projects.map((proj) => {
          const total = proj.counts?.total || 0;
          const completed = proj.counts?.completed || 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isPaused = proj.status === 'paused';

          return (
            <div
              key={proj._id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    {proj.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {proj.aiEnabled && (
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-cyan)' }}>
                        <Sparkles size={11} /> AI Assist
                      </span>
                    )}
                    <span className={`badge badge-${proj.status === 'active' ? 'annotator' : 'admin'}`}>
                      {proj.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {proj.description || 'No description provided.'}
                </p>

                {/* Labels Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  {proj.labels?.map((l) => (
                    <span
                      key={l.name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '9999px',
                        padding: '3px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-main)'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color }} />
                      {l.name}
                    </span>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    <span>Consensus Completion</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{completed} / {total} ({percent}%)</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '9999px',
                    background: 'var(--bg-secondary)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={isPaused}
                    onClick={() => onSelectProjectForAnnotation(proj)}
                  >
                    <Play size={14} /> {isPaused ? 'Project Paused' : 'Start Labeling'}
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleViewStats(proj._id)}
                  >
                    <BarChart2 size={14} /> Analytics
                  </button>
                </div>

                {user?.role === 'admin' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', border: '1px solid var(--border-subtle)', padding: '5px' }}
                        title="Import Tasks CSV"
                        onClick={() => onOpenUploadCSV(proj._id)}
                      >
                        <UploadCloud size={12} /> Import
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', border: '1px solid var(--border-subtle)', padding: '5px' }}
                        title="Generate AI pre-labels for unannotated tasks"
                        onClick={() => handleAIPrelabel(proj._id)}
                      >
                        <Sparkles size={12} /> AI Pre-label
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', border: '1px solid var(--border-subtle)', padding: '5px' }}
                        title="Pause or Resume Project"
                        onClick={() => handleToggleStatus(proj)}
                      >
                        <Pause size={12} /> {isPaused ? 'Resume' : 'Pause'}
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', border: '1px solid var(--border-subtle)', padding: '5px' }}
                        disabled={exportingId === proj._id}
                        onClick={() => handleExport(proj._id, 'csv')}
                      >
                        <Download size={12} /> CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Modal */}
      {selectedStats && (
        <div className="modal-overlay" onClick={() => setSelectedStats(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
                  {selectedStats.projectName} — Quality & Metrics
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Inter-annotator agreement, consensus throughput, and accuracy audit
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStats(null)}>
                ✕
              </button>
            </div>

            {/* Key Quality Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Tasks</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  {selectedStats.taskCounts?.total || 0}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Consensus Done</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  {selectedStats.taskCounts?.completed || 0}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Disagreements</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
                  {selectedStats.taskCounts?.in_review || 0}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Agreement (κ)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                  {selectedStats.agreementMetrics?.kappaScore ?? 1.0}
                </div>
              </div>
            </div>

            {/* Agreement Analysis Card */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Inter-Annotator Agreement Status
                </span>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {selectedStats.agreementMetrics?.description || 'Substantial Agreement'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Observed Agreement (P₀):</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginLeft: '6px' }}>
                  {Math.round((selectedStats.agreementMetrics?.observedAgreement || 1) * 100)}%
                </span>
              </div>
            </div>

            {/* Annotator Quality Leaderboard */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Award size={16} color="var(--accent-amber)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                  Annotator Quality & Benchmark Accuracy
                </h4>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-dim)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Annotator</th>
                      <th style={{ padding: '10px 14px' }}>Role</th>
                      <th style={{ padding: '10px 14px' }}>Total Labeled</th>
                      <th style={{ padding: '10px 14px' }}>Benchmark Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStats.annotatorScores?.map((ann) => (
                      <tr key={ann.userId} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#fff' }}>{ann.name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge badge-${ann.role}`}>{ann.role}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-main)' }}>{ann.totalLabeled}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {ann.goldAccuracy !== null ? (
                            <span style={{ fontWeight: 700, color: ann.goldAccuracy >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                              {ann.goldAccuracy}%
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)' }}>Pending check</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Label Distribution Breakdown */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                Class Distribution
              </h4>

              {selectedStats.labelDistribution?.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No annotations recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedStats.labelDistribution?.map((ld) => {
                    const totalAnns = selectedStats.totalAnnotations || 1;
                    const percent = Math.round((ld.count / totalAnns) * 100);
                    return (
                      <div key={ld.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '100px', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                          {ld.label}
                        </span>
                        <div style={{ flex: 1, height: '8px', background: 'var(--bg-secondary)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '9999px' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', width: '60px', textAlign: 'right' }}>
                          {ld.count} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedStats(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
