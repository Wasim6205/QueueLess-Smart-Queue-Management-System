const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication token is missing or malformed.',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication token is missing.',
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Server auth configuration error.',
        },
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: err.name === 'TokenExpiredError' ? 'Token has expired.' : 'Invalid authentication token.',
        },
      });
    }

    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Invalid token payload.',
        },
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'User not found or account is inactive.',
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
        },
      });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};

