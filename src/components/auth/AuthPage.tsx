import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Layers,
  Shield,
  Tag,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Activity,
  Users
} from 'lucide-react';

interface AuthPageProps {
  onOpenBlueprint?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onOpenBlueprint }) => {
  const { login, signup, demoLogin, users } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In state
  const [loginEmail, setLoginEmail] = useState<string>('alex@labelai.io');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  
  // Sign Up state
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupRole, setSignupRole] = useState<UserRole>('annotator');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');
  const [acceptGuidelines, setAcceptGuidelines] = useState<boolean>(true);

  // Status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!signupName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signupPassword) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!acceptGuidelines) {
      setErrorMessage('You must accept the annotation quality standards to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(signupName, signupEmail, signupRole, signupPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      id: 'u-alex',
      name: 'Alex Chen',
      email: 'alex@labelai.io',
      role: 'admin',
      badge: 'Admin / PM',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      description: 'Project setup, CSV ingestion, workforce telemetry & dataset exports',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'u-asha',
      name: 'Asha Patel',
      email: 'asha@labelai.io',
      role: 'annotator',
      badge: 'Senior Annotator',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      description: 'CVAT bounding boxes, keyboard shortcuts (1-9), speed labeling',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'u-marcus',
      name: 'Marcus Vance',
      email: 'marcus@labelai.io',
      role: 'reviewer',
      badge: 'Quality Reviewer',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      description: 'Dispute queue, multi-rater consensus & Fleiss’ Kappa verification',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'u-devon',
      name: 'Devon Reed',
      email: 'devon@labelai.io',
      role: 'annotator',
      badge: 'Annotator',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      description: 'Secondary annotator to test multi-user overlap & agreement rules',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Decorative Glow Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Top Header & Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-3 justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">LabelLoop</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                AI
              </span>
            </div>
            <span className="text-xs text-indigo-200/70 font-medium block">
              Data Annotation & Quality Platform
            </span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
          {mode === 'signin' ? 'Sign in to access the Dashboard' : 'Create your Operator Account'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          {mode === 'signin'
            ? 'Authentication required before entering labeling or monitoring consoles'
            : 'Join the human-in-the-loop AI annotation and review workforce'}
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/80">
          
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="name@company.io"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Demo key: <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono">password123</code>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <span>Keep me authenticated</span>
                </label>
                <span className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer text-[11px]">
                  Role-based permissions
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    placeholder="e.g. Jordan Miller"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    placeholder="jordan@company.io"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Role & Clearance (Phase 5 RBAC)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      role: 'annotator' as UserRole,
                      title: 'Annotator',
                      desc: 'Label tasks & CVAT boxes',
                      icon: Tag,
                      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                    },
                    {
                      role: 'reviewer' as UserRole,
                      title: 'Reviewer',
                      desc: 'Check quality & consensus',
                      icon: CheckCircle2,
                      color: 'border-purple-500/50 bg-purple-950/20 text-purple-300'
                    },
                    {
                      role: 'admin' as UserRole,
                      title: 'Admin',
                      desc: 'Manage projects & stats',
                      icon: Shield,
                      color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300'
                    }
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = signupRole === r.role;
                    return (
                      <button
                        type="button"
                        key={r.role}
                        onClick={() => setSignupRole(r.role)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? `${r.color} ring-2 ring-indigo-500 shadow-md`
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className="w-4 h-4" />
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <div className="font-bold text-xs text-slate-100">{r.title}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    placeholder="At least 6 chars"
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={acceptGuidelines}
                    onChange={(e) => setAcceptGuidelines(e.target.checked)}
                    className="mt-0.5 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <span className="leading-snug text-slate-400 text-[11px]">
                    I agree to the annotation quality standards, blind consensus rules, and gold standard benchmarking.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Start Labeling</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Personas (Instant 1-Click Access) */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick 1-Click Demo Login
              </span>
              <span className="text-[11px] text-slate-500">Pick a role to test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => demoLogin(account.id)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 text-left transition-all group"
                >
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-indigo-500 transition-all"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {account.name}
                      </span>
                      <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${account.badgeColor}`}>
                        {account.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {account.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Security & Architecture Specs Info */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phase 5 Auth: Session Tokens & Role-Based RBAC</span>
            </div>
            {onOpenBlueprint && (
              <button
                type="button"
                onClick={onOpenBlueprint}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Inspect System Architecture →
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
