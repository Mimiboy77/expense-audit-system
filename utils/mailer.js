const nodemailer = require("nodemailer");
const logger = require("./logger");

// Uses service:'gmail' exactly like your working project
// This lets Nodemailer handle all Gmail config internally
// and avoids the IPv6 ENETUNREACH error completely
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,   // Your Gmail address
    pass: process.env.GMAIL_PASS    // Your 16 character App Password
  }
});

// Verify connection when server starts
transporter.verify((error, success) => {
  if (error) {
    logger.error(`Mailer connection failed: ${error.message}`);
  } else {
    logger.info("Mailer is ready — Gmail connected successfully");
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
    const info = await transporter.sendMail({
      from: `"ExpenseAudit System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html
    });

    logger.info(`Email sent to ${to} — MessageID: ${info.messageId}`);
  } catch (error) {
    // Log failure but never crash the app
    logger.error(`Failed to send email to ${to} — ${error.message}`);
  }
};

module.exports = { sendMail };
