const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,          // Force IPv4 — prevents ENETUNREACH on IPv6
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  // Increase timeout so slow connections do not fail
  connectionTimeout: 10000,   // 10 seconds to connect
  greetingTimeout: 10000,     // 10 seconds for greeting
  socketTimeout: 15000        // 15 seconds for socket
});

// Verify connection on server start
transporter.verify((error, success) => {
  if (error) {
    // Log but do not crash the server over email config
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
    // Log failure but never throw — email must never crash the app
    logger.error(`Failed to send email to ${to} — ${error.message}`);
  }
};

module.exports = { sendMail };