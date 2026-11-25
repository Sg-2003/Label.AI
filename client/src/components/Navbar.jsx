import React from 'react';
import { Tag, ShieldAlert, BarChart3, LogOut, Sparkles, User, ChevronDown, Timer } from 'lucide-react';

export default function Navbar({
  user,
  currentView,
  setCurrentView,
  onOpenAuth,
  onLogout,
  onQuickSwitchUser
}) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const goldAccuracy = user?.stats?.goldTotal > 0
    ? Math.round((user.stats.goldCorrect / user.stats.goldTotal) * 100)
    : null;

  return (
    <header className="header-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('projects')}>
          <div className="brand-icon-box">
            <Tag size={20} />
          </div>
          <span>LabelLoop <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>AI</span></span>
        </div>

        {user && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`btn btn-sm ${currentView === 'projects' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCurrentView('projects')}
            >
              <BarChart3 size={15} />
              Projects
            </button>

            <button
              className={`btn btn-sm ${currentView === 'annotate' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCurrentView('annotate')}
            >
              <Tag size={15} />
              Labeling Studio
            </button>

            {(user.role === 'reviewer' || user.role === 'admin') && (
              <button
                className={`btn btn-sm ${currentView === 'review' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCurrentView('review')}
              >
                <ShieldAlert size={15} />
                Review Queue
              </button>
            )}

            {user.role === 'admin' && (
              <button
                className={`btn btn-sm ${currentView === 'timetracker' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCurrentView('timetracker')}
              >
                <Timer size={15} />
                Time Tracker
              </button>
            )}
          </nav>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            {/* Annotator metrics badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'var(--bg-elevated)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: 'var(--text-dim)' }}>Labeled:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.stats?.totalLabeled || 0}</span>
                {goldAccuracy !== null && (
                  <>
                    <span style={{ color: 'var(--border-subtle)' }}>|</span>
                    <span style={{ color: 'var(--text-dim)' }}>Accuracy:</span>
                    <span style={{ fontWeight: 700, color: goldAccuracy >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {goldAccuracy}%
                    </span>
                  </>
                )}
              </div>

              {/* Role badge */}
              <span className={`badge badge-${user.role}`}>
                {user.role.toUpperCase()}
              </span>
            </div>

            {/* Quick Demo Switcher & User Profile Menu */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <User size={15} />
                <span>{user.name}</span>
                <ChevronDown size={13} />
              </button>

              {dropdownOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    width: '240px',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 60,
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Switch Account
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                    onClick={() => { onQuickSwitchUser('admin@labelloop.ai'); setDropdownOpen(false); }}
                  >
                    👑 Admin (Full Access)
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                    onClick={() => { onQuickSwitchUser('alice@labelloop.ai'); setDropdownOpen(false); }}
                  >
                    ✏️ Alice (Annotator 1)
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                    onClick={() => { onQuickSwitchUser('bob@labelloop.ai'); setDropdownOpen(false); }}
                  >
                    ✏️ Bob (Annotator 2)
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                    onClick={() => { onQuickSwitchUser('reviewer@labelloop.ai'); setDropdownOpen(false); }}
                  >
                    🛡️ Rachel (Reviewer)
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--accent-rose)' }}
                    onClick={() => { onLogout(); setDropdownOpen(false); }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            <Sparkles size={14} />
            Sign In / Demo
          </button>
        )}
      </div>
    </header>
  );
}
