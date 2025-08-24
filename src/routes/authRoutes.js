const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, register);

router.post('/login', loginLimiter, login);

router.delete('/logout', logout);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

module.exports = router;
