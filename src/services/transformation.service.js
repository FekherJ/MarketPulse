// Transformation service - converts external API formats to internal schema
// Handles mapping between CoinGecko API response and our database model
const logger = require("../config/logger");

// Transform raw CoinGecko response into our internal market data format
// Maps coin IDs to our symbol format and extracts relevant fields
function transformCoinGeckoPayload(rawRecord) {
  const payload = rawRecord.payload;
  const rawPriceId = rawRecord.id;
  const capturedAt = rawRecord.fetched_at || new Date().toISOString();

  // Mapping from CoinGecko coin IDs to our internal symbols
  // Centralized here to make it easy to add or modify supported coins
  const mapping = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
  };

  // Transform each coin in the payload
  // Throws error if any expected coin is missing from the response
  const transformedRecords = Object.entries(mapping).map(([coinId, symbol]) => {
    const coinData = payload[coinId];

    if (!coinData) {
      throw new Error(`Missing data for ${coinId}`);
    }

    return {
      symbol,
      price: coinData.usd,
      currency: "USD",
      // Round to 4 decimal places to match database precision
      variation24h:
        coinData.usd_24h_change !== undefined &&
        coinData.usd_24h_change !== null
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
