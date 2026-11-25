const mongoose = require('mongoose');

/**
 * TimeLog — CVAT-style daily work session tracker.
 *
 * One document per user per calendar day (UTC).  Every annotation/review
 * action appends to the `actions` array and bumps the aggregate counters.
 * The labeler's on-screen timer records active work seconds so the admin
 * can see real wall-clock effort.
 *
 * At the start of each new UTC day a fresh document is created;
 * old documents stay in the DB forever as admin history.
 */
const timeLogActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['annotation', 'review_approve', 'review_reject', 'skip'],
      required: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    projectName: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    timeSpentSeconds: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const timeLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    date: {
      type: String, // 'YYYY-MM-DD' in UTC
      required: [true, 'Date is required']
    },

    // Aggregate counters — updated on every action
    totalAnnotations: { type: Number, default: 0 },
    totalApproved: { type: Number, default: 0 },
    totalRejected: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
    totalActiveSeconds: { type: Number, default: 0 },

    // Clock-in / clock-out
    firstActionAt: { type: Date, default: null },
    lastActionAt: { type: Date, default: null },

    // Individual action log (granular history for the admin)
    actions: [timeLogActionSchema]
  },
  {
    timestamps: true
  }
);

// One document per user per day
timeLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Admin queries: list all users on a date, sort by productivity
timeLogSchema.index({ date: 1, totalAnnotations: -1 });

const TimeLog = mongoose.model('TimeLog', timeLogSchema);

module.exports = TimeLog;

