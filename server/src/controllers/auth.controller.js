const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid email address is required.',
        },
      });
    }

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password is required.',
        },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    const genericInvalidMsg = 'Invalid email or password.';

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: genericInvalidMsg,
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Account is inactive. Please contact the administrator.',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: genericInvalidMsg,
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'JWT secret not configured.',
        },
      });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const token = jwt.sign(
      {
        sub: user._id,
        role: user.role,
      },
      jwtSecret,
      { expiresIn }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
}

module.exports = {
  login,
  getMe,
};

