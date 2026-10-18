const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/project.service');

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project }
  });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user, req.query);
  res.status(200).json({
    success: true,
    data: { projects }
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  res.status(200).json({
    success: true,
    data: { project }
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: { project }
  });
});

const updateProjectStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const project = await projectService.updateProject(req.params.id, { status });
  res.status(200).json({
    success: true,
    message: `Project status changed to ${status}`,
    data: { project }
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Project and associated data deleted successfully'
  });
});

const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await projectService.getProjectStats(req.params.id);
  res.status(200).json({
    success: true,
    data: { stats }
  });
});

const prelabelTasks = asyncHandler(async (req, res) => {
  const result = await projectService.prelabelTasks(req.params.id);
  res.status(200).json({
    success: true,
    message: `Successfully generated AI suggestions for ${result.count} tasks`,
    data: result
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  deleteProject,
  getProjectStats,
  prelabelTasks
};
