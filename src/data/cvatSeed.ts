import { Project, Task, Annotation, WorkerActivityLog, WorkerLiveStatus, BoundingBox } from '../types';

export const CVAT_PROJECT: Project = {
  id: 'p-cvat-driving',
  name: 'Autonomous Driving Perception (CVAT)',
  description: 'Pixel-accurate 2D bounding box detection for self-driving vehicle perception (Cars, Pedestrians, Traffic Lights, Cyclists).',
  taskType: 'image_bounding_box',
  labels: [
    { id: 'cv1', name: 'Car', color: '#22c55e', shortcutKey: '1', description: 'Motor vehicles, sedans, trucks, SUVs' },
    { id: 'cv2', name: 'Pedestrian', color: '#f59e0b', shortcutKey: '2', description: 'Walking or standing pedestrians' },
    { id: 'cv3', name: 'Traffic Light', color: '#ef4444', shortcutKey: '3', description: 'Traffic signals and overhead lane lights' },
    { id: 'cv4', name: 'Bicycle', color: '#3b82f6', shortcutKey: '4', description: 'Cyclists and electric scooters' },
    { id: 'cv5', name: 'Road Sign', color: '#8b5cf6', shortcutKey: '5', description: 'Regulatory, warning, and route signs' },
  ],
  guidelines: 'Draw tight bounding boxes around all visible road objects.\n- Box boundaries must touch the extreme pixel edges.\n- If an object is occluded >75%, skip it.\n- Annotate traffic lights regardless of whether red, yellow, or green.',
  overlapCount: 2,
  majorityPolicy: 'auto',
  aiEnabled: true,
  aiMode: 'show',
  aiModel: 'gemini-3.8-flash',
  aiExamples: [],
  goldRate: 0.15,
  status: 'active',
  members: [
    { userId: 'u-asha', role: 'annotator', assignedAt: '2026-10-24T10:00:00Z' },
    { userId: 'u-devon', role: 'annotator', assignedAt: '2026-10-24T10:00:00Z' },
    { userId: 'u-alex', role: 'annotator', assignedAt: '2026-10-24T10:00:00Z' },
    { userId: 'u-marcus', role: 'reviewer', assignedAt: '2026-10-24T10:00:00Z' }
  ],
  counts: {
    total: 6,
    completed: 2,
    inReview: 1,
    pending: 3,
    gold: 1
  },
  createdAt: '2026-10-24T09:00:00Z',
  updatedAt: '2026-10-30T09:00:00Z'
};

export const CVAT_TASKS: Task[] = [
  {
    id: 't-cvat-1',
    projectId: 'p-cvat-driving',
    data: {
      text: 'Urban downtown intersection with dense multi-lane traffic',
      imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&auto=format&fit=crop&q=80',
      imageWidth: 1200,
      imageHeight: 800,
      meta: { weather: 'Clear', time: '14:30', camera: 'Front-Center-HDR' }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 2,
    annotatedBy: ['u-asha', 'u-devon'],
    aiSuggestion: {
      label: 'Detection Complete',
      confidence: 0.94,
      rationale: 'YOLOv10 / Gemini Vision detected 4 vehicles and 2 pedestrians.',
      boxes: [
        { id: 'b1', label: 'Car', x: 18, y: 55, width: 28, height: 26, confidence: 0.96, source: 'ai' },
        { id: 'b2', label: 'Car', x: 52, y: 56, width: 34, height: 30, confidence: 0.98, source: 'ai' },
        { id: 'b3', label: 'Pedestrian', x: 10, y: 58, width: 6, height: 18, confidence: 0.89, source: 'ai' },
        { id: 'b4', label: 'Traffic Light', x: 42, y: 15, width: 5, height: 12, confidence: 0.92, source: 'ai' }
      ],
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_cvat_1',
      createdAt: '2026-10-24T09:30:00Z'
    },
    finalLabel: {
      label: 'Car',
      method: 'consensus',
      boxes: [
        { id: 'fb1', label: 'Car', x: 18, y: 55, width: 28, height: 26, source: 'human', color: '#22c55e' },
        { id: 'fb2', label: 'Car', x: 52, y: 56, width: 34, height: 30, source: 'human', color: '#22c55e' },
        { id: 'fb3', label: 'Pedestrian', x: 10, y: 58, width: 6, height: 18, source: 'human', color: '#f59e0b' }
      ],
      resolvedAt: '2026-10-24T11:00:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T11:00:00Z'
  },
  {
    id: 't-cvat-2',
    projectId: 'p-cvat-driving',
    data: {
      text: 'Highway merge lane with commercial transport truck',
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80',
      imageWidth: 1200,
      imageHeight: 800,
      meta: { weather: 'Overcast', speed_mph: 62 }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 2,
    annotatedBy: ['u-asha', 'u-devon'],
    aiSuggestion: {
      label: 'Detection Complete',
      confidence: 0.96,
      rationale: 'Primary commercial vehicle and trailing sedan detected.',
      boxes: [
        { id: 'b5', label: 'Car', x: 30, y: 40, width: 42, height: 45, confidence: 0.97, source: 'ai' },
        { id: 'b6', label: 'Road Sign', x: 80, y: 35, width: 10, height: 16, confidence: 0.91, source: 'ai' }
      ],
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_cvat_1',
      createdAt: '2026-10-24T09:30:00Z'
    },
    finalLabel: {
      label: 'Car',
      method: 'consensus',
      boxes: [
        { id: 'fb4', label: 'Car', x: 30, y: 40, width: 42, height: 45, source: 'human', color: '#22c55e' }
      ],
      resolvedAt: '2026-10-24T11:45:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T11:45:00Z'
  },
  {
    id: 't-cvat-3',
    projectId: 'p-cvat-driving',
    data: {
      text: 'Crosswalk with mixed crowd of pedestrians and cyclists near plaza',
      imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1200&auto=format&fit=crop&q=80',
      imageWidth: 1200,
      imageHeight: 800,
      meta: { weather: 'Sunny', time: '17:15', risk_level: 'High' }
    },
    status: 'in_review', // Disagreement in boxes: Asha boxed 4 pedestrians, Devon boxed 2 pedestrians and 1 bicycle!
    isGold: false,
    annotationCount: 2,
    annotatedBy: ['u-asha', 'u-devon'],
    aiSuggestion: {
      label: 'Detection Complete',
      confidence: 0.88,
      rationale: 'Multiple human participants with potential occlusion near road curb.',
      boxes: [
        { id: 'b7', label: 'Pedestrian', x: 22, y: 60, width: 8, height: 22, confidence: 0.93, source: 'ai' },
        { id: 'b8', label: 'Pedestrian', x: 34, y: 62, width: 7, height: 20, confidence: 0.87, source: 'ai' },
        { id: 'b9', label: 'Bicycle', x: 45, y: 65, width: 14, height: 18, confidence: 0.82, source: 'ai' }
      ],
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_cvat_1',
      createdAt: '2026-10-24T09:30:00Z'
    },
    skippedBy: [],
    flags: [
      { userId: 'u-devon', reason: 'Occlusion overlap makes distinguishing cyclist from walking commuter ambiguous', createdAt: '2026-10-24T13:00:00Z' }
    ],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T13:00:00Z'
  },
  {
    id: 't-cvat-4',
    projectId: 'p-cvat-driving',
    data: {
      text: 'Suburban residential street with parked vehicles and overhead trees',
      imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&auto=format&fit=crop&q=80',
      imageWidth: 1200,
      imageHeight: 800,
      meta: { speed_limit_mph: 25 }
    },
    status: 'pending', // Waiting for annotator to draw boxes!
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'Car',
      confidence: 0.92,
      rationale: 'AI detected lead sedan and curb-parked vehicle.',
      boxes: [
        { id: 'b10', label: 'Car', x: 38, y: 52, width: 25, height: 28, confidence: 0.95, source: 'ai' },
        { id: 'b11', label: 'Car', x: 72, y: 55, width: 18, height: 20, confidence: 0.88, source: 'ai' }
      ],
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_cvat_1',
      createdAt: '2026-10-24T09:30:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T09:00:00Z'
  },
  {
    id: 't-cvat-5',
    projectId: 'p-cvat-driving',
    data: {
      text: 'Boulevard traffic approaching traffic light at sunset',
      imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&auto=format&fit=crop&q=80',
      imageWidth: 1200,
      imageHeight: 800,
      meta: { glare: 'Medium', sunset: true }
    },
    status: 'pending',
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'Car',
      confidence: 0.91,
      rationale: 'Lead luxury vehicle detected in center lane.',
      boxes: [
        { id: 'b12', label: 'Car', x: 32, y: 48, width: 36, height: 35, confidence: 0.94, source: 'ai' }
      ],
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_cvat_1',
      createdAt: '2026-10-24T09:30:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T09:00:00Z'
  },
  {
    id: 't-cvat-6-gold',
    projectId: 'p-cvat-driving',
    data: {
      text: 'Verified benchmark: Clear single sports car on track',
      imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80',
      imageWidth: 1200,
      imageHeight: 800,
      meta: { ground_truth_verified: true, reviewer: 'Marcus Vance' }
    },
    status: 'pending',
    isGold: true,
    goldLabel: 'Car',
    goldBoxes: [
      { id: 'gb1', label: 'Car', x: 25, y: 35, width: 50, height: 42, source: 'human', color: '#22c55e' }
    ],
    annotationCount: 1,
    annotatedBy: ['u-devon'],
    aiSuggestion: {
      label: 'Car',
      confidence: 0.99,
      rationale: 'Unambiguous single sports car.',
      boxes: [
        { id: 'b13', label: 'Car', x: 25, y: 35, width: 50, height: 42, confidence: 0.99, source: 'ai' }
      ],
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_cvat_1',
      createdAt: '2026-10-24T09:30:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-24T09:00:00Z',
    updatedAt: '2026-10-24T09:00:00Z'
  }
];

export const CVAT_ANNOTATIONS: Annotation[] = [
  {
    id: 'a-cvat-1',
    taskId: 't-cvat-1',
    projectId: 'p-cvat-driving',
    userId: 'u-asha',
    label: 'Car',
    boxes: [
      { id: 'ab1', label: 'Car', x: 18, y: 55, width: 28, height: 26, color: '#22c55e' },
      { id: 'ab2', label: 'Car', x: 52, y: 56, width: 34, height: 30, color: '#22c55e' }
    ],
    timeTakenSeconds: 14,
    createdAt: '2026-10-24T10:15:00Z',
    usedAiSuggestion: true
  },
  {
    id: 'a-cvat-2',
    taskId: 't-cvat-1',
    projectId: 'p-cvat-driving',
    userId: 'u-devon',
    label: 'Car',
    boxes: [
      { id: 'ab3', label: 'Car', x: 18, y: 55, width: 28, height: 26, color: '#22c55e' },
      { id: 'ab4', label: 'Car', x: 52, y: 56, width: 34, height: 30, color: '#22c55e' }
    ],
    timeTakenSeconds: 16,
    createdAt: '2026-10-24T10:45:00Z',
    usedAiSuggestion: true
  },
  {
    id: 'a-cvat-3',
    taskId: 't-cvat-3',
    projectId: 'p-cvat-driving',
    userId: 'u-asha',
    label: 'Pedestrian',
    boxes: [
      { id: 'ab5', label: 'Pedestrian', x: 22, y: 60, width: 8, height: 22, color: '#f59e0b' },
      { id: 'ab6', label: 'Pedestrian', x: 34, y: 62, width: 7, height: 20, color: '#f59e0b' }
    ],
    timeTakenSeconds: 22,
    createdAt: '2026-10-24T12:30:00Z',
    usedAiSuggestion: false
  },
  {
    id: 'a-cvat-4',
    taskId: 't-cvat-3',
    projectId: 'p-cvat-driving',
    userId: 'u-devon',
    label: 'Bicycle',
    boxes: [
      { id: 'ab7', label: 'Bicycle', x: 45, y: 65, width: 14, height: 18, color: '#3b82f6' }
    ],
    timeTakenSeconds: 28,
    notes: 'Prioritized moving cyclist over pedestrians',
    createdAt: '2026-10-24T12:50:00Z',
    usedAiSuggestion: false
  }
];

// --- Workforce Real-time Activity Telemetry Logs ---
export const SEED_WORKER_LOGS: WorkerActivityLog[] = [
  {
    id: 'wlog-1',
    userId: 'u-asha',
    userName: 'Asha Patel',
    userRole: 'annotator',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    projectId: 'p-cvat-driving',
    projectName: 'Autonomous Driving Perception',
    taskId: 't-cvat-1',
    action: 'box_created',
    details: 'Drew BBox [Car] at (18%, 55%) 28x26px',
    durationSeconds: 4,
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  },
  {
    id: 'wlog-2',
    userId: 'u-asha',
    userName: 'Asha Patel',
    userRole: 'annotator',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    projectId: 'p-cvat-driving',
    projectName: 'Autonomous Driving Perception',
    taskId: 't-cvat-1',
    action: 'ai_accepted',
    details: 'Accepted Gemini AI auto-detection box for Pedestrian with 0.89 confidence',
    durationSeconds: 2,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  },
  {
    id: 'wlog-3',
    userId: 'u-devon',
    userName: 'Devon Reed',
    userRole: 'annotator',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    projectId: 'p-cvat-driving',
    projectName: 'Autonomous Driving Perception',
    taskId: 't-cvat-3',
    action: 'task_flagged',
    details: 'Flagged task for occlusion overlap near road curb',
    durationSeconds: 15,
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  },
  {
    id: 'wlog-4',
    userId: 'u-marcus',
    userName: 'Marcus Vance',
    userRole: 'reviewer',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    projectId: 'p-movie-sentiment',
    projectName: 'Film Review Sentiment Analysis',
    taskId: 't-movie-3',
    action: 'conflict_resolved',
    details: 'Resolved 3-way split decision → marked authoritative label as "Neutral"',
    durationSeconds: 18,
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: 'wlog-5',
    userId: 'u-alex',
    userName: 'Alex Chen',
    userRole: 'admin',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    projectId: 'p-cvat-driving',
    projectName: 'Autonomous Driving Perception',
    taskId: 't-cvat-4',
    action: 'ai_accepted',
    details: 'Dispatched Gemini 2.5 Flash batch pre-labeling on 5 road frames',
    durationSeconds: 6,
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString()
  }
];

export const SEED_WORKER_STATUSES: WorkerLiveStatus[] = [
  {
    userId: 'u-asha',
    userName: 'Asha Patel',
    email: 'asha@labelai.io',
    role: 'annotator',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120',
    status: 'active_labeling',
    currentTaskId: 't-cvat-4',
    currentTaskType: 'image_bounding_box',
    lastAction: 'Drawing Bounding Box [Car]',
    lastActiveTimestamp: new Date(Date.now() - 15 * 1000).toISOString(),
    todayTasksCompleted: 42,
    todayBoxesDrawn: 128,
    todayActiveMinutes: 245,
    todayIdleMinutes: 18,
    avgSecondsPerTask: 6.2,
    rejectionRatePct: 2.1,
    goldAccuracyPct: 92
  },
  {
    userId: 'u-devon',
    userName: 'Devon Reed',
    email: 'devon@labelai.io',
    role: 'annotator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    status: 'idle',
    currentTaskId: 't-cvat-5',
    currentTaskType: 'image_bounding_box',
    lastAction: 'Idle for 2m 14s (Task reserved)',
    lastActiveTimestamp: new Date(Date.now() - 134 * 1000).toISOString(),
    todayTasksCompleted: 28,
    todayBoxesDrawn: 74,
    todayActiveMinutes: 180,
    todayIdleMinutes: 44,
    avgSecondsPerTask: 8.9,
    rejectionRatePct: 6.4,
    goldAccuracyPct: 88
  },
  {
    userId: 'u-marcus',
    userName: 'Marcus Vance',
    email: 'marcus@labelai.io',
    role: 'reviewer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    status: 'reviewing',
    currentTaskId: 't-cvat-3',
    currentTaskType: 'image_bounding_box',
    lastAction: 'Reviewing Disagreement Queue',
    lastActiveTimestamp: new Date(Date.now() - 30 * 1000).toISOString(),
    todayTasksCompleted: 19,
    todayBoxesDrawn: 45,
    todayActiveMinutes: 210,
    todayIdleMinutes: 22,
    avgSecondsPerTask: 11.4,
    rejectionRatePct: 0.0,
    goldAccuracyPct: 98
  },
  {
    userId: 'u-alex',
    userName: 'Alex Chen',
    email: 'alex@labelai.io',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    status: 'active_labeling',
    currentTaskId: 't-cvat-1',
    currentTaskType: 'image_bounding_box',
    lastAction: 'Auditing Fleiss Kappa and Team Telemetry',
    lastActiveTimestamp: new Date(Date.now() - 5 * 1000).toISOString(),
    todayTasksCompleted: 14,
    todayBoxesDrawn: 38,
    todayActiveMinutes: 190,
    todayIdleMinutes: 15,
    avgSecondsPerTask: 7.8,
    rejectionRatePct: 1.2,
    goldAccuracyPct: 95
  }
];
