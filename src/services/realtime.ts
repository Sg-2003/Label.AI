import { storage } from './storage';
import { Task, Annotation, BoundingBox, WorkerActivityLog } from '../types';

export interface ActiveMember {
  userId: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'annotation' | 'review' | 'flag' | 'ai' | 'presence';
  message: string;
  user: { name: string; role: string; avatar?: string };
  timestamp: string;
  projectId: string;
}

type EventCallback = (data: any) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private status: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private activeMembers: ActiveMember[] = [];
  private activities: ActivityFeedItem[] = [];
  private listeners: Set<() => void> = new Set();
  private eventHandlers: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;
  private currentProjectId: string = '';
  private currentUserId: string = '';
  private currentRole: string = '';
  private currentUserName: string = '';
  private currentUserAvatar?: string;
  private pingTimer: any = null;

  constructor() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.status = 'connecting';
      this.notify();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.notify();

        // If credentials already set, re-join
        if (this.currentProjectId && this.currentUserId) {
          this.joinProject(
            this.currentProjectId,
            this.currentUserId,
            this.currentRole,
            this.currentUserName,
            this.currentUserAvatar
          );
        }

        // Setup ping heartbeat
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerEvent(msg.event, msg.payload);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.notify();
        if (this.pingTimer) clearInterval(this.pingTimer);

        // Auto reconnect
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Realtime WebSocket error:', err);
      };
    } catch (e) {
      this.status = 'disconnected';
      this.notify();
    }
  }

  private handleServerEvent(event: string, payload: any) {
    switch (event) {
      case 'presence:update': {
        this.activeMembers = payload.activeMembers || [];
        this.notify();
        break;
      }

      case 'task:updated': {
        const { task, annotation } = payload;
        if (task) {
          // Sync into client storage
          const clientTask = storage.getTask(task.id);
          if (clientTask) {
            Object.assign(clientTask, task);
            storage.recalculateCounts(task.projectId);
          }
        }
        this.notify();
        break;
      }

      case 'task:reserved': {
        const { taskId, userId, reservedUntil } = payload;
        const task = storage.getTask(taskId);
        if (task) {
          task.reservedBy = userId;
          task.reservedUntil = reservedUntil;
        }
        this.notify();
        break;
      }

      case 'activity:new': {
        this.activities.unshift(payload);
        if (this.activities.length > 50) this.activities.pop();
        this.notify();
        break;
      }

      case 'ai:batch_completed': {
        if (payload.results && Array.isArray(payload.results)) {
          payload.results.forEach((item: any) => {
            storage.updateTaskAiSuggestion(item.taskId, item.aiSuggestion);
          });
        }
        this.notify();
        break;
      }

      case 'state:snapshot': {
        if (payload.activities) {
          this.activities = payload.activities;
        }
        this.notify();
        break;
      }
    }

    // Call any specific event callbacks
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(payload));
    }
  }

  public joinProject(
    projectId: string,
    userId: string,
    role: string,
    userName: string,
    avatar?: string
  ) {
    this.currentProjectId = projectId;
    this.currentUserId = userId;
    this.currentRole = role;
    this.currentUserName = userName;
    this.currentUserAvatar = avatar;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'join',
        projectId,
        userId,
        role,
        userName,
        avatar
      }));
    }
  }

  public reserveTask(taskId: string, userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'task:reserve', taskId, userId }));
    }
  }

  public submitAnnotation(
    taskId: string,
    userId: string,
    label: string,
    timeTakenSeconds: number,
    notes?: string,
    boxes?: BoundingBox[]
  ) {
    // Optimistic update locally
    const localResult = storage.submitAnnotation(taskId, userId, label, timeTakenSeconds, notes, boxes);

    // Send through WebSocket to broadcast to all clients in real-time
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'annotation:submit',
        taskId,
        userId,
        label,
        timeTakenSeconds,
        notes,
        boxes
      }));
    }

    return localResult;
  }

  public recordTelemetry(log: Omit<WorkerActivityLog, 'id' | 'timestamp'>) {
    const createdLog = storage.recordWorkerAction(log);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'telemetry:action',
        log: createdLog
      }));
    }

    return createdLog;
  }

  public resolveReview(taskId: string, reviewerId: string, finalLabelName: string) {
    storage.resolveReview(taskId, reviewerId, finalLabelName);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'review:resolve',
        taskId,
        reviewerId,
        finalLabelName
      }));
    }
  }

  public flagTask(taskId: string, userId: string, reason: string) {
    storage.flagTask(taskId, userId, reason);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'task:flag',
        taskId,
        userId,
        reason
      }));
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public on(event: string, callback: EventCallback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);
    return () => {
      this.eventHandlers.get(event)?.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getStatus() {
    return this.status;
  }

  public getActiveMembers() {
    return [...this.activeMembers];
  }

  public getActivities() {
    return [...this.activities];
  }
}

export const realtime = new RealtimeService();
