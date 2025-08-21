const express = require('express');
const router = express.Router();
const { register, login, logout, requestPasswordReset } = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// POST /api/v1/auth/register
router.post('/register', registerLimiter, register);

// POST /api/v1/auth/login
router.post('/login', loginLimiter, login);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// POST /api/v1/auth/reset-password
// router.post('/resetPassword', requestPasswordReset);

module.exports = router;
