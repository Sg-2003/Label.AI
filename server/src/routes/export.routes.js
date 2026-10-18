const express = require('express');
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// Export dataset
router.get(
  '/projects/:projectId/export',
  authorize([ROLES.ADMIN, ROLES.REVIEWER]),
  exportController.exportDataset
);

// Notion spec export alias
router.get(
  '/export/:projectId',
  authorize([ROLES.ADMIN, ROLES.REVIEWER]),
  exportController.exportDataset
);

module.exports = router;
