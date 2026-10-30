export type UserRole = 'admin' | 'annotator' | 'reviewer';

export interface UserStats {
  totalLabeled: number;
  goldCorrect: number;
  goldTotal: number;
  streak: number;
  avgTimeSeconds?: number;
  totalBoxesDrawn?: number;
  activeMinutes?: number;
  idleMinutes?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  stats: UserStats;
}

export interface LabelDefinition {
  id: string;
  name: string;
  color: string;
  shortcutKey: string;
  description?: string;
}

export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type MajorityPolicy = 'auto' | 'manual';
export type AiMode = 'off' | 'hidden' | 'show';
export type ProjectTaskType = 'text_classification' | 'image_bounding_box' | 'multi_modal';

export interface ProjectMember {
  userId: string;
  role: 'annotator' | 'reviewer';
  assignedAt: string;
}

export interface AiExample {
  text?: string;
  label: string;
  imageUrl?: string;
}

export interface ProjectCounts {
  total: number;
  completed: number;
  inReview: number;
  pending: number;
  gold: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  taskType: ProjectTaskType;
  labels: LabelDefinition[];
  guidelines: string;
  overlapCount: number; // typically 2 or 3
  majorityPolicy: MajorityPolicy;
  aiEnabled: boolean;
  aiMode: AiMode;
  aiModel: string;
  aiExamples: AiExample[];
  goldRate: number; // e.g. 0.05 for 5%
  status: ProjectStatus;
  members: ProjectMember[];
  counts: ProjectCounts;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'in_review' | 'completed';

export interface BoundingBox {
  id: string;
  label: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
  confidence?: number;
  source?: 'human' | 'ai';
  color?: string;
}

export interface TaskData {
  text?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  meta?: Record<string, any>;
}

export interface AiSuggestion {
  label: string;
  confidence: number; // 0 to 1
  rationale?: string;
  boxes?: BoundingBox[];
  model: string;
  promptVersion: string;
  createdAt: string;
}

export interface FinalLabel {
  label: string;
  method: 'consensus' | 'majority' | 'reviewer';
  boxes?: BoundingBox[];
  resolvedBy?: string; // userId if reviewer
  resolvedAt: string;
}

export interface TaskFlag {
  userId: string;
  reason: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  data: TaskData;
  status: TaskStatus;
  isGold: boolean;
  goldLabel?: string;
  goldBoxes?: BoundingBox[];
  annotationCount: number;
  annotatedBy: string[]; // userIds
  reservedBy?: string;
  reservedUntil?: string; // ISO date
  aiSuggestion?: AiSuggestion;
  finalLabel?: FinalLabel;
  skippedBy: string[];
  flags: TaskFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  label: string;
  boxes?: BoundingBox[];
  timeTakenSeconds: number;
  isGold?: boolean;
  isCorrect?: boolean;
  usedAiSuggestion?: boolean;
  notes?: string;
  createdAt: string;
}

export interface QualityMetrics {
  fleissKappa: number | null;
  kappaInterpretation: 'Poor' | 'Fair' | 'Moderate' | 'Substantial' | 'Almost Perfect' | 'Not enough data';
  observedAgreement: number;
  chanceAgreement: number;
  eligibleTaskCount: number;
  consensusTasksCount: number;
  majorityTasksCount: number;
  reviewerTasksCount: number;
  disagreementRate: number;
  goldAccuracyOverall: number;
  goldTotalAnswered: number;
  completionRate: number;
  annotationProgressRate: number;
  estimatedEtaHours: number | null;
  throughputPerHour: number;
}

export interface HealthIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionText: string;
  actionKey: string;
}

export interface AiEvaluationReport {
  totalTasksWithAi: number;
  accuracyOnGold: number | null;
  goldEvaluatedCount: number;
  followedWhenWrongRate: number;
  calibrationHighConfidenceAccuracy: number | null;
  calibrationLowConfidenceAccuracy: number | null;
  estimatedCostUsd: number;
  totalTokensUsed: number;
  lastRunTimestamp?: string;
}

// --- Real-time Activity & Telemetry Tracker Types (CVAT / JEBI style) ---
export type WorkerActionType =
  | 'box_created'
  | 'box_deleted'
  | 'box_resized'
  | 'label_assigned'
  | 'task_submitted'
  | 'task_skipped'
  | 'task_flagged'
  | 'conflict_resolved'
  | 'ai_accepted'
  | 'idle_detected'
  | 'canvas_zoom'
  | 'guidelines_viewed';

export interface WorkerActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  projectId: string;
  projectName: string;
  taskId: string;
  action: WorkerActionType;
  details: string;
  durationSeconds?: number;
  timestamp: string;
}

export interface WorkerLiveStatus {
  userId: string;
  userName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active_labeling' | 'reviewing' | 'idle' | 'offline';
  currentTaskId?: string;
  currentTaskType?: string;
  lastAction: string;
  lastActiveTimestamp: string;
  todayTasksCompleted: number;
  todayBoxesDrawn: number;
  todayActiveMinutes: number;
  todayIdleMinutes: number;
  avgSecondsPerTask: number;
  rejectionRatePct: number;
  goldAccuracyPct: number;
}
