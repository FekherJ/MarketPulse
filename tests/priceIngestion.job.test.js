// Test file for priceIngestion.job.js
// Verifies ingestion interval validation logic

jest.mock("node-cron", () => ({
  schedule: jest.fn(),
}));

jest.mock("../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../src/services/ingestion.service", () => ({
  fetchTransformAndStorePrices: jest.fn(),
}));

const {
  getIngestionIntervalSeconds,
} = require("../src/jobs/priceIngestion.job");

describe("priceIngestion.job", () => {
  const originalFetchIntervalSeconds = process.env.FETCH_INTERVAL_SECONDS;

  afterEach(() => {
    process.env.FETCH_INTERVAL_SECONDS = originalFetchIntervalSeconds;
    jest.clearAllMocks();
  });

  test("should return default interval when FETCH_INTERVAL_SECONDS is not set", () => {
    delete process.env.FETCH_INTERVAL_SECONDS;

    const result = getIngestionIntervalSeconds();

    expect(result).toBe(30);
  });

  test("should return configured interval when value is valid", () => {
    process.env.FETCH_INTERVAL_SECONDS = "30";

    const result = getIngestionIntervalSeconds();

    expect(result).toBe(30);
  });

  test("should throw an error when value is not a number", () => {
    process.env.FETCH_INTERVAL_SECONDS = "abc";

    expect(() => getIngestionIntervalSeconds()).toThrow(
      "FETCH_INTERVAL_SECONDS must be an integer between 1 and 59",
    );
  });

  test("should throw an error when value is lower than 1", () => {
    process.env.FETCH_INTERVAL_SECONDS = "0";

    expect(() => getIngestionIntervalSeconds()).toThrow(
      "FETCH_INTERVAL_SECONDS must be an integer between 1 and 59",
    );
  });

  test("should throw an error when value is higher than 59", () => {
    process.env.FETCH_INTERVAL_SECONDS = "60";

    expect(() => getIngestionIntervalSeconds()).toThrow(
      "FETCH_INTERVAL_SECONDS must be an integer between 1 and 59",
    );
  });
});
