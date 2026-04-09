// src/routes/auth.routes.js
const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const {
  validate,
  registerRules,
  loginRules,
} = require('../middleware/validate');

const router = Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: 'Too many refresh requests. Slow down.' },
});

// ─── Public routes ────────────────────────────────────────────────────────────

/**
 * @route  POST /api/auth/register
 * @desc   Create a new account
 * @access Public
 * @body   { name, email, password, confirmPassword }
 */
router.post('/register', authLimiter, registerRules, validate, register);

/**
 * @route  POST /api/auth/login
 * @desc   Login and receive access + refresh tokens
 * @access Public
 * @body   { email, password }
 */
router.post('/login', authLimiter, loginRules, validate, login);

/**
 * @route  POST /api/auth/refresh
 * @desc   Issue a new access token using the refresh cookie
 * @access Public (requires valid refresh cookie)
 */
router.post('/refresh', refreshLimiter, refreshToken);

// ─── Protected routes ─────────────────────────────────────────────────────────

/**
 * @route  GET /api/auth/me
 * @desc   Get the currently authenticated user
 * @access Private
 */
router.get('/me', protect, getMe);

/**
 * @route  POST /api/auth/logout
 * @desc   Logout current session (revokes this device's refresh token)
 * @access Private
 */
router.post('/logout', protect, logout);

/**
 * @route  POST /api/auth/logout-all
 * @desc   Logout from all devices (revokes all refresh tokens)
 * @access Private
 */
router.post('/logout-all', protect, logoutAll);

module.exports = router;