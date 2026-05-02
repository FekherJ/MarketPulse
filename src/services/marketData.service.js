// Market data service - contains application logic for reading market prices
// Routes call this service, and this service coordinates repositories and cache access
const {
  findLatestPrices,
  findLatestPriceBySymbol,
  findPriceHistoryBySymbol,
} = require("../repositories/marketData.repository");

// Cache service provides Redis-based caching for fast price lookups
// Reduces database load by serving frequently requested data from memory
const { getLatestPrice, setLatestPrice } = require("./cache.service");

// Retrieve the most recent price for all available symbols
// Always queries the database to ensure data accuracy
async function getLatestPrices() {
  return findLatestPrices();
}

// Retrieve the latest price for a specific symbol
// Implements cache-aside pattern: check Redis first, fallback to DB, then cache the result
async function getLatestPriceBySymbol(symbol) {
  // Normalize symbol input to uppercase for consistent lookup
  const normalizedSymbol = symbol.toUpperCase();

  // Step 1: Check if the price exists in Redis cache (fast path)
  const cachedPrice = await getLatestPrice(normalizedSymbol);

  if (cachedPrice) {
    return {
      source: "cache",
      data: cachedPrice,
    };
  }

  // Step 2: Cache miss - query the database for the latest price
  const price = await findLatestPriceBySymbol(normalizedSymbol);

  if (!price) {
    return null;
  }

  // Step 3: Store the result in cache for future requests
  // This populates the cache so subsequent requests hit the fast path
  await setLatestPrice(normalizedSymbol, price);

  return {
    source: "database",
    data: price,
  };
}

// Retrieve historical price data for a specific symbol
async function getPriceHistoryBySymbol(symbol, limit) {
  return findPriceHistoryBySymbol(symbol, limit);
}

module.exports = {
  getLatestPrices,
  getLatestPriceBySymbol,
  getPriceHistoryBySymbol,
};