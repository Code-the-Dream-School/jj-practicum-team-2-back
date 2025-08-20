// generateToken.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (userId, type = 'auth', expiresIn) => {
  const secret = type === 'reset' ? process.env.JWT_RESET_SECRET : process.env.JWT_SECRET;
  const duration =
    expiresIn ||
    (type === 'reset' ? process.env.JWT_RESET_PASSWORD_EXPIRES_IN : process.env.JWT_LIFETIME);
  return jwt.sign({ userId, type }, secret, { expiresIn: duration });
};

module.exports = generateToken;
