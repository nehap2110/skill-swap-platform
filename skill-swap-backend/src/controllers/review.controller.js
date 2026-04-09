// src/controllers/review.controller.js
const mongoose = require('mongoose');
const Review = require('../models/Review');
const { SwapRequest, SWAP_STATUS } = require('../models/SwapRequest');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Standard populate applied to every Review query. */
const withDetails = (query) =>
  query
    .populate('reviewer', 'name avatar')
    .populate('reviewee', 'name avatar')
    .populate('swap',     'offeredSkill wantedSkill completedAt');

// ─── POST /api/reviews — create a review ─────────────────────────────────────
const createReview = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reviewerId = req.user._id;
    const { swapId, rating, comment } = req.body;

    // ── Guard 1: swap must exist ──────────────────────────────────────────────
    const swap = await SwapRequest.findById(swapId).session(session);
    if (!swap) {
      await session.abortTransaction();
      return next(new AppError('Swap request not found.', 404));
    }

    // ── Guard 2: swap must be completed ──────────────────────────────────────
    if (swap.status !== SWAP_STATUS.COMPLETED) {
      await session.abortTransaction();
      return sendError(res, {
        statusCode: 400,
        message: `Reviews can only be submitted for completed swaps. This swap is '${swap.status}'.`,
      });
    }

    // ── Guard 3: reviewer must be a party to the swap ─────────────────────────
    const isSender   = swap.sender.toString()   === reviewerId.toString();
    const isReceiver = swap.receiver.toString() === reviewerId.toString();

    if (!isSender && !isReceiver) {
      await session.abortTransaction();
      return next(new AppError('You are not a party to this swap.', 403));
    }

    // ── Guard 4: reviewer has not already reviewed this swap ──────────────────
    // Determine which flag to check based on the reviewer's role in the swap
    const alreadyReviewed = isSender ? swap.senderReviewed : swap.receiverReviewed;
    if (alreadyReviewed) {
      await session.abortTransaction();
      return sendError(res, {
        statusCode: 409,
        message: 'You have already submitted a review for this swap.',
      });
    }

    // Reviewee is the other party
    const revieweeId = isSender ? swap.receiver : swap.sender;

    // ── Create the review ─────────────────────────────────────────────────────
    const [review] = await Review.create(
      [{ swap: swapId, reviewer: reviewerId, reviewee: revieweeId, rating, comment: comment || '' }],
      { session }
    );

    // ── Mark the swap so the same party cannot review again ───────────────────
    const swapUpdate = isSender
      ? { senderReviewed: true }
      : { receiverReviewed: true };

    await SwapRequest.findByIdAndUpdate(swapId, swapUpdate, { session });

    await session.commitTransaction();

    // ── Trigger rating recalculation (outside transaction — non-critical) ──────
    // The post('save') hook fires after commitTransaction; this is a belt-and-
    // suspenders call in case the hook doesn't fire in all Mongoose versions.
    try {
      await User.recalculateRating(revieweeId);
    } catch (ratingErr) {
      console.error('Rating recalculation warning:', ratingErr.message);
    }

    const populated = await withDetails(Review.findById(review._id));

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Review submitted successfully.',
      data: { review: populated },
    });
  } catch (err) {
    await session.abortTransaction();

    // Mongoose unique index violation (belt-and-suspenders for the race condition)
    if (err.code === 11000) {
      return sendError(res, {
        statusCode: 409,
        message: 'You have already submitted a review for this swap.',
      });
    }

    next(err);
  } finally {
    session.endSession();
  }
};

// ─── GET /api/reviews/user/:userId — paginated reviews for a user ─────────────
const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
    const skip  = (page - 1) * limit;

    // Confirm target user exists
    const user = await User.findById(userId).select('name avatar rating reviewCount');
    if (!user || !user.isActive) return next(new AppError('User not found.', 404));

    const filter = { reviewee: userId };

    // Optional rating filter (e.g. ?minRating=4)
    if (req.query.minRating) {
      const min = parseInt(req.query.minRating, 10);
      if (min >= 1 && min <= 5) filter.rating = { $gte: min };
    }

    const [reviews, total, ratingBreakdown] = await Promise.all([
      withDetails(
        Review.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),

      Review.countDocuments(filter),

      // Star distribution for the profile rating widget
      Review.aggregate([
        { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    // Shape breakdown into { 5: N, 4: N, 3: N, 2: N, 1: N }
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingBreakdown.forEach(({ _id, count }) => { breakdown[_id] = count; });

    return sendSuccess(res, {
      data: {
        user: {
          id:          user._id,
          name:        user.name,
          avatar:      user.avatar,
          rating:      user.rating,
          reviewCount: user.reviewCount,
        },
        breakdown,
        reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/me — reviews written by the current user ────────────────
const getMyReviews = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
    const skip  = (page - 1) * limit;

    const filter = { reviewer: req.user._id };

    const [reviews, total] = await Promise.all([
      withDetails(Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
      Review.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: {
        reviews,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/:id — single review ────────────────────────────────────
const getReviewById = async (req, res, next) => {
  try {
    const review = await withDetails(Review.findById(req.params.id));
    if (!review) return next(new AppError('Review not found.', 404));
    return sendSuccess(res, { data: { review } });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/reviews/:id — edit within 24-hour window ─────────────────────
const editReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found.', 404));

    // Only the original reviewer can edit
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only edit your own reviews.', 403));
    }

    // Enforce 24-hour edit window
    const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - review.createdAt.getTime() > EDIT_WINDOW_MS) {
      return sendError(res, {
        statusCode: 403,
        message: 'The 24-hour edit window for this review has closed.',
      });
    }

    const EDITABLE = ['rating', 'comment'];
    EDITABLE.forEach((field) => {
      if (req.body[field] !== undefined) review[field] = req.body[field];
    });
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save(); // post('save') hook recalculates rating automatically

    const updated = await withDetails(Review.findById(review._id));

    return sendSuccess(res, {
      message: 'Review updated.',
      data: { review: updated },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/reviews/:id — remove a review (reviewer only) ───────────────
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found.', 404));

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only delete your own reviews.', 403));
    }

    const revieweeId = review.reviewee;

    await Review.findByIdAndDelete(review._id);
    // post('findOneAndDelete') hook recalculates rating automatically

    // Also unmark the reviewed flag on the swap so the user could re-review if needed
    const swap = await SwapRequest.findById(review.swap);
    if (swap) {
      const isSender = swap.sender.toString() === req.user._id.toString();
      await SwapRequest.findByIdAndUpdate(
        review.swap,
        isSender ? { senderReviewed: false } : { receiverReviewed: false }
      );
    }

    // Belt-and-suspenders: recalculate even if hook fires
    await User.recalculateRating(revieweeId).catch((e) =>
      console.error('Rating recalc after delete:', e.message)
    );

    return sendSuccess(res, { message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getUserReviews,
  getMyReviews,
  getReviewById,
  editReview,
  deleteReview,
};