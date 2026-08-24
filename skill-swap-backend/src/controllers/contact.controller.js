const Contact = require('../models/Contact');
const { sendEmail } = require('../config/email');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const env = require('../config/env');

// Minimal HTML-escaping for values interpolated into the admin notification
// email — these come straight from a public, unauthenticated form.
const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sendContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // validation
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return sendError(res, {
        statusCode: 400,
        message: 'All fields are required',
      });
    }

    // Bug fix: this endpoint had no recipient address — it read
    // process.env.EMAIL_USER directly, which is undefined unless EMAIL_USER
    // happens to already be set (bypassing env.js's validated config, and
    // with no fallback). Nodemailer's SMTP layer throws
    // "EENVELOPE: No recipients defined" the moment `to` is empty, which is
    // why the contact form was failing to send. CONTACT_EMAIL_TO (with a
    // sensible fallback chain) fixes this without renaming EMAIL_USER.
    const recipient = env.CONTACT_EMAIL_TO || env.EMAIL_USER || 'hello@skillswap.io';

    // save to DB first — so the message is never lost even if the email
    // notification below fails (e.g. transient SMTP issue)
    await Contact.create({ name, email, subject, message });

    // email content
    const html = `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Subject:</b> ${escapeHtml(subject)}</p>
      <p><b>Message:</b> ${escapeHtml(message)}</p>
    `;

    // send email to admin
    await sendEmail({
      to: recipient,
      subject: `Contact: ${subject}`,
      html,
    });

    return sendSuccess(res, {
      message: 'Message sent successfully',
    });

  } catch (err) {
    // Log the real cause (auth failure, connection refused, missing
    // recipient, etc.) without ever printing SMTP credentials.
    console.error(`Contact email send error (${err.code || 'UNKNOWN'}):`, err.message);
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to send message. Please try again later.',
    });
  }
};

module.exports = { sendContact };