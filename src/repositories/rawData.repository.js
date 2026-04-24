// Raw data repository - handles storage of untransformed external API responses
// Preserves the original payload for audit and replay capabilities
const { pool } = require("../config/database");

// Store the raw API response before transformation
// This allows for reprocessing if the transformation logic changes
async function saveRawPrice(payload) {
  const query = `
    INSERT INTO raw_prices (payload)
    VALUES ($1)
    RETURNING id, payload, fetched_at
  `;

  const result = await pool.query(query, [payload]);
  return result.rows[0];
}

// Retrieve a raw price record by ID
// Used for debugging and audit purposes
async function findRawPriceById(id) {
  const query = `
    SELECT id, payload, fetched_at
    FROM raw_prices
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

module.exports = {
  saveRawPrice,
  findRawPriceById,
};
