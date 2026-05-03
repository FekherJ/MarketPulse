// Test file for ingestionMonitoring.service.js
// Verifies that the service layer delegates ingestion monitoring queries to the correct repositories

// Mock ingestion run repository to avoid real PostgreSQL access during tests
jest.mock("../src/repositories/ingestionRun.repository", () => ({
  findLatestIngestionRuns: jest.fn(),
  findFailedIngestionRuns: jest.fn(),
  findIngestionRunById: jest.fn(),
}));

// Mock data quality repository to avoid real PostgreSQL access during tests
jest.mock("../src/repositories/dataQuality.repository", () => ({
  findQualityChecksByIngestionRunId: jest.fn(),
  findFailedQualityChecks: jest.fn(),
}));

const {
  findLatestIngestionRuns,
  findFailedIngestionRuns,
  findIngestionRunById,
} = require("../src/repositories/ingestionRun.repository");

const {
  findQualityChecksByIngestionRunId,
  findFailedQualityChecks,
} = require("../src/repositories/dataQuality.repository");

const {
  getLatestIngestionRuns,
  getFailedIngestionRuns,
  getFailedQualityChecks,
  getQualityChecksByIngestionRunId,
  getIngestionRunById,
} = require("../src/services/ingestionMonitoring.service");

describe("ingestionMonitoring.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLatestIngestionRuns", () => {
    test("should return latest ingestion runs from repository", async () => {
      const runs = [
        {
          id: 1,
          status: "SUCCESS",
          records_count: 3,
        },
        {
          id: 2,
          status: "FAILED",
          records_count: 0,
        },
      ];

      findLatestIngestionRuns.mockResolvedValue(runs);

      const result = await getLatestIngestionRuns(20);

      expect(findLatestIngestionRuns).toHaveBeenCalledWith(20);
      expect(result).toEqual(runs);
    });
  });

  describe("getFailedIngestionRuns", () => {
    test("should return failed ingestion runs from repository", async () => {
      const failedRuns = [
        {
          id: 2,
          status: "FAILED",
          records_count: 0,
          error_message: "Data quality checks failed",
        },
      ];

      findFailedIngestionRuns.mockResolvedValue(failedRuns);

      const result = await getFailedIngestionRuns(10);

      expect(findFailedIngestionRuns).toHaveBeenCalledWith(10);
      expect(result).toEqual(failedRuns);
    });
  });

  describe("getFailedQualityChecks", () => {
    test("should return failed quality checks from repository", async () => {
      const failedChecks = [
        {
          id: 1,
          ingestion_run_id: 2,
          check_name: "PRICE_POSITIVE",
          status: "FAILED",
        },
      ];

      findFailedQualityChecks.mockResolvedValue(failedChecks);

      const result = await getFailedQualityChecks(10);

      expect(findFailedQualityChecks).toHaveBeenCalledWith(10);
      expect(result).toEqual(failedChecks);
    });
  });

  describe("getQualityChecksByIngestionRunId", () => {
    test("should return quality checks for a specific ingestion run from repository", async () => {
      const checks = [
        {
          id: 1,
          ingestion_run_id: 1,
          check_name: "PAYLOAD_NOT_EMPTY",
          status: "PASSED",
        },
        {
          id: 2,
          ingestion_run_id: 1,
          check_name: "PRICE_POSITIVE",
          status: "PASSED",
        },
      ];

      findQualityChecksByIngestionRunId.mockResolvedValue(checks);

      const result = await getQualityChecksByIngestionRunId(1);

      expect(findQualityChecksByIngestionRunId).toHaveBeenCalledWith(1);
      expect(result).toEqual(checks);
    });
  });

  describe("getIngestionRunById", () => {
    test("should return one ingestion run by id from repository", async () => {
      const run = {
        id: 1,
        status: "SUCCESS",
        records_count: 3,
      };

      findIngestionRunById.mockResolvedValue(run);

      const result = await getIngestionRunById(1);

      expect(findIngestionRunById).toHaveBeenCalledWith(1);
      expect(result).toEqual(run);
    });

    test("should return null when ingestion run does not exist", async () => {
      findIngestionRunById.mockResolvedValue(null);

      const result = await getIngestionRunById(999);

      expect(findIngestionRunById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
});
