// Ingestion routes - provides endpoints for monitoring and querying ingestion job history
// Allows clients to check the status of past and current data ingestion runs
const express = require("express");
const router = express.Router();

// Ingestion monitoring service contains application logic for querying ingestion history
const {
  getLatestIngestionRuns,
  getFailedIngestionRuns,
  getFailedQualityChecks,
  getQualityChecksByIngestionRunId,
  getIngestionRunById,
} = require("../services/ingestionMonitoring.service");

/**
 * @swagger
 * /api/ingestions/runs:
 *   get:
 *     summary: Get latest ingestion runs
 *     description: Returns the latest ingestion pipeline executions with status, duration, record counts and errors.
 *     tags:
 *       - Ingestions
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum number of ingestion runs to return.
 *     responses:
 *       200:
 *         description: Ingestion runs returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to retrieve ingestion runs
 */

// GET /runs - Retrieve the most recent ingestion runs
// Used by monitoring dashboards to show ingestion job history
// Supports pagination via query parameter (default: 20, max: 100)
router.get("/runs", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const runs = await getLatestIngestionRuns(limit);

    res.json({
      status: "SUCCESS",
      count: runs.length,
      data: runs,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ingestions/runs/failed:
 *   get:
 *     summary: Get failed ingestion runs
 *     description: Returns ingestion runs that ended with FAILED status.
 *     tags:
 *       - Ingestions
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum number of failed ingestion runs to return.
 *     responses:
 *       200:
 *         description: Failed ingestion runs returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to retrieve failed ingestion runs
 */

// GET /runs/failed - Retrieve only failed ingestion runs
// Used for alerting and debugging ingestion failures
// Returns runs where the ingestion process encountered errors
router.get("/runs/failed", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const runs = await getFailedIngestionRuns(limit);

    res.json({
      status: "SUCCESS",
      count: runs.length,
      data: runs,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ingestions/quality-checks/failed:
 *   get:
 *     summary: Get failed data quality checks
 *     description: Returns failed data quality checks across ingestion runs.
 *     tags:
 *       - Ingestions
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum number of failed quality checks to return.
 *     responses:
 *       200:
 *         description: Failed quality checks returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to retrieve failed quality checks
 */

// GET /quality-checks/failed - Retrieve only failed quality checks
// Used for identifying data quality issues across all ingestion runs
router.get("/quality-checks/failed", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const checks = await getFailedQualityChecks(limit);

    res.json({
      status: "SUCCESS",
      count: checks.length,
      data: checks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ingestions/runs/{id}/quality-checks:
 *   get:
 *     summary: Get quality checks for an ingestion run
 *     description: Returns data quality check results for a specific ingestion run.
 *     tags:
 *       - Ingestions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 7
 *         description: Ingestion run ID.
 *     responses:
 *       200:
 *         description: Quality checks returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 count:
 *                   type: integer
 *                   example: 6
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       check_name:
 *                         type: string
 *                         example: PAYLOAD_NOT_EMPTY
 *                       status:
 *                         type: string
 *                         example: PASSED
 *                       error_message:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *       500:
 *         description: Failed to retrieve quality checks
 */

// GET /runs/:id/quality-checks - Retrieve quality checks for a specific ingestion run
// Used to see data quality validation results for a particular job
router.get("/runs/:id/quality-checks", async (req, res, next) => {
  try {
    const checks = await getQualityChecksByIngestionRunId(req.params.id);

    res.json({
      status: "SUCCESS",
      count: checks.length,
      data: checks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ingestions/runs/{id}:
 *   get:
 *     summary: Get ingestion run by ID
 *     description: Returns details for a specific ingestion run.
 *     tags:
 *       - Ingestions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 7
 *         description: Ingestion run ID.
 *     responses:
 *       200:
 *         description: Ingestion run returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: object
 *       404:
 *         description: Ingestion run not found
 *       500:
 *         description: Failed to retrieve ingestion run
 */

// GET /runs/:id - Retrieve a specific ingestion run by its ID
// Used for detailed investigation of a particular ingestion job
// Returns 404 if no run exists with the given ID
router.get("/runs/:id", async (req, res, next) => {
  try {
    const run = await getIngestionRunById(req.params.id);

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
