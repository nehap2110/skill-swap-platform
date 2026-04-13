// src/config/env.js
const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const optional = (key, fallback = '') => process.env[key] || fallback;

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  MONGO_URI: required('MONGO_URI'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  CLIENT_URL: optional('CLIENT_URL', 'http://localhost:3000'),

  // Email — Nodemailer (Gmail SMTP or Ethereal for dev)
  EMAIL_HOST:     optional('EMAIL_HOST', 'smtp.ethereal.email'),
  EMAIL_PORT:     parseInt(optional('EMAIL_PORT', '587'), 10),
  EMAIL_SECURE:   optional('EMAIL_SECURE', 'false') === 'true',
  EMAIL_USER:     optional('EMAIL_USER', ''),
  EMAIL_PASS:     optional('EMAIL_PASS', ''),
  EMAIL_FROM:     optional('EMAIL_FROM', '"SkillSwap" <noreply@skillswap.io>'),

  // Password reset
  RESET_TOKEN_EXPIRES_MINUTES: parseInt(optional('RESET_TOKEN_EXPIRES_MINUTES', '15'), 10),

  isDev:  (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

module.exports = env;