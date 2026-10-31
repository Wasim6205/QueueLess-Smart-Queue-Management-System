const rateLimit = require('express-rate-limit');

// Login rate limiter: max 5 failed attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many login attempts. Please try again in 15 minutes.',
      },
    });
  },
});

// General API limiter: 100 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again after a minute.',
      },
    });
  },
});

module.exports = {
  loginLimiter,
  apiLimiter,
};
