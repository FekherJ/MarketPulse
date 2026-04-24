// Redis client configuration for caching layer
// Uses the redis library's modern Promise-based API
// Connection details are loaded from environment variables
const redis = require("redis");
const logger = require("./logger");

// Create a Redis client instance (not yet connected)
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

// Global error handler for Redis connection issues
// Logs errors without crashing - cache failures are non-fatal
redisClient.on("error", (error) => {
  logger.error({
    event: "REDIS_ERROR",
    message: error.message,
  });
});

// Connect to Redis if not already connected
// Idempotent: safe to call multiple times
async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info({
      event: "REDIS_CONNECTED",
    });
  }
}

// Export the client and connection function
module.exports = {
  redisClient,
  connectRedis,
};
