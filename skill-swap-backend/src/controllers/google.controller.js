// src/controllers/google.controller.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { sendSuccess } = require('../utils/apiResponse');
const {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
} = require('../config/googleClient');

// Short-lived signed state token so the OAuth redirect (a plain browser
// navigation, not an authenticated fetch) can tell us which user initiated it.
const signState = (userId) =>
  jwt.sign({ uid: userId.toString() }, env.JWT_ACCESS_SECRET, { expiresIn: '10m' });

const verifyState = (state) => jwt.verify(state, env.JWT_ACCESS_SECRET).uid;

// ─── GET /api/google/auth-url — where to send the browser to connect ─────────
const getAuthUrl = async (req, res, next) => {
  try {
    const state = signState(req.user._id);
    const url = getGoogleAuthUrl(state);
    return sendSuccess(res, { data: { url } });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/google/callback — Google redirects here after consent ──────────
const oauthCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    const redirectBase = `${env.CLIENT_URL}/swaps`;

    if (error) {
      return res.redirect(`${redirectBase}?google=denied`);
    }
    if (!code || !state) {
      return res.redirect(`${redirectBase}?google=error`);
    }

    let userId;
    try {
      userId = verifyState(state);
    } catch {
      return res.redirect(`${redirectBase}?google=expired`);
    }

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google only returns a refresh_token the FIRST time a user consents
      // (or when prompt=consent forces it). If it's missing here, something
      // upstream (e.g. an already-granted app) swallowed it.
      return res.redirect(`${redirectBase}?google=no_refresh_token`);
    }

    await User.findByIdAndUpdate(userId, {
      google: {
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate:   tokens.expiry_date,
        connectedAt:  new Date(),
      },
    });

    return res.redirect(`${redirectBase}?google=connected`);
  } catch (err) {

    //temporary
    console.error('❌ GOOGLE CALLBACK ERROR');
  console.error('message:', err.message);
  console.error('code:', err.code);
  console.error('status:', err.status);
  console.error('statusCode:', err.statusCode);
  console.error('response:', err.response?.data);
  console.error('stack:', err.stack);


    next(err);
  }
};

// ─── GET /api/google/status — is Google Meet connected? ──────────────────────────
const getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+google.refreshToken +google.email');
    return sendSuccess(res, {
      data: { connected: !!user?.google?.refreshToken, email: user?.google?.email || null },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/google — disconnect Google account ─────────────────────────────────
const disconnect = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { google: 1 } });
    return sendSuccess(res, { message: 'Google account disconnected.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuthUrl, oauthCallback, getStatus, disconnect };