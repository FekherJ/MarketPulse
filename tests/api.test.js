const request = require("supertest");

jest.mock("../src/config/database", () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock("../src/config/redis", () => ({
  redisClient: {
    isOpen: true,
    ping: jest.fn(),
  },
}));

jest.mock("../src/repositories/marketData.repository", () => ({
  findLatestPrices: jest.fn(),
  findLatestPriceBySymbol: jest.fn(),
  findPriceHistoryBySymbol: jest.fn(),
}));

jest.mock("../src/services/ingestion.service", () => ({
  fetchTransformAndStorePrices: jest.fn(),
}));

jest.mock("../src/services/cache.service", () => ({
  getLatestPrice: jest.fn(),
  setLatestPrice: jest.fn(),
}));

jest.mock("../src/repositories/ingestionRun.repository", () => ({
  findLatestIngestionRuns: jest.fn(),
  findFailedIngestionRuns: jest.fn(),
  findIngestionRunById: jest.fn(),
}));

jest.mock("../src/repositories/dataQuality.repository", () => ({
  findQualityChecksByIngestionRunId: jest.fn(),
  findFailedQualityChecks: jest.fn(),
}));

const app = require("../src/app");

const { pool } = require("../src/config/database");
const { redisClient } = require("../src/config/redis");

const {
  findLatestPrices,
  findLatestPriceBySymbol,
  findPriceHistoryBySymbol,
} = require("../src/repositories/marketData.repository");

const {
  fetchTransformAndStorePrices,
} = require("../src/services/ingestion.service");

const {
  getLatestPrice,
  setLatestPrice,
} = require("../src/services/cache.service");

const {
  findLatestIngestionRuns,
  findFailedIngestionRuns,
  findIngestionRunById,
} = require("../src/repositories/ingestionRun.repository");

const {
  findQualityChecksByIngestionRunId,
  findFailedQualityChecks,
} = require("../src/repositories/dataQuality.repository");

describe("API routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.isOpen = true;
  });

  describe("GET /health", () => {
    test("should return UP when PostgreSQL and Redis are available", async () => {
      pool.query.mockResolvedValue({ rows: [{ result: 1 }] });
      redisClient.ping.mockResolvedValue("PONG");

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("UP");
      expect(response.body.service).toBe("marketpulse-api");
      expect(response.body.dependencies.database).toBe("UP");
      expect(response.body.dependencies.redis).toBe("UP");

      expect(pool.query).toHaveBeenCalledWith("SELECT 1");
      expect(redisClient.ping).toHaveBeenCalledTimes(1);
    });

    test("should return DEGRADED when PostgreSQL is unavailable", async () => {
      pool.query.mockRejectedValue(new Error("Database unavailable"));
      redisClient.ping.mockResolvedValue("PONG");

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("DEGRADED");
      expect(response.body.dependencies.database).toBe("DOWN");
      expect(response.body.dependencies.redis).toBe("UP");
    });

    test("should return DEGRADED when Redis is not connected", async () => {
      pool.query.mockResolvedValue({ rows: [{ result: 1 }] });
      redisClient.isOpen = false;

      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("DEGRADED");
      expect(response.body.dependencies.database).toBe("UP");
      expect(response.body.dependencies.redis).toBe("DOWN");
      expect(redisClient.ping).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/prices/fetch", () => {
    test("should trigger manual ingestion and return 201", async () => {
      const ingestionResult = {
        ingestionRunId: 7,
        rawPriceId: 100,
        recordsCount: 3,
        records: [
          {
            id: 1,
            symbol: "BTC",
            price: "78000.000000",
          },
        ],
      };

      fetchTransformAndStorePrices.mockResolvedValue(ingestionResult);

      const response = await request(app).post("/api/prices/fetch");

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.message).toBe(
        "Prices fetched, transformed and stored successfully",
      );
      expect(response.body.data).toEqual(ingestionResult);
      expect(fetchTransformAndStorePrices).toHaveBeenCalledTimes(1);
    });

    test("should return 500 when manual ingestion fails", async () => {
      fetchTransformAndStorePrices.mockRejectedValue(
        new Error("CoinGecko unavailable"),
      );

      const response = await request(app).post("/api/prices/fetch");

      expect(response.status).toBe(500);
      expect(response.body.status).toBe("ERROR");
      expect(response.body.message).toBe("Failed to fetch prices");
      expect(response.body.error).toBe("CoinGecko unavailable");
    });
  });

  describe("GET /api/prices/latest", () => {
    test("should return latest prices from database", async () => {
      const latestPrices = [
        {
          id: 1,
          symbol: "BTC",
          price: "78000.000000",
          currency: "USD",
        },
        {
          id: 2,
          symbol: "ETH",
          price: "3500.000000",
          currency: "USD",
        },
      ];

      findLatestPrices.mockResolvedValue(latestPrices);

      const response = await request(app).get("/api/prices/latest");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.source).toBe("database");
      expect(response.body.count).toBe(2);
      expect(response.body.data).toEqual(latestPrices);
      expect(findLatestPrices).toHaveBeenCalledTimes(1);
    });

    test("should return 500 when latest prices query fails", async () => {
      findLatestPrices.mockRejectedValue(new Error("Database query failed"));

      const response = await request(app).get("/api/prices/latest");

      expect(response.status).toBe(500);
      expect(response.body.status).toBe("ERROR");
      expect(response.body.message).toBe("Failed to retrieve latest prices");
      expect(response.body.error).toBe("Database query failed");
    });
  });

  describe("GET /api/prices/latest/:symbol", () => {
    test("should return latest price from cache when cache hit", async () => {
      const cachedPrice = {
        id: 1,
        symbol: "BTC",
        price: "78000.000000",
        currency: "USD",
      };

      getLatestPrice.mockResolvedValue(cachedPrice);

      const response = await request(app).get("/api/prices/latest/btc");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.source).toBe("cache");
      expect(response.body.data).toEqual(cachedPrice);

      expect(getLatestPrice).toHaveBeenCalledWith("BTC");
      expect(findLatestPriceBySymbol).not.toHaveBeenCalled();
      expect(setLatestPrice).not.toHaveBeenCalled();
    });

    test("should return latest price from database and refresh cache when cache miss", async () => {
      const databasePrice = {
        id: 2,
        symbol: "ETH",
        price: "3500.000000",
        currency: "USD",
      };

      getLatestPrice.mockResolvedValue(null);
      findLatestPriceBySymbol.mockResolvedValue(databasePrice);
      setLatestPrice.mockResolvedValue(undefined);

      const response = await request(app).get("/api/prices/latest/eth");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.source).toBe("database");
      expect(response.body.data).toEqual(databasePrice);

      expect(getLatestPrice).toHaveBeenCalledWith("ETH");
      expect(findLatestPriceBySymbol).toHaveBeenCalledWith("ETH");
      expect(setLatestPrice).toHaveBeenCalledWith("ETH", databasePrice);
    });

    test("should return 404 when symbol does not exist", async () => {
      getLatestPrice.mockResolvedValue(null);
      findLatestPriceBySymbol.mockResolvedValue(null);

      const response = await request(app).get("/api/prices/latest/doge");

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("NOT_FOUND");
      expect(response.body.message).toBe("No price found for symbol DOGE");
    });
  });

  describe("GET /api/prices/history/:symbol", () => {
    test("should return price history for a symbol", async () => {
      const history = [
        {
          id: 1,
          symbol: "BTC",
          price: "78000.000000",
        },
        {
          id: 2,
          symbol: "BTC",
          price: "78100.000000",
        },
      ];

      findPriceHistoryBySymbol.mockResolvedValue(history);

      const response = await request(app).get(
        "/api/prices/history/BTC?limit=10",
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.count).toBe(2);
      expect(response.body.data).toEqual(history);
      expect(findPriceHistoryBySymbol).toHaveBeenCalledWith("BTC", 10);
    });

    test("should clamp history limit to maximum 500", async () => {
      findPriceHistoryBySymbol.mockResolvedValue([]);

      await request(app).get("/api/prices/history/BTC?limit=9999");

      expect(findPriceHistoryBySymbol).toHaveBeenCalledWith("BTC", 500);
    });
  });

  describe("GET /api/ingestions/runs", () => {
    test("should return latest ingestion runs", async () => {
      const runs = [
        {
          id: 1,
          source: "CoinGecko",
          status: "SUCCESS",
        },
      ];

      findLatestIngestionRuns.mockResolvedValue(runs);

      const response = await request(app).get("/api/ingestions/runs?limit=5");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.count).toBe(1);
      expect(response.body.data).toEqual(runs);
      expect(findLatestIngestionRuns).toHaveBeenCalledWith(5);
    });
  });

  describe("GET /api/ingestions/runs/failed", () => {
    test("should return failed ingestion runs", async () => {
      const failedRuns = [
        {
          id: 2,
          source: "CoinGecko",
          status: "FAILED",
          error_message: "Data quality checks failed",
        },
      ];

      findFailedIngestionRuns.mockResolvedValue(failedRuns);

      const response = await request(app).get(
        "/api/ingestions/runs/failed?limit=5",
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.count).toBe(1);
      expect(response.body.data).toEqual(failedRuns);
      expect(findFailedIngestionRuns).toHaveBeenCalledWith(5);
    });
  });

  describe("GET /api/ingestions/runs/:id", () => {
    test("should return one ingestion run by id", async () => {
      const run = {
        id: 7,
        source: "CoinGecko",
        status: "SUCCESS",
      };

      findIngestionRunById.mockResolvedValue(run);

      const response = await request(app).get("/api/ingestions/runs/7");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.data).toEqual(run);
      expect(findIngestionRunById).toHaveBeenCalledWith("7");
    });

    test("should return 404 when ingestion run is not found", async () => {
      findIngestionRunById.mockResolvedValue(null);

      const response = await request(app).get("/api/ingestions/runs/999");

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("ERROR");
      expect(response.body.message).toBe("Ingestion run not found");
    });
  });

  describe("GET /api/ingestions/runs/:id/quality-checks", () => {
    test("should return quality checks for a specific ingestion run", async () => {
      const checks = [
        {
          id: 1,
          ingestion_run_id: 7,
          check_name: "PAYLOAD_NOT_EMPTY",
          status: "PASSED",
        },
      ];

      findQualityChecksByIngestionRunId.mockResolvedValue(checks);

      const response = await request(app).get(
        "/api/ingestions/runs/7/quality-checks",
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.count).toBe(1);
      expect(response.body.data).toEqual(checks);
      expect(findQualityChecksByIngestionRunId).toHaveBeenCalledWith("7");
    });
  });

  describe("GET /api/ingestions/quality-checks/failed", () => {
    test("should return failed quality checks", async () => {
      const failedChecks = [
        {
          id: 1,
          ingestion_run_id: 7,
          check_name: "PRICE_NOT_NULL",
          status: "FAILED",
          error_message: "1 records have null price",
        },
      ];

      findFailedQualityChecks.mockResolvedValue(failedChecks);

      const response = await request(app).get(
        "/api/ingestions/quality-checks/failed?limit=5",
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SUCCESS");
      expect(response.body.count).toBe(1);
      expect(response.body.data).toEqual(failedChecks);
      expect(findFailedQualityChecks).toHaveBeenCalledWith(5);
    });
  });
});
