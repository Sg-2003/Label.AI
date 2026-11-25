const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../config/constants');
const timelogController = require('../controllers/timelog.controller');

// Any logged-in user: get today's own log
router.get('/timelog/today', authenticate, timelogController.getMyToday);

// Admin only: browse all employee time logs
router.get(
  '/timelog/history',
  authenticate,
  authorize([ROLES.ADMIN]),
  timelogController.getHistory
);

// Admin only: specific user + date detail
router.get(
  '/timelog/user/:userId/:date',
  authenticate,
  authorize([ROLES.ADMIN]),
  timelogController.getUserDayDetail
);

module.exports = router;

