const nodemailer = require("nodemailer");
const logger = require("./logger");

// Mailtrap SMTP transporter for development email testing
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,       // sandbox.smtp.mailtrap.io
  port: process.env.EMAIL_PORT,       // 2525
  auth: {
    user: process.env.EMAIL_USER,     // Mailtrap username
    pass: process.env.EMAIL_PASS      // Mailtrap password
  }
});

// Verify connection when server starts
// You will see "Mailer is ready" in terminal if credentials are correct
transporter.verify((error, success) => {
  if (error) {
    logger.error(`Mailer connection failed: ${error.message}`);
  } else {
    logger.info("Mailer is ready to send emails");
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