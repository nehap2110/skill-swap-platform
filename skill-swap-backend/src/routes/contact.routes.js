const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { sendContact } = require('../controllers/contact.controller');
const { validate, contactRules } = require('../middleware/validate');

const router = Router();

// Prevent contact-form spam / duplicate email sends from the same client.
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', contactLimiter, contactRules, validate, sendContact);

module.exports = router;