// generateToken.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (userId, type = 'auth', expiresIn) => {

    if (!process.env.JWT_SECRET) {
        throw new Error('Missing JWT_SECRET in .env');
    }
    if (!process.env.JWT_RESET_PASSWORD_EXPIRES_IN) {
        throw new Error('Missing JWT_RESET_PASSWORD_EXPIRES_IN in .env');
    }
  const secret = type === 'reset' ? process.env.JWT_RESET_SECRET : process.env.JWT_SECRET;
  const duration =
    expiresIn ||
    (type === 'reset' ? process.env.JWT_RESET_PASSWORD_EXPIRES_IN : process.env.JWT_LIFETIME);
  return jwt.sign({ userId, type }, secret, { expiresIn: duration });
};

module.exports = generateToken;
