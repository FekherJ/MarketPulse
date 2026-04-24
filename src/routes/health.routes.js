const express = require("express");
const { pool } = require("../config/database");
const { redisClient } = require("../config/redis");

const router = express.Router();

router.get("/", async (req, res) => {
  const health = {
    status: "UP",
    service: "marketpulse-api",
    timestamp: new Date().toISOString(),
    dependencies: {
      database: "UNKNOWN",
      redis: "UNKNOWN"
    }
  };

  try {
    await pool.query("SELECT 1");
    health.dependencies.database = "UP";
  } catch (error) {
    health.dependencies.database = "DOWN";
    health.status = "DEGRADED";
  }

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

  res.json(health);
});

module.exports = router;