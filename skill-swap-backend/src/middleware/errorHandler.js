// src/middleware/errorHandler.js
const env = require('../config/env');
const { sendError } = require('../utils/apiResponse');

// ─── Custom application error ─────────────────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks errors we intentionally raised
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Global error handler (must be last app.use) ──────────────────────────────
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let { statusCode = 500, message } = err;

  // Mongoose: duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    statusCode = 409;
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already in use.`;
  }

  // Mongoose: validation errors (required fields, enum, min/max)
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, { statusCode, message: 'Validation failed', errors });
  }

  // Mongoose: invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again.';
  }

  // Log stack trace only in development
  if (env.isDev) {
    console.error('ERROR 🔥', err);
  }

  // Never leak internal details in production for non-operational errors
  if (env.isProd && !err.isOperational) {
    message = 'Something went wrong. Please try again later.';
  }

  return sendError(res, { statusCode, message });
};

module.exports = { AppError, errorHandler };