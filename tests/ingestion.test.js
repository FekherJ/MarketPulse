jest.mock("axios");

jest.mock("../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../src/repositories/rawData.repository", () => ({
  saveRawPrice: jest.fn(),
}));

jest.mock("../src/repositories/marketData.repository", () => ({
  saveMarketData: jest.fn(),
}));

jest.mock("../src/services/transformation.service", () => ({
  transformCoinGeckoPayload: jest.fn(),
}));

jest.mock("../src/services/cache.service", () => ({
  setLatestPrice: jest.fn(),
}));

jest.mock("../src/repositories/ingestionRun.repository", () => ({
  createIngestionRun: jest.fn(),
  markInestionRunSuccess: jest.fn(),
  markIngestionRunSuccess: jest.fn(),
  markIngestionRunFailed: jest.fn(),
}));

jest.mock("../src/repositories/dataQuality.repository", () => ({
  saveDataQualityChecks: jest.fn(),
}));

jest.mock("../src/services/dataQuality.service", () => ({
  runDataQualityChecks: jest.fn(),
  hasFailedQualityChecks: jest.fn(),
}));

const axios = require("axios");
const { saveRawPrice } = require("../src/repositories/rawData.repository");
const { saveMarketData } = require("../src/repositories/marketData.repository");
const {
  transformCoinGeckoPayload,
} = require("../src/services/transformation.service");
const { setLatestPrice } = require("../src/services/cache.service");
const {
  createIngestionRun,
  markIngestionRunSuccess,
  markIngestionRunFailed,
} = require("../src/repositories/ingestionRun.repository");
const {
  saveDataQualityChecks,
} = require("../src/repositories/dataQuality.repository");
const {
  runDataQualityChecks,
  hasFailedQualityChecks,
} = require("../src/services/dataQuality.service");
const {
  fetchTransformAndStorePrices,
} = require("../src/services/ingestion.service");

describe("ingestion.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
  });

  test("should persist data quality checks before failing ingestion when quality checks fail", async () => {
    const payload = {
      bitcoin: {
        usd: null,
        usd_24h_change: 1.5,
      },
    };

    const ingestionRun = {
      id: 1,
      source: "CoinGecko",
      status: "RUNNING",
    };

    const rawRecord = {
      id: 10,
      payload,
    };

    const transformedRecords = [
      {
        rawPriceId: 10,
        coinId: "bitcoin",
        symbol: "BTC",
        price: null,
        priceChange24h: 1.5,
        fetchedAt: new Date(),
      },
    ];

    const failedQualityChecks = [
      {
        ingestionRunId: 1,
        checkName: "PRICE_NOT_NULL",
        status: "FAILED",
        errorMessage: "1 records have null price",
      },
    ];

    axios.get.mockResolvedValue({
      data: payload,
    });

    createIngestionRun.mockResolvedValue(ingestionRun);
    saveRawPrice.mockResolvedValue(rawRecord);
    transformCoinGeckoPayload.mockReturnValue(transformedRecords);
    runDataQualityChecks.mockReturnValue(failedQualityChecks);
    saveDataQualityChecks.mockResolvedValue(failedQualityChecks);
    hasFailedQualityChecks.mockReturnValue(true);
    markIngestionRunFailed.mockResolvedValue({
      ...ingestionRun,
      status: "FAILED",
      error_message: "Data quality checks failed",
    });

    await expect(fetchTransformAndStorePrices()).rejects.toThrow(
      "Data quality checks failed",
    );

    expect(createIngestionRun).toHaveBeenCalledWith("CoinGecko");
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(saveRawPrice).toHaveBeenCalledWith(payload);
    expect(transformCoinGeckoPayload).toHaveBeenCalledWith(rawRecord);

    expect(runDataQualityChecks).toHaveBeenCalledWith(
      ingestionRun.id,
      payload,
      transformedRecords,
      ["bitcoin", "ethereum", "solana"],
    );

    expect(saveDataQualityChecks).toHaveBeenCalledWith(failedQualityChecks);

    expect(saveMarketData).not.toHaveBeenCalled();
    expect(setLatestPrice).not.toHaveBeenCalled();
    expect(markIngestionRunSuccess).not.toHaveBeenCalled();

    expect(markIngestionRunFailed).toHaveBeenCalledWith(
      ingestionRun.id,
      "Data quality checks failed",
      expect.any(Number),
    );

    expect(saveDataQualityChecks.mock.invocationCallOrder[0]).toBeLessThan(
      markIngestionRunFailed.mock.invocationCallOrder[0],
    );
  });

  test("should complete ingestion successfully when data quality checks pass", async () => {
    const payload = {
      bitcoin: {
        usd: 65000,
        usd_24h_change: 2.5,
      },
      ethereum: {
        usd: 3500,
        usd_24h_change: 1.2,
      },
      solana: {
        usd: 150,
        usd_24h_change: 4.1,
      },
    };

    const ingestionRun = {
      id: 2,
      source: "CoinGecko",
      status: "RUNNING",
    };

    const rawRecord = {
      id: 20,
      payload,
    };

    const transformedRecords = [
      {
        rawPriceId: 20,
        coinId: "bitcoin",
        symbol: "BTC",
        price: 65000,
        priceChange24h: 2.5,
        fetchedAt: new Date(),
      },
      {
        rawPriceId: 20,
        coinId: "ethereum",
        symbol: "ETH",
        price: 3500,
        priceChange24h: 1.2,
        fetchedAt: new Date(),
      },
      {
        rawPriceId: 20,
        coinId: "solana",
        symbol: "SOL",
        price: 150,
        priceChange24h: 4.1,
        fetchedAt: new Date(),
      },
    ];

    const passedQualityChecks = [
      {
        ingestionRunId: 2,
        checkName: "PAYLOAD_NOT_EMPTY",
        status: "PASSED",
        errorMessage: null,
      },
      {
        ingestionRunId: 2,
        checkName: "PRICE_POSITIVE",
        status: "PASSED",
        errorMessage: null,
      },
    ];

    const savedRecords = transformedRecords.map((record, index) => ({
      id: index + 1,
      symbol: record.symbol,
      price: record.price,
      raw_price_id: record.rawPriceId,
    }));

    axios.get.mockResolvedValue({
      data: payload,
    });

    createIngestionRun.mockResolvedValue(ingestionRun);
    saveRawPrice.mockResolvedValue(rawRecord);
    transformCoinGeckoPayload.mockReturnValue(transformedRecords);
    runDataQualityChecks.mockReturnValue(passedQualityChecks);
    saveDataQualityChecks.mockResolvedValue(passedQualityChecks);
    hasFailedQualityChecks.mockReturnValue(false);

    saveMarketData
      .mockResolvedValueOnce(savedRecords[0])
      .mockResolvedValueOnce(savedRecords[1])
      .mockResolvedValueOnce(savedRecords[2]);

    markIngestionRunSuccess.mockResolvedValue({
      ...ingestionRun,
      status: "SUCCESS",
      duration_ms: 100,
      records_fetched: 3,
      records_inserted: 3,
    });

    const result = await fetchTransformAndStorePrices();

    expect(createIngestionRun).toHaveBeenCalledWith("CoinGecko");
    expect(saveRawPrice).toHaveBeenCalledWith(payload);
    expect(transformCoinGeckoPayload).toHaveBeenCalledWith(rawRecord);

    expect(saveDataQualityChecks).toHaveBeenCalledWith(passedQualityChecks);

    expect(saveMarketData).toHaveBeenCalledTimes(3);
    expect(setLatestPrice).toHaveBeenCalledTimes(3);

    expect(markIngestionRunSuccess).toHaveBeenCalledWith(
      ingestionRun.id,
      transformedRecords.length,
      savedRecords.length,
      expect.any(Number),
    );

    expect(markIngestionRunFailed).not.toHaveBeenCalled();

    expect(result).toEqual({
      ingestionRunId: ingestionRun.id,
      rawPriceId: rawRecord.id,
      recordsCount: savedRecords.length,
      records: savedRecords,
    });
  });
});
