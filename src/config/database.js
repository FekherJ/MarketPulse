const { Pool } = require("pg");
const logger = require("./logger");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    logger.info({
      event: "DATABASE_CONNECTED",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    logger.error({
      event: "DATABASE_CONNECTION_FAILED",
      message: error.message,
    });
    throw error;
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};
