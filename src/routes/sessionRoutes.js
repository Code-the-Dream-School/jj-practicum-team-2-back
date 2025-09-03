
const express = require('express');
const {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes
router.route('/')
  .post(protect, authorize('mentor', 'admin'), createSession)
  .get(protect, getAllSessions);

router.route('/:id')
  .get(protect, getSessionById)
  .put(protect, authorize('mentor', 'admin'), updateSession)
  .delete(protect, authorize('mentor', 'admin'), deleteSession);

module.exports = router;
