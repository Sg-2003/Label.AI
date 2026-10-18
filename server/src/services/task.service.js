const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Annotation = require('../models/Annotation');
const Review = require('../models/Review');
const ApiError = require('../utils/apiError');
const config = require('../config/env');
const { TASK_STATUS, REVIEW_DECISION } = require('../config/constants');

/**
 * Bulk create tasks for a project
 */
const createTasks = async (projectId, taskItems) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const tasksToInsert = taskItems.map((item) => ({
    projectId,
    data: {
      text: typeof item === 'string' ? item : item.text,
      metadata: item.metadata || {}
    },
    isGoldStandard: !!item.isGoldStandard,
    goldLabel: item.goldLabel || null,
    status: TASK_STATUS.UNASSIGNED
  }));

  const createdTasks = await Task.insertMany(tasksToInsert);

  // Update total count on project
  await Project.findByIdAndUpdate(projectId, {
    $inc: { 'counts.total': createdTasks.length }
  });

  return createdTasks;
};

/**
 * Import tasks parsed from CSV
 * Supported CSV headers: text, metadata_*, isGoldStandard, goldLabel
 */
const importTasksFromCSV = async (projectId, rows) => {
  const taskItems = rows
    .filter((row) => (row.text && row.text.trim().length > 0))
    .map((row) => {
      const metadata = {};
      Object.keys(row).forEach((key) => {
        if (!['text', 'isGoldStandard', 'goldLabel'].includes(key)) {
          metadata[key] = row[key];
        }
      });

      return {
        text: row.text.trim(),
        metadata,
        isGoldStandard: row.isGoldStandard === 'true' || row.isGoldStandard === true,
        goldLabel: row.goldLabel ? row.goldLabel.trim() : null
      };
    });

  if (taskItems.length === 0) {
    throw ApiError.badRequest('No valid task rows found. CSV must contain a non-empty "text" column.');
  }

  return createTasks(projectId, taskItems);
};

/**
 * Get next available task for an annotator with atomic lock
 */
const getNextTaskForAnnotator = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const lockTimeoutMs = config.taskLockTimeoutMinutes * 60 * 1000;
  const lockExpirationThreshold = new Date(Date.now() - lockTimeoutMs);

  // 1. Check if the user already has an active locked task in this project
  const existingActiveTask = await Task.findOne({
    projectId,
    status: TASK_STATUS.ASSIGNED,
    assignedTo: userId,
    lockedAt: { $gte: lockExpirationThreshold }
  });

  if (existingActiveTask) {
    return existingActiveTask;
  }

  // 2. Find tasks already annotated by this user in this project
  const userAnnotatedTaskIds = await Annotation.find({
    projectId,
    userId
  }).distinct('taskId');

  // 3. Atomically find and lock an unassigned or expired task
  const query = {
    projectId,
    _id: { $nin: userAnnotatedTaskIds },
    skippedBy: { $ne: userId },
    $or: [
      { status: TASK_STATUS.UNASSIGNED },
      {
        status: TASK_STATUS.ASSIGNED,
        lockedAt: { $lt: lockExpirationThreshold }
      }
    ]
  };

  const update = {
    $set: {
      status: TASK_STATUS.ASSIGNED,
      assignedTo: userId,
      lockedAt: new Date()
    }
  };

  const nextTask = await Task.findOneAndUpdate(query, update, {
    new: true,
    sort: { createdAt: 1 }
  });

  if (nextTask && project.aiEnabled && !nextTask.aiSuggestion?.label) {
    const aiService = require('./ai.service');
    const suggestion = aiService.generateAISuggestion(nextTask.data.text, project.labels);
    if (suggestion) {
      nextTask.aiSuggestion = suggestion;
      await nextTask.save();
    }
  }

  return nextTask;
};

/**
 * Skip a task for an annotator
 */
const skipTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Add user to skippedBy list and reset status to unassigned if locked by this user
  const isCurrentlyAssigned =
    task.assignedTo && task.assignedTo.toString() === userId.toString();

  const update = {
    $addToSet: { skippedBy: userId }
  };

  if (isCurrentlyAssigned) {
    update.$set = {
      status: TASK_STATUS.UNASSIGNED,
      assignedTo: null,
      lockedAt: null
    };
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, update, { new: true });
  return updatedTask;
};

/**
 * Fetch tasks with filters and pagination
 */
const getTasks = async (projectId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { projectId };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.isGoldStandard !== undefined) {
    filter.isGoldStandard = query.isGoldStandard === 'true';
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter)
  ]);

  return {
    tasks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get task details including all its submitted annotations
 */
const getTaskById = async (taskId) => {
  const task = await Task.findById(taskId).populate('assignedTo', 'name email');
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  const annotations = await Annotation.find({ taskId }).populate(
    'userId',
    'name email role'
  );

  return {
    task,
    annotations
  };
};

/**
 * Fetch review queue tasks for a project
 */
const getReviewQueue = async (projectId) => {
  const tasks = await Task.find({
    projectId,
    status: TASK_STATUS.IN_REVIEW
  }).sort({ updatedAt: -1 });

  // Populate annotations for each in-review task
  const populatedTasks = await Promise.all(
    tasks.map(async (t) => {
      const annotations = await Annotation.find({ taskId: t._id }).populate(
        'userId',
        'name email'
      );
      return {
        ...t.toObject(),
        annotations
      };
    })
  );

  return populatedTasks;
};

/**
 * Reviewer decision on an in-review task
 */
const reviewTask = async (taskId, reviewerId, { decision, finalLabel, comments }) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  if (task.status !== TASK_STATUS.IN_REVIEW) {
    throw ApiError.badRequest('Task is not in review status');
  }

  // Create Review record
  const reviewRecord = await Review.create({
    taskId: task._id,
    projectId: task.projectId,
    reviewerId,
    decision,
    finalLabel: decision === REVIEW_DECISION.REJECTED ? null : finalLabel,
    comments: comments || ''
  });

  if (decision === REVIEW_DECISION.APPROVED || decision === REVIEW_DECISION.OVERRIDDEN) {
    task.status = TASK_STATUS.COMPLETED;
    task.consensusLabel = finalLabel;
    task.consensusScore = 1.0;
    await task.save();

    await Project.findByIdAndUpdate(task.projectId, {
      $inc: { 'counts.completed': 1 }
    });
  } else if (decision === REVIEW_DECISION.REJECTED) {
    // Rejection: clear consensus and reset to unassigned for fresh annotations
    task.status = TASK_STATUS.UNASSIGNED;
    task.consensusLabel = null;
    task.consensusScore = null;
    await task.save();
  }

  return {
    task,
    review: reviewRecord
  };
};

module.exports = {
  createTasks,
  importTasksFromCSV,
  getNextTaskForAnnotator,
  skipTask,
  getTasks,
  getTaskById,
  getReviewQueue,
  reviewTask
};
