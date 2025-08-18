const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_INVALID_HEADER',
        message: 'Invalid Authorization header. Use "Bearer <token>".',
      },
    });
  }

  const token = authHeader.split(' ')[1].trim();

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: { code: 'SERVER_CONFIG_ERROR', message: 'JWT secret not set' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: 'AUTH_INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
};

module.exports = authMiddleware;
