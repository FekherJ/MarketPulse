const { pool } = require("../config/database");

async function saveRawPrice(payload) {
  const query = `
    INSERT INTO raw_prices (payload)
    VALUES ($1)
    RETURNING id, payload, fetched_at
  `;

  const result = await pool.query(query, [payload]);
  return result.rows[0];
}

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
