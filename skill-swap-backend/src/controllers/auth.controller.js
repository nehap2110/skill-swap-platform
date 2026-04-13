// src/controllers/auth.controller.js
const crypto = require('crypto');
const User   = require('../models/User');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} = require('../utils/generateToken');
const { AppError }          = require('../middleware/errorHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendEmail }         = require('../config/email');
const env                   = require('../config/env');
require('dotenv').config();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const issueTokens = async (user, res, statusCode = 200, message = 'Success') => {
  const accessToken  = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const tokens = [...(user.refreshTokens || []), hashedRefresh].slice(-5);
  await User.findByIdAndUpdate(user._id, { refreshTokens: tokens });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());

  return sendSuccess(res, {
    statusCode,
    message,
    data: { accessToken, user: user.publicProfile },
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'Email is already registered.' });
    }
    const user = await User.create({ name, email, password });
    return issueTokens(user, res, 201, 'Account created successfully.');
  } catch (err) { next(err); }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user || !user.isActive) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }
    return issueTokens(user, res, 200, 'Logged in successfully.');
  } catch (err) { next(err); }
};

// ─── Refresh ──────────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return sendError(res, { statusCode: 401, message: 'No refresh token provided.' });

    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { return sendError(res, { statusCode: 401, message: 'Invalid or expired refresh token.' }); }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findById(decoded.sub).select('+refreshTokens');
    if (!user || !user.isActive || !user.refreshTokens.includes(hashedToken)) {
      if (user) await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
      return sendError(res, { statusCode: 401, message: 'Refresh token has been revoked.' });
    }

    const updatedTokens = user.refreshTokens.filter(t => t !== hashedToken);
    user.refreshTokens = updatedTokens;
    return issueTokens(user, res, 200, 'Token refreshed.');
  } catch (err) { next(err); }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: hashedToken } });
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return sendSuccess(res, { message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

// ─── Logout all ───────────────────────────────────────────────────────────────
const logoutAll = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshTokens: [] });
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return sendSuccess(res, { message: 'Logged out from all devices.' });
  } catch (err) { next(err); }
};

// ─── Get me ───────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('skillsOffered', 'title category level name')
      .populate('skillsWanted',  'title category level name');
    if (!user) return next(new AppError('User not found.', 404));
    return sendSuccess(res, { data: user.publicProfile });
  } catch (err) { next(err); }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return sendError(res, { statusCode: 400, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond with success to prevent user enumeration
    const successResponse = () => sendSuccess(res, {
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

    if (!user || !user.isActive) return successResponse();

    // Generate raw token (sent in URL) + hashed version (stored in DB)
    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(
      Date.now() + env.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000
    );
    await user.save({ validateBeforeSave: false });

    // Build reset URL pointing to frontend
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    const expiresIn = `${env.RESET_TOKEN_EXPIRES_MINUTES} minutes`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Outfit', Arial, sans-serif; background: #f4f4f6; margin: 0; padding: 0;">
        <div style="max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08);">
          <div style="background: #16a579; padding: 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">SkillSwap</h1>
            <p style="color: rgba(255,255,255,.85); margin: 6px 0 0; font-size: 14px;">Password Reset Request</p>
          </div>
          <div style="padding: 40px 32px;">
            <p style="color: #0f1117; font-size: 16px; margin: 0 0 16px;">Hi ${user.name},</p>
            <p style="color: #484b6e; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Someone requested a password reset for your SkillSwap account.
              If this was you, click the button below. The link expires in <strong>${expiresIn}</strong>.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #16a579; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Reset My Password
              </a>
            </div>
            <p style="color: #9a9cb2; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
              If you didn't request this, you can safely ignore this email — your password won't change.<br/>
              This link will expire at ${user.passwordResetExpires.toUTCString()}.
            </p>
            <hr style="border: none; border-top: 1px solid #e8e9ee; margin: 24px 0;"/>
            <p style="color: #9a9cb2; font-size: 11px; margin: 0;">
              If the button doesn't work, copy and paste this URL into your browser:<br/>
              <span style="color: #16a579; word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({ to: user.email, subject: 'SkillSwap — Reset your password', html });
    } catch (emailErr) {
      // Roll back token if email fails so user can retry
      user.passwordResetToken   = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send error:', emailErr.message);
      return sendError(res, {
        statusCode: 500,
        message: 'Failed to send reset email. Please try again later.',
      });
    }

    return successResponse();
  } catch (err) { next(err); }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return sendError(res, { statusCode: 400, message: 'Reset token is required.' });
    }

    if (!password || password.length < 8) {
      return sendError(res, {
        statusCode: 400,
        message: 'Password must be at least 8 characters.',
      });
    }

    if (password !== confirmPassword) {
      return sendError(res, { statusCode: 400, message: 'Passwords do not match.' });
    }

    // Hash the raw token from URL to compare against stored hash
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password +refreshTokens');

    if (!user) {
      return sendError(res, {
        statusCode: 400,
        message: 'Reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Validate password strength
    if (!/[A-Z]/.test(password)) {
      return sendError(res, {
        statusCode: 400,
        message: 'Password must contain at least one uppercase letter.',
      });
    }
    if (!/[0-9]/.test(password)) {
      return sendError(res, {
        statusCode: 400,
        message: 'Password must contain at least one number.',
      });
    }

    // Update password (pre-save hook hashes it + clears refresh tokens)
    user.password             = password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send confirmation email (non-critical)
    sendEmail({
      to:      user.email,
      subject: 'SkillSwap — Your password has been changed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 32px; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08);">
          <h2 style="color: #16a579;">Password changed ✓</h2>
          <p style="color: #484b6e;">Hi ${user.name}, your SkillSwap password was successfully updated.</p>
          <p style="color: #9a9cb2; font-size: 13px;">If you didn't do this, please contact us immediately.</p>
        </div>
      `,
    }).catch(() => {});   // fire and forget

    return sendSuccess(res, {
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) { next(err); }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  forgotPassword,
  resetPassword,
};