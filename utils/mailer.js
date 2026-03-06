const nodemailer = require("nodemailer");
const logger = require("./logger");
const dns = require("dns");

// Force Node.js to resolve DNS using IPv4 only
// This prevents the ENETUNREACH IPv6 error on Windows
dns.setDefaultResultOrder("ipv4first");

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: false,
  family: 4,                    // Force IPv4 connection
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,     // 15 seconds to connect
  greetingTimeout: 15000,       // 15 seconds for greeting
  socketTimeout: 20000          // 20 seconds for socket
});

// Verify connection when server starts
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
    logger.error(`Failed to send email to ${to} — ${error.message}`);
  }
};

module.exports = { sendMail };
