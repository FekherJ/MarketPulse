const axios = require("axios");
const logger = require("../config/logger");
const { saveRawPrice } = require("../repositories/rawData.repository");
const { saveMarketData } = require("../repositories/marketData.repository");
const { transformCoinGeckoPayload } = require("./transformation.service");
const { setLatestPrice } = require("./cache.service");

const COINS = ["bitcoin", "ethereum", "solana"];

async function fetchPricesFromCoinGecko() {
  const baseUrl = process.env.COINGECKO_BASE_URL;

  const url = `${baseUrl}/simple/price`;

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

async function fetchTransformAndStorePrices() {
  try {
    const payload = await fetchPricesFromCoinGecko();

    const rawRecord = await saveRawPrice(payload);

    logger.info({
      event: "RAW_PRICE_STORED",
      rawPriceId: rawRecord.id,
    });

    const transformedRecords = transformCoinGeckoPayload(rawRecord);

    const savedRecords = [];

    for (const record of transformedRecords) {
      const saved = await saveMarketData(record);
      await setLatestPrice(saved.symbol, saved);

      logger.info({
        event: "MARKET_DATA_STORED",
        symbol: saved.symbol,
        price: saved.price,
        rawPriceId: saved.raw_price_id,
      });

      savedRecords.push(saved);
    }

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
