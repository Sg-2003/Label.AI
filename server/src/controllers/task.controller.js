const asyncHandler = require('../utils/asyncHandler');
const taskService = require('../services/task.service');
const { parseCSV } = require('../utils/csvParser');
const ApiError = require('../utils/apiError');
const timelogService = require('../services/timelog.service');
const Annotation = require('../models/Annotation');

const createTasks = asyncHandler(async (req, res) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw ApiError.badRequest('Body must include a non-empty array of tasks');
  }

  const createdTasks = await taskService.createTasks(req.params.projectId, tasks);
  res.status(201).json({
    success: true,
    message: `${createdTasks.length} tasks created successfully`,
    data: { tasks: createdTasks }
  });
});

const uploadCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload a CSV file');
  }

  const parsedRows = await parseCSV(req.file.buffer);
  const createdTasks = await taskService.importTasksFromCSV(req.params.projectId, parsedRows);

  res.status(201).json({
    success: true,
    message: `Successfully imported ${createdTasks.length} tasks from CSV`,
    data: { count: createdTasks.length }
  });
});

const getNextTask = asyncHandler(async (req, res) => {
  const task = await taskService.getNextTaskForAnnotator(
    req.params.projectId,
    req.user._id
  );

  if (!task) {
    return res.status(200).json({
      success: true,
      message: 'No available tasks to annotate at this time',
      data: { task: null }
    });
  }

  res.status(200).json({
    success: true,
    data: { task }
  });
});

const skipTask = asyncHandler(async (req, res) => {
  const task = await taskService.skipTask(req.params.taskId, req.user._id);

  // Record skip in daily time log
  timelogService.recordAction({
    userId: req.user._id,
    type: 'skip',
    taskId: task._id,
    projectId: task.projectId,
    timeSpentSeconds: 0
  }).catch(err => console.error('[TimeLog] skip record failed:', err.message));

  res.status(200).json({
    success: true,
    message: 'Task skipped successfully',
    data: { task }
  });
});

const listTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(req.params.projectId, req.query);
  res.status(200).json({
    success: true,
    data: result
  });
});

const getTaskById = asyncHandler(async (req, res) => {
  const result = await taskService.getTaskById(req.params.taskId);
  res.status(200).json({
    success: true,
    data: result
  });
});

const getReviewQueue = asyncHandler(async (req, res) => {
  const tasks = await taskService.getReviewQueue(req.params.projectId);
  res.status(200).json({
    success: true,
    data: { count: tasks.length, tasks }
  });
});

const reviewTask = asyncHandler(async (req, res) => {
  const { decision, finalLabel, comments } = req.body;
  const result = await taskService.reviewTask(req.params.taskId, req.user._id, {
    decision,
    finalLabel,
    comments
  });

  // Record review in daily time log for reviewer
  const reviewType = decision === 'rejected' ? 'review_reject' : 'review_approve';
  timelogService.recordAction({
    userId: req.user._id,
    type: reviewType,
    taskId: req.params.taskId,
    projectId: result.task?.projectId,
    label: finalLabel || decision
  }).catch(err => console.error('[TimeLog] review record failed:', err.message));

  // Also record approved/rejected outcome on each annotator's daily time log
  Annotation.find({ taskId: req.params.taskId })
    .then((annotations) => {
      for (const ann of annotations) {
        const isApproved =
          decision !== 'rejected' &&
          finalLabel &&
          ann.label.trim().toLowerCase() === finalLabel.trim().toLowerCase();
        timelogService.recordAction({
          userId: ann.userId,
          type: isApproved ? 'review_approve' : 'review_reject',
          taskId: req.params.taskId,
          projectId: ann.projectId,
          label: ann.label
        }).catch(err => console.error('[TimeLog] annotator outcome record failed:', err.message));
      }
    })
    .catch(err => console.error('[TimeLog] annotation lookup failed:', err.message));

  res.status(200).json({
    success: true,
    message: 'Review decision recorded successfully',
    data: result
  });
});

module.exports = {
  createTasks,
  uploadCSV,
  getNextTask,
  skipTask,
  listTasks,
  getTaskById,
  getReviewQueue,
  reviewTask
};
