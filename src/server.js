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

// Main server startup function - orchestrates initialization sequence
// 1. Test database connectivity
// 2. Connect to Redis cache
// 3. Start HTTP server
// 4. Register scheduled price ingestion job
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

      // Step 4: Start the background job for periodic price updates
      // This runs independently of HTTP requests
      startPriceIngestionJob();
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
