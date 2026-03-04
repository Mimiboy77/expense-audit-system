const nodemailer = require("nodemailer");
const logger = require("./logger");

// Gmail SMTP transporter using App Password
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,  // false for port 587 — uses STARTTLS
  auth: {
    user: process.env.EMAIL_USER,   // Your Gmail address
    pass: process.env.EMAIL_PASS    // Your 16 character App Password
  },
  tls: {
    rejectUnauthorized: false       // Prevents TLS errors in development
  }
});

// Verify connection on server start
// Terminal will confirm if Gmail accepted the credentials
transporter.verify((error, success) => {
  if (error) {
    logger.error(`Mailer connection failed: ${error.message}`);
  } else {
    logger.info("Mailer is ready — Gmail SMTP connected successfully");
  }
});

/**
 * Sends an email notification
 * @param {string} to - recipient email address
 * @param {string} subject - email subject line
 * @param {string} html - HTML body content
 */
const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"ExpenseAudit System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    logger.info(`Email sent to ${to} — Subject: ${subject}`);
  } catch (error) {
    // Log failure but never crash the app over an email
    logger.error(`Failed to send email to ${to} — ${error.message}`);
  }
};

module.exports = { sendMail };