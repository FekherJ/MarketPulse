// Health check routes - used by load balancers and orchestration platforms
// Provides visibility into service and dependency status
const express = require("express");
const { pool } = require("../config/database");
const { redisClient } = require("../config/redis");

const router = express.Router();

// GET / - Main health check endpoint
// Returns the overall service status and the status of each dependency
// Load balancers use this to determine whether to route traffic to this instance
router.get("/", async (req, res) => {
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

  // Return the health object as JSON
  // Status will be "UP" if all dependencies are healthy, "DEGRADED" otherwise
  res.json(health);
});

// Export the health router for mounting in the main app
module.exports = router;
