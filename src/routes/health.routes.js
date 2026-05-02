// Health check routes - used by load balancers and orchestration platforms
// Provides visibility into service and dependency status
const express = require("express");
const { checkHealth } = require("../services/health.service");

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
  const health = await checkHealth();

  // Return the health object as JSON
  // Status will be "UP" if all dependencies are healthy, "DEGRADED" otherwise
  res.json(health);
});

// Export the health router for mounting in the main app
module.exports = router;