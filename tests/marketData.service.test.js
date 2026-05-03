// Test file for marketData.service.js
// Verifies the service layer logic between routes, cache, and market data repository

// Mock the market data repository to avoid real PostgreSQL access during tests
jest.mock("../src/repositories/marketData.repository", () => ({
  findLatestPrices: jest.fn(),
  findLatestPriceBySymbol: jest.fn(),
  findPriceHistoryBySymbol: jest.fn(),
}));

// Mock the cache service to avoid real Redis access during tests
jest.mock("../src/services/cache.service", () => ({
  getLatestPrice: jest.fn(),
  setLatestPrice: jest.fn(),
}));

const {
  findLatestPrices,
  findLatestPriceBySymbol,
  findPriceHistoryBySymbol,
} = require("../src/repositories/marketData.repository");

const {
  getLatestPrice,
  setLatestPrice,
} = require("../src/services/cache.service");

const {
  getLatestPrices,
  getLatestPriceBySymbol,
  getPriceHistoryBySymbol,
} = require("../src/services/marketData.service");

describe("marketData.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLatestPrices", () => {
    test("should return latest prices from repository", async () => {
      const latestPrices = [
        {
          symbol: "BTC",
          price: "78000.000000",
          currency: "USD",
        },
        {
          symbol: "ETH",
          price: "2500.000000",
          currency: "USD",
        },
      ];

      findLatestPrices.mockResolvedValue(latestPrices);

      const result = await getLatestPrices();

      expect(findLatestPrices).toHaveBeenCalledTimes(1);
      expect(result).toEqual(latestPrices);
    });
  });

  describe("getLatestPriceBySymbol", () => {
    test("should return cached price when Redis cache has data", async () => {
      const cachedPrice = {
        symbol: "BTC",
        price: "78000.000000",
        currency: "USD",
      };

      getLatestPrice.mockResolvedValue(cachedPrice);

      const result = await getLatestPriceBySymbol("btc");

      expect(getLatestPrice).toHaveBeenCalledWith("BTC");
      expect(findLatestPriceBySymbol).not.toHaveBeenCalled();
      expect(setLatestPrice).not.toHaveBeenCalled();
      expect(result).toEqual({
        source: "cache",
        data: cachedPrice,
      });
    });

    test("should read from repository and update cache when Redis cache is empty", async () => {
      const databasePrice = {
        symbol: "ETH",
        price: "2500.000000",
        currency: "USD",
      };

      getLatestPrice.mockResolvedValue(null);
      findLatestPriceBySymbol.mockResolvedValue(databasePrice);

      const result = await getLatestPriceBySymbol("eth");

      expect(getLatestPrice).toHaveBeenCalledWith("ETH");
      expect(findLatestPriceBySymbol).toHaveBeenCalledWith("ETH");
      expect(setLatestPrice).toHaveBeenCalledWith("ETH", databasePrice);
      expect(result).toEqual({
        source: "database",
        data: databasePrice,
      });
    });

    test("should return null when price does not exist in cache or repository", async () => {
      getLatestPrice.mockResolvedValue(null);
      findLatestPriceBySymbol.mockResolvedValue(null);

      const result = await getLatestPriceBySymbol("SOL");

      expect(getLatestPrice).toHaveBeenCalledWith("SOL");
      expect(findLatestPriceBySymbol).toHaveBeenCalledWith("SOL");
      expect(setLatestPrice).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("getPriceHistoryBySymbol", () => {
    test("should return price history from repository", async () => {
      const priceHistory = [
        {
          symbol: "BTC",
          price: "78000.000000",
          currency: "USD",
        },
        {
          symbol: "BTC",
          price: "77900.000000",
          currency: "USD",
        },
      ];

      findPriceHistoryBySymbol.mockResolvedValue(priceHistory);

      const result = await getPriceHistoryBySymbol("BTC", 2);

      expect(findPriceHistoryBySymbol).toHaveBeenCalledWith("BTC", 2);
      expect(result).toEqual(priceHistory);
    });
  });
});
