// Ingestion monitoring service - contains application logic for querying ingestion history
// Routes call this service, and this service coordinates ingestion and data quality repositories
const {
  findLatestIngestionRuns,
  findFailedIngestionRuns,
  findIngestionRunById,
} = require("../repositories/ingestionRun.repository");

const {
  findQualityChecksByIngestionRunId,
  findFailedQualityChecks,
} = require("../repositories/dataQuality.repository");

// Retrieve the most recent ingestion runs
async function getLatestIngestionRuns(limit) {
  return findLatestIngestionRuns(limit);
}

// Retrieve only failed ingestion runs
async function getFailedIngestionRuns(limit) {
  return findFailedIngestionRuns(limit);
}

// Retrieve only failed quality checks
async function getFailedQualityChecks(limit) {
  return findFailedQualityChecks(limit);
}

// Retrieve quality checks for a specific ingestion run
async function getQualityChecksByIngestionRunId(ingestionRunId) {
  return findQualityChecksByIngestionRunId(ingestionRunId);
}

// Retrieve a specific ingestion run by its ID
async function getIngestionRunById(id) {
  return findIngestionRunById(id);
}

module.exports = {
  getLatestIngestionRuns,
  getFailedIngestionRuns,
  getFailedQualityChecks,
  getQualityChecksByIngestionRunId,
  getIngestionRunById,
};
