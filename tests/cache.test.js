// Test file for cache.service.js
// Uses Jest to verify the cache layer functionality
// Mocks are used to avoid actual Redis connections during testing

// Mock the Redis client module to control its behavior in tests
// This isolates the cache service tests from external dependencies
jest.mock("../src/config/redis", () => ({
  redisClient: {
    setEx: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock the logger to prevent console output during test runs
jest.mock("../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

// Import the mocked Redis client and the service under test
const { redisClient } = require("../src/config/redis");
const {
  setLatestPrice,
  getLatestPrice,
  deleteLatestPrice,
} = require("../src/services/cache.service");

// Test suite for cache.service functions
// Groups tests by the function being tested
describe("cache.service", () => {
  // Reset all mocks before each test to ensure clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests for setLatestPrice function
  describe("setLatestPrice", () => {
    // Verify that prices are stored with the correct key format and TTL
    test("should store latest price in Redis with TTL", async () => {
      const marketData = {
        symbol: "BTC",
        price: "78000.000000",
        currency: "USD",
        variation24h: "0.5124",
        captured_at: "2026-04-24T14:00:00.000Z",
      };

      await setLatestPrice("BTC", marketData);

      expect(redisClient.setEx).toHaveBeenCalledTimes(1);
      expect(redisClient.setEx).toHaveBeenCalledWith(
        "latest:BTC",
        300,
        JSON.stringify(marketData),
      );
    });

    // Verify symbol normalization works correctly (lowercase input -> uppercase key)
    test("should normalize symbol to uppercase when storing", async () => {
      const marketData = {
        symbol: "BTC",
        price: "78000.000000",
      };

      await setLatestPrice("btc", marketData);

      expect(redisClient.setEx).toHaveBeenCalledWith(
        "latest:BTC",
        300,
        JSON.stringify(marketData),
      );
    });
  });

  // Tests for getLatestPrice function
  describe("getLatestPrice", () => {
    // Verify that cached data is retrieved and parsed correctly
    test("should return parsed cached value when cache hit", async () => {
      const cachedMarketData = {
        symbol: "ETH",
        price: "2300.000000",
        currency: "USD",
      };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedMarketData));

      const result = await getLatestPrice("ETH");

      expect(redisClient.get).toHaveBeenCalledWith("latest:ETH");
      expect(result).toEqual(cachedMarketData);
    });

    // Verify null is returned when no data exists for the symbol
    test("should return null when cache miss", async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await getLatestPrice("SOL");

      expect(redisClient.get).toHaveBeenCalledWith("latest:SOL");
      expect(result).toBeNull();
    });

    // Verify case-insensitive symbol lookup
    test("should normalize symbol to uppercase when reading", async () => {
      const cachedMarketData = {
        symbol: "BTC",
        price: "78000.000000",
      };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedMarketData));

      await getLatestPrice("btc");

      expect(redisClient.get).toHaveBeenCalledWith("latest:BTC");
    });
  });

  // Tests for deleteLatestPrice function
  describe("deleteLatestPrice", () => {
    // Verify the delete operation uses the correct Redis command
    test("should delete latest price from Redis", async () => {
      await deleteLatestPrice("BTC");

      expect(redisClient.del).toHaveBeenCalledTimes(1);
      expect(redisClient.del).toHaveBeenCalledWith("latest:BTC");
    });

    // Verify case-insensitive deletion
    test("should normalize symbol to uppercase when deleting", async () => {
      await deleteLatestPrice("eth");

      expect(redisClient.del).toHaveBeenCalledWith("latest:ETH");
    });
  });
});
