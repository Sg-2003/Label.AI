import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Navbar } from './components/common/Navbar';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { EngineeringBlueprint } from './components/common/EngineeringBlueprint';
import { LiveActivityFeed } from './components/common/LiveActivityFeed';

// Annotator Views
import { LabelingStudio } from './components/annotator/LabelingStudio';
import { AnnotatorProjects } from './components/annotator/AnnotatorProjects';
import { AnnotatorHistory } from './components/annotator/AnnotatorHistory';

// Reviewer Views
import { ReviewQueue } from './components/reviewer/ReviewQueue';

// Admin Views
import { ProjectList } from './components/admin/ProjectList';
import { ProjectOverview } from './components/admin/ProjectOverview';
import { TasksManager } from './components/admin/TasksManager';
import { MetricsView } from './components/admin/MetricsView';
import { AiStudioView } from './components/admin/AiStudioView';
import { UserManagement } from './components/admin/UserManagement';
import { ExportView } from './components/admin/ExportView';
import { CreateProjectModal } from './components/admin/CreateProjectModal';
import { WorkforceTrackerView } from './components/tracker/WorkforceTrackerView';

function MainApp() {
  const { currentUser, activeProject, setActiveProjectId, isAdmin, isAnnotator, isReviewer } = useAuth();
  
  // Tab state initialized according to current role
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (currentUser.role === 'admin') return 'overview';
    if (currentUser.role === 'reviewer') return 'review-queue';
    return 'labeling';
  });

  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showBlueprint, setShowBlueprint] = useState<boolean>(false);
  const [showLiveFeed, setShowLiveFeed] = useState<boolean>(false);

  // If user role changes and current tab is incompatible, automatically redirect
  React.useEffect(() => {
    if (currentTab === 'tracker') return; // Available to all roles
    if (isAdmin && ['my-projects', 'labeling', 'history'].includes(currentTab)) {
      setCurrentTab('overview');
    } else if (isAnnotator && ['projects', 'overview', 'tasks', 'ai-studio', 'users', 'export', 'review-queue'].includes(currentTab)) {
      setCurrentTab('labeling');
    } else if (isReviewer && ['my-projects', 'labeling', 'history', 'projects', 'ai-studio', 'users'].includes(currentTab)) {
      setCurrentTab('review-queue');
    }
  }, [currentUser.role, currentTab]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenBlueprint={() => setShowBlueprint(true)}
        onOpenLiveFeed={() => setShowLiveFeed(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {/* Admin Tabs */}
        {isAdmin && (
          <>
            {currentTab === 'projects' && (
              <ProjectList
                onOpenCreate={() => setShowCreateModal(true)}
                onSelectProject={(id) => {
                  setActiveProjectId(id);
                  setCurrentTab('overview');
                }}
              />
            )}
            {currentTab === 'overview' && (
              <ProjectOverview onNavigateTab={(tab) => setCurrentTab(tab)} />
            )}
            {currentTab === 'tasks' && <TasksManager />}
            {currentTab === 'metrics' && (
              <MetricsView onNavigateTab={(tab) => setCurrentTab(tab)} />
            )}
            {currentTab === 'ai-studio' && <AiStudioView />}
            {currentTab === 'users' && <UserManagement />}
            {currentTab === 'export' && <ExportView />}
          </>
        )}

        {/* Annotator Tabs */}
        {isAnnotator && (
          <>
            {currentTab === 'my-projects' && (
              <AnnotatorProjects
                onStartLabeling={(id) => {
                  setActiveProjectId(id);
                  setCurrentTab('labeling');
                }}
              />
            )}
            {currentTab === 'labeling' && (
              <LabelingStudio onOpenShortcuts={() => setShowShortcuts(true)} />
            )}
            {currentTab === 'history' && <AnnotatorHistory />}
          </>
        )}

        {/* Reviewer Tabs */}
        {isReviewer && (
          <>
            {currentTab === 'review-queue' && <ReviewQueue />}
            {currentTab === 'review-tasks' && <TasksManager />}
            {currentTab === 'metrics' && (
              <MetricsView onNavigateTab={(tab) => setCurrentTab(tab)} />
            )}
          </>
        )}

        {/* Global Workforce Tracker (Accessible across personas) */}
        {currentTab === 'tracker' && <WorkforceTrackerView />}
      </main>


      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Engineering Blueprint Modal */}
      <EngineeringBlueprint
        isOpen={showBlueprint}
        onClose={() => setShowBlueprint(false)}
      />

      {/* Live Real-time Activity Feed Drawer */}
      <LiveActivityFeed
        isOpen={showLiveFeed}
        onClose={() => setShowLiveFeed(false)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newProjectId) => {
          setActiveProjectId(newProjectId);
          setCurrentTab('overview');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LabelLoop AI — Production Data Annotation & Pre-Labeling Platform</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBlueprint(true)}
              className="text-indigo-600 font-bold hover:underline"
            >
              📖 View Architecture Blueprint (Phases 1-17)
            </button>
            <span>•</span>
            <button
              onClick={() => setShowShortcuts(true)}
              className="hover:text-slate-600 transition-colors"
            >
              Shortcuts (?)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainApp />
      </RealtimeProvider>
    </AuthProvider>
  );
}
