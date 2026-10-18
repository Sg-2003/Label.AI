const express = require('express');
const Joi = require('joi');
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { ROLES, PROJECT_STATUS, TASK_TYPES } = require('../config/constants');

const router = express.Router();

const createProjectSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().allow('').default(''),
    taskType: Joi.string().valid(...Object.values(TASK_TYPES)).default(TASK_TYPES.TEXT_CLASSIFICATION),
    labels: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        color: Joi.string().default('#3B82F6'),
        shortcutKey: Joi.string().allow('').default('')
      })
    ).min(2).required(),
    guidelines: Joi.string().allow('').default(''),
    overlapCount: Joi.number().integer().min(1).default(3),
    aiEnabled: Joi.boolean().default(false),
    status: Joi.string().valid(...Object.values(PROJECT_STATUS)).default(PROJECT_STATUS.ACTIVE)
  })
};

const updateProjectSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    name: Joi.string().trim().min(3).max(100),
    description: Joi.string().allow(''),
    guidelines: Joi.string().allow(''),
    labels: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        color: Joi.string().default('#3B82F6'),
        shortcutKey: Joi.string().allow('').default('')
      })
    ),
    overlapCount: Joi.number().integer().min(1),
    aiEnabled: Joi.boolean(),
    status: Joi.string().valid(...Object.values(PROJECT_STATUS))
  })
};

router.use(authenticate);

router.post('/', authorize([ROLES.ADMIN]), validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', authorize([ROLES.ADMIN]), validate(updateProjectSchema), projectController.updateProject);
router.patch('/:id/status', authorize([ROLES.ADMIN]), projectController.updateProjectStatus);
router.post('/:id/ai-prelabel', authorize([ROLES.ADMIN]), projectController.prelabelTasks);
router.delete('/:id', authorize([ROLES.ADMIN]), projectController.deleteProject);
router.get('/:id/stats', projectController.getProjectStats);

module.exports = router;
