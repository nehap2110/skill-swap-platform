// src/middleware/auth.middleware.js
const { verifyAccessToken } = require('../utils/generateToken');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

/**
 * protect — verifies the Bearer access token on every protected route.
 * Attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No access token provided. Please log in.', 401));
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify signature and expiry
    const decoded = verifyAccessToken(token);

    // 3. Check user still exists (may have been deleted since token was issued)
    const user = await User.findById(decoded.sub).select('+passwordChangedAt');
    if (!user || !user.isActive) {
      return next(new AppError('User no longer exists or has been deactivated.', 401));
    }

    // 4. Guard against tokens issued before a password change
    if (user.passwordChangedAfter(decoded.iat)) {
      return next(new AppError('Password was recently changed. Please log in again.', 401));
    }

    // 5. Attach user to request context
    req.user = user;
    next();
  } catch (err) {
    next(err); // JWT errors are handled by errorHandler
  }
};

/**
 * optionalAuth — same as protect but never blocks the request.
 * Useful for routes that return extra data when the user is logged in.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);
    if (user && user.isActive) req.user = user;
  } catch {
    // Silently ignore invalid tokens for optional routes
  }
  next();
};

module.exports = { protect, optionalAuth };