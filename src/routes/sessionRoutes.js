const express = require('express');
const {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  cancelSession,
  getStudentDashboard,
  getMentorDashboard,
  registerForSession,
  unregisterFromSession,
  markAttendance,
  getSessionAttendance,
  updateWeeklyGoal,
  updateSessionStatus,
} = require('../controllers/sessionController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/student-dashboard', authMiddleware, checkRole(['student']), getStudentDashboard);
router.get('/mentor-dashboard', authMiddleware, checkRole(['mentor']), getMentorDashboard);

router.post('/:id/register', authMiddleware, checkRole(['student']), registerForSession);
router.delete('/:id/unregister', authMiddleware, checkRole(['student']), unregisterFromSession);

router.post('/:id/attendance', authMiddleware, checkRole(['mentor']), markAttendance);
router.get('/:id/attendance', authMiddleware, checkRole(['mentor']), getSessionAttendance);

router.put('/weekly-goal', authMiddleware, checkRole(['student']), updateWeeklyGoal);

router.put('/:id/status', authMiddleware, checkRole(['mentor']), updateSessionStatus);

router.put('/:id/cancel', authMiddleware, checkRole(['mentor', 'admin']), cancelSession);

router
  .route('/')
  .post(authMiddleware, checkRole(['mentor', 'admin']), createSession)
  .get(authMiddleware, getAllSessions);

router
  .route('/:id')
  .get(authMiddleware, checkRole(['mentor', 'admin']), getSessionById)
  .put(authMiddleware, checkRole(['mentor', 'admin']), updateSession)
  .delete(authMiddleware, checkRole(['mentor', 'admin']), deleteSession);

module.exports = router;
