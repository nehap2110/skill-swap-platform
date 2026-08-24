const nodemailer = require('nodemailer');
const env        = require('./env');

let _transport = null;

async function getTransport() {
  if (_transport) return _transport;

  // If real SMTP credentials are provided, use them
  if (env.EMAIL_USER && env.EMAIL_PASS) {
    _transport = nodemailer.createTransport({
      host:   env.EMAIL_HOST,
      port:   env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
    return _transport;
  }

  // Dev fallback: Ethereal auto-account (no config needed)
  const testAccount = await nodemailer.createTestAccount();
  console.log('📧  Ethereal test account created:');
  console.log('    User:', testAccount.user);
  console.log('    Pass:', testAccount.pass);

  _transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return _transport;
}

/**
 * Send an email. Returns the Nodemailer info object.
 * In dev, logs the Ethereal preview URL.
 */
async function sendEmail({ to, subject, html, text }) {
  const transport = await getTransport();
  const info = await transport.sendMail({
    from:    env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });

  if (env.isDev) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log(`📧  Email preview: ${preview}`);
    }
  }

  return info;
}

/**
 * One-time, non-blocking SMTP sanity check — call this once at server
 * startup (see server.js). Never throws: logs a clear, specific reason
 * (auth failure, connection refused, etc. — via Nodemailer's own `code`)
 * without ever printing the SMTP password, and never blocks server boot,
 * since a transient SMTP outage shouldn't take the whole API down.
 */
async function verifyEmailConfig() {
  try {
    const transport = await getTransport();
    await transport.verify();
    console.log('📧  SMTP transporter verified — ready to send email.');
  } catch (err) {
    console.error(
      `📧  SMTP transporter verification failed (${err.code || 'UNKNOWN'}): ${err.message}`
    );
  }
}

module.exports = { sendEmail, verifyEmailConfig };