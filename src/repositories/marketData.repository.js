const { pool } = require("../config/database");

async function saveMarketData(marketData) {
  const query = `
    INSERT INTO market_data (
      symbol,
      price,
      currency,
      variation24h,
      high24h,
      low24h,
      raw_price_id,
      captured_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    marketData.symbol,
    marketData.price,
    marketData.currency || "USD",
    marketData.variation24h,
    marketData.high24h,
    marketData.low24h,
    marketData.rawPriceId,
    marketData.capturedAt,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findLatestPrices() {
  const query = `
    SELECT DISTINCT ON (symbol)
      id,
      symbol,
      price,
      currency,
      variation24h,
      high24h,
      low24h,
      raw_price_id,
      captured_at
    FROM market_data
    ORDER BY symbol, captured_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function findLatestPriceBySymbol(symbol) {
  const query = `
    SELECT
      id,
      symbol,
      price,
      currency,
      variation24h,
      high24h,
      low24h,
      raw_price_id,
      captured_at
    FROM market_data
    WHERE symbol = $1
    ORDER BY captured_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [symbol.toUpperCase()]);
  return result.rows[0] || null;
}

async function findPriceHistoryBySymbol(symbol, limit = 100) {
  const query = `
    SELECT
      id,
      symbol,
      price,
      currency,
      variation24h,
      high24h,
      low24h,
      raw_price_id,
      captured_at
    FROM market_data
    WHERE symbol = $1
    ORDER BY captured_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [symbol.toUpperCase(), limit]);
  return result.rows;
}

module.exports = {
  saveMarketData,
  findLatestPrices,
  findLatestPriceBySymbol,
  findPriceHistoryBySymbol,
};
