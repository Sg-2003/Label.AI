const TimeLog = require('../models/TimeLog');

/**
 * Get today's date string in UTC (YYYY-MM-DD).
 */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Record an action in the user's daily TimeLog.
 * Creates today's document if it doesn't exist yet.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {'annotation'|'review_approve'|'review_reject'|'skip'} params.type
 * @param {string} [params.taskId]
 * @param {string} [params.projectId]
 * @param {string} [params.projectName]
 * @param {string} [params.label]
 * @param {number} [params.timeSpentSeconds]
 */
async function recordAction({
  userId,
  type,
  taskId,
  projectId,
  projectName = '',
  label = '',
  timeSpentSeconds = 0
}) {
  const date = todayUTC();
  const now = new Date();

  // Build the increment object
  const inc = {};
  if (type === 'annotation') {
    inc.totalAnnotations = 1;
  } else if (type === 'review_approve') {
    inc.totalApproved = 1;
  } else if (type === 'review_reject') {
    inc.totalRejected = 1;
  } else if (type === 'skip') {
    inc.totalSkipped = 1;
  }
  if (timeSpentSeconds > 0) {
    inc.totalActiveSeconds = timeSpentSeconds;
  }

  const action = {
    type,
    taskId,
    projectId,
    projectName,
    label,
    timeSpentSeconds,
    timestamp: now
  };

  // Upsert: create today's doc if first action of the day
  const timeLog = await TimeLog.findOneAndUpdate(
    { userId, date },
    {
      $inc: inc,
      $push: { actions: action },
      $set: { lastActionAt: now },
      $setOnInsert: { firstActionAt: now }
    },
    { upsert: true, new: true }
  );

  return timeLog;
}

/**
 * Get a user's TimeLog for today (labeler widget).
 */
async function getTodayLog(userId) {
  const date = todayUTC();
  let log = await TimeLog.findOne({ userId, date });
  if (!log) {
    // Return a blank slate — no need to create until first action
    log = {
      date,
      totalAnnotations: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalSkipped: 0,
      totalActiveSeconds: 0,
      firstActionAt: null,
      lastActionAt: null,
      actions: []
    };
  }
  return log;
}

/**
 * Admin: Get all users' TimeLogs for a date range, with user info.
 */
async function getLogsForDateRange(startDate, endDate, userId = null) {
  const filter = {
    date: { $gte: startDate, $lte: endDate }
  };
  if (userId) {
    filter.userId = userId;
  }

  const logs = await TimeLog.find(filter)
    .populate('userId', 'name email role')
    .sort({ date: -1, totalAnnotations: -1 });

  return logs;
}

/**
 * Admin: Get a single user's daily breakdown for a date.
 */
async function getUserDayLog(userId, date) {
  const log = await TimeLog.findOne({ userId, date })
    .populate('userId', 'name email role');
  return log;
}

module.exports = {
  recordAction,
  getTodayLog,
  getLogsForDateRange,
  getUserDayLog,
  todayUTC
};

