// src/controllers/auth.controller.js
const crypto = require('crypto');
const User = require('../models/User');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require('../utils/generateToken');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Issue both tokens, persist the hashed refresh token on the user document,
 * set the refresh cookie, and send the access token in the response body.
 */
const issueTokens = async (user, res, statusCode = 200, message = 'Success') => {
  const accessToken  = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  // Store a SHA-256 hash of the refresh token (never store raw tokens)
  const hashedRefresh = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Keep at most 5 concurrent sessions (oldest dropped automatically)
  const tokens = [...(user.refreshTokens || []), hashedRefresh].slice(-5);
  await User.findByIdAndUpdate(user._id, { refreshTokens: tokens });

  // Refresh token lives in a secure, HTTP-only cookie
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());

  return sendSuccess(res, {
    statusCode,
    message,
    data: {
      accessToken,
      user: user.publicProfile,
    },
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Fail fast if email is taken (mongoose unique index would catch it too,
    // but this gives a cleaner, early error message)
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'Email is already registered.' });
    }

    const user = await User.create({ name, email, password });

    return issueTokens(user, res, 201, 'Account created successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (field has select: false in schema)
    const user = await User.findOne({ email }).select('+password +refreshTokens');

    if (!user || !user.isActive) {
      // Deliberately vague to prevent user enumeration
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }

    return issueTokens(user, res, 200, 'Logged in successfully.');
  } catch (err) {
    next(err);
  }
};

// ─── Refresh access token ─────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return sendError(res, { statusCode: 401, message: 'No refresh token provided.' });
    }

    // Verify signature
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return sendError(res, { statusCode: 401, message: 'Invalid or expired refresh token.' });
    }

    // Check the hashed token is still in the user's list (not revoked)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findById(decoded.sub).select('+refreshTokens');

    if (!user || !user.isActive || !user.refreshTokens.includes(hashedToken)) {
      // Possible token reuse — invalidate all sessions for this user
      if (user) await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
      return sendError(res, { statusCode: 401, message: 'Refresh token has been revoked.' });
    }

    // Rotate: remove the old token, issue a fresh pair
    const updatedTokens = user.refreshTokens.filter((t) => t !== hashedToken);
    user.refreshTokens = updatedTokens;

    return issueTokens(user, res, 200, 'Token refreshed.');
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      // Remove just this session's refresh token
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: hashedToken },
      });
    }

    // Clear the cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });

    return sendSuccess(res, { message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Logout all devices ───────────────────────────────────────────────────────
const logoutAll = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshTokens: [] });
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return sendSuccess(res, { message: 'Logged out from all devices.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get current user ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by the protect middleware
    const user = await User.findById(req.user._id)
      .populate('skillsOffered', 'title category level')
      .populate('skillsWanted',  'title category level');

    if (!user) return next(new AppError('User not found.', 404));

    return sendSuccess(res, { data: user.publicProfile });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, logoutAll, getMe };