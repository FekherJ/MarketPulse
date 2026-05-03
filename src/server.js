// Load environment variables from .env file before any other imports
// This ensures all configuration values are available to all modules
require("dotenv").config();

// Import application components
// - priceIngestion.job: scheduled job for periodic price fetching
// - app: configured Express application with mounted routes
// - logger: centralized logging instance (Winston)
// - database: PostgreSQL connection pool and test function
// - redis: Redis client and connection function
const { startPriceIngestionJob } = require("./jobs/priceIngestion.job");
const app = require("./app");
const logger = require("./config/logger");
const { testDatabaseConnection } = require("./config/database");
const { connectRedis } = require("./config/redis");

// Server port configuration - defaults to 3000 if not set in environment
const PORT = process.env.PORT || 3000;

// Background ingestion job configuration
// true  = the API process starts the local node-cron ingestion job
// false = the API starts without the cron job, useful for cloud deployments
// where ingestion is triggered separately by EventBridge, ECS scheduled tasks, or another scheduler
const ENABLE_INGESTION_JOB = process.env.ENABLE_INGESTION_JOB !== "false";

// Main server startup function - orchestrates initialization sequence
// 1. Test database connectivity
// 2. Connect to Redis cache
// 3. Start HTTP server
// 4. Register scheduled price ingestion job if enabled
async function startServer() {
  try {
    // Step 1: Verify PostgreSQL is accessible before accepting requests
    await testDatabaseConnection();

    // Step 2: Establish Redis connection for caching layer
    await connectRedis();

    // Step 3: Start HTTP server and begin accepting requests
    app.listen(PORT, () => {
      logger.info({
        event: "SERVER_STARTED",
        port: PORT,
      });

      // Step 4: Start the background job for periodic price updates if enabled
      // This allows cloud deployments to disable local cron and use EventBridge/ECS scheduled tasks instead
      if (ENABLE_INGESTION_JOB) {
        startPriceIngestionJob();
      } else {
        logger.info({
          event: "PRICE_INGESTION_JOB_DISABLED",
        });
      }
    });
  } catch (error) {
    // If any critical service fails to initialize, log error and exit
    // The process cannot function without database and cache connectivity
    logger.error({
      event: "SERVER_START_FAILED",
      message: error.message,
    });

    process.exit(1);
  }
}

// Execute the startup sequence immediately when this file is run
startServer();
