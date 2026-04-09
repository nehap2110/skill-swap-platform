// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

// ─── Sub-schema: social links ────────────────────────────────────────────────
const socialLinksSchema = new Schema(
  {
    linkedin: { type: String, default: '' },
    github:   { type: String, default: '' },
    website:  { type: String, default: '' },
  },
  { _id: false }
);

// ─── Main User schema ────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    // ── Skills ────────────────────────────────────────────────────────────────
    skillsOffered: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    skillsWanted: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],

    // ── Reputation ────────────────────────────────────────────────────────────
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },

    // ── Auth / status ─────────────────────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokens: {
      // Stores hashed refresh tokens to support multi-device login + revocation
      type: [String],
      select: false,
      default: [],
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
//userSchema.index({ email: 1 });
userSchema.index({ skillsOffered: 1 });
userSchema.index({ skillsWanted: 1 });
userSchema.index({ location: 1 });
userSchema.index({ rating: -1 });

// ─── Virtual: public profile ──────────────────────────────────────────────────
// Returns only the fields safe to expose in API responses
userSchema.virtual('publicProfile').get(function () {
  return {
    id:            this._id,
    name:          this.name,
    email:         this.email,
    avatar:        this.avatar,
    bio:           this.bio,
    location:      this.location,
    socialLinks:   this.socialLinks,
    skillsOffered: this.skillsOffered,
    skillsWanted:  this.skillsWanted,
    rating:        this.rating,
    reviewCount:   this.reviewCount,
    isVerified:    this.isVerified,
    createdAt:     this.createdAt,
  };
});

// ─── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function () {
  // Only re-hash when password field was actually modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Invalidate all refresh tokens on password change (security hygiene)
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
    this.refreshTokens = [];
  }

  //next();
});

// ─── Instance method: compare password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  // `this.password` is normally not selected; caller must explicitly select it
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: check if password changed after a JWT was issued ────────
userSchema.methods.passwordChangedAfter = function (jwtIssuedAt) {
  if (!this.passwordChangedAt) return false;
  // jwtIssuedAt is in seconds (JWT standard); convert to ms
  return this.passwordChangedAt.getTime() > jwtIssuedAt * 1000;
};

// ─── Static: update rating after a new review ────────────────────────────────
userSchema.statics.recalculateRating = async function (userId) {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (result.length === 0) return;

  await this.findByIdAndUpdate(userId, {
    rating:      parseFloat(result[0].avgRating.toFixed(2)),
    reviewCount: result[0].count,
  });
};

const User = mongoose.model('User', userSchema);
module.exports = User;