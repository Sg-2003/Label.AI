import { Project, Task, Annotation, QualityMetrics, HealthIssue, FinalLabel } from '../types';

/**
 * Outcome decision based on Phase 9 specification.
 */
export function decideOutcome(
  labels: string[],
  majorityPolicy: 'auto' | 'manual' = 'auto'
): { status: 'completed' | 'in_review'; label: string | null; method: 'consensus' | 'majority' | null } {
  if (labels.length === 0) {
    return { status: 'in_review', label: null, method: null };
  }

  const counts: Record<string, number> = {};
  labels.forEach(l => {
    counts[l] = (counts[l] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topLabel, topCount] = sorted[0];
  const secondCount = sorted[1]?.[1] || 0;

  // 1. Consensus: 100% agreement
  if (topCount === labels.length) {
    return { status: 'completed', label: topLabel, method: 'consensus' };
  }

  // 2. Majority: topCount > secondCount and topCount > labels.length / 2
  const hasMajority = topCount > secondCount && topCount > labels.length / 2;
  if (hasMajority && majorityPolicy === 'auto') {
    return { status: 'completed', label: topLabel, method: 'majority' };
  }

  // 3. Fallback to review
  return { status: 'in_review', label: null, method: null };
}

/**
 * Fleiss' Kappa implementation strictly matching Phase 9 code & formula.
 * items: array of label arrays, e.g. [["Pos","Pos","Neg"], ["Neg","Neg","Neg"], ...]
 * Every inner array must have the same length n (n >= 2)
 */
export function fleissKappa(
  items: string[][],
  categories: string[]
): {
  kappa: number | null;
  observedAgreement: number;
  chanceAgreement: number;
} {
  const N = items.length;
  if (N === 0) return { kappa: null, observedAgreement: 0, chanceAgreement: 0 };
  const n = items[0].length;
  if (n < 2) return { kappa: null, observedAgreement: 0, chanceAgreement: 0 };

  const totals: Record<string, number> = Object.fromEntries(categories.map(c => [c, 0]));
  let sumPi = 0;

  for (const labels of items) {
    const counts: Record<string, number> = {};
    for (const l of labels) {
      counts[l] = (counts[l] || 0) + 1;
      totals[l] = (totals[l] || 0) + 1;
    }
    const sumSquares = Object.values(counts).reduce((s, c) => s + c * c, 0);
    sumPi += (sumSquares - n) / (n * (n - 1)); // agreement within this item
  }

  const Pbar = sumPi / N; // average observed agreement
  const Pe = categories.reduce((s, c) => {
    const p = (totals[c] || 0) / (N * n); // share of all labels that are class c
    return s + p * p;
  }, 0);

  if (Pe === 1) return { kappa: null, observedAgreement: Pbar, chanceAgreement: Pe };

  const kappa = (Pbar - Pe) / (1 - Pe);
  return {
    kappa: Math.max(-1, Math.min(1, kappa)),
    observedAgreement: Pbar,
    chanceAgreement: Pe,
  };
}

export function interpretKappa(kappa: number | null, sampleSize: number): QualityMetrics['kappaInterpretation'] {
  if (kappa === null || sampleSize < 3) return 'Not enough data';
  if (kappa < 0.20) return 'Poor';
  if (kappa <= 0.40) return 'Fair';
  if (kappa <= 0.60) return 'Moderate';
  if (kappa <= 0.80) return 'Substantial';
  return 'Almost Perfect';
}

/**
 * Calculates complete project metrics according to Phase 11.
 */
export function calculateProjectMetrics(
  project: Project,
  tasks: Task[],
  annotations: Annotation[]
): QualityMetrics {
  const normalTasks = tasks.filter(t => !t.isGold);
  const goldTasks = tasks.filter(t => t.isGold);

  // Group annotations by task
  const annotationsByTask: Record<string, Annotation[]> = {};
  annotations.forEach(a => {
    if (!annotationsByTask[a.taskId]) annotationsByTask[a.taskId] = [];
    annotationsByTask[a.taskId].push(a);
  });

  // Keep tasks with exactly overlapCount annotations for Fleiss' Kappa
  const kappaEligibleItems: string[][] = [];
  normalTasks.forEach(t => {
    const taskAnns = annotationsByTask[t.id] || [];
    if (taskAnns.length >= project.overlapCount && project.overlapCount >= 2) {
      kappaEligibleItems.push(taskAnns.slice(0, project.overlapCount).map(a => a.label));
    }
  });

  const categories = project.labels.map(l => l.name);
  const kappaResult = fleissKappa(kappaEligibleItems, categories);

  let consensusCount = 0;
  let majorityCount = 0;
  let reviewerCount = 0;

  normalTasks.forEach(t => {
    if (t.finalLabel) {
      if (t.finalLabel.method === 'consensus') consensusCount++;
      else if (t.finalLabel.method === 'majority') majorityCount++;
      else if (t.finalLabel.method === 'reviewer') reviewerCount++;
    }
  });

  const completedNormalTasks = normalTasks.filter(t => t.status === 'completed').length;
  const inReviewTasks = normalTasks.filter(t => t.status === 'in_review').length;
  const evaluatedForAgreement = consensusCount + majorityCount + inReviewTasks;

  const disagreementRate = evaluatedForAgreement > 0
    ? (inReviewTasks + reviewerCount) / evaluatedForAgreement
    : 0;

  // Gold accuracy calculation
  const goldAnnotations = annotations.filter(a => a.isGold);
  const goldCorrect = goldAnnotations.filter(a => a.isCorrect).length;
  const goldAccuracyOverall = goldAnnotations.length > 0 ? (goldCorrect / goldAnnotations.length) * 100 : 100;

  // Progress metrics
  const completionRate = normalTasks.length > 0 ? (completedNormalTasks / normalTasks.length) * 100 : 0;
  const totalRequiredAnnotations = normalTasks.length * project.overlapCount;
  const currentNormalAnnotations = annotations.filter(a => !a.isGold).length;
  const annotationProgressRate = totalRequiredAnnotations > 0
    ? Math.min(100, (currentNormalAnnotations / totalRequiredAnnotations) * 100)
    : 0;

  // Throughput and ETA calculation
  const recentAnnotations = annotations.slice(-30);
  let throughputPerHour = 45; // baseline assumption
  if (recentAnnotations.length >= 5) {
    const avgTime = recentAnnotations.reduce((sum, a) => sum + (a.timeTakenSeconds || 12), 0) / recentAnnotations.length;
    throughputPerHour = Math.round(3600 / Math.max(4, avgTime));
  }

  const remainingAnnotations = Math.max(0, totalRequiredAnnotations - currentNormalAnnotations);
  const activeAnnotatorCount = Math.max(1, project.members.filter(m => m.role === 'annotator').length);
  const estimatedEtaHours = remainingAnnotations > 0
    ? Number((remainingAnnotations / (throughputPerHour * activeAnnotatorCount)).toFixed(1))
    : 0;

  return {
    fleissKappa: kappaResult.kappa,
    kappaInterpretation: interpretKappa(kappaResult.kappa, kappaEligibleItems.length),
    observedAgreement: Number((kappaResult.observedAgreement * 100).toFixed(1)),
    chanceAgreement: Number((kappaResult.chanceAgreement * 100).toFixed(1)),
    eligibleTaskCount: kappaEligibleItems.length,
    consensusTasksCount: consensusCount,
    majorityTasksCount: majorityCount,
    reviewerTasksCount: reviewerCount,
    disagreementRate: Number((disagreementRate * 100).toFixed(1)),
    goldAccuracyOverall: Number(goldAccuracyOverall.toFixed(1)),
    goldTotalAnswered: goldAnnotations.length,
    completionRate: Number(completionRate.toFixed(1)),
    annotationProgressRate: Number(annotationProgressRate.toFixed(1)),
    estimatedEtaHours,
    throughputPerHour,
  };
}

/**
 * Project Health Panel checks according to Phase 11.
 */
export function generateHealthIssues(
  project: Project,
  tasks: Task[],
  metrics: QualityMetrics
): HealthIssue[] {
  const issues: HealthIssue[] = [];

  // Check 1: Review Backlog (> 5 tasks in review queue)
  const inReviewTasks = tasks.filter(t => !t.isGold && t.status === 'in_review');
  if (inReviewTasks.length >= 5) {
    issues.push({
      id: 'backlog-warning',
      severity: inReviewTasks.length > 10 ? 'critical' : 'warning',
      title: 'Review Queue Backlog',
      message: `${inReviewTasks.length} tasks require human reviewer resolution due to annotator disagreement.`,
      actionText: 'Open Review Queue',
      actionKey: 'open_review',
    });
  }

  // Check 2: Low Kappa Agreement (< 0.40 with sufficient tasks)
  if (metrics.eligibleTaskCount >= 5 && metrics.fleissKappa !== null && metrics.fleissKappa < 0.40) {
    issues.push({
      id: 'low-kappa-warning',
      severity: 'warning',
      title: 'Low Agreement Score (κ = ' + metrics.fleissKappa.toFixed(2) + ')',
      message: 'Annotators frequently disagree. Consider clarifying annotation guidelines or adding few-shot examples.',
      actionText: 'Review Guidelines',
      actionKey: 'edit_guidelines',
    });
  }

  // Check 3: Gold Standard task coverage
  const goldCount = tasks.filter(t => t.isGold).length;
  if (goldCount < 5 && tasks.length > 10) {
    issues.push({
      id: 'low-gold-info',
      severity: 'info',
      title: 'Low Gold Standard Pool',
      message: `Only ${goldCount} gold tasks configured. Having at least 15-20 ensures accurate annotator quality evaluation.`,
      actionText: 'Add Gold Task',
      actionKey: 'add_gold',
    });
  }

  // Check 4: Member headcount vs Overlap
  const annotatorCount = project.members.filter(m => m.role === 'annotator').length;
  if (project.status === 'active' && annotatorCount < project.overlapCount) {
    issues.push({
      id: 'understaffed-critical',
      severity: 'critical',
      title: 'Understaffed for Overlap Count',
      message: `Project requires overlap of ${project.overlapCount}, but only ${annotatorCount} annotator(s) are assigned. Tasks cannot reach full consensus.`,
      actionText: 'Assign Members',
      actionKey: 'assign_members',
    });
  }

  // Check 5: Flagged Tasks
  const flaggedTasks = tasks.filter(t => t.flags && t.flags.length > 0);
  if (flaggedTasks.length > 0) {
    issues.push({
      id: 'flagged-tasks-warning',
      severity: 'warning',
      title: `${flaggedTasks.length} Flagged Task(s)`,
      message: 'Annotators flagged items for ambiguity, data corruption, or guideline gaps.',
      actionText: 'Inspect Flags',
      actionKey: 'open_flags',
    });
  }

  return issues;
}
