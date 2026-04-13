// src/controllers/user.controller.js
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

// ─── GET /api/users/:id — public profile ─────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('skillsOffered', 'title category level tags')
      .populate('skillsWanted',  'title category level tags');

    if (!user || !user.isActive) {
      return next(new AppError('User not found.', 404));
    }

    return sendSuccess(res, { data: user.publicProfile });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/users/me — update own profile ───────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    // Fields the user is allowed to update via this endpoint
   // const ALLOWED = ['name', 'bio', 'location', 'avatar', 'socialLinks'];
   const ALLOWED = [
  'name',
  'bio',
  'location',
  'avatar',
  'socialLinks',
  'skillsOffered',
  'skillsWanted'
];
    const updates = {};
    ALLOWED.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('skillsOffered', 'title category level')
      .populate('skillsWanted',  'title category level');

    return sendSuccess(res, { message: 'Profile updated.', data: user.publicProfile });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/users/me/password — change password ──────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password +refreshTokens');
    if (!user) return next(new AppError('User not found.', 404));

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    user.password = newPassword; // pre-save hook hashes it + clears refresh tokens
    await user.save();

    return sendSuccess(res, { message: 'Password changed. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/users/me — soft-delete account ───────────────────────────────
const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      refreshTokens: [],
      email: `deleted_${req.user._id}@removed.local`, // free the email for re-registration
    });

    res.clearCookie('refreshToken', { path: '/api/auth' });
    return sendSuccess(res, { message: 'Account deactivated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/users/matches — skill-matched users ────────────────────────────
/**
 * Basic matching algorithm:
 *   Find users whose skillsOffered intersect with the current user's skillsWanted
 *   AND whose skillsWanted intersect with the current user's skillsOffered.
 *   Sorted by rating descending, paginated.
 */
const getMatches = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me) return next(new AppError('User not found.', 404));

    if (!me.skillsOffered.length && !me.skillsWanted.length) {
      return sendSuccess(res, {
        message: 'Add skills to your profile to see matches.',
        data: { matches: [], total: 0 },
      });
    }

    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
    const skip  = (page - 1) * limit;

    const query = {
      _id:      { $ne: me._id },
      isActive: true,
    };

    // At least one of the two directions must match
    const conditions = [];
    if (me.skillsWanted.length) {
      conditions.push({ skillsOffered: { $in: me.skillsWanted } });
    }
    if (me.skillsOffered.length) {
      conditions.push({ skillsWanted: { $in: me.skillsOffered } });
    }
    if (conditions.length) query.$or = conditions;

    const [matches, total] = await Promise.all([
      User.find(query)
        .populate('skillsOffered', 'name title category level')
        .populate('skillsWanted',  'name title category level')
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(limit)
        .select('-refreshTokens -password'),
      User.countDocuments(query),
    ]);

    return sendSuccess(res, {
      data: {
        matches: matches.map((u) => u.publicProfile),
//         matches: matches.map((u) => {
//   const theyOffer = u.skillsOffered.filter(skill =>
//     me.skillsWanted.includes(skill._id.toString())
//   )

//   const theyWant = u.skillsWanted.filter(skill =>
//     me.skillsOffered.includes(skill._id.toString())
//   )

//   return {
//     user: u.publicProfile,
//     matchedSkills: {
//       theyOffer,
//       theyWant
//     }
//   }
// }),
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

module.exports = { getUserById, updateMe, changePassword, deleteMe, getMatches };