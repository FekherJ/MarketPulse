// Health service - contains dependency checks for PostgreSQL and Redis
// The health route calls this service and only returns the HTTP response
const { pool } = require("../config/database");
const { redisClient } = require("../config/redis");

// Check the overall service status and the status of each dependency
async function checkHealth() {
  // Default health response - assumes all systems operational
  // Will be downgraded to DEGRADED if any dependency fails
  const health = {
    status: "UP",
    service: "marketpulse-api",
    timestamp: new Date().toISOString(),
    dependencies: {
      database: "UNKNOWN",
      redis: "UNKNOWN",
    },
  };

  // Check PostgreSQL connectivity with a simple query
  // Sets dependency status and downgrades overall status on failure
  try {
    await pool.query("SELECT 1");
    health.dependencies.database = "UP";
  } catch (error) {
    health.dependencies.database = "DOWN";
    health.status = "DEGRADED";
  }

  // Check Redis connectivity with PING command
  // First checks if client is connected, then verifies with PING
  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      health.dependencies.redis = "UP";
    } else {
      health.dependencies.redis = "DOWN";
      health.status = "DEGRADED";
    }
  } catch (error) {
    health.dependencies.redis = "DOWN";
    health.status = "DEGRADED";
  }

  return health;
}

module.exports = {
  checkHealth,
};
