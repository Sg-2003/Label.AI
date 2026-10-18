const Task = require('../models/Task');
const Project = require('../models/Project');
const Annotation = require('../models/Annotation');
const ApiError = require('../utils/apiError');
const { TASK_STATUS } = require('../config/constants');

/**
 * Format string for CSV cell (handling quotes and commas)
 */
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Export project dataset in JSON format
 */
const exportToJSON = async (projectId, completedOnly = true) => {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  const filter = { projectId };
  if (completedOnly) {
    filter.status = TASK_STATUS.COMPLETED;
  }

  const tasks = await Task.find(filter).sort({ createdAt: 1 });

  const dataset = tasks.map((task) => ({
    id: task._id,
    text: task.data.text,
    metadata: task.data.metadata || {},
    label: task.consensusLabel,
    consensusScore: task.consensusScore,
    status: task.status,
    isGoldStandard: task.isGoldStandard,
    createdAt: task.createdAt
  }));

  return {
    projectName: project.name,
    taskType: project.taskType,
    exportedAt: new Date().toISOString(),
    totalExported: dataset.length,
    data: dataset
  };
};

/**
 * Export project dataset in CSV format
 */
const exportToCSV = async (projectId, completedOnly = true) => {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  const filter = { projectId };
  if (completedOnly) {
    filter.status = TASK_STATUS.COMPLETED;
  }

  const tasks = await Task.find(filter).sort({ createdAt: 1 });

  const headers = ['id', 'text', 'label', 'consensusScore', 'status', 'isGoldStandard', 'metadata'];
  const rows = [headers.map(escapeCSV).join(',')];

  for (const task of tasks) {
    const row = [
      escapeCSV(task._id.toString()),
      escapeCSV(task.data.text),
      escapeCSV(task.consensusLabel || ''),
      escapeCSV(task.consensusScore !== null ? task.consensusScore : ''),
      escapeCSV(task.status),
      escapeCSV(task.isGoldStandard),
      escapeCSV(task.data.metadata || {})
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
};

module.exports = {
  exportToJSON,
  exportToCSV
};
