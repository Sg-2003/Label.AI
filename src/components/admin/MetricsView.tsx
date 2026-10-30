import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  ShieldCheck,
  Zap,
  Info,
  Users
} from 'lucide-react';

interface MetricsViewProps {
  onNavigateTab: (tab: string) => void;
}

export const MetricsView: React.FC<MetricsViewProps> = ({ onNavigateTab }) => {
  const { activeProject } = useAuth();

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">No project selected</div>;
  }

  const tasks = storage.getTasks(activeProject.id);
  const annotations = storage.getAnnotations(activeProject.id);
  const metrics = storage.getMetrics(activeProject.id);
  const healthIssues = storage.getHealthIssues(activeProject.id);
  const users = storage.getUsers();

  const annotators = activeProject.members
    .filter(m => m.role === 'annotator')
    .map(m => {
      const u = storage.getUser(m.userId);
      const userAnns = annotations.filter(a => a.userId === m.userId);
      const goldAnns = userAnns.filter(a => a.isGold);
      const goldCorrect = goldAnns.filter(a => a.isCorrect).length;
      const goldPct = goldAnns.length > 0 ? Math.round((goldCorrect / goldAnns.length) * 100) : 100;

      return {
        id: m.userId,
        name: u?.name || 'Unknown',
        email: u?.email || '',
        avatar: u?.avatar,
        labeledCount: userAnns.length,
        goldCount: goldAnns.length,
        goldAccuracy: goldPct,
        streak: u?.stats?.streak || 1
      };
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            Quality Assurance & Inter-Rater Agreement
          </span>
          <span className="text-xs text-slate-400">• {activeProject.name}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Quality Control & Agreement Metrics
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl">
          Statistical rigor for label consistency using Fleiss' Kappa, secret gold-standard verification, and consensus thresholds (Phases 9 & 11).
        </p>
      </div>

      {/* Fleiss' Kappa Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Kappa Score Display (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Project Inter-Annotator Agreement</span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-black tracking-tight text-white font-mono">
                {metrics.fleissKappa !== null ? metrics.fleissKappa.toFixed(2) : '—'}
              </span>
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  {metrics.kappaInterpretation}
                </span>
                <p className="text-[11px] text-indigo-200/80">
                  Landis & Koch Scale
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-2">
              Fleiss' Kappa measures consensus across multiple annotators while strictly eliminating agreement that would happen by pure chance.
            </p>
          </div>

          {/* Math breakdown (7 cols) */}
          <div className="lg:col-span-7 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 flex items-center justify-between">
              <span>Formula Components</span>
              <span className="font-mono text-[11px] text-indigo-300">κ = (P̄ − Pₑ) / (1 − Pₑ)</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Observed (P̄)</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{metrics.observedAgreement}%</div>
                <div className="text-[10px] text-slate-400 mt-1">Raw agreement rate</div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Chance (Pₑ)</div>
                <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{metrics.chanceAgreement}%</div>
                <div className="text-[10px] text-slate-400 mt-1">Expected by random luck</div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Sample Pool</div>
                <div className="text-xl font-bold text-indigo-300 font-mono mt-0.5">{metrics.eligibleTaskCount}</div>
                <div className="text-[10px] text-slate-400 mt-1">Tasks with {activeProject.overlapCount}x overlap</div>
              </div>
            </div>

            {/* Scale legend */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1.5">
                <span>&lt;0.20 Poor</span>
                <span>0.21-0.40 Fair</span>
                <span>0.41-0.60 Moderate</span>
                <span>0.61-0.80 Substantial</span>
                <span>0.81-1.0 Almost Perfect</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden flex">
                <div className="w-1/5 h-full bg-rose-500" />
                <div className="w-1/5 h-full bg-amber-500" />
                <div className="w-1/5 h-full bg-yellow-400" />
                <div className="w-1/5 h-full bg-emerald-400" />
                <div className="w-1/5 h-full bg-indigo-400" />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Grid: Agreement Breakdown & Throughput */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Consensus vs Majority Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Task Finalization Outcomes
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            How tasks reached resolution under majority policy: <strong>{activeProject.majorityPolicy}</strong>
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  100%
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">Consensus (Unanimous)</div>
                  <div className="text-[11px] text-emerald-700">All {activeProject.overlapCount} annotators agreed</div>
                </div>
              </div>
              <div className="text-lg font-black text-emerald-700 font-mono">
                {metrics.consensusTasksCount}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  &gt;50%
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-900">Majority Vote Accepted</div>
                  <div className="text-[11px] text-blue-700">Auto-approved by majority threshold</div>
                </div>
              </div>
              <div className="text-lg font-black text-blue-700 font-mono">
                {metrics.majorityTasksCount}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  QA
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-900">Reviewer Overruled</div>
                  <div className="text-[11px] text-purple-700">Decided by senior QA lead</div>
                </div>
              </div>
              <div className="text-lg font-black text-purple-700 font-mono">
                {metrics.reviewerTasksCount}
              </div>
            </div>
          </div>
        </div>

        {/* Throughput & ETA Calculator */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Throughput & Estimated ETA
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Real-time velocity projection based on recent annotation time logs.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Velocity
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {metrics.throughputPerHour}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">tasks / annotator / hr</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Completion ETA
                </div>
                <div className="text-2xl font-black text-indigo-600 font-mono">
                  {metrics.estimatedEtaHours !== null ? `${metrics.estimatedEtaHours}h` : '0h'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">at current pace (est.)</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 leading-relaxed">
            <strong>Production rule (Phase 11):</strong> The ETA is an estimate that assumes current annotator availability and excludes review backlog. Always labeled as (est.).
          </div>
        </div>

      </div>

      {/* Annotator Quality Scorecard (Gold Standard Benchmark) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                Annotator Quality Scorecards
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated against secret gold-standard verification tasks. Never exposed to annotators during active labeling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">
              Team Gold Accuracy: <strong className="text-emerald-600">{metrics.goldAccuracyOverall}%</strong>
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          {annotators.map((ann) => (
            <div key={ann.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <img
                  src={ann.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{ann.name}</div>
                  <div className="text-[11px] text-slate-500">{ann.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tasks Labeled</div>
                  <div className="font-bold text-slate-800">{ann.labeledCount}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Gold Questions</div>
                  <div className="font-bold text-slate-800">{ann.goldCount}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={ann.goldAccuracy >= 85 ? 'text-emerald-600' : 'text-amber-600'}>
                      {ann.goldAccuracy}%
                    </span>
                    {ann.goldAccuracy >= 90 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Top Tier
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
