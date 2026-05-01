// Ingestion routes - provides endpoints for monitoring and querying ingestion job history
// Allows clients to check the status of past and current data ingestion runs
const express = require("express");
const router = express.Router();

// Import repository functions for querying ingestion run data from the database
const {
  findLatestIngestionRuns,
  findFailedIngestionRuns,
  findIngestionRunById,
} = require("../repositories/ingestionRun.repository");

// Repository for querying data quality check results
const {
  findQualityChecksByIngestionRunId,
  findFailedQualityChecks,
} = require("../repositories/dataQuality.repository");

// GET /runs - Retrieve the most recent ingestion runs
// Used by monitoring dashboards to show ingestion job history
// Supports pagination via query parameter (default: 20, max: 100)
router.get("/runs", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const runs = await findLatestIngestionRuns(limit);

    res.json({
      status: "SUCCESS",
      count: runs.length,
      data: runs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /runs/failed - Retrieve only failed ingestion runs
// Used for alerting and debugging ingestion failures
// Returns runs where the ingestion process encountered errors
router.get("/runs/failed", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const runs = await findFailedIngestionRuns(limit);

    res.json({
      status: "SUCCESS",
      count: runs.length,
      data: runs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /quality-checks/failed - Retrieve only failed quality checks
// Used for identifying data quality issues across all ingestion runs
router.get("/quality-checks/failed", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const checks = await findFailedQualityChecks(limit);

    res.json({
      status: "SUCCESS",
      count: checks.length,
      data: checks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /runs/:id/quality-checks - Retrieve quality checks for a specific ingestion run
// Used to see data quality validation results for a particular job
router.get("/runs/:id/quality-checks", async (req, res, next) => {
  try {
    const checks = await findQualityChecksByIngestionRunId(req.params.id);

    res.json({
      status: "SUCCESS",
      count: checks.length,
      data: checks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /runs/:id - Retrieve a specific ingestion run by its ID
// Used for detailed investigation of a particular ingestion job
// Returns 404 if no run exists with the given ID
router.get("/runs/:id", async (req, res, next) => {
  try {
    const run = await findIngestionRunById(req.params.id);

    if (!run) {
      return res.status(404).json({
        status: "ERROR",
        message: "Ingestion run not found",
      });
    }

    res.json({
      status: "SUCCESS",
      data: run,
    });
  } catch (error) {
    next(error);
  }
});

// Export the router for mounting in the main app
module.exports = router;