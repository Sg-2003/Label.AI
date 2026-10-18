const asyncHandler = require('../utils/asyncHandler');
const Annotation = require('../models/Annotation');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const consensusService = require('../services/consensus.service');

const submitAnnotation = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { label, confidence = 5, timeSpentSeconds = 0 } = req.body;
  const userId = req.user._id;

  if (!label) {
    throw ApiError.badRequest('Annotation label is required');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Check if user already submitted annotation for this task
  const existingAnnotation = await Annotation.findOne({ taskId, userId });
  if (existingAnnotation) {
    throw ApiError.conflict('You have already submitted an annotation for this task');
  }

  // Handle gold standard evaluation
  let isGoldCheck = false;
  let isGoldCorrect = null;

  if (task.isGoldStandard) {
    isGoldCheck = true;
    isGoldCorrect = (label.trim().toLowerCase() === (task.goldLabel || '').trim().toLowerCase());
  }

  // Create the annotation
  const annotation = await Annotation.create({
    taskId: task._id,
    projectId: task.projectId,
    userId,
    label,
    confidence,
    timeSpentSeconds,
    isGoldCheck,
    isGoldCorrect
  });

  // Update user statistics
  const userUpdate = {
    $inc: { 'stats.totalLabeled': 1 }
  };

  if (isGoldCheck) {
    userUpdate.$inc['stats.goldTotal'] = 1;
    if (isGoldCorrect) {
      userUpdate.$inc['stats.goldCorrect'] = 1;
    }
  }

  await User.findByIdAndUpdate(userId, userUpdate);

  // Evaluate consensus
  const consensusResult = await consensusService.evaluateConsensus(task._id);

  res.status(201).json({
    success: true,
    message: 'Annotation submitted successfully',
    data: {
      annotation,
      consensusResult,
      goldFeedback: isGoldCheck
        ? {
            isGoldStandard: true,
            isCorrect: isGoldCorrect
          }
        : null
    }
  });
});

const getTaskAnnotations = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const annotations = await Annotation.find({ taskId })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { annotations }
  });
});

module.exports = {
  submitAnnotation,
  getTaskAnnotations
};
