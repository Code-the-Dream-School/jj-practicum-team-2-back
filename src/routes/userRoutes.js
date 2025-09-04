const express = require('express');
const router = express.Router();
const {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getOwnProfile,
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

console.log({ getUser, updateUser, deleteUser, getAllUsers, authMiddleware });

// Profile CRUD
router.get('/myProfile', authMiddleware, getOwnProfile);
router.get('/:id', authMiddleware, getUser); // get single user
router.put('/:id', authMiddleware, updateUser); // update profile
router.delete('/:id', authMiddleware, deleteUser); // delete profile

// Admin only
router.get('/', authMiddleware, getAllUsers);

module.exports = router;
