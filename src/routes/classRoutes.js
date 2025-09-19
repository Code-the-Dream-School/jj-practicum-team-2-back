const express = require('express');
const router = express.Router();
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getDefaultClass,
} = require('../controllers/classController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

router.get('/default', authMiddleware, getDefaultClass);

// CRUD routes
router
  .route('/')
  .post(authMiddleware, checkRole(['mentor', 'admin']), createClass)
  .get(authMiddleware, getAllClasses);

router
  .route('/:id')
  .get(authMiddleware, checkRole(['mentor', 'admin']), getClassById)
  .put(authMiddleware, checkRole(['mentor', 'admin']), updateClass)
  .delete(authMiddleware, checkRole(['mentor', 'admin']), deleteClass);

module.exports = router;

