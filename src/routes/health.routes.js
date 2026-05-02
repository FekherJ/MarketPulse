// Health check routes - used by load balancers and orchestration platforms
// Provides visibility into service and dependency status
const express = require("express");
const { pool } = require("../config/database");
const { redisClient } = require("../config/redis");

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API and dependency health
 *     description: Returns the health status of the API, PostgreSQL and Redis.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Health status returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 service:
 *                   type: string
 *                   example: marketpulse-api
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-05-02T10:00:00.000Z
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: UP
 *                     redis:
 *                       type: string
 *                       example: UP
 */

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
