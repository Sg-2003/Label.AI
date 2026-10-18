const Task = require('../models/Task');
const Project = require('../models/Project');
const Annotation = require('../models/Annotation');
const { TASK_STATUS } = require('../config/constants');

/**
 * Evaluate consensus when annotations for a task are submitted
 * @param {string} taskId
 */
const evaluateConsensus = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) return null;

  const project = await Project.findById(task.projectId);
  if (!project) return null;

  const annotations = await Annotation.find({ taskId: task._id });
  const totalAnnotations = annotations.length;

  // Check if target overlap count has been reached
  if (totalAnnotations < project.overlapCount) {
    // If not yet reached overlap, task remains unassigned for the next annotator to pick up
    task.status = TASK_STATUS.UNASSIGNED;
    task.assignedTo = null;
    task.lockedAt = null;
    await task.save();
    return {
      status: TASK_STATUS.UNASSIGNED,
      annotationsNeeded: project.overlapCount - totalAnnotations
    };
  }

  // Calculate vote distribution
  const voteCounts = {};
  for (const ann of annotations) {
    voteCounts[ann.label] = (voteCounts[ann.label] || 0) + 1;
  }

  let topLabel = null;
  let maxVotes = 0;
  for (const [label, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topLabel = label;
    }
  }

  const consensusScore = maxVotes / totalAnnotations;
  // Threshold: at least 60% agreement (or strict majority)
  const consensusThreshold = 0.6;
  const isConsensusReached = consensusScore >= consensusThreshold;

  if (isConsensusReached) {
    task.status = TASK_STATUS.COMPLETED;
    task.consensusLabel = topLabel;
    task.consensusScore = Math.round(consensusScore * 100) / 100;
    task.assignedTo = null;
    task.lockedAt = null;
    await task.save();

    // Increment completed task count in Project
    await Project.findByIdAndUpdate(project._id, {
      $inc: { 'counts.completed': 1 }
    });

    return {
      status: TASK_STATUS.COMPLETED,
      consensusLabel: topLabel,
      consensusScore: task.consensusScore
    };
  } else {
    // No consensus reached -> escalate to in_review for expert reviewer
    task.status = TASK_STATUS.IN_REVIEW;
    task.consensusLabel = null;
    task.consensusScore = Math.round(consensusScore * 100) / 100;
    task.assignedTo = null;
    task.lockedAt = null;
    await task.save();

    return {
      status: TASK_STATUS.IN_REVIEW,
      consensusScore: task.consensusScore,
      message: 'Escalated to review queue due to label disagreement'
    };
  }
};

module.exports = {
  evaluateConsensus
};
