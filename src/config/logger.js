// Centralized logging configuration using Winston
// Provides structured JSON logging with timestamps for production debugging
// All modules import this logger to ensure consistent log format
const winston = require("winston");

// Create a logger instance with:
// - info level: logs info, warn, and error messages
// - JSON format: structured logs for easy parsing by log aggregators
// - Console transport: outputs to stdout for containerized environments
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

// Export the configured logger for use throughout the application
module.exports = logger;
