// Global error handler — must have exactly 4 params for Express to treat it as an error handler
const logger = require("../utils/logger"); // Import Winston logger
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code was set on the error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  // Log the full error in development so you can debug easily
  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:", err);
  }
 // Log the full error stack to the log files via Winston
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);
  // Respond with EJS error page or JSON depending on request type
  if (req.accepts("html")) {
    return res.status(statusCode).render("error", {
      message,
      statusCode
    });
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = { errorHandler };