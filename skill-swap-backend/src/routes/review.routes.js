// src/routes/review.routes.js
// const { Router } = require('express');
// const rateLimit = require('express-rate-limit');

// const {
//   createReview,
//   getUserReviews,
//   getMyReviews,
//   getReviewById,
//   editReview,
//   deleteReview,
// } = require('../controllers/review.controller');

// const { protect, optionalAuth } = require('../middleware/auth.middleware');
// const {
//   validate,
//   createReviewRules,
//   editReviewRules,
//   listUserReviewsRules,
// } = require('../middleware/validate');

// const router = Router();

// // Prevent review spam (max 30 reviews per hour per user)
// const reviewLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 30,
//  // keyGenerator: (req) => req.user?._id?.toString() || req.ip,
//   message: { success: false, message: 'Too many reviews submitted. Please try again later.' },
// });

// // ─── Authenticated routes ─────────────────────────────────────────────────────

// /**
//  * @route  POST /api/reviews
//  * @desc   Submit a review for a completed swap
//  * @access Private
//  * @body   { swapId, rating, comment? }
//  */
// router.post('/', protect, reviewLimiter, createReviewRules, validate, createReview);

// /**
//  * @route  GET /api/reviews/me
//  * @desc   Reviews written by the current user
//  * @access Private
//  * @query  page, limit
//  */
// router.get('/me', protect, getMyReviews);

// /**
//  * @route  PATCH /api/reviews/:id
//  * @desc   Edit a review within 24 hours of posting
//  * @access Private (reviewer only)
//  * @body   { rating?, comment? }
//  */
// router.patch('/:id', protect, editReviewRules, validate, editReview);

// /**
//  * @route  DELETE /api/reviews/:id
//  * @desc   Delete a review (reviewer only)
//  * @access Private
//  */
// router.delete('/:id', protect, deleteReview);

// // ─── Public / optional-auth routes ───────────────────────────────────────────

// /**
//  * @route  GET /api/reviews/user/:userId
//  * @desc   All reviews for a given user (public profile feed)
//  * @access Public
//  * @query  minRating, page, limit
//  */
// router.get('/user/:userId', optionalAuth, listUserReviewsRules, validate, getUserReviews);

// /**
//  * @route  GET /api/reviews/:id
//  * @desc   Single review by ID
//  * @access Public
//  */
// router.get('/:id', optionalAuth, getReviewById);

// module.exports = router;




//add a new review route by me


// src/routes/review.routes.js
const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const {
  createReview,
  getUserReviews,
  getMyReviews,
  getReviewById,
  editReview,
  deleteReview,
} = require('../controllers/review.controller');

const { protect, optionalAuth } = require('../middleware/auth.middleware');
const {
  validate,
  createReviewRules,
  editReviewRules,
  listUserReviewsRules,
} = require('../middleware/validate');

const router = Router();

// Prevent review spam (max 30 reviews per hour per user)
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
 // keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Too many reviews submitted. Please try again later.' },
});

// ─── Authenticated routes ─────────────────────────────────────────────────────

/**
 * @route  POST /api/reviews
 * @desc   Submit a review for a completed swap
 * @access Private
 * @body   { swapId, rating, comment? }
 */
router.post('/', protect, reviewLimiter, createReviewRules, validate, createReview);

/**
 * @route  GET /api/reviews/me
 * @desc   Reviews written by the current user
 * @access Private
 * @query  page, limit
 */
router.get('/me', protect, getMyReviews);

/**
 * @route  PATCH /api/reviews/:id
 * @desc   Edit a review within 24 hours of posting
 * @access Private (reviewer only)
 * @body   { rating?, comment? }
 */
router.patch('/:id', protect, editReviewRules, validate, editReview);

/**
 * @route  DELETE /api/reviews/:id
 * @desc   Delete a review (reviewer only)
 * @access Private
 */
router.delete('/:id', protect, deleteReview);

// ─── Public / optional-auth routes ───────────────────────────────────────────

/**
 * @route  GET /api/reviews/user/:userId
 * @desc   All reviews for a given user (public profile feed)
 * @access Public
 * @query  minRating, page, limit
 */
router.get('/user/:userId', optionalAuth, listUserReviewsRules, validate, getUserReviews);


/**
 * @route  GET /api/reviews/:id
 * @desc   Single review by ID
 * @access Public
 */
router.get('/:id', optionalAuth, getReviewById);

module.exports = router;