const logger = require("../config/logger");

function transformCoinGeckoPayload(rawRecord) {
  const payload = rawRecord.payload;
  const rawPriceId = rawRecord.id;
  const capturedAt = rawRecord.fetched_at || new Date().toISOString();

  const mapping = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
  };

  const transformedRecords = Object.entries(mapping).map(([coinId, symbol]) => {
    const coinData = payload[coinId];

    if (!coinData) {
      throw new Error(`Missing data for ${coinId}`);
    }

    return {
      symbol,
      price: coinData.usd,
      currency: "USD",
      variation24h: coinData.usd_24h_change
        ? Number(coinData.usd_24h_change.toFixed(4))
        : null,
      high24h: coinData.usd_24h_high || null,
      low24h: coinData.usd_24h_low || null,
      rawPriceId,
      capturedAt,
    };
  });

  logger.info({
    event: "PRICE_TRANSFORMED",
    rawPriceId,
    recordsCount: transformedRecords.length,
  });

  return transformedRecords;
}

module.exports = {
  transformCoinGeckoPayload,
};
