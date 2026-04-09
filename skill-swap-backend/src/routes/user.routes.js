// src/routes/user.routes.js
const { Router } = require('express');

const {
  getUserById,
  updateMe,
  changePassword,
  deleteMe,
  getMatches,
} = require('../controllers/user.controller');

const { protect } = require('../middleware/auth.middleware');
const {
  validate,
  updateProfileRules,
  changePasswordRules,
} = require('../middleware/validate');

const router = Router();

// All user routes require authentication
router.use(protect);

/**
 * @route  GET /api/users/matches
 * @desc   Get users whose skills match yours
 * @access Private
 * @query  page, limit
 */
router.get('/matches', getMatches);

/**
 * @route  GET  /api/users/me  (alias — same as /api/auth/me but via user router)
 * @route  PUT  /api/users/me  — update profile fields
 * @route  DELETE /api/users/me — soft-delete account
 */
router
  .route('/me')
  .put(updateProfileRules, validate, updateMe)
  .delete(deleteMe);

/**
 * @route  PATCH /api/users/me/password
 * @desc   Change password (requires current password)
 * @access Private
 */
router.patch('/me/password', changePasswordRules, validate, changePassword);

/**
 * @route  GET /api/users/:id
 * @desc   Get any user's public profile
 * @access Private
 */
router.get('/:id', getUserById);

module.exports = router;