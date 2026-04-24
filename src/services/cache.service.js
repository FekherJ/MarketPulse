// Cache service - provides Redis-based caching for price data
// Implements cache-aside pattern to reduce database load
const { redisClient } = require("../config/redis");
const logger = require("../config/logger");

// Time-to-live for cached prices (5 minutes)
// Balances freshness of data with cache hit rate
const CACHE_TTL_SECONDS = 300; // 5 minutes

// Build a consistent cache key for the latest price of a symbol
// Format: latest:SYMBOL (e.g., latest:BTC)
function buildLatestPriceKey(symbol) {
  return `latest:${symbol.toUpperCase()}`;
}

// Store a price in Redis with TTL
// Uses setEx for atomic set-and-expire operation
async function setLatestPrice(symbol, marketData) {
  const key = buildLatestPriceKey(symbol);

  await redisClient.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(marketData));

  logger.info({
    event: "CACHE_SET",
    key,
    ttlSeconds: CACHE_TTL_SECONDS,
  });
}

// Retrieve a price from Redis cache
// Returns null if key doesn't exist or has expired
async function getLatestPrice(symbol) {
  const key = buildLatestPriceKey(symbol);

  const cachedValue = await redisClient.get(key);

  if (!cachedValue) {
    logger.info({
      event: "CACHE_MISS",
      key,
    });

    return null;
  }

  logger.info({
    event: "CACHE_HIT",
    key,
  });

  return JSON.parse(cachedValue);
}

// Manually invalidate a cached price
// Useful when data is known to be stale or after a data correction
async function deleteLatestPrice(symbol) {
  const key = buildLatestPriceKey(symbol);

  await redisClient.del(key);

  logger.info({
    event: "CACHE_DELETE",
    key,
  });
}

module.exports = {
  setLatestPrice,
  getLatestPrice,
  deleteLatestPrice,
};
