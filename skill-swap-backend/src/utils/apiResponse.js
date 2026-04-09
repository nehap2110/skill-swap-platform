// src/utils/apiResponse.js
// Every controller uses these helpers so the frontend always sees a
// consistent envelope: { success, message, data? } or { success, message, errors? }

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

const sendError = (res, { statusCode = 500, message = 'Internal server error', errors = null } = {}) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };