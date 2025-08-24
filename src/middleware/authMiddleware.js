const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1].trim();
  } else {
    token = req.signedCookies.token;
  }

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'AUTH_NO_TOKEN',
        message: 'No token provided. Use Authorization header or cookie.',
      },
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: { code: 'SERVER_CONFIG_ERROR', message: 'JWT secret not set' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_err) {
    return res.status(401).json({
      error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
};

module.exports = authMiddleware;
