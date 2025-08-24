const jwt = require('jsonwebtoken');

const generateToken = (userId, expiresIn = '7d', type = 'auth', role = null) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in .env');
  }

  const secret =
    type === 'reset'
      ? process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
      : process.env.JWT_SECRET;

  let duration;
  if (expiresIn) {
    duration = expiresIn;
  } else if (type === 'reset') {
    duration = process.env.JWT_RESET_PASSWORD_EXPIRES_IN || '1h';
  } else {
    duration = process.env.JWT_LIFETIME || '7d';
  }

  const payload = { userId, type };
  if (role) {
    payload.role = role;
  }

  return jwt.sign(payload, secret, { expiresIn: duration });
};

module.exports = generateToken;
