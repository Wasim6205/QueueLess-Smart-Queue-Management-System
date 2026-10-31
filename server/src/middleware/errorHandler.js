const AppError = require('../utils/AppError');

function errorHandler(err, req, res, next) {
  // Check if it's our custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...err.extra,
      },
    });
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    // If it's the partial unique index on { service: 1, dateKey: 1, status: 'serving' }
    if (err.message && err.message.includes('serving')) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_SERVING',
          message: 'Another token is already being served.',
        },
      });
    }

    return res.status(409).json({
      error: {
        code: 'INVALID_TRANSITION',
        message: 'Duplicate key conflict in queue operation.',
      },
    });
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid format for ${err.path}: ${err.value}`,
      },
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const firstKey = Object.keys(err.errors)[0];
    const message = err.errors[firstKey]?.message || 'Validation error';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    });
  }

  // Log unexpected errors in development
  console.error('[Unhandled Error]', err);

  // Default server error (never leak stack trace)
  return res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  });
}

module.exports = errorHandler;

