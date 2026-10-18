const express = require('express');
const Joi = require('joi');
const annotationController = require('../controllers/annotation.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

const annotateSchema = {
  params: Joi.object({
    taskId: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    label: Joi.string().trim().required(),
    confidence: Joi.number().integer().min(1).max(5).default(5),
    timeSpentSeconds: Joi.number().min(0).default(0)
  })
};

router.use(authenticate);

router.post(
  '/tasks/:taskId/annotate',
  authorize([ROLES.ADMIN, ROLES.ANNOTATOR, ROLES.REVIEWER]),
  validate(annotateSchema),
  annotationController.submitAnnotation
);

router.get(
  '/tasks/:taskId/annotations',
  annotationController.getTaskAnnotations
);

module.exports = router;
