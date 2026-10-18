const ROLES = {
  ADMIN: 'admin',
  ANNOTATOR: 'annotator',
  REVIEWER: 'reviewer'
};

const PROJECT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

const TASK_STATUS = {
  UNASSIGNED: 'unassigned',
  ASSIGNED: 'assigned',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

const REVIEW_DECISION = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  OVERRIDDEN: 'overridden'
};

const TASK_TYPES = {
  TEXT_CLASSIFICATION: 'text_classification'
};

const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

module.exports = {
  ROLES,
  PROJECT_STATUS,
  TASK_STATUS,
  REVIEW_DECISION,
  TASK_TYPES,
  LOCK_TIMEOUT_MS
};
