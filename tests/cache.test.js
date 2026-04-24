jest.mock("../src/config/redis", () => ({
  redisClient: {
    setEx: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

jest.mock("../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn()
}));

const { redisClient } = require("../src/config/redis");
const {
  setLatestPrice,
  getLatestPrice,
  deleteLatestPrice
} = require("../src/services/cache.service");

describe("cache.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setLatestPrice", () => {
    test("should store latest price in Redis with TTL", async () => {
      const marketData = {
        symbol: "BTC",
        price: "78000.000000",
        currency: "USD",
        variation24h: "0.5124",
        captured_at: "2026-04-24T14:00:00.000Z"
      };

      await setLatestPrice("BTC", marketData);

      expect(redisClient.setEx).toHaveBeenCalledTimes(1);
      expect(redisClient.setEx).toHaveBeenCalledWith(
        "latest:BTC",
        300,
        JSON.stringify(marketData)
      );
    });

    test("should normalize symbol to uppercase when storing", async () => {
      const marketData = {
        symbol: "BTC",
        price: "78000.000000"
      };

      await setLatestPrice("btc", marketData);

      expect(redisClient.setEx).toHaveBeenCalledWith(
        "latest:BTC",
        300,
        JSON.stringify(marketData)
      );
    });
  });

  describe("getLatestPrice", () => {
    test("should return parsed cached value when cache hit", async () => {
      const cachedMarketData = {
        symbol: "ETH",
        price: "2300.000000",
        currency: "USD"
      };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedMarketData));

      const result = await getLatestPrice("ETH");

      expect(redisClient.get).toHaveBeenCalledWith("latest:ETH");
      expect(result).toEqual(cachedMarketData);
    });

    test("should return null when cache miss", async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await getLatestPrice("SOL");

      expect(redisClient.get).toHaveBeenCalledWith("latest:SOL");
      expect(result).toBeNull();
    });

    test("should normalize symbol to uppercase when reading", async () => {
      const cachedMarketData = {
        symbol: "BTC",
        price: "78000.000000"
      };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedMarketData));

      await getLatestPrice("btc");

      expect(redisClient.get).toHaveBeenCalledWith("latest:BTC");
    });
  });

  describe("deleteLatestPrice", () => {
    test("should delete latest price from Redis", async () => {
      await deleteLatestPrice("BTC");

      expect(redisClient.del).toHaveBeenCalledTimes(1);
      expect(redisClient.del).toHaveBeenCalledWith("latest:BTC");
    });

    test("should normalize symbol to uppercase when deleting", async () => {
      await deleteLatestPrice("eth");

      expect(redisClient.del).toHaveBeenCalledWith("latest:ETH");
    });
  });
});