import { User, Project, Task, Annotation, ProjectCounts, QualityMetrics, HealthIssue, BoundingBox, WorkerActivityLog, WorkerLiveStatus, WorkerActionType } from '../types';
import { SEED_USERS, SEED_PROJECTS, SEED_TASKS, SEED_ANNOTATIONS, SEED_WORKER_LOGS, SEED_WORKER_STATUSES } from '../data/seedData';
import { decideOutcome, calculateProjectMetrics, generateHealthIssues } from '../utils/metrics';

const STORAGE_KEYS = {
  USERS: 'labelloop_users_v1',
  PROJECTS: 'labelloop_projects_v1',
  TASKS: 'labelloop_tasks_v1',
  ANNOTATIONS: 'labelloop_annotations_v1',
  CURRENT_USER_ID: 'labelloop_current_user_id_v1',
  WORKER_LOGS: 'labelloop_worker_logs_v1',
  WORKER_STATUSES: 'labelloop_worker_statuses_v1',
};

class StorageService {
  private users: User[] = [];
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private annotations: Annotation[] = [];
  private workerLogs: WorkerActivityLog[] = [];
  private workerStatuses: WorkerLiveStatus[] = [];
  private currentUserId: string = 'u-alex'; // default admin
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const storedAnnotations = localStorage.getItem(STORAGE_KEYS.ANNOTATIONS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const storedLogs = localStorage.getItem(STORAGE_KEYS.WORKER_LOGS);
      const storedStatuses = localStorage.getItem(STORAGE_KEYS.WORKER_STATUSES);

      if (storedUsers && storedProjects && storedTasks && storedAnnotations) {
        this.users = JSON.parse(storedUsers);
        this.projects = JSON.parse(storedProjects);
        this.tasks = JSON.parse(storedTasks);
        this.annotations = JSON.parse(storedAnnotations);
        this.workerLogs = storedLogs ? JSON.parse(storedLogs) : JSON.parse(JSON.stringify(SEED_WORKER_LOGS));
        this.workerStatuses = storedStatuses ? JSON.parse(storedStatuses) : JSON.parse(JSON.stringify(SEED_WORKER_STATUSES));
      } else {
        this.resetToDefaults();
      }

      if (storedUser && this.users.some(u => u.id === storedUser)) {
        this.currentUserId = storedUser;
      }
    } catch (e) {
      console.error('Failed to load storage, initializing defaults', e);
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    this.users = JSON.parse(JSON.stringify(SEED_USERS));
    this.projects = JSON.parse(JSON.stringify(SEED_PROJECTS));
    this.tasks = JSON.parse(JSON.stringify(SEED_TASKS));
    this.annotations = JSON.parse(JSON.stringify(SEED_ANNOTATIONS));
    this.workerLogs = JSON.parse(JSON.stringify(SEED_WORKER_LOGS));
    this.workerStatuses = JSON.parse(JSON.stringify(SEED_WORKER_STATUSES));
    this.currentUserId = 'u-alex';
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(this.projects));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
      localStorage.setItem(STORAGE_KEYS.ANNOTATIONS, JSON.stringify(this.annotations));
      localStorage.setItem(STORAGE_KEYS.WORKER_LOGS, JSON.stringify(this.workerLogs));
      localStorage.setItem(STORAGE_KEYS.WORKER_STATUSES, JSON.stringify(this.workerStatuses));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // --- User Management ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public getCurrentUser(): User {
    const user = this.getUser(this.currentUserId);
    return user || this.users[0];
  }

  public setCurrentUser(userId: string) {
    if (this.users.some(u => u.id === userId)) {
      this.currentUserId = userId;
      this.persist();
    }
  }

  public updateUserRole(userId: string, newRole: User['role']) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.role = newRole;
      this.persist();
    }
  }

  public toggleUserStatus(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isActive = !user.isActive;
      this.persist();
    }
  }

  public registerUser(name: string, email: string): User {
    const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role: 'annotator', // new users start as annotator per Phase 5
      isActive: true,
      stats: {
        totalLabeled: 0,
        goldCorrect: 0,
        goldTotal: 0,
        streak: 0,
        avgTimeSeconds: 0
      }
    };
    this.users.push(newUser);
    this.currentUserId = newUser.id;
    this.persist();
    return newUser;
  }

  // --- Project Management ---
  public getProjects(): Project[] {
    return [...this.projects];
  }

  public getProject(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  public createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'counts'>): Project {
    const newProject: Project = {
      ...projectData,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      counts: {
        total: 0,
        completed: 0,
        inReview: 0,
        pending: 0,
        gold: 0
      }
    };
    this.projects.unshift(newProject);
    this.persist();
    return newProject;
  }

  public updateProject(id: string, updates: Partial<Project>): Project {
    const project = this.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');

    Object.assign(project, updates, { updatedAt: new Date().toISOString() });
    this.recalculateCounts(id);
    this.persist();
    return project;
  }

  public activateProject(id: string): { success: boolean; error?: string } {
    const project = this.getProject(id);
    if (!project) return { success: false, error: 'Project not found' };

    // Phase 8 Activation Rules:
    // 1. At least 2 labels defined
    if (project.labels.length < 2) {
      return { success: false, error: 'At least 2 labels must be defined before activation.' };
    }

    // 2. At least 1 task imported
    const projectTasks = this.tasks.filter(t => t.projectId === id);
    if (projectTasks.length === 0) {
      return { success: false, error: 'At least 1 task must be imported before activation.' };
    }

    // 3. Number of annotator members >= overlapCount
    const annotatorCount = project.members.filter(m => m.role === 'annotator').length;
    if (annotatorCount < project.overlapCount) {
      return {
        success: false,
        error: `Add at least ${project.overlapCount} annotators or lower the overlap count (currently ${annotatorCount} assigned).`
      };
    }

    project.status = 'active';
    project.updatedAt = new Date().toISOString();
    this.persist();
    return { success: true };
  }

  public setProjectStatus(id: string, status: Project['status']) {
    const project = this.getProject(id);
    if (project) {
      project.status = status;
      project.updatedAt = new Date().toISOString();
      this.persist();
    }
  }

  public recalculateCounts(projectId: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    const projectTasks = this.tasks.filter(t => t.projectId === projectId);
    const normalTasks = projectTasks.filter(t => !t.isGold);
    const goldTasks = projectTasks.filter(t => t.isGold);

    project.counts = {
      total: normalTasks.length,
      completed: normalTasks.filter(t => t.status === 'completed').length,
      inReview: normalTasks.filter(t => t.status === 'in_review').length,
      pending: normalTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      gold: goldTasks.length
    };
  }

  // --- Tasks & Labeling Workflow ---
  public getTasks(projectId: string): Task[] {
    return this.tasks.filter(t => t.projectId === projectId);
  }

  public getTask(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  /**
   * Fetches the next available task for the annotator using Phase 6 & Phase 8 reservation mechanics.
   * Handles secret gold task insertion if project.goldRate > 0.
   */
  public getNextTask(projectId: string, userId: string): { task: Task | null; doneByYou: number; availableForYou: number } {
    const project = this.getProject(projectId);
    if (!project || project.status !== 'active') {
      return { task: null, doneByYou: 0, availableForYou: 0 };
    }

    const projectTasks = this.tasks.filter(t => t.projectId === projectId);
    const userAnnotations = this.annotations.filter(a => a.projectId === projectId && a.userId === userId);
    const doneByYou = userAnnotations.length;

    const now = new Date().getTime();

    // Candidate normal tasks:
    // - Not gold
    // - User hasn't already annotated
    // - User hasn't skipped
    // - Not completed
    // - Annotation count < overlapCount
    // - Not reserved by someone else whose lock is still active
    const candidateTasks = projectTasks.filter(t => {
      if (t.isGold) return false;
      if (t.annotatedBy.includes(userId)) return false;
      if (t.skippedBy && t.skippedBy.includes(userId)) return false;
      if (t.status === 'completed') return false;
      if (t.annotationCount >= project.overlapCount) return false;

      if (t.reservedBy && t.reservedBy !== userId && t.reservedUntil) {
        const lockTime = new Date(t.reservedUntil).getTime();
        if (now < lockTime) return false; // lock still active
      }
      return true;
    });

    const availableForYou = candidateTasks.length;

    // Secret Gold Task Check (Phase 9 Tool 4)
    if (project.goldRate > 0 && Math.random() < project.goldRate) {
      const goldCandidate = projectTasks.find(t => {
        return t.isGold && !t.annotatedBy.includes(userId) && (!t.skippedBy || !t.skippedBy.includes(userId));
      });
      if (goldCandidate) {
        goldCandidate.reservedBy = userId;
        goldCandidate.reservedUntil = new Date(now + 10 * 60 * 1000).toISOString();
        this.persist();
        // Return without exposing isGold or goldLabel to the annotator!
        return {
          task: { ...goldCandidate, goldLabel: undefined },
          doneByYou,
          availableForYou
        };
      }
    }

    if (candidateTasks.length === 0) {
      return { task: null, doneByYou, availableForYou: 0 };
    }

    // Reserve task for 10 minutes
    const nextTask = candidateTasks[0];
    nextTask.reservedBy = userId;
    nextTask.reservedUntil = new Date(now + 10 * 60 * 1000).toISOString();
    this.persist();

    return {
      task: nextTask,
      doneByYou,
      availableForYou
    };
  }

  /**
   * Submit an annotation according to Phase 6 & Phase 9.
   */
  public submitAnnotation(
    taskId: string,
    userId: string,
    label: string,
    timeTakenSeconds: number,
    notes?: string,
    boxes?: BoundingBox[]
  ): { success: boolean; isGold?: boolean; isCorrect?: boolean; finalStatus?: string } {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    const project = this.getProject(task.projectId);
    if (!project) throw new Error('Project not found');

    const isGold = Boolean(task.isGold);
    const isCorrect = isGold ? label === task.goldLabel : undefined;

    // Check if annotator used AI suggestion
    const usedAiSuggestion = Boolean(
      project.aiMode === 'show' &&
      task.aiSuggestion &&
      (task.aiSuggestion.label.toLowerCase() === label.toLowerCase() ||
        (boxes && boxes.some(b => b.source === 'ai')))
    );

    const newAnnotation: Annotation = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      taskId,
      projectId: task.projectId,
      userId,
      label,
      boxes: boxes ? [...boxes] : undefined,
      timeTakenSeconds: Math.max(1, timeTakenSeconds),
      isGold,
      isCorrect,
      usedAiSuggestion,
      notes,
      createdAt: new Date().toISOString()
    };
    this.annotations.push(newAnnotation);

    // Update user stats
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.stats.totalLabeled += 1;
      if (boxes && boxes.length > 0) {
        user.stats.totalBoxesDrawn = (user.stats.totalBoxesDrawn || 0) + boxes.length;
      }
      if (isGold) {
        user.stats.goldTotal += 1;
        if (isCorrect) user.stats.goldCorrect += 1;
      }
      user.stats.streak = (user.stats.streak || 0) + 1;
    }

    // Update task
    if (!task.annotatedBy.includes(userId)) {
      task.annotatedBy.push(userId);
    }
    task.annotationCount = task.annotatedBy.length;
    task.reservedBy = undefined;
    task.reservedUntil = undefined;
    task.updatedAt = new Date().toISOString();

    // If gold task, don't finalize for project consensus
    if (!isGold) {
      if (task.annotationCount >= project.overlapCount) {
        // Collect all submitted labels for this task
        const taskAnnotations = this.annotations.filter(a => a.taskId === taskId && !a.isGold);
        const labels = taskAnnotations.map(a => a.label);

        const outcome = decideOutcome(labels, project.majorityPolicy);
        if (outcome.status === 'completed' && outcome.label && outcome.method) {
          task.status = 'completed';
          task.finalLabel = {
            label: outcome.label,
            method: outcome.method,
            boxes: boxes ? [...boxes] : undefined,
            resolvedAt: new Date().toISOString()
          };
        } else {
          task.status = 'in_review';
        }
      } else {
        task.status = 'in_progress';
      }
    }

    // Record worker telemetry action
    this.recordWorkerAction({
      userId,
      userName: user?.name || 'Annotator',
      userRole: user?.role || 'annotator',
      userAvatar: user?.avatar,
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      action: 'task_submitted',
      details: boxes && boxes.length > 0 
        ? `Submitted ${boxes.length} bounding boxes [${label}] in ${timeTakenSeconds}s`
        : `Submitted label "${label}" in ${timeTakenSeconds}s`,
      durationSeconds: timeTakenSeconds
    });

    // Update worker live status
    this.updateWorkerStatus(userId, {
      status: 'active_labeling',
      lastAction: boxes && boxes.length > 0 ? `Submitted ${boxes.length} BBoxes` : `Submitted [${label}]`,
      todayTasksCompleted: (this.getWorkerStatus(userId)?.todayTasksCompleted || 0) + 1,
      todayBoxesDrawn: (this.getWorkerStatus(userId)?.todayBoxesDrawn || 0) + (boxes?.length || 0),
      lastActiveTimestamp: new Date().toISOString()
    });

    this.recalculateCounts(task.projectId);
    this.persist();

    return {
      success: true,
      isGold,
      isCorrect,
      finalStatus: task.status
    };
  }

  public skipTask(taskId: string, userId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      if (!task.skippedBy) task.skippedBy = [];
      if (!task.skippedBy.includes(userId)) task.skippedBy.push(userId);
      task.reservedBy = undefined;
      task.reservedUntil = undefined;
      this.persist();
    }
  }

  public flagTask(taskId: string, userId: string, reason: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      if (!task.flags) task.flags = [];
      task.flags.push({ userId, reason, createdAt: new Date().toISOString() });
      task.status = 'in_review';
      task.reservedBy = undefined;
      task.reservedUntil = undefined;
      this.recalculateCounts(task.projectId);
      this.persist();
    }
  }

  public resolveReview(taskId: string, reviewerId: string, finalLabelName: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.finalLabel = {
        label: finalLabelName,
        method: 'reviewer',
        resolvedBy: reviewerId,
        resolvedAt: new Date().toISOString()
      };
      this.recalculateCounts(task.projectId);
      this.persist();
    }
  }

  public importTasks(projectId: string, rows: { text: string; goldLabel?: string; meta?: any }[]): { imported: number; skipped: number } {
    let imported = 0;
    let skipped = 0;

    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const validLabels = project.labels.map(l => l.name.toLowerCase());

    rows.forEach((row, i) => {
      const text = (row.text || '').trim();
      if (!text) {
        skipped++;
        return;
      }

      let isGold = false;
      let validGoldLabel: string | undefined = undefined;

      if (row.goldLabel) {
        const match = project.labels.find(l => l.name.toLowerCase() === row.goldLabel!.toLowerCase());
        if (match) {
          isGold = true;
          validGoldLabel = match.name;
        }
      }

      const newTask: Task = {
        id: `t-${projectId.slice(0, 8)}-${Date.now()}-${i}`,
        projectId,
        data: {
          text,
          meta: row.meta || {}
        },
        status: 'pending',
        isGold,
        goldLabel: validGoldLabel,
        annotationCount: 0,
        annotatedBy: [],
        skippedBy: [],
        flags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.tasks.push(newTask);
      imported++;
    });

    this.recalculateCounts(projectId);
    this.persist();
    return { imported, skipped };
  }

  public addGoldTask(projectId: string, text: string, goldLabel: string): Task {
    const newTask: Task = {
      id: `t-gold-${Date.now()}`,
      projectId,
      data: { text },
      status: 'pending',
      isGold: true,
      goldLabel,
      annotationCount: 0,
      annotatedBy: [],
      skippedBy: [],
      flags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.recalculateCounts(projectId);
    this.persist();
    return newTask;
  }

  // --- AI Pre-labeling Updates ---
  public updateTaskAiSuggestion(taskId: string, suggestion: Task['aiSuggestion']) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.aiSuggestion = suggestion;
      task.updatedAt = new Date().toISOString();
      this.persist();
    }
  }

  // --- Quality & Metrics ---
  public getMetrics(projectId: string): QualityMetrics {
    const project = this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const projectTasks = this.tasks.filter(t => t.projectId === projectId);
    const projectAnnotations = this.annotations.filter(a => a.projectId === projectId);

    return calculateProjectMetrics(project, projectTasks, projectAnnotations);
  }

  public getHealthIssues(projectId: string): HealthIssue[] {
    const project = this.getProject(projectId);
    if (!project) return [];

    const projectTasks = this.tasks.filter(t => t.projectId === projectId);
    const metrics = this.getMetrics(projectId);
    return generateHealthIssues(project, projectTasks, metrics);
  }

  public getAnnotations(projectId?: string): Annotation[] {
    if (!projectId) return [...this.annotations];
    return this.annotations.filter(a => a.projectId === projectId);
  }

  // --- CVAT / JEBI Workforce Tracker Telemetry ---
  public recordWorkerAction(log: Omit<WorkerActivityLog, 'id' | 'timestamp'>) {
    const newLog: WorkerActivityLog = {
      ...log,
      id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.workerLogs.unshift(newLog);
    if (this.workerLogs.length > 200) this.workerLogs.pop();
    this.persist();
    return newLog;
  }

  public getWorkerLogs(filter?: { userId?: string; projectId?: string; action?: string }): WorkerActivityLog[] {
    let list = [...this.workerLogs];
    if (filter?.userId) list = list.filter(l => l.userId === filter.userId);
    if (filter?.projectId) list = list.filter(l => l.projectId === filter.projectId);
    if (filter?.action) list = list.filter(l => l.action === filter.action);
    return list;
  }

  public getWorkerStatuses(): WorkerLiveStatus[] {
    return [...this.workerStatuses];
  }

  public getWorkerStatus(userId: string): WorkerLiveStatus | undefined {
    return this.workerStatuses.find(s => s.userId === userId);
  }

  public updateWorkerStatus(userId: string, updates: Partial<WorkerLiveStatus>) {
    const existing = this.workerStatuses.find(s => s.userId === userId);
    if (existing) {
      Object.assign(existing, updates);
      if (updates.status) existing.status = updates.status;
      existing.lastActiveTimestamp = new Date().toISOString();
    } else {
      const user = this.getUser(userId);
      if (user) {
        this.workerStatuses.push({
          userId,
          userName: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          status: updates.status || 'active_labeling',
          lastAction: updates.lastAction || 'Started labeling',
          lastActiveTimestamp: new Date().toISOString(),
          todayTasksCompleted: updates.todayTasksCompleted || 0,
          todayBoxesDrawn: updates.todayBoxesDrawn || 0,
          todayActiveMinutes: updates.todayActiveMinutes || 1,
          todayIdleMinutes: updates.todayIdleMinutes || 0,
          avgSecondsPerTask: updates.avgSecondsPerTask || 6.5,
          rejectionRatePct: updates.rejectionRatePct || 0,
          goldAccuracyPct: updates.goldAccuracyPct || 100,
          ...updates
        });
      }
    }
    this.persist();
  }

  public exportTelemetryLogsCsv(): string {
    const headers = ['Log ID', 'Timestamp', 'User Name', 'Role', 'Project', 'Task ID', 'Action', 'Duration (s)', 'Details'];
    const rows = this.workerLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.userName.replace(/"/g, '""')}"`,
      l.userRole,
      `"${l.projectName.replace(/"/g, '""')}"`,
      l.taskId,
      l.action,
      l.durationSeconds || 0,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const storage = new StorageService();

