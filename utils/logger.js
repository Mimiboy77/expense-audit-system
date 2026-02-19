const { createLogger, format, transports } = require("winston");
const path = require("path");

// Combine timestamp and a readable format for every log entry
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

const logger = createLogger({
  level: "info", // Log info, warn, and error levels

  format: logFormat,

  transports: [
    // Write only errors to error.log
    new transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error"
    }),

    // Write all levels to combined.log
    new transports.File({
      filename: path.join(__dirname, "../logs/combined.log")
    })
  ]
});

// In development also print logs to the terminal in color
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), logFormat)
    })
  );
}

module.exports = logger;