import { fleissKappa, decideOutcome, interpretKappa } from './metrics';
import { readableTextColor, luminance } from './color';
import { buildPrompt, computePromptVersion } from './promptBuilder';
import { Project } from '../types';

export interface TestCaseResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: string;
  executionTimeMs: number;
}

export function runAllAppTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Test 1: Fleiss' Kappa Perfect Agreement
  const t1Start = performance.now();
  try {
    const perfectItems = [
      ['Pos', 'Pos', 'Pos'],
      ['Neg', 'Neg', 'Neg'],
      ['Pos', 'Pos', 'Pos'],
      ['Neutral', 'Neutral', 'Neutral']
    ];
    const categories = ['Pos', 'Neg', 'Neutral'];
    const res = fleissKappa(perfectItems, categories);
    const passed = res.kappa !== null && res.kappa >= 0.99 && res.observedAgreement === 1;
    results.push({
      name: "Fleiss' Kappa - 100% Unanimous Agreement",
      category: 'Quality Control (Phase 9)',
      passed,
      message: passed ? 'κ = 1.00 correctly calculated with P̄ = 1.00' : `Expected κ = 1.0, got ${res.kappa}`,
      details: `Observed: ${res.observedAgreement}, Chance: ${res.chanceAgreement.toFixed(3)}`,
      executionTimeMs: Number((performance.now() - t1Start).toFixed(2))
    });
  } catch (err: any) {
    results.push({
      name: "Fleiss' Kappa - 100% Unanimous Agreement",
      category: 'Quality Control (Phase 9)',
      passed: false,
      message: err.message,
      executionTimeMs: Number((performance.now() - t1Start).toFixed(2))
    });
  }

  // Test 2: Fleiss' Kappa Disagreement vs Chance
  const t2Start = performance.now();
  try {
    const splitItems = [
      ['Pos', 'Neg', 'Neutral'],
      ['Neg', 'Pos', 'Neutral'],
      ['Neutral', 'Pos', 'Neg']
    ];
    const categories = ['Pos', 'Neg', 'Neutral'];
    const res = fleissKappa(splitItems, categories);
    const passed = res.kappa !== null && res.kappa <= 0.05;
    results.push({
      name: "Fleiss' Kappa - High Disagreement / Chance Baseline",
      category: 'Quality Control (Phase 9)',
      passed,
      message: passed ? `Correctly detected low/negative agreement (κ = ${res.kappa?.toFixed(2)})` : `Unexpected kappa: ${res.kappa}`,
      details: `Observed agreement: ${res.observedAgreement.toFixed(2)}, Chance: ${res.chanceAgreement.toFixed(2)}`,
      executionTimeMs: Number((performance.now() - t2Start).toFixed(2))
    });
  } catch (err: any) {
    results.push({
      name: "Fleiss' Kappa - High Disagreement",
      category: 'Quality Control (Phase 9)',
      passed: false,
      message: err.message,
      executionTimeMs: Number((performance.now() - t2Start).toFixed(2))
    });
  }

  // Test 3: Decision Outcome - Consensus
  const t3Start = performance.now();
  try {
    const outcome = decideOutcome(['Positive', 'Positive', 'Positive'], 'auto');
    const passed = outcome.status === 'completed' && outcome.label === 'Positive' && outcome.method === 'consensus';
    results.push({
      name: 'Voting Engine - Unanimous Consensus',
      category: 'Voting Engine (Phase 6 & 8)',
      passed,
      message: passed ? 'Marked task completed with method: consensus' : 'Consensus logic failure',
      details: JSON.stringify(outcome),
      executionTimeMs: Number((performance.now() - t3Start).toFixed(2))
    });
  } catch (err: any) {
    results.push({
      name: 'Voting Engine - Unanimous Consensus',
      category: 'Voting Engine (Phase 6 & 8)',
      passed: false,
      message: err.message,
      executionTimeMs: Number((performance.now() - t3Start).toFixed(2))
    });
  }

  // Test 4: Decision Outcome - Majority Auto-Approval
  const t4Start = performance.now();
  try {
    const outcome = decideOutcome(['Positive', 'Positive', 'Negative'], 'auto');
    const passed = outcome.status === 'completed' && outcome.label === 'Positive' && outcome.method === 'majority';
    results.push({
      name: 'Voting Engine - Majority Auto-Approval (2 of 3)',
      category: 'Voting Engine (Phase 6 & 8)',
      passed,
      message: passed ? 'Auto-approved 2/3 majority under "auto" policy' : 'Majority logic failure',
      details: JSON.stringify(outcome),
      executionTimeMs: Number((performance.now() - t4Start).toFixed(2))
    });
  } catch (err: any) {
    results.push({
      name: 'Voting Engine - Majority Auto-Approval',
      category: 'Voting Engine (Phase 6 & 8)',
      passed: false,
      message: err.message,
      executionTimeMs: Number((performance.now() - t4Start).toFixed(2))
    });
  }

  // Test 5: Decision Outcome - Complete Split -> In Review
  const t5Start = performance.now();
  try {
    const outcome = decideOutcome(['Positive', 'Neutral', 'Negative'], 'auto');
    const passed = outcome.status === 'in_review' && outcome.label === null;
    results.push({
      name: 'Voting Engine - Complete Split Routes to Review Queue',
      category: 'Voting Engine (Phase 6 & 8)',
      passed,
      message: passed ? 'Triaged split votes to in_review status for human QA' : 'Split decision routing failure',
      details: JSON.stringify(outcome),
      executionTimeMs: Number((performance.now() - t5Start).toFixed(2))
    });
  } catch (err: any) {
    results.push({
      name: 'Voting Engine - Complete Split',
      category: 'Voting Engine (Phase 6 & 8)',
      passed: false,
      message: err.message,
      executionTimeMs: Number((performance.now() - t5Start).toFixed(2))
    });
  }

  // Test 6: WCAG AA Color Contrast Calculation
  const t6Start = performance.now();
  try {
    const textOnDark = readableTextColor('#0f172a'); // slate-900
    const textOnLight = readableTextColor('#ffffff'); // white
    const textOnRed = readableTextColor('#ef4444'); // red
    const passed = textOnDark === '#ffffff' && textOnLight === '#0f172a';
    results.push({
      name: 'WCAG AA Dynamic Text Contrast (Phase 12)',
      category: 'UI/UX Accessibility (Phase 12)',
      passed,
      message: passed ? 'High contrast text selected for light and dark backgrounds' : 'Contrast failure',
      details: `Dark BG text: ${textOnDark}, Light BG text: ${textOnLight}`,
      executionTimeMs: Number((performance.now() - t6Start).toFixed(2))
    });
  } catch (err: any) {
    results.push({
      name: 'WCAG AA Dynamic Text Contrast',
      category: 'UI/UX Accessibility (Phase 12)',
      passed: false,
      message: err.message,
      executionTimeMs: Number((performance.now() - t6Start).toFixed(2))
    });
  }

  // Test 7: Prompt Version Hash Stability (Phase 10)
  const t7Start = performance.now();
  try {
    const mockProj: any = {
      labels: [{ name: 'Spam' }, { name: 'Ham' }],
      guidelines: 'Check for phishing',
      aiExamples: [],
      aiModel: 'gemini-3.8-flash'
    };
    const hash1 = computePromptVersion(mockProj);
    const hash2 = computePromptVersion(mockProj);
    mockProj.guidelines = 'Updated guidelines for SMS';
    const hash3 = computePromptVersion(mockProj);
    const passed = hash1 === hash2 && hash1 !== hash3;
    results.push({
      name: 'Prompt Version Invalidation & Cache Hash (Phase 10)',
      category: 'AI Engine (Phase 10)',
      passed,
      message: passed ? 'Deterministic hash matches on equal content and invalidates upon guideline changes' : 'Prompt hashing failure',
      details: `Initial: ${hash1}, Modified: ${hash3}`,
      executionTimeMs: Number((performance.now() - t7Start).toFixed(2))
    });
  } catch (err: any) {
    results.push({
      name: 'Prompt Version Invalidation',
      category: 'AI Engine (Phase 10)',
      passed: false,
      message: err.message,
      executionTimeMs: Number((performance.now() - t7Start).toFixed(2))
    });
  }

  return results;
}
