const { redisClient } = require("../config/redis");
const logger = require("../config/logger");

const CACHE_TTL_SECONDS = 300; // 5 minutes

function buildLatestPriceKey(symbol) {
  return `latest:${symbol.toUpperCase()}`;
}

async function setLatestPrice(symbol, marketData) {
  const key = buildLatestPriceKey(symbol);

  await redisClient.setEx(
    key,
    CACHE_TTL_SECONDS,
    JSON.stringify(marketData)
  );

  logger.info({
    event: "CACHE_SET",
    key,
    ttlSeconds: CACHE_TTL_SECONDS
  });
}

async function getLatestPrice(symbol) {
  const key = buildLatestPriceKey(symbol);

  const cachedValue = await redisClient.get(key);

  if (!cachedValue) {
    logger.info({
      event: "CACHE_MISS",
      key
    });

    return null;
  }

  logger.info({
    event: "CACHE_HIT",
    key
  });

  return JSON.parse(cachedValue);
}

async function deleteLatestPrice(symbol) {
  const key = buildLatestPriceKey(symbol);

  await redisClient.del(key);

  logger.info({
    event: "CACHE_DELETE",
    key
  });
}

module.exports = {
  setLatestPrice,
  getLatestPrice,
  deleteLatestPrice
};