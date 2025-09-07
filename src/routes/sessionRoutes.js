const express = require('express');
const {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  getStudentDashboard,
  getMentorDashboard,
  registerForSession,
  unregisterFromSession,
} = require('../controllers/sessionController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Dashboard routes
router.get('/student-dashboard', authMiddleware, checkRole(['student']), getStudentDashboard);
router.get('/mentor-dashboard', authMiddleware, checkRole(['mentor']), getMentorDashboard);

// Session registration routes
router.post('/:id/register', authMiddleware, checkRole(['student']), registerForSession);
router.delete('/:id/unregister', authMiddleware, checkRole(['student']), unregisterFromSession);

// Protected routes
router
  .route('/')
  .post(authMiddleware, checkRole('mentor', 'admin'), createSession)
  .get(authMiddleware, getAllSessions);

router
  .route('/:id')
  .get(authMiddleware, checkRole(['mentor', 'admin']), getSessionById)
  .put(authMiddleware, checkRole(['mentor', 'admin']), updateSession)
  .delete(authMiddleware, checkRole(['mentor', 'admin']), deleteSession);

module.exports = router;
