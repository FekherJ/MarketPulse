// Background job for periodic price data ingestion
// Uses node-cron to schedule recurring price fetches from external APIs
// Runs independently of HTTP request handling
const cron = require("node-cron");
const logger = require("../config/logger");
const {
  fetchTransformAndStorePrices,
} = require("../services/ingestion.service");

// Initialize and start the price ingestion cron job
// The interval is configurable via FETCH_INTERVAL_SECONDS environment variable
function startPriceIngestionJob() {
  // Read the interval from environment, default to 60 seconds if not set
  const intervalSeconds = Number(process.env.FETCH_INTERVAL_SECONDS || 60);

  // Build cron expression: */N * * * * * runs every N seconds
  // Note: node-cron uses 6-field format (seconds, minutes, hours, day, month, weekday)
  const cronExpression = `*/${intervalSeconds} * * * * *`;

  logger.info({
    event: "PRICE_INGESTION_JOB_REGISTERED",
    intervalSeconds,
    cronExpression,
  });

  // Schedule the job to run at the specified interval
  // Each execution fetches fresh prices, transforms, and stores in the database
  cron.schedule(cronExpression, async () => {
    logger.info({
      event: "PRICE_INGESTION_JOB_TRIGGERED",
    });

    try {
      // Execute the ETL pipeline: fetch → transform → store
      const result = await fetchTransformAndStorePrices();

      logger.info({
        event: "PRICE_INGESTION_JOB_COMPLETED",
        rawPriceId: result.rawPriceId,
        recordsCount: result.recordsCount,
      });
    } catch (error) {
      // Log error but don't crash the process - the job will retry on next interval
      logger.error({
        event: "PRICE_INGESTION_JOB_FAILED",
        message: error.message,
      });
    }
  });
}

// Export the function to be called from server.js during startup
module.exports = {
  startPriceIngestionJob,
};
