const Project = require('../models/Project');
const Task = require('../models/Task');
const Annotation = require('../models/Annotation');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { ROLES, TASK_STATUS, PROJECT_STATUS } = require('../config/constants');
const aiService = require('./ai.service');

const createProject = async (projectData, userId) => {
  const project = await Project.create({
    ...projectData,
    createdBy: userId
  });
  return project;
};

const getProjects = async (user, query = {}) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  // If annotator or reviewer, show projects they are member of or all active projects
  if (user.role !== ROLES.ADMIN) {
    filter.$or = [
      { 'members.userId': user._id },
      { status: PROJECT_STATUS.ACTIVE }
    ];
  }

  const projects = await Project.find(filter)
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email role')
    .sort({ createdAt: -1 });

  return projects;
};

const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email role');

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
};

const updateProject = async (projectId, updateData) => {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
};

const deleteProject = async (projectId) => {
  const project = await Project.findByIdAndDelete(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Cascade delete associated tasks and annotations
  await Task.deleteMany({ projectId });
  await Annotation.deleteMany({ projectId });

  return project;
};

/**
 * Calculate Inter-Annotator Agreement (Cohen's Kappa / Observed Agreement Po)
 */
const calculateAgreementScore = async (projectId) => {
  // Find tasks with 2 or more annotations
  const taskAnnotations = await Annotation.aggregate([
    { $match: { projectId } },
    { $group: { _id: '$taskId', labels: { $push: '$label' }, count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } }
  ]);

  if (taskAnnotations.length === 0) {
    return { observedAgreement: 1.0, kappaScore: 1.0, description: 'Single-annotator / baseline' };
  }

  let totalPairs = 0;
  let agreedPairs = 0;
  const labelCounts = {};

  for (const item of taskAnnotations) {
    const { labels } = item;
    for (let i = 0; i < labels.length; i++) {
      labelCounts[labels[i]] = (labelCounts[labels[i]] || 0) + 1;
      for (let j = i + 1; j < labels.length; j++) {
        totalPairs++;
        if (labels[i] === labels[j]) {
          agreedPairs++;
        }
      }
    }
  }

  const observedAgreement = totalPairs > 0 ? agreedPairs / totalPairs : 1.0;

  // Expected chance agreement Pe = sum(p_i^2)
  const totalLabelsRecorded = Object.values(labelCounts).reduce((a, b) => a + b, 0);
  let expectedAgreement = 0;
  if (totalLabelsRecorded > 0) {
    for (const count of Object.values(labelCounts)) {
      const p = count / totalLabelsRecorded;
      expectedAgreement += p * p;
    }
  }

  let kappa = 1.0;
  if (expectedAgreement < 1.0) {
    kappa = (observedAgreement - expectedAgreement) / (1 - expectedAgreement);
  }
  kappa = Math.max(0, Math.min(1.0, Math.round(kappa * 100) / 100));

  let description = 'Moderate Agreement';
  if (kappa >= 0.8) description = 'Near-Perfect Agreement';
  else if (kappa >= 0.6) description = 'Substantial Agreement';
  else if (kappa < 0.4) description = 'Low / Needs Review';

  return {
    observedAgreement: Math.round(observedAgreement * 100) / 100,
    kappaScore: kappa,
    description
  };
};

const getProjectStats = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const [statusCounts, labelDistribution, totalAnnotations, agreementMetrics, annotatorsList] = await Promise.all([
    Task.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Annotation.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: '$label', count: { $sum: 1 } } }
    ]),
    Annotation.countDocuments({ projectId: project._id }),
    calculateAgreementScore(project._id),
    User.find({ role: { $in: [ROLES.ANNOTATOR, ROLES.REVIEWER] } }).select('name email role stats')
  ]);

  const taskCounts = {
    total: 0,
    unassigned: 0,
    assigned: 0,
    in_review: 0,
    completed: 0,
    skipped: 0
  };

  statusCounts.forEach((sc) => {
    taskCounts.total += sc.count;
    if (taskCounts.hasOwnProperty(sc._id)) {
      taskCounts[sc._id] = sc.count;
    }
  });

  const completionRate = taskCounts.total > 0
    ? Math.round((taskCounts.completed / taskCounts.total) * 100)
    : 0;

  // Annotator accuracy leaderboard
  const annotatorScores = annotatorsList.map((ann) => {
    const goldTotal = ann.stats?.goldTotal || 0;
    const goldCorrect = ann.stats?.goldCorrect || 0;
    const accuracy = goldTotal > 0 ? Math.round((goldCorrect / goldTotal) * 100) : null;
    return {
      userId: ann._id,
      name: ann.name,
      email: ann.email,
      role: ann.role,
      totalLabeled: ann.stats?.totalLabeled || 0,
      goldAccuracy: accuracy
    };
  });

  return {
    projectId: project._id,
    projectName: project.name,
    projectStatus: project.status,
    overlapCount: project.overlapCount,
    aiEnabled: project.aiEnabled,
    taskCounts,
    completionRate,
    totalAnnotations,
    agreementMetrics,
    annotatorScores,
    labelDistribution: labelDistribution.map((ld) => ({
      label: ld._id,
      count: ld.count
    }))
  };
};

const prelabelTasks = async (projectId) => {
  return aiService.prelabelProjectTasks(projectId);
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats,
  prelabelTasks
};
