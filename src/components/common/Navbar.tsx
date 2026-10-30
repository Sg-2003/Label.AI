import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import {
  Sparkles,
  Layers,
  FolderGit2,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  Eye,
  Sliders,
  Users,
  Compass,
  AlertTriangle,
  BookOpen,
  Activity
} from 'lucide-react';


interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenShortcuts: () => void;
  onOpenBlueprint: () => void;
  onOpenLiveFeed: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenShortcuts,
  onOpenBlueprint,
  onOpenLiveFeed
}) => {
  const { currentUser, users, switchUser, activeProject, activeProjectId, setActiveProjectId, isAdmin, isAnnotator, isReviewer } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const projects = storage.getProjects();

  // Calculate review queue count for badge
  const inReviewCount = activeProject ? storage.getTasks(activeProject.id).filter(t => !t.isGold && t.status === 'in_review').length : 0;

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to default initial seed? This will restore initial tasks, annotations, and sample projects.')) {
      storage.resetToDefaults();
      window.location.reload();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'annotator':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'reviewer':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand & Project Selector */}
          <div className="flex items-center gap-4">
            <div 
              onClick={() => onTabChange(isAdmin ? 'projects' : isAnnotator ? 'my-projects' : 'review-queue')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">LabelLoop</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                    AI
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Data Annotation & Quality Platform</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 hidden md:block" />

            {/* Project Selector Dropdown */}
            {activeProject && (
              <div className="relative">
                <button
                  onClick={() => setShowProjectMenu(!showProjectMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="max-w-[140px] truncate">{activeProject.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showProjectMenu && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Switch Project
                    </div>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setShowProjectMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          p.id === activeProjectId ? 'bg-indigo-50/70 text-indigo-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                          p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Role Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {isAdmin && (
              <>
                <button
                  onClick={() => onTabChange('projects')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'projects'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Projects
                </button>
                <button
                  onClick={() => onTabChange('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'overview'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Project Overview
                </button>
                <button
                  onClick={() => onTabChange('tasks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'tasks'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tasks & Gold
                </button>
                <button
                  onClick={() => onTabChange('metrics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'metrics'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kappa & Health
                </button>
                <button
                  onClick={() => onTabChange('ai-studio')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'ai-studio'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Pre-Labeling
                </button>
                <button
                  onClick={() => onTabChange('users')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'users'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Team
                </button>
                <button
                  onClick={() => onTabChange('tracker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'tracker'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  Workforce Tracker
                </button>
                <button
                  onClick={() => onTabChange('export')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'export'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Export
                </button>
              </>
            )}

            {isAnnotator && (
              <>
                <button
                  onClick={() => onTabChange('my-projects')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'my-projects'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Projects
                </button>
                <button
                  onClick={() => onTabChange('labeling')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'labeling'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Labeling Studio
                </button>
                <button
                  onClick={() => onTabChange('tracker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'tracker'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  Activity Tracker
                </button>
                <button
                  onClick={() => onTabChange('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'history'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My History
                </button>
              </>
            )}

            {isReviewer && (
              <>
                <button
                  onClick={() => onTabChange('review-queue')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'review-queue'
                      ? 'bg-white text-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Review Queue</span>
                  {inReviewCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                      {inReviewCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onTabChange('tracker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'tracker'
                      ? 'bg-white text-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-purple-500" />
                  Workforce Tracker
                </button>
                <button
                  onClick={() => onTabChange('review-tasks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'review-tasks'
                      ? 'bg-white text-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Tasks Inspector
                </button>
                <button
                  onClick={() => onTabChange('metrics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'metrics'
                      ? 'bg-white text-purple-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kappa & Health
                </button>
              </>
            )}

          </nav>

          {/* Right: Persona Switcher, Shortcuts, Reset */}
          <div className="flex items-center gap-2">
            
            {/* Realtime Live Stream button */}
            <button
              onClick={onOpenLiveFeed}
              title="Real-time Activity Stream & Presence"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="hidden md:inline">Live Stream</span>
            </button>

            {/* Architecture Blueprint & Specs button */}
            <button
              onClick={onOpenBlueprint}
              title="Interactive Engineering Blueprint & Phase Specs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Blueprint (Phases 1-17)</span>
            </button>

            {/* Keyboard Shortcuts button */}
            <button
              onClick={onOpenShortcuts}
              title="Keyboard Shortcuts (?)"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset Data button */}
            <button
              onClick={handleResetData}
              title="Reset Demo Data"
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Persona Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shadow-xs transition-all"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-1 py-0.2 rounded w-fit border ${getRoleBadgeColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Persona Switcher Dropdown */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-800">Switch Persona (Role Testing)</div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Experience the full platform from Admin, Annotator, and Reviewer perspectives:
                    </div>
                  </div>

                  <div className="space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowPersonaMenu(false);
                          // Auto switch tab based on role
                          if (u.role === 'admin') onTabChange('overview');
                          else if (u.role === 'annotator') onTabChange('labeling');
                          else if (u.role === 'reviewer') onTabChange('review-queue');
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${
                          u.id === currentUser.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 truncate">{u.name}</span>
                            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${getRoleBadgeColor(u.role)}`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                        </div>
                        {u.id === currentUser.id && (
                          <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100">
          {isAdmin && (
            <>
              <button onClick={() => onTabChange('projects')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Projects</button>
              <button onClick={() => onTabChange('overview')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Overview</button>
              <button onClick={() => onTabChange('tasks')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Tasks</button>
              <button onClick={() => onTabChange('metrics')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'metrics' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Metrics</button>
              <button onClick={() => onTabChange('ai-studio')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'ai-studio' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>AI Pre-Labeling</button>
              <button onClick={() => onTabChange('users')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Team</button>
              <button onClick={() => onTabChange('export')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'export' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>Export</button>
            </>
          )}
          {isAnnotator && (
            <>
              <button onClick={() => onTabChange('my-projects')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'my-projects' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>My Projects</button>
              <button onClick={() => onTabChange('labeling')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'labeling' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>Labeling Studio</button>
              <button onClick={() => onTabChange('history')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'history' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>History</button>
            </>
          )}
          {isReviewer && (
            <>
              <button onClick={() => onTabChange('review-queue')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'review-queue' ? 'bg-purple-600 text-white' : 'text-slate-600'}`}>Review Queue ({inReviewCount})</button>
              <button onClick={() => onTabChange('review-tasks')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'review-tasks' ? 'bg-purple-600 text-white' : 'text-slate-600'}`}>All Tasks</button>
              <button onClick={() => onTabChange('metrics')} className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${currentTab === 'metrics' ? 'bg-purple-600 text-white' : 'text-slate-600'}`}>Agreement</button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};
