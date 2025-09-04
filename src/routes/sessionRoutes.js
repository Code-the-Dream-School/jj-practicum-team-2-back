const express = require('express');
const {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession
} = require('../controllers/sessionController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes
router.route('/')
  .post(authMiddleware, checkRole('mentor', 'admin'), createSession)
  .get(authMiddleware, getAllSessions);

router.route('/:id')
  .get(authMiddleware, checkRole(['mentor', 'admin']), getSessionById)
  .put(authMiddleware, checkRole(['mentor', 'admin']), updateSession)
  .delete(authMiddleware, checkRole(['mentor', 'admin']), deleteSession);

module.exports = router;
