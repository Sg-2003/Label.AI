import React, { useState, useEffect, useRef } from 'react';
import { api, getStoredUser } from './services/api';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ProjectList from './components/ProjectList';
import AnnotatorWorkspace from './components/AnnotatorWorkspace';
import ReviewQueue from './components/ReviewQueue';
import CreateProjectModal from './components/CreateProjectModal';
import UploadCsvModal from './components/UploadCsvModal';
import AnimatedBackground from './components/AnimatedBackground';
import AdminTimeHistory from './components/AdminTimeHistory';
import { Tag, Sparkles, ShieldCheck, ArrowRight, Play, CheckCircle2, Zap } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentView, setCurrentView] = useState('projects');
  const [activeProject, setActiveProject] = useState(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isUploadCsvOpen, setIsUploadCsvOpen] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState(null);

  // Smooth scroll parallax state
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Use requestAnimationFrame for buttery-smooth updates
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check login session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentView('projects');
    setActiveProject(null);
  };

  const handleQuickSwitchUser = async (email) => {
    try {
      const res = await api.login(email, 'password123');
      setUser(res.user);
      // If switched to reviewer, take them to review or projects
      if (res.user.role === 'reviewer') {
        setCurrentView('review');
      }
    } catch {
      alert(`Could not switch to ${email}. Make sure database is seeded.`);
    }
  };

  const refreshUserStats = async () => {
    try {
      const updatedUser = await api.getMe();
      setUser(updatedUser);
    } catch {
      // ignore
    }
  };

  const handleSelectProjectForAnnotation = (project) => {
    setActiveProject(project);
    setCurrentView('annotate');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {!user && <AnimatedBackground />}
      <Navbar
        user={user}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onQuickSwitchUser={handleQuickSwitchUser}
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {/* If Not Logged In -> Show Hero & Quick Test Drive */}
        {!user ? (
          <div ref={heroRef} style={{ maxWidth: '900px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '24px',
              transform: `translateY(${scrollY * -0.15}px)`,
              opacity: Math.max(0, 1 - scrollY * 0.003),
              transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
            }}>
              <Sparkles size={16} /> Intelligent Annotation & Consensus Platform
            </div>

            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '20px',
              letterSpacing: '-0.03em',
              transform: `translateY(${scrollY * -0.1}px)`,
              opacity: Math.max(0, 1 - scrollY * 0.002),
              transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
            }}>
              Collaborative Data Labeling with{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Consensus Algorithms
              </span>
            </h1>

            <p style={{
              fontSize: '1.15rem',
              color: 'var(--text-muted)',
              maxWidth: '640px',
              margin: '0 auto 36px',
              lineHeight: 1.6,
              transform: `translateY(${scrollY * -0.06}px)`,
              opacity: Math.max(0, 1 - scrollY * 0.0015),
              transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
            }}>
              Empower your ML teams with atomic task locks, majority-vote consensus thresholds, real-time gold standard quality control, and human dispute resolution.
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              transform: `translateY(${scrollY * -0.04}px)`,
              transition: 'transform 0.1s ease-out',
            }}>
              <button
                className="btn btn-primary"
                style={{ padding: '14px 28px', fontSize: '1rem' }}
                onClick={() => handleQuickSwitchUser('admin@labelloop.ai')}
              >
                <Zap size={18} /> Launch Demo as Admin
              </button>

              <button
                className="btn btn-secondary"
                style={{ padding: '14px 28px', fontSize: '1rem' }}
                onClick={() => handleQuickSwitchUser('alice@labelloop.ai')}
              >
                <Play size={18} /> Launch as Annotator
              </button>

              <button
                className="btn btn-ghost"
                style={{ padding: '14px 20px', fontSize: '1rem' }}
                onClick={() => setIsAuthModalOpen(true)}
              >
                Sign In / Custom Account <ArrowRight size={16} />
              </button>
            </div>

            {/* Feature Cards Showcase */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              marginTop: '64px',
              textAlign: 'left',
              transform: `translateY(${Math.max(0, 30 - scrollY * 0.08)}px)`,
              opacity: Math.min(1, 0.3 + scrollY * 0.005),
              transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
            }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }}>
                  <ShieldCheck size={28} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
                  15-Min Atomic Lease
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Prevents duplicate overlapping effort while automatically freeing tasks if an annotator disconnects.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ color: 'var(--accent-emerald)', marginBottom: '12px' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
                  Majority-Vote Consensus
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Evaluates agreement across multiple annotators and automatically routes ties to expert review.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ color: 'var(--accent-purple)', marginBottom: '12px' }}>
                  <Tag size={28} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
                  Gold Benchmark Checks
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Interleaves verified ground-truth tasks to continuously audit annotator accuracy and confidence.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* View 1: Projects List */}
            {currentView === 'projects' && (
              <ProjectList
                user={user}
                onSelectProjectForAnnotation={handleSelectProjectForAnnotation}
                onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                onOpenUploadCSV={(projId) => {
                  setUploadProjectId(projId);
                  setIsUploadCsvOpen(true);
                }}
              />
            )}

            {/* View 2: Annotator Workspace */}
            {currentView === 'annotate' && (
              activeProject ? (
                <AnnotatorWorkspace
                  project={activeProject}
                  user={user}
                  onUpdateStats={refreshUserStats}
                />
              ) : (
                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Please select a project to start labeling tasks.
                  </p>
                  <button className="btn btn-primary" onClick={() => setCurrentView('projects')}>
                    Browse Projects
                  </button>
                </div>
              )
            )}

            {/* View 3: Review Queue */}
            {currentView === 'review' && (
              activeProject ? (
                <ReviewQueue project={activeProject} user={user} />
              ) : (
                <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                    Select a Project to Inspect Disagreements:
                  </h3>
                  <ProjectList
                    user={user}
                    onSelectProjectForAnnotation={(proj) => {
                      setActiveProject(proj);
                      setCurrentView('review');
                    }}
                    onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                    onOpenUploadCSV={(projId) => {
                      setUploadProjectId(projId);
                      setIsUploadCsvOpen(true);
                    }}
                  />
                </div>
              )
            )}

            {/* View 4: Time Tracker History (Admin only) */}
            {currentView === 'timetracker' && user.role === 'admin' && (
              <AdminTimeHistory />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          setCurrentView('projects');
        }}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={(newProject) => {
          setActiveProject(newProject);
        }}
      />

      <UploadCsvModal
        isOpen={isUploadCsvOpen}
        projectId={uploadProjectId}
        onClose={() => {
          setIsUploadCsvOpen(false);
          setUploadProjectId(null);
        }}
        onUploadSuccess={() => {
          alert('CSV tasks uploaded and queued successfully!');
        }}
      />
    </div>
  );
}
