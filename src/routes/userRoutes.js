const express = require('express');
const router = express.Router();
const {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getOwnProfile,
} = require('../controllers/userController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Profile CRUD
router.get('/myProfile', authMiddleware, getOwnProfile);
router.get('/:id', authMiddleware, checkRole(['mentor', 'student', 'admin']), getUser); // get single user
router.put('/:id', authMiddleware, checkRole(['mentor', 'student', 'admin']), updateUser); // update profile
router.delete('/:id', authMiddleware, checkRole(['admin']), deleteUser); // delete profile - admin only

// Admin only
router.get('/', authMiddleware, checkRole(['admin']), getAllUsers);

module.exports = router;
