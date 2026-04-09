// src/middleware/validate.js
const { validationResult, body, param, query } = require('express-validator');
const { sendError } = require('../utils/apiResponse');
const { SWAP_STATUS } = require('../models/SwapRequest');

// ─── Runner ───────────────────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      statusCode: 422,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirmPassword').notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
  body('bio').optional().isLength({ max: 300 }).withMessage('Bio cannot exceed 300 characters'),
  body('location').optional().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('socialLinks.linkedin').optional().isURL().withMessage('LinkedIn must be a valid URL'),
  body('socialLinks.github').optional().isURL().withMessage('GitHub must be a valid URL'),
  body('socialLinks.website').optional().isURL().withMessage('Website must be a valid URL'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number'),
];

// ─── Swap ─────────────────────────────────────────────────────────────────────
const sendSwapRules = [
  body('receiverId').notEmpty().withMessage('Receiver is required')
    .isMongoId().withMessage('Invalid receiver ID'),
  body('offeredSkillId').notEmpty().withMessage('Offered skill is required')
    .isMongoId().withMessage('Invalid offered skill ID'),
  body('wantedSkillId').notEmpty().withMessage('Wanted skill is required')
    .isMongoId().withMessage('Invalid wanted skill ID')
    .custom((value, { req }) => {
      if (value === req.body.offeredSkillId) throw new Error('Offered skill and wanted skill must be different');
      return true;
    }),
  body('message').optional().isString().withMessage('Message must be a string')
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters').trim(),
  body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) throw new Error('Scheduled date must be in the future');
      return true;
    }),
];

const updateStatusRules = [
  param('id').isMongoId().withMessage('Invalid swap request ID'),
  body('status').notEmpty().withMessage('Status is required')
    .isIn([SWAP_STATUS.ACCEPTED, SWAP_STATUS.REJECTED, SWAP_STATUS.COMPLETED, SWAP_STATUS.CANCELLED])
    .withMessage('Status must be one of: accepted, rejected, completed, cancelled'),
  body('note').optional().isString().withMessage('Note must be a string')
    .isLength({ max: 200 }).withMessage('Note cannot exceed 200 characters').trim(),
];

const listSwapsRules = [
  query('status').optional().isIn(Object.values(SWAP_STATUS))
    .withMessage('Status filter must be one of: ' + Object.values(SWAP_STATUS).join(', ')),
  query('role').optional().isIn(['sender', 'receiver', 'all'])
    .withMessage('Role must be sender, receiver, or all'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt(),
];

// ─── Review ───────────────────────────────────────────────────────────────────
const createReviewRules = [
  body('swapId').notEmpty().withMessage('Swap ID is required')
    .isMongoId().withMessage('Invalid swap ID'),
  body('rating').notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number between 1 and 5').toInt(),
  body('comment').optional().isString().withMessage('Comment must be a string')
    .isLength({ max: 600 }).withMessage('Comment cannot exceed 600 characters').trim(),
];

const editReviewRules = [
  param('id').isMongoId().withMessage('Invalid review ID'),
  body('rating').optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number between 1 and 5').toInt(),
  body('comment').optional().isString().withMessage('Comment must be a string')
    .isLength({ max: 600 }).withMessage('Comment cannot exceed 600 characters').trim(),
  body().custom((_, { req }) => {
    if (req.body.rating === undefined && req.body.comment === undefined) {
      throw new Error('Provide at least one field to update: rating or comment');
    }
    return true;
  }),
];

const listUserReviewsRules = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  query('minRating').optional()
    .isInt({ min: 1, max: 5 }).withMessage('minRating must be between 1 and 5').toInt(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt(),
];

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  validate,
  // auth
  registerRules, loginRules, updateProfileRules, changePasswordRules,
  // swap
  sendSwapRules, updateStatusRules, listSwapsRules,
  // review
  createReviewRules, editReviewRules, listUserReviewsRules,
};