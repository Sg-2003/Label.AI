import { User, Project, Task, Annotation, WorkerActivityLog, WorkerLiveStatus } from '../types';
import { CVAT_PROJECT, CVAT_TASKS, CVAT_ANNOTATIONS, SEED_WORKER_LOGS, SEED_WORKER_STATUSES } from './cvatSeed';
export { SEED_WORKER_LOGS, SEED_WORKER_STATUSES };

export const SEED_USERS: User[] = [
  {
    id: 'u-alex',
    name: 'Alex Chen',
    email: 'alex@labelai.io',
    role: 'admin',
    password: 'password123',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    stats: {
      totalLabeled: 142,
      goldCorrect: 28,
      goldTotal: 30,
      streak: 7,
      avgTimeSeconds: 8.5
    }
  },
  {
    id: 'u-asha',
    name: 'Asha Patel',
    email: 'asha@labelai.io',
    role: 'annotator',
    password: 'password123',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    stats: {
      totalLabeled: 384,
      goldCorrect: 46,
      goldTotal: 50,
      streak: 14,
      avgTimeSeconds: 6.2
    }
  },
  {
    id: 'u-marcus',
    name: 'Marcus Vance',
    email: 'marcus@labelai.io',
    role: 'reviewer',
    password: 'password123',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    stats: {
      totalLabeled: 210,
      goldCorrect: 38,
      goldTotal: 40,
      streak: 9,
      avgTimeSeconds: 7.1
    }
  },
  {
    id: 'u-devon',
    name: 'Devon Reed',
    email: 'devon@labelai.io',
    role: 'annotator',
    password: 'password123',
    isActive: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    stats: {
      totalLabeled: 195,
      goldCorrect: 32,
      goldTotal: 35,
      streak: 4,
      avgTimeSeconds: 9.0
    }
  }
];

export const SEED_PROJECTS: Project[] = [
  CVAT_PROJECT,
  {
    id: 'p-movie-sentiment',
    name: 'Film Review Sentiment Analysis',
    description: 'Classify viewer critique sentiment across cinematic releases to train customer perception LLMs.',
    taskType: 'text_classification',
    labels: [
      { id: 'l1', name: 'Positive', color: '#22c55e', shortcutKey: '1', description: 'Praises film, acting, plot, or score' },
      { id: 'l2', name: 'Negative', color: '#ef4444', shortcutKey: '2', description: 'Critical, disappointed, or bored' },
      { id: 'l3', name: 'Neutral', color: '#64748b', shortcutKey: '3', description: 'Mixed feelings, balanced, or factual overview' },
    ],
    guidelines: 'Label the overall perceived sentiment of the viewer.\n- Focus on the final impression if mixed.\n- Mild praise is still Positive.\n- Sarcasm or complaints about technical screening glitches count as Negative.',
    overlapCount: 3,
    majorityPolicy: 'auto',
    aiEnabled: true,
    aiMode: 'show',
    aiModel: 'gemini-3.8-flash',
    aiExamples: [
      { text: 'A visual spectacle with heart-stopping sequences, though the third act dragged slightly.', label: 'Positive' },
      { text: 'Predictable tropes and wooden dialogue ruined whatever potential the premise had.', label: 'Negative' },
      { text: 'The movie runtime is 142 minutes and covers the historical timeline objectively.', label: 'Neutral' },
    ],
    goldRate: 0.15,
    status: 'active',
    members: [
      { userId: 'u-asha', role: 'annotator', assignedAt: '2026-10-20T10:00:00Z' },
      { userId: 'u-devon', role: 'annotator', assignedAt: '2026-10-20T10:00:00Z' },
      { userId: 'u-alex', role: 'annotator', assignedAt: '2026-10-20T10:00:00Z' },
      { userId: 'u-marcus', role: 'reviewer', assignedAt: '2026-10-20T10:00:00Z' }
    ],
    counts: {
      total: 20,
      completed: 7,
      inReview: 3,
      pending: 10,
      gold: 4
    },
    createdAt: '2026-10-15T08:30:00Z',
    updatedAt: '2026-10-30T09:00:00Z'
  },
  {
    id: 'p-support-intent',
    name: 'Customer Support Intent Triage',
    description: 'Categorize inbound enterprise support tickets for automatic priority routing and SLA management.',
    taskType: 'text_classification',
    labels: [
      { id: 'l4', name: 'Bug Report', color: '#8b5cf6', shortcutKey: '1', description: 'Software crash, error 500, or broken feature' },
      { id: 'l5', name: 'Billing Issue', color: '#f59e0b', shortcutKey: '2', description: 'Invoices, credit card failure, charge disputes' },
      { id: 'l6', name: 'Feature Request', color: '#3b82f6', shortcutKey: '3', description: 'Wishlist, integration suggestions, enhancements' },
      { id: 'l7', name: 'General Inquiry', color: '#64748b', shortcutKey: '4', description: 'How-to questions, onboarding, office hours' }
    ],
    guidelines: 'Identify the primary intent of the customer.\n- If a user mentions both billing and a bug, prioritize Billing Issue if financial charges occurred.\n- Questions asking "Can your software do X?" are General Inquiry unless explicitly requesting addition.',
    overlapCount: 2,
    majorityPolicy: 'auto',
    aiEnabled: true,
    aiMode: 'show',
    aiModel: 'gemini-3.8-flash',
    aiExamples: [
      { text: 'I was charged twice on invoice #INV-9821 this morning.', label: 'Billing Issue' },
      { text: 'Clicking Export CSV triggers an unexpected blank screen on Chrome.', label: 'Bug Report' },
      { text: 'Would love to see Figma sync integration in your next sprint!', label: 'Feature Request' },
    ],
    goldRate: 0.10,
    status: 'active',
    members: [
      { userId: 'u-asha', role: 'annotator', assignedAt: '2026-10-22T10:00:00Z' },
      { userId: 'u-devon', role: 'annotator', assignedAt: '2026-10-22T10:00:00Z' },
      { userId: 'u-marcus', role: 'reviewer', assignedAt: '2026-10-22T10:00:00Z' }
    ],
    counts: {
      total: 16,
      completed: 8,
      inReview: 2,
      pending: 6,
      gold: 3
    },
    createdAt: '2026-10-18T11:00:00Z',
    updatedAt: '2026-10-30T09:00:00Z'
  },
  {
    id: 'p-sms-spam',
    name: 'SMS Phishing & Urgent Alert Detection',
    description: 'Filter malicious SMS smishing links, gift card scams, and critical banking alerts.',
    taskType: 'text_classification',
    labels: [
      { id: 'l8', name: 'Spam / Phishing', color: '#ef4444', shortcutKey: '1', description: 'Malicious links, scam lottery, unsolicited ads' },
      { id: 'l9', name: 'Legitimate Chat', color: '#22c55e', shortcutKey: '2', description: 'Personal messages, delivery notices, friend updates' },
      { id: 'l10', name: 'Urgent Alert', color: '#f59e0b', shortcutKey: '3', description: 'Security 2FA codes, flight cancellation alerts' }
    ],
    guidelines: 'Identify spam and security risks.\n- Any SMS with generic URL shorteners claiming account lock is Spam / Phishing.\n- Bank 2FA codes with no links are Urgent Alert.',
    overlapCount: 2,
    majorityPolicy: 'auto',
    aiEnabled: true,
    aiMode: 'hidden',
    aiModel: 'gemini-3.8-flash',
    aiExamples: [
      { text: 'URGENT: Your parcel delivery is held. Click tinyurl.com/pkg92 to pay $1.50 fee.', label: 'Spam / Phishing' },
      { text: 'Hey Dad, are we still meeting for lunch at 1pm tomorrow?', label: 'Legitimate Chat' },
      { text: 'Your verification code is 492810. It expires in 5 minutes.', label: 'Urgent Alert' }
    ],
    goldRate: 0.10,
    status: 'draft',
    members: [
      { userId: 'u-asha', role: 'annotator', assignedAt: '2026-10-25T14:00:00Z' },
      { userId: 'u-marcus', role: 'reviewer', assignedAt: '2026-10-25T14:00:00Z' }
    ],
    counts: {
      total: 12,
      completed: 0,
      inReview: 0,
      pending: 12,
      gold: 2
    },
    createdAt: '2026-10-25T12:00:00Z',
    updatedAt: '2026-10-30T09:00:00Z'
  }
];

export const SEED_TASKS: Task[] = [
  ...CVAT_TASKS,
  // --- Movie Sentiment Tasks ---
  {
    id: 't-movie-1',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'The performances by the lead duo were simply breathtaking. A poignant and haunting masterpiece that stays with you for days.',
      meta: { genre: 'Drama', year: 2024 }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 3,
    annotatedBy: ['u-asha', 'u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Positive',
      confidence: 0.98,
      rationale: 'High frequency of strong positive aesthetic terms: "breathtaking", "masterpiece".',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    finalLabel: {
      label: 'Positive',
      method: 'consensus',
      resolvedAt: '2026-10-20T12:30:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T12:30:00Z'
  },
  {
    id: 't-movie-2',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'Two hours of painful cliches, disjointed editing, and uninspired direction. Walked out before the credits rolled.',
      meta: { genre: 'Thriller', year: 2024 }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 3,
    annotatedBy: ['u-asha', 'u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Negative',
      confidence: 0.96,
      rationale: 'Explicit negative critique including "painful cliches" and walking out early.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    finalLabel: {
      label: 'Negative',
      method: 'consensus',
      resolvedAt: '2026-10-20T13:10:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T13:10:00Z'
  },
  {
    id: 't-movie-3',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'While the cinematography was stunning and the score evocative, the sluggish pacing in the second half really tested my patience.',
      meta: { genre: 'Sci-Fi', year: 2025 }
    },
    status: 'in_review', // Annotators disagreed! Sitting in review queue for Reviewer
    isGold: false,
    annotationCount: 3,
    annotatedBy: ['u-asha', 'u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Neutral',
      confidence: 0.65,
      rationale: 'Balances high praise for visuals against complaints about pacing.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-21T09:40:00Z'
  },
  {
    id: 't-movie-4',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'An absolute rollercoaster from the first second! Popcorn entertainment at its finest with snappy one-liners.',
      meta: { genre: 'Action', year: 2025 }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 3,
    annotatedBy: ['u-asha', 'u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Positive',
      confidence: 0.94,
      rationale: 'Enthusiastic commendation for entertainment value.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    finalLabel: {
      label: 'Positive',
      method: 'consensus',
      resolvedAt: '2026-10-21T10:15:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-21T10:15:00Z'
  },
  {
    id: 't-movie-5',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'I suppose if you are a die-hard fan of the comic book series you will appreciate the references, but casual viewers will be utterly lost.',
      meta: { genre: 'Superhero', year: 2024 }
    },
    status: 'in_review', // Disagreement: one annotator said Neutral, one Negative, one Neutral
    isGold: false,
    annotationCount: 3,
    annotatedBy: ['u-asha', 'u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Neutral',
      confidence: 0.58,
      rationale: 'Conditional evaluation depending on whether viewer is fan or casual.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [
      { userId: 'u-devon', reason: 'Ambiguous sentiment - could be interpreted as negative towards accessibility.', createdAt: '2026-10-21T11:00:00Z' }
    ],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-21T11:00:00Z'
  },
  {
    id: 't-movie-6-gold',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'Without doubt the worst film ever committed to celluloid. Incompetent in every technical and narrative dimension.',
      meta: { genre: 'Comedy', year: 2024 }
    },
    status: 'pending',
    isGold: true,
    goldLabel: 'Negative',
    annotationCount: 1,
    annotatedBy: ['u-devon'],
    aiSuggestion: {
      label: 'Negative',
      confidence: 0.99,
      rationale: 'Unambiguous extreme negative evaluation ("worst film ever").',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-21T11:15:00Z'
  },
  {
    id: 't-movie-7-gold',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'A triumph of modern storytelling. Heartfelt, gorgeously staged, and featuring career-best acting from the entire cast.',
      meta: { genre: 'Biopic', year: 2025 }
    },
    status: 'pending',
    isGold: true,
    goldLabel: 'Positive',
    annotationCount: 2,
    annotatedBy: ['u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Positive',
      confidence: 0.99,
      rationale: 'Clear superlative praise across all artistic dimensions.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-21T11:20:00Z'
  },
  {
    id: 't-movie-8',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'The documentary documents the migration patterns of arctic terns over an eighteen month observation window.',
      meta: { genre: 'Documentary', year: 2024 }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 3,
    annotatedBy: ['u-asha', 'u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Neutral',
      confidence: 0.94,
      rationale: 'Purely objective and factual description without subjective valence.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    finalLabel: {
      label: 'Neutral',
      method: 'consensus',
      resolvedAt: '2026-10-22T08:00:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-22T08:00:00Z'
  },
  {
    id: 't-movie-9',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'Started off with so much promise in the opening twenty minutes, but spiraled into nonsensical melodrama by the climax.',
      meta: { genre: 'Mystery', year: 2024 }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 3,
    annotatedBy: ['u-asha', 'u-devon', 'u-alex'],
    aiSuggestion: {
      label: 'Negative',
      confidence: 0.82,
      rationale: 'Overall negative trajectory despite good beginning.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    finalLabel: {
      label: 'Negative',
      method: 'majority',
      resolvedAt: '2026-10-22T09:12:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-22T09:12:00Z'
  },
  {
    id: 't-movie-10',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'Exhilarating sound design and sensory overload! Not a deep screenplay, but an unforgettable theater experience.',
      meta: { genre: 'Sci-Fi', year: 2024 }
    },
    status: 'pending', // Waiting for annotator labels!
    isGold: false,
    annotationCount: 1,
    annotatedBy: ['u-devon'],
    aiSuggestion: {
      label: 'Positive',
      confidence: 0.89,
      rationale: 'Praises theater experience and sensory sound design.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 't-movie-11',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'The script feels like it was pieced together by committee with zero soul or original perspective.',
      meta: { genre: 'Comedy', year: 2025 }
    },
    status: 'pending',
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'Negative',
      confidence: 0.92,
      rationale: 'Negative critique of screenplay authenticity.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 't-movie-12',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'A subtle, delicate indie drama that respects the audience intelligence. Beautifully understated.',
      meta: { genre: 'Indie', year: 2025 }
    },
    status: 'pending',
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'Positive',
      confidence: 0.93,
      rationale: 'Warm approval of intelligence and subtlety.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 't-movie-13',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'It contains four musical numbers and is filmed on location across Florence and Venice.',
      meta: { genre: 'Musical', year: 2024 }
    },
    status: 'pending',
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'Neutral',
      confidence: 0.95,
      rationale: 'Factual descriptions of locations and musical numbers without evaluation.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 't-movie-14',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'Horrendous CGI that looks a decade out of date. Even the star power could not salvage this disaster.',
      meta: { genre: 'Fantasy', year: 2024 }
    },
    status: 'pending',
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'Negative',
      confidence: 0.97,
      rationale: 'Strong condemnation of visual effects and overall production.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 't-movie-15',
    projectId: 'p-movie-sentiment',
    data: {
      text: 'I found myself smiling from start to finish. Truly heartwarming and genuine.',
      meta: { genre: 'Rom-Com', year: 2025 }
    },
    status: 'pending',
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'Positive',
      confidence: 0.98,
      rationale: 'Expresses genuine emotional warmth and smiling.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_0a1b2c',
      createdAt: '2026-10-20T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z'
  },

  // --- Support Intent Tasks ---
  {
    id: 't-sup-1',
    projectId: 'p-support-intent',
    data: {
      text: 'Every time I try to invite a teammate with an @edu email address, the button spins forever and crashes the page.',
      meta: { plan: 'Team', browser: 'Safari 17' }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 2,
    annotatedBy: ['u-asha', 'u-devon'],
    aiSuggestion: {
      label: 'Bug Report',
      confidence: 0.95,
      rationale: 'UI freezing and crash behavior reported upon user action.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_sup1',
      createdAt: '2026-10-22T10:05:00Z'
    },
    finalLabel: {
      label: 'Bug Report',
      method: 'consensus',
      resolvedAt: '2026-10-22T12:00:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T12:00:00Z'
  },
  {
    id: 't-sup-2',
    projectId: 'p-support-intent',
    data: {
      text: 'Can we get an updated VAT invoice for our accountant? The company address on our receipt is missing our tax ID.',
      meta: { plan: 'Enterprise', country: 'Germany' }
    },
    status: 'completed',
    isGold: false,
    annotationCount: 2,
    annotatedBy: ['u-asha', 'u-devon'],
    aiSuggestion: {
      label: 'Billing Issue',
      confidence: 0.98,
      rationale: 'Requests correction to VAT tax invoice and accounting receipt.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_sup1',
      createdAt: '2026-10-22T10:05:00Z'
    },
    finalLabel: {
      label: 'Billing Issue',
      method: 'consensus',
      resolvedAt: '2026-10-22T12:15:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T12:15:00Z'
  },
  {
    id: 't-sup-3',
    projectId: 'p-support-intent',
    data: {
      text: 'Is there any way to export our weekly reports automatically to Google Drive or Slack every Monday at 9 AM?',
      meta: { plan: 'Pro' }
    },
    status: 'in_review', // Disagreement: one said Feature Request, one General Inquiry
    isGold: false,
    annotationCount: 2,
    annotatedBy: ['u-asha', 'u-devon'],
    aiSuggestion: {
      label: 'Feature Request',
      confidence: 0.72,
      rationale: 'Asks about scheduled automated external export capabilities.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_sup1',
      createdAt: '2026-10-22T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T13:00:00Z'
  },
  {
    id: 't-sup-4-gold',
    projectId: 'p-support-intent',
    data: {
      text: 'Unsubscribe me immediately and issue a full refund for the unauthorized $49 charge on card ending in 8812.',
      meta: { plan: 'Trial' }
    },
    status: 'pending',
    isGold: true,
    goldLabel: 'Billing Issue',
    annotationCount: 1,
    annotatedBy: ['u-devon'],
    aiSuggestion: {
      label: 'Billing Issue',
      confidence: 0.99,
      rationale: 'Demands refund for credit card transaction charge.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_sup1',
      createdAt: '2026-10-22T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T13:30:00Z'
  },
  {
    id: 't-sup-5',
    projectId: 'p-support-intent',
    data: {
      text: 'Where do I find our organization API key in the new v2 dashboard settings menu?',
      meta: { plan: 'Free' }
    },
    status: 'pending',
    isGold: false,
    annotationCount: 0,
    annotatedBy: [],
    aiSuggestion: {
      label: 'General Inquiry',
      confidence: 0.96,
      rationale: 'Basic navigation and documentation inquiry.',
      model: 'gemini-3.8-flash',
      promptVersion: 'pv_sup1',
      createdAt: '2026-10-22T10:05:00Z'
    },
    skippedBy: [],
    flags: [],
    createdAt: '2026-10-22T10:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  }
];

export const SEED_ANNOTATIONS: Annotation[] = [
  // Annotations for t-movie-1 (Consensus on Positive)
  { id: 'a1', taskId: 't-movie-1', projectId: 'p-movie-sentiment', userId: 'u-asha', label: 'Positive', timeTakenSeconds: 5, createdAt: '2026-10-20T12:00:00Z', usedAiSuggestion: true },
  { id: 'a2', taskId: 't-movie-1', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Positive', timeTakenSeconds: 7, createdAt: '2026-10-20T12:15:00Z', usedAiSuggestion: true },
  { id: 'a3', taskId: 't-movie-1', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Positive', timeTakenSeconds: 6, createdAt: '2026-10-20T12:30:00Z', usedAiSuggestion: true },

  // Annotations for t-movie-2 (Consensus on Negative)
  { id: 'a4', taskId: 't-movie-2', projectId: 'p-movie-sentiment', userId: 'u-asha', label: 'Negative', timeTakenSeconds: 4, createdAt: '2026-10-20T12:45:00Z', usedAiSuggestion: true },
  { id: 'a5', taskId: 't-movie-2', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Negative', timeTakenSeconds: 8, createdAt: '2026-10-20T13:00:00Z', usedAiSuggestion: true },
  { id: 'a6', taskId: 't-movie-2', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Negative', timeTakenSeconds: 5, createdAt: '2026-10-20T13:10:00Z', usedAiSuggestion: true },

  // Annotations for t-movie-3 (Disagreement -> In Review)
  // Asha: Positive, Devon: Negative, Alex: Neutral
  { id: 'a7', taskId: 't-movie-3', projectId: 'p-movie-sentiment', userId: 'u-asha', label: 'Positive', timeTakenSeconds: 11, notes: 'Focusing on visuals', createdAt: '2026-10-21T09:00:00Z', usedAiSuggestion: false },
  { id: 'a8', taskId: 't-movie-3', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Negative', timeTakenSeconds: 14, notes: 'Pacing destroyed it', createdAt: '2026-10-21T09:20:00Z', usedAiSuggestion: false },
  { id: 'a9', taskId: 't-movie-3', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Neutral', timeTakenSeconds: 9, notes: 'Balanced pros and cons', createdAt: '2026-10-21T09:40:00Z', usedAiSuggestion: true },

  // Annotations for t-movie-4 (Consensus on Positive)
  { id: 'a10', taskId: 't-movie-4', projectId: 'p-movie-sentiment', userId: 'u-asha', label: 'Positive', timeTakenSeconds: 5, createdAt: '2026-10-21T10:00:00Z', usedAiSuggestion: true },
  { id: 'a11', taskId: 't-movie-4', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Positive', timeTakenSeconds: 6, createdAt: '2026-10-21T10:10:00Z', usedAiSuggestion: true },
  { id: 'a12', taskId: 't-movie-4', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Positive', timeTakenSeconds: 5, createdAt: '2026-10-21T10:15:00Z', usedAiSuggestion: true },

  // Annotations for t-movie-5 (Disagreement -> In Review)
  // Asha: Neutral, Devon: Negative, Alex: Neutral (Majority policy could accept Neutral, but flagged!)
  { id: 'a13', taskId: 't-movie-5', projectId: 'p-movie-sentiment', userId: 'u-asha', label: 'Neutral', timeTakenSeconds: 12, createdAt: '2026-10-21T10:30:00Z', usedAiSuggestion: true },
  { id: 'a14', taskId: 't-movie-5', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Negative', timeTakenSeconds: 16, createdAt: '2026-10-21T10:45:00Z', usedAiSuggestion: false },
  { id: 'a15', taskId: 't-movie-5', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Neutral', timeTakenSeconds: 10, createdAt: '2026-10-21T11:00:00Z', usedAiSuggestion: true },

  // Annotations for t-movie-6-gold (Gold Standard)
  { id: 'a16', taskId: 't-movie-6-gold', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Negative', timeTakenSeconds: 4, isGold: true, isCorrect: true, createdAt: '2026-10-21T11:15:00Z' },

  // Annotations for t-movie-7-gold (Gold Standard)
  { id: 'a17', taskId: 't-movie-7-gold', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Positive', timeTakenSeconds: 5, isGold: true, isCorrect: true, createdAt: '2026-10-21T11:18:00Z' },
  { id: 'a18', taskId: 't-movie-7-gold', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Positive', timeTakenSeconds: 6, isGold: true, isCorrect: true, createdAt: '2026-10-21T11:20:00Z' },

  // Annotations for t-movie-8 (Consensus on Neutral)
  { id: 'a19', taskId: 't-movie-8', projectId: 'p-movie-sentiment', userId: 'u-asha', label: 'Neutral', timeTakenSeconds: 6, createdAt: '2026-10-22T07:40:00Z', usedAiSuggestion: true },
  { id: 'a20', taskId: 't-movie-8', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Neutral', timeTakenSeconds: 7, createdAt: '2026-10-22T07:50:00Z', usedAiSuggestion: true },
  { id: 'a21', taskId: 't-movie-8', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Neutral', timeTakenSeconds: 5, createdAt: '2026-10-22T08:00:00Z', usedAiSuggestion: true },

  // Annotations for t-movie-9 (Majority on Negative)
  // Asha: Negative, Devon: Negative, Alex: Neutral
  { id: 'a22', taskId: 't-movie-9', projectId: 'p-movie-sentiment', userId: 'u-asha', label: 'Negative', timeTakenSeconds: 8, createdAt: '2026-10-22T08:45:00Z', usedAiSuggestion: true },
  { id: 'a23', taskId: 't-movie-9', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Negative', timeTakenSeconds: 9, createdAt: '2026-10-22T09:00:00Z', usedAiSuggestion: true },
  { id: 'a24', taskId: 't-movie-9', projectId: 'p-movie-sentiment', userId: 'u-alex', label: 'Neutral', timeTakenSeconds: 11, createdAt: '2026-10-22T09:12:00Z', usedAiSuggestion: false },

  // Annotations for t-movie-10 (Partial, 1 done)
  { id: 'a25', taskId: 't-movie-10', projectId: 'p-movie-sentiment', userId: 'u-devon', label: 'Positive', timeTakenSeconds: 7, createdAt: '2026-10-22T10:00:00Z', usedAiSuggestion: true },

  // --- Support Annotations ---
  { id: 'a26', taskId: 't-sup-1', projectId: 'p-support-intent', userId: 'u-asha', label: 'Bug Report', timeTakenSeconds: 6, createdAt: '2026-10-22T11:45:00Z', usedAiSuggestion: true },
  { id: 'a27', taskId: 't-sup-1', projectId: 'p-support-intent', userId: 'u-devon', label: 'Bug Report', timeTakenSeconds: 7, createdAt: '2026-10-22T12:00:00Z', usedAiSuggestion: true },

  { id: 'a28', taskId: 't-sup-2', projectId: 'p-support-intent', userId: 'u-asha', label: 'Billing Issue', timeTakenSeconds: 5, createdAt: '2026-10-22T12:10:00Z', usedAiSuggestion: true },
  { id: 'a29', taskId: 't-sup-2', projectId: 'p-support-intent', userId: 'u-devon', label: 'Billing Issue', timeTakenSeconds: 6, createdAt: '2026-10-22T12:15:00Z', usedAiSuggestion: true },

  // t-sup-3 (Disagreement: Asha: Feature Request, Devon: General Inquiry)
  { id: 'a30', taskId: 't-sup-3', projectId: 'p-support-intent', userId: 'u-asha', label: 'Feature Request', timeTakenSeconds: 9, createdAt: '2026-10-22T12:45:00Z', usedAiSuggestion: true },
  { id: 'a31', taskId: 't-sup-3', projectId: 'p-support-intent', userId: 'u-devon', label: 'General Inquiry', timeTakenSeconds: 10, createdAt: '2026-10-22T13:00:00Z', usedAiSuggestion: false },

  // t-sup-4-gold (Gold Standard)
  { id: 'a32', taskId: 't-sup-4-gold', projectId: 'p-support-intent', userId: 'u-devon', label: 'Billing Issue', timeTakenSeconds: 5, isGold: true, isCorrect: true, createdAt: '2026-10-22T13:30:00Z' },

  // --- CVAT Bounding Box Annotations ---
  ...CVAT_ANNOTATIONS
];

