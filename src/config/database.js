// PostgreSQL connection pool configuration
// Uses the pg library's Pool for managing multiple concurrent connections
// Connection details are loaded from environment variables
const { Pool } = require("pg");
const logger = require("./logger");

// Create a pool of database connections
// The pool automatically manages connection lifecycle and reuse
// This improves performance by avoiding connection setup overhead for each query
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Health check function to verify database connectivity
// Used during server startup to ensure the database is accessible
// Returns the server's current timestamp to confirm query execution
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

// Export the pool for use by repositories and the connection test function
module.exports = {
  pool,
  testDatabaseConnection,
};
