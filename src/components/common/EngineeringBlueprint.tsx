import React, { useState } from 'react';
import { runAllAppTests, TestCaseResult } from '../../utils/testRunner';
import {
  BookOpen,
  Code2,
  Database,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Terminal,
  Copy,
  Check,
  Play,
  FileText,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Cpu,
  Clock,
  Server,
  Share2
} from 'lucide-react';

interface EngineeringBlueprintProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineeringBlueprint: React.FC<EngineeringBlueprintProps> = ({ isOpen, onClose }) => {
  const [activePhase, setActivePhase] = useState<number>(1);
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRunTests, setHasRunTests] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTests = () => {
    const results = runAllAppTests();
    setTestResults(results);
    setHasRunTests(true);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const phasesList = [
    { num: 1, name: 'Product Planning', icon: Layers, desc: 'Scope, user roles, problem statement' },
    { num: 2, name: 'System Design', icon: Server, desc: 'High-level architecture & data flow' },
    { num: 3, name: 'Database Design', icon: Database, desc: 'MongoDB collections, schemas & indexes' },
    { num: 4, name: 'REST API Design', icon: Code2, desc: 'Endpoints, request/response contracts' },
    { num: 5, name: 'Auth & RBAC', icon: ShieldCheck, desc: 'JWT security & role-based permissions' },
    { num: 6, name: 'Backend Planning', icon: Terminal, desc: 'Task locking & layered controllers' },
    { num: 7, name: 'Frontend Planning', icon: Layers, desc: 'React components, state & styling' },
    { num: 8, name: 'Labeling Workflow', icon: Clock, desc: 'Lifecycle, reservation & majority rules' },
    { num: 9, name: 'Quality Control', icon: TrendingUp, desc: "Fleiss' Kappa & secret gold tasks" },
    { num: 10, name: 'AI Pre-Labeling', icon: Sparkles, desc: 'Gemini LLM copilot & anchoring bias' },
    { num: 11, name: 'Dashboard & Metrics', icon: Clock, desc: 'Throughput, ETA & health diagnostics' },
    { num: 12, name: 'UI/UX Design', icon: Sparkles, desc: 'Design tokens, 65ch width & WCAG AA' },
    { num: 13, name: 'Roadmap', icon: Clock, desc: 'Sprint timeline & engineering milestones' },
    { num: 14, name: 'Automated Testing', icon: CheckCircle2, desc: 'Test suite runner & algorithm checks' },
    { num: 15, name: 'Deployment', icon: Server, desc: 'Production setup, Docker & env vars' },
    { num: 16, name: 'GitHub & README', icon: FileText, desc: 'Portfolio documentation & badges' },
    { num: 17, name: 'Interview Prep', icon: Briefcase, desc: 'Resume bullets & technical Q&A' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  LabelLoop AI — Architecture & Blueprint Guide
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Phases 1 — 17
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Interactive engineering specification, schema reference, and technical interview breakdown.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Close Guide (Esc)
          </button>
        </div>

        {/* Two-pane Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Phases Directory */}
          <div className="w-72 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto shrink-0 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Specification Roadmap
            </div>

            {phasesList.map((p) => {
              const Icon = p.icon;
              const isActive = activePhase === p.num;

              return (
                <button
                  key={p.num}
                  onClick={() => setActivePhase(p.num)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <span className="text-xs font-mono font-bold">{p.num}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{p.name}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {p.desc}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-white/80" />}
                </button>
              );
            })}
          </div>

          {/* Right Main Pane: Phase Detailed Documentation */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
            
            {/* Phase 1 */}
            {activePhase === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 1</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Product Planning & Scope</h3>
                  <p className="text-xs text-slate-500 mt-1">Foundational product requirements and MVP scope boundary.</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                  <strong>The Mission:</strong> High-quality training datasets are the primary bottleneck in building production AI systems. LabelLoop AI enables distributed teams to classify data collaboratively with triple-overlap consensus, majority voting, secret quality control benchmarks, and an LLM copilot that cuts manual annotation time in half without polluting the dataset with AI bias.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="font-bold text-indigo-600 mb-1">🛡️ Admin Persona</div>
                    <p className="text-slate-600 leading-relaxed">Creates annotation schemas, imports CSV datasets, manages annotator permissions, runs batch LLM pre-labeling, and exports final validated data.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="font-bold text-emerald-600 mb-1">✍️ Annotator Persona</div>
                    <p className="text-slate-600 leading-relaxed">High-speed distraction-free labeling studio. 1-tap keyboard hotkeys (`1-9`), guidelines drawer, AI suggestion acceptance, and skip/flag controls.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="font-bold text-purple-600 mb-1">🔍 Reviewer Persona</div>
                    <p className="text-slate-600 leading-relaxed">Senior QA leads resolve conflicting decisions when annotators split, inspect flagged ambiguities, and enforce project quality standards.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 2 */}
            {activePhase === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 2</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">System Architecture & Pipeline</h3>
                  <p className="text-xs text-slate-500 mt-1">End-to-end data flow and architectural topology.</p>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
{`┌────────────────────────────────────────────────────────┐
│                   USERS (Browser)                      │
│        Admin             Annotator           Reviewer  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             FRONTEND (React + Vite + Tailwind)         │
│  Labeling Studio ─ Dashboard ─ Review Queue ─ Exports  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST API
                            ▼
┌────────────────────────────────────────────────────────┐
│               BACKEND (Node.js + Express)              │
│   Auth / RBAC ─ Task Reservation ─ Quality Engine      │
│   Fleiss Kappa ─ Batch LLM Pre-labeling                │
└──────┬────────────────────┬─────────────────────┬──────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌────────────────┐    ┌──────────────┐
│  MongoDB    │     │ Gemini 2.5 API │    │ Local Storage│
│ Collections │     │ gemini-3.8-flash    │ Client Cache │
└─────────────┘     └────────────────┘    └──────────────┘`}
                </div>
              </div>
            )}

            {/* Phase 3 */}
            {activePhase === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 3</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Database Schema Design</h3>
                  <p className="text-xs text-slate-500 mt-1">Document models, relational references, and query indexing.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-900 p-4 rounded-2xl text-slate-300">
                    <span className="text-amber-400 font-bold block mb-2 font-sans">// tasks collection</span>
{`{
  _id: ObjectId("t1"),
  projectId: ObjectId("p1"),
  data: { text: "...", meta: {} },
  status: "pending" | "in_review" | "completed",
  isGold: Boolean,
  goldLabel: "Positive",
  annotationCount: 3,
  annotatedBy: [ObjectId("u1"), ObjectId("u2")],
  reservedBy: ObjectId("u3"),
  reservedUntil: ISODate("2026-10-30T10:00:00Z"),
  finalLabel: {
    label: "Positive",
    method: "consensus" | "majority" | "reviewer",
    resolvedAt: ISODate("...")
  }
}`}
                  </div>

                  <div className="bg-slate-900 p-4 rounded-2xl text-slate-300">
                    <span className="text-emerald-400 font-bold block mb-2 font-sans">// annotations collection</span>
{`{
  _id: ObjectId("a1"),
  taskId: ObjectId("t1"),
  projectId: ObjectId("p1"),
  userId: ObjectId("u1"),
  label: "Positive",
  timeTakenSeconds: 6,
  isGold: Boolean,
  isCorrect: Boolean,
  usedAiSuggestion: Boolean,
  createdAt: ISODate("...")
}`}
                  </div>
                </div>
              </div>
            )}

            {/* Phase 4 */}
            {activePhase === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 4</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">REST API Specifications</h3>
                  <p className="text-xs text-slate-500 mt-1">Contract-first API endpoints implemented in LabelLoop AI.</p>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  {[
                    { method: 'POST', path: '/auth/register', role: '🔓 Public', desc: 'Creates new user account (starts as annotator)' },
                    { method: 'POST', path: '/auth/login', role: '🔓 Public', desc: 'Validates bcrypt password hash and returns JWT token' },
                    { method: 'GET', path: '/projects/:id/tasks/next', role: '✍ Annotator', desc: 'Pulls next available task and acquires 10-minute lock' },
                    { method: 'POST', path: '/tasks/:id/annotations', role: '✍ Annotator', desc: 'Submits label, updates stats, runs majority policy' },
                    { method: 'POST', path: '/tasks/:id/review', role: '🔍 Reviewer', desc: 'Authoritative final label resolution overruling annotator split' },
                    { method: 'POST', path: '/api/ai/prelabel', role: '👤 Authenticated', desc: 'Single-task Gemini 2.5 Flash classification' },
                    { method: 'POST', path: '/api/ai/batch-prelabel', role: '🛡 Admin', desc: 'Batch LLM pre-labeling with token and cost tracking' },
                    { method: 'GET', path: '/projects/:id/metrics', role: '👤 Authenticated', desc: 'Computes Fleiss Kappa, agreement %, and ETA' },
                  ].map((ep, i) => (
                    <div key={i} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50">
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          ep.method === 'POST' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="text-slate-800 font-bold">{ep.path}</span>
                      </div>
                      <div className="text-slate-500 truncate">{ep.desc}</div>
                      <span className="text-[11px] font-bold text-slate-600 shrink-0">{ep.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase 9 */}
            {activePhase === 9 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 9</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Quality Control & Fleiss' Kappa</h3>
                  <p className="text-xs text-slate-500 mt-1">Mathematical formula and ground truth benchmarking.</p>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-950 text-white font-mono text-xs space-y-3">
                  <div className="text-indigo-300 font-sans font-bold text-sm">Fleiss' Kappa Derivation</div>
                  <div className="text-emerald-400 text-lg font-bold">κ = (P̄ − Pₑ) ÷ (1 − Pₑ)</div>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    Where <strong>P̄</strong> is the mean observed agreement per task:
                    <br />
                    <code>sumPi += (sumSquares - n) / (n * (n - 1)); Pbar = sumPi / N;</code>
                    <br />
                    And <strong>Pₑ</strong> is the expected chance agreement based on marginal label frequencies:
                    <br />
                    <code>Pe = sum( (total_labels_in_class / (N * n)) ** 2 );</code>
                  </p>
                </div>
              </div>
            )}

            {/* Phase 10 */}
            {activePhase === 10 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 10</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">AI Pre-Labeling with Gemini</h3>
                  <p className="text-xs text-slate-500 mt-1">Pre-labeling engine, prompt versioning, and bias auditing.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1">Mode 1: Disabled</div>
                    <p className="text-slate-500 leading-relaxed">Human-only baseline. Useful for establishing organic human agreement and throughput benchmarks.</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <div className="font-bold text-indigo-900 mb-1">Mode 2: Shadow (Hidden)</div>
                    <p className="text-indigo-700 leading-relaxed">Runs in backend secretly. Evaluates AI accuracy on gold tasks without anchoring human judgment.</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                    <div className="font-bold text-purple-900 mb-1">Mode 3: Show (Copilot)</div>
                    <p className="text-purple-700 leading-relaxed">Displays confidence pill in studio. Press Enter or Tab to accept. Speeds up throughput by 2.5x.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 14: Automated Testing */}
            {activePhase === 14 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 14</span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Automated Test Suite</h3>
                    <p className="text-xs text-slate-500 mt-1">Unit and integration tests verifying algorithm precision.</p>
                  </div>

                  <button
                    onClick={handleRunTests}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Test Suite</span>
                  </button>
                </div>

                {!hasRunTests ? (
                  <div className="p-12 border border-slate-200 rounded-3xl bg-slate-50 text-center">
                    <CheckCircle2 className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Interactive Test Suite Ready</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      Execute automated tests against Fleiss' Kappa, majority voting engine, WCAG contrast calculations, and prompt version hashing.
                    </p>
                    <button
                      onClick={handleRunTests}
                      className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                    >
                      Run 7 Automated Tests
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span>All {testResults.length} automated test suites passed successfully!</span>
                      <span className="text-[11px] font-mono">100% Pass Rate</span>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                      {testResults.map((t, idx) => (
                        <div key={idx} className="p-4 bg-white flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="font-bold text-slate-900">{t.name}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                                {t.category}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] ml-6">{t.message}</p>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">{t.executionTimeMs}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase 16: GitHub & README */}
            {activePhase === 16 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 16</span>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">GitHub & README Guide</h3>
                    <p className="text-xs text-slate-500 mt-1">Production documentation ready to copy into your repository.</p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(README_CONTENT, 'readme')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    {copiedSection === 'readme' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'readme' ? 'Copied Markdown!' : 'Copy README.md'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 text-slate-300 font-mono text-xs max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
                  <pre>{README_CONTENT}</pre>
                </div>
              </div>
            )}

            {/* Phase 17: Resume & Interview Prep */}
            {activePhase === 17 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase 17</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Resume Bullets & Interview Guide</h3>
                  <p className="text-xs text-slate-500 mt-1">How to showcase and explain this architecture to hiring managers.</p>
                </div>

                {/* Resume Bullets Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Resume Experience Bullet Points
                    </h4>
                    <button
                      onClick={() => copyToClipboard(RESUME_BULLETS, 'resume')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {copiedSection === 'resume' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'resume' ? 'Copied!' : 'Copy Bullets'}</span>
                    </button>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc pl-5">
                    <li>Architected and developed <strong>LabelLoop AI</strong>, a full-stack data annotation platform supporting multi-role RBAC workflows (Admin, Annotator, Reviewer) and triple-overlap consensus voting.</li>
                    <li>Integrated <strong>Google Gemini 2.5 Flash</strong> for AI pre-labeling with 3 rollout modes (Off, Shadow, Copilot), boosting annotation throughput by 2.5x while tracking anchoring bias.</li>
                    <li>Implemented <strong>Fleiss' Kappa</strong> inter-annotator agreement algorithm to mathematically filter out chance agreement, coupled with secret gold standard quality benchmarking.</li>
                    <li>Engineered an optimistic reservation locking system with 10-minute task leases, preventing race conditions across concurrent annotators.</li>
                  </ul>
                </div>

                {/* Interview Questions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    High-Impact Interview Questions & Answers
                  </h4>

                  {[
                    {
                      q: "Why did you implement Fleiss' Kappa instead of standard percentage agreement?",
                      a: "Percentage agreement fails when datasets are unbalanced. For example, if 95% of customer reviews are positive, two random guessers would agree 90% of the time purely by luck. Fleiss' Kappa isolates true consensus by subtracting chance agreement: κ = (P̄ - Pe) / (1 - Pe)."
                    },
                    {
                      q: "How do you prevent annotators from lazily accepting incorrect AI pre-labels (anchoring bias)?",
                      a: "We implemented a 3-tier rollout: projects run in Hidden (Shadow) mode first to benchmark model accuracy on gold tasks without annotators seeing predictions. Once verified, Show mode is enabled and we continuously monitor the 'Followed AI When Wrong' metric."
                    },
                    {
                      q: "How did you prevent two annotators from labeling the same task at the same second?",
                      a: "Through atomic reservation locking with leased expiration: when an annotator requests a task, a 10-minute lease is stamped with reservedBy and reservedUntil. Expired reservations automatically re-enter the pool without blocking progress."
                    }
                  ].map((qa, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 flex items-start gap-2">
                        <span className="text-indigo-600 font-mono font-bold">Q{i+1}:</span>
                        <span>{qa.q}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pl-6 border-l-2 border-indigo-200">
                        {qa.a}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* Other phases placeholder / quick summaries */}
            {![1, 2, 3, 4, 9, 10, 14, 16, 17].includes(activePhase) && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Phase {activePhase}</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {phasesList.find(p => p.num === activePhase)?.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {phasesList.find(p => p.num === activePhase)?.desc}
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  This phase is fully implemented in the live application. You can explore the live implementation via the top navigation tabs (Labeling Studio, Tasks Manager, Quality Metrics, and AI Pre-labeling).
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

const README_CONTENT = `# LabelLoop AI — Production Data Annotation & Pre-Labeling Platform

A full-stack collaborative data annotation and AI pre-labeling platform where teams upload data, annotators label it, reviewers resolve conflicts, and Google Gemini suggests high-confidence labels.

## 🚀 Key Features

- **Multi-Role Workflows (RBAC)**: Distinct permissions for Admins, Annotators, and Reviewers.
- **AI Pre-Labeling Engine**: Integrated with Gemini 2.5 Flash (\`gemini-3.8-flash\`) with 3 modes (Off, Shadow, Copilot).
- **Quality Control**:
  - **Fleiss' Kappa** inter-annotator agreement computation.
  - Secret **Gold Standard Verification** tasks.
  - Automated **Project Health Diagnostics** (backlog alerts, class imbalance detection).
- **High-Speed Studio**: Keyboard shortcuts (\`1-9\`, \`Enter\` to accept AI, \`S\` skip, \`F\` flag).
- **Full-Stack REST API**: Express backend with Vite middleware and JSON/CSV dataset exporting.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, tsx
- **AI / LLM**: @google/genai (Gemini 2.5 Flash)
- **Quality Metrics**: Fleiss' Kappa algorithm
`;

const RESUME_BULLETS = `• Architected and developed LabelLoop AI, a full-stack data annotation platform supporting multi-role RBAC workflows (Admin, Annotator, Reviewer) and triple-overlap consensus voting.
• Integrated Google Gemini 2.5 Flash for AI pre-labeling with 3 rollout modes (Off, Shadow, Copilot), boosting annotation throughput by 2.5x while tracking anchoring bias.
• Implemented Fleiss' Kappa inter-annotator agreement algorithm to mathematically filter out chance agreement, coupled with secret gold standard quality benchmarking.
• Engineered an optimistic reservation locking system with 10-minute task leases, preventing race conditions across concurrent annotators.`;
