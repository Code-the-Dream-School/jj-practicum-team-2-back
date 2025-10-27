const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  let token;
  let authMethod = 'none';

  // Try cookies first (for browsers that support cross-origin cookies)
  token = req.signedCookies.token || req.cookies.token;
  if (token) {
    authMethod = req.signedCookies.token ? 'signed cookies' : 'regular cookies';
    console.log('🍪 Using cookie token');
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    // Fallback to Authorization header (for Safari and other cases)
    token = authHeader.split(' ')[1].trim();
    authMethod = 'Authorization header';
    console.log('🔑 Using Authorization header token');
  }

  // Debug logging with auth method
  if (process.env.NODE_ENV === 'production') {
    console.log('Auth Debug:', {
      origin: req.headers.origin,
      authMethod: authMethod,
      hasAuthHeader: !!req.headers.authorization,
      hasCookies: req.cookies ? Object.keys(req.cookies).length : 0,
      hasSignedCookies: req.signedCookies ? Object.keys(req.signedCookies).length : 0,
    });
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

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'AUTH_NO_USER', message: 'User not authenticated' },
      });
    }

    if (!req.user.role) {
      return res.status(403).json({
        error: { code: 'AUTH_NO_ROLE', message: 'User role not found in token' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    return next();
  };
};

module.exports = { authMiddleware, checkRole };
