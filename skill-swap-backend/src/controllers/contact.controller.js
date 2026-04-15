const Contact = require('../models/Contact');
const {sendEmail} = require('../config/email');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const sendContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // validation
    if (!name || !email || !subject || !message) {
      return sendError(res, {
        statusCode: 400,
        message: 'All fields are required',
      });
    }

    // save to DB
    await Contact.create({ name, email, subject, message });

    // email content
    const html = `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Message:</b> ${message}</p>
    `;

    // send email to admin
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `Contact: ${subject}`,
      html,
    });

    return sendSuccess(res, {
      message: 'Message sent successfully',
    });

  } catch (err) {
    console.error(err);
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to send message',
    });
  }
};

module.exports = { sendContact };