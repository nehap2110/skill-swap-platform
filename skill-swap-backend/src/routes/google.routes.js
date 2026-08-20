// src/routes/google.routes.js
const { Router } = require('express');
const { getAuthUrl, oauthCallback, getStatus, disconnect } = require('../controllers/google.controller');
const { protect } = require('../middleware/auth.middleware');

const router = Router();

/**
 * @route  GET /api/google/auth-url
 * @desc   Returns the Google consent-screen URL for the current user to visit
 * @access Private
 */
router.get('/auth-url', protect, getAuthUrl);

/**
 * @route  GET /api/google/callback
 * @desc   Google redirects the browser here after consent (public — the
 *         signed `state` param, not a header, identifies the user)
 * @access Public
 */
router.get('/callback', oauthCallback);

/**
 * @route  GET /api/google/status
 * @desc   Whether the current user has a connected Google account
 * @access Private
 */
router.get('/status', protect, getStatus);

/**
 * @route  DELETE /api/google
 * @desc   Disconnect the current user's Google account
 * @access Private
 */
router.delete('/', protect, disconnect);

module.exports = router;