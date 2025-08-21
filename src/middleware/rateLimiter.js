const rateLimit = require('express-rate-limit');

// Limit login attempts: max 5 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    message: 'Too many login attempts from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Limit register attempts: max 10 per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    message: 'Too many accounts created from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, registerLimiter };
