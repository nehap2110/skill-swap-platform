// src/routes/swap.routes.js
const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const {
  sendSwapRequest,
  listSwaps,
  getSwapById,
  updateSwapStatus,
  deleteSwapRequest,
  getSwapStats,
} = require('../controllers/swap.controller');

const { protect } = require('../middleware/auth.middleware');
const {
  validate,
  sendSwapRules,
  updateStatusRules,
  listSwapsRules,
} = require('../middleware/validate');

const router = Router();

// All swap routes are protected
router.use(protect);

// Prevent request flooding (e.g. spamming requests to many users)
const sendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many swap requests sent. Please try again later.' },
  keyGenerator: (req) => req.user._id.toString(),
});

/**
 * @route  GET  /api/swaps/stats
 * @desc   Dashboard summary counts per status for current user
 * @access Private
 */
router.get('/stats', getSwapStats);

/**
 * @route  GET  /api/swaps
 * @desc   List swap requests (sent + received) with filters
 * @access Private
 * @query  role (sender|receiver|all), status, page, limit
 */
router.get('/', listSwapsRules, validate, listSwaps);

/**
 * @route  POST /api/swaps
 * @desc   Send a new swap request
 * @access Private
 * @body   { receiverId, offeredSkillId, wantedSkillId, message?, scheduledAt? }
 */
router.post('/', sendLimiter, sendSwapRules, validate, sendSwapRequest);

/**
 * @route  GET /api/swaps/:id
 * @desc   Get a single swap request (only accessible by parties)
 * @access Private
 */
router.get('/:id', getSwapById);

/**
 * @route  PATCH /api/swaps/:id/status
 * @desc   Transition swap status (accept / reject / complete / cancel)
 * @access Private
 * @body   { status, note? }
 */
router.patch('/:id/status', updateStatusRules, validate, updateSwapStatus);

/**
 * @route  DELETE /api/swaps/:id
 * @desc   Hard-delete a pending request (sender only)
 * @access Private
 */
router.delete('/:id', deleteSwapRequest);

module.exports = router;