// Ingestion service - orchestrates the complete ETL pipeline
// Coordinates fetching from external APIs, transforming data, and storing in database
const axios = require("axios");
const logger = require("../config/logger");
const { saveRawPrice } = require("../repositories/rawData.repository");
const { saveMarketData } = require("../repositories/marketData.repository");
const { transformCoinGeckoPayload } = require("./transformation.service");
const { setLatestPrice } = require("./cache.service");

// List of coins to fetch from CoinGecko API
// This configuration is used both for building the API request and for transformation mapping
const COINS = ["bitcoin", "ethereum", "solana"];

// Fetch current prices from CoinGecko API
// Uses the free /simple/price endpoint with USD as base currency
async function fetchPricesFromCoinGecko() {
  const baseUrl = process.env.COINGECKO_BASE_URL;

  const url = `${baseUrl}/simple/price`;

  // Request parameters for CoinGecko API
  const params = {
    ids: COINS.join(","),
    vs_currencies: "usd",
    include_24hr_change: "true",
  };

  const startTime = Date.now();

  logger.info({
    event: "INGESTION_START",
    source: "CoinGecko",
    coins: COINS,
  });

  // Make the HTTP request with a 10-second timeout to prevent hanging
  const response = await axios.get(url, {
    params,
    timeout: 10000,
  });

  const durationMs = Date.now() - startTime;

  logger.info({
    event: "PRICE_FETCHED",
    source: "CoinGecko",
    durationMs,
  });

  return response.data;
}

// Main ETL function - fetch, transform, and store prices in one operation
// This is the core function called by both the API endpoint and the scheduled job
async function fetchTransformAndStorePrices() {
  try {
    // Step 1: Fetch prices from external API
    const payload = await fetchPricesFromCoinGecko();

    // Step 2: Store raw response for audit/replay
    const rawRecord = await saveRawPrice(payload);

    logger.info({
      event: "RAW_PRICE_STORED",
      rawPriceId: rawRecord.id,
    });

    // Step 3: Transform external format to internal schema
    const transformedRecords = transformCoinGeckoPayload(rawRecord);

    // Step 4: Save each transformed record to database and update cache
    const savedRecords = [];

    for (const record of transformedRecords) {
      const saved = await saveMarketData(record);
      // Update Redis cache with the latest price
      await setLatestPrice(saved.symbol, saved);

      logger.info({
        event: "MARKET_DATA_STORED",
        symbol: saved.symbol,
        price: saved.price,
        rawPriceId: saved.raw_price_id,
      });

      savedRecords.push(saved);
    }

    // Return summary of the ingestion operation
    return {
      rawPriceId: rawRecord.id,
      recordsCount: savedRecords.length,
      records: savedRecords,
    };
  } catch (error) {
    logger.error({
      event: "INGESTION_FAILED",
      message: error.message,
    });

    throw error;
  }
}

module.exports = {
  fetchPricesFromCoinGecko,
  fetchTransformAndStorePrices,
};
