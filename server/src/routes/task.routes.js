const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { ROLES, REVIEW_DECISION } = require('../config/constants');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

const reviewSchema = {
  params: Joi.object({
    taskId: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    decision: Joi.string().valid(...Object.values(REVIEW_DECISION)).required(),
    finalLabel: Joi.string().allow(null, '').default(null),
    comments: Joi.string().allow('').default('')
  })
};

router.use(authenticate);

// Project-scoped task routes
router.post(
  '/projects/:projectId/tasks',
  authorize([ROLES.ADMIN]),
  taskController.createTasks
);

router.post(
  '/projects/:projectId/tasks/upload',
  authorize([ROLES.ADMIN]),
  upload.single('file'),
  taskController.uploadCSV
);

router.post(
  '/projects/:projectId/tasks/csv',
  authorize([ROLES.ADMIN]),
  upload.single('file'),
  taskController.uploadCSV
);

router.get(
  '/projects/:projectId/tasks/next',
  authorize([ROLES.ADMIN, ROLES.ANNOTATOR, ROLES.REVIEWER]),
  taskController.getNextTask
);

router.get(
  '/projects/:projectId/tasks',
  taskController.listTasks
);

router.get(
  '/projects/:projectId/tasks/review-queue',
  authorize([ROLES.ADMIN, ROLES.REVIEWER]),
  taskController.getReviewQueue
);

// Review queue alias matching Notion spec
router.get(
  '/review/queue/:projectId',
  authorize([ROLES.ADMIN, ROLES.REVIEWER]),
  taskController.getReviewQueue
);

// Direct task actions
router.get(
  '/tasks/:taskId',
  taskController.getTaskById
);

router.post(
  '/tasks/:taskId/skip',
  authorize([ROLES.ADMIN, ROLES.ANNOTATOR]),
  taskController.skipTask
);

router.post(
  '/tasks/:taskId/review',
  authorize([ROLES.ADMIN, ROLES.REVIEWER]),
  validate(reviewSchema),
  taskController.reviewTask
);

// Notion review decision alias
router.post(
  '/review/:taskId/decision',
  authorize([ROLES.ADMIN, ROLES.REVIEWER]),
  validate(reviewSchema),
  taskController.reviewTask
);

module.exports = router;
