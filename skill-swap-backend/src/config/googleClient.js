
const { OAuth2Client } = require('google-auth-library');
const env = require('./env');

// Only scope required for Meet's spaces.create: lets the app create/manage
// Meet spaces it created on the user's behalf. No Calendar scope needed.
const SCOPES = [
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/userinfo.email',
];

/** Build a fresh OAuth2 client (stateless — safe to call per-request). */
const buildOAuthClient = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      'Google OAuth is not configured. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI.'
    );
  }
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
};

/** URL that sends the user to Google's consent screen. `state` round-trips our userId. */
const getGoogleAuthUrl = (state) => {
  const client = buildOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',   // required to get a refresh_token
    prompt: 'consent',        // force refresh_token on every re-connect too
    scope: SCOPES,
    state,
  });
};

/** Exchange the ?code=... from the OAuth redirect for tokens. */
const exchangeCodeForTokens = async (code) => {
  const client = buildOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens; // { access_token, refresh_token, expiry_date, ... }
};

/**
 * Build an authenticated OAuth2 client for a specific user's stored tokens.
 * Attaches a listener so that if the OAuth client silently refreshes the access
 * token mid-request, we persist the new one back onto the user document.
 */
const getAuthorizedClientForUser = (user) => {
  if (!user?.google?.refreshToken) {
    const err = new Error('Google account not connected.');
    err.statusCode = 428; // Precondition Required
    err.code = 'GOOGLE_NOT_CONNECTED';
    throw err;
  }

  const client = buildOAuthClient();
  client.setCredentials({
    refresh_token: user.google.refreshToken,
    access_token: user.google.accessToken || undefined,
    expiry_date: user.google.expiryDate || undefined,
  });

  client.on('tokens', async (tokens) => {
    const update = {};
    if (tokens.access_token) update['google.accessToken'] = tokens.access_token;
    if (tokens.expiry_date) update['google.expiryDate'] = tokens.expiry_date;
    if (tokens.refresh_token) update['google.refreshToken'] = tokens.refresh_token;
    if (Object.keys(update).length) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(user._id, update).catch(() => {});
    }
  });

  return client;
};

module.exports = {
  SCOPES,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getAuthorizedClientForUser,
};