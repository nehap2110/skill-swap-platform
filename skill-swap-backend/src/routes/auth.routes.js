// src/routes/auth.routes.js
const { Router } = require('express');
const rateLimit  = require('express-rate-limit');

const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const { validate, registerRules, loginRules } = require('../middleware/validate');

const router = Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many refresh requests. Slow down.' },
});

// Stricter rate limit for password reset (prevent abuse)
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 5,
  message: { success: false, message: 'Too many reset attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/register',        authLimiter,  registerRules, validate, register);
router.post('/login',           authLimiter,  loginRules,    validate, login);
router.post('/refresh',         refreshLimiter, refreshToken);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password',  resetLimiter, resetPassword);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.get('/me',          protect, getMe);
router.post('/logout',     protect, logout);
router.post('/logout-all', protect, logoutAll);

module.exports = router;