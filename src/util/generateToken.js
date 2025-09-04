const jwt = require('jsonwebtoken');

const generateToken = (id, expiresIn = '7d', type = 'auth', role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in .env');
  }

  if (!role) {
    throw new Error('Role is required to generate token');
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

  const payload = { id, type, role };

  return jwt.sign(payload, secret, { expiresIn: duration });
};

module.exports = generateToken;
