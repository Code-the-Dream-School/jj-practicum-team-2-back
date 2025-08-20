const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const jwtLifetime = process.env.JWT_LIFETIME;
  const token = jwt.sign({ userId }, secret, { expiresIn: jwtLifetime });
  return token;
};

module.exports = generateToken;
