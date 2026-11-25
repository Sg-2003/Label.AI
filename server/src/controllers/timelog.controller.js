const asyncHandler = require('../utils/asyncHandler');
const timelogService = require('../services/timelog.service');
const ApiError = require('../utils/apiError');

/**
 * GET /api/v1/timelog/today
 * Labeler: get my daily stats & action feed for today (resets each UTC day).
 */
const getMyToday = asyncHandler(async (req, res) => {
  const log = await timelogService.getTodayLog(req.user._id);
  res.status(200).json({
    success: true,
    data: { log }
  });
});

/**
 * GET /api/v1/timelog/history?start=YYYY-MM-DD&end=YYYY-MM-DD&userId=...
 * Admin: get time logs across all employees for a date range.
 * - ?start & ?end default to the last 7 days.
 * - ?userId filters to a specific user.
 */
const getHistory = asyncHandler(async (req, res) => {
  const { start, end, userId } = req.query;

  // Default: last 7 days
  const endDate = end || timelogService.todayUTC();
  const startDate =
    start ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const logs = await timelogService.getLogsForDateRange(
    startDate,
    endDate,
    userId || null
  );

  res.status(200).json({
    success: true,
    data: { logs, startDate, endDate }
  });
});

/**
 * GET /api/v1/timelog/user/:userId/:date
 * Admin: get detailed action log for a specific user on a specific date.
 */
const getUserDayDetail = asyncHandler(async (req, res) => {
  const { userId, date } = req.params;
  const log = await timelogService.getUserDayLog(userId, date);
  if (!log) {
    throw ApiError.notFound('No time log found for this user on this date');
  }
  res.status(200).json({
    success: true,
    data: { log }
  });
});

module.exports = {
  getMyToday,
  getHistory,
  getUserDayDetail
};

