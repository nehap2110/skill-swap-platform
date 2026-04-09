// src/models/Review.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

// ─── Schema ───────────────────────────────────────────────────────────────────
const reviewSchema = new Schema(
  {
    // ── Relationships ─────────────────────────────────────────────────────────
    swap: {
      type: Schema.Types.ObjectId,
      ref: 'SwapRequest',
      required: [true, 'Swap reference is required'],
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee is required'],
    },

    // ── Content ───────────────────────────────────────────────────────────────
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      // Enforce integer-only ratings at the schema level
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number between 1 and 5',
      },
    },
    comment: {
      type: String,
      maxlength: [600, 'Comment cannot exceed 600 characters'],
      trim: true,
      default: '',
    },

    // ── Soft-edit window ──────────────────────────────────────────────────────
    // Allow the reviewer to edit their comment within 24 hours of posting.
    editedAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary duplicate guard: one reviewer per swap
// (compound unique enforced at DB level — belt-and-suspenders on top of controller logic)
reviewSchema.index(
  { swap: 1, reviewer: 1 },
  { unique: true, name: 'one_review_per_reviewer_per_swap' }
);

reviewSchema.index({ reviewee: 1, createdAt: -1 }); // user profile review feed
reviewSchema.index({ reviewer: 1 });                 // "reviews I've written"

// ─── Post-save: update reviewee's aggregate rating ───────────────────────────
// Fires after every new Review document is inserted.
reviewSchema.post('save', async function (doc) {
  try {
    const User = mongoose.model('User');
    await User.recalculateRating(doc.reviewee);
  } catch (err) {
    // Log but don't crash — rating recalculation is non-critical path
    console.error('Failed to recalculate rating after review save:', err.message);
  }
});

// ─── Post-delete: recalculate rating if a review is removed ──────────────────
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    const User = mongoose.model('User');
    await User.recalculateRating(doc.reviewee);
  } catch (err) {
    console.error('Failed to recalculate rating after review delete:', err.message);
  }
});

// ─── Virtual: whether the edit window is still open (24 h) ───────────────────
reviewSchema.virtual('canEdit').get(function () {
  const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
  return Date.now() - this.createdAt.getTime() < EDIT_WINDOW_MS;
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;