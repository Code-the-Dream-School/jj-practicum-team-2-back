const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', registerLimiter, register);

router.post('/login', loginLimiter, login);

router.delete('/logout', logout);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
