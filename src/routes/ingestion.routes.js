const express = require("express");
const router = express.Router();

const {
  findLatestIngestionRuns,
  findFailedIngestionRuns,
  findIngestionRunById,
} = require("../repositories/ingestionRun.repository");

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

module.exports = router;