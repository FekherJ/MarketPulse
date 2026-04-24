// Express framework for creating HTTP route handlers
const express = require("express");

// Market data repository handles all database queries for price data
// - findLatestPrices: retrieves current prices for all symbols
// - findLatestPriceBySymbol: gets latest price for a specific symbol
// - findPriceHistoryBySymbol: retrieves historical price data for analysis
const {
  findLatestPrices,
  findLatestPriceBySymbol,
  findPriceHistoryBySymbol,
} = require("../repositories/marketData.repository");

// Ingestion service orchestrates the ETL pipeline: fetch external data → transform → store
const {
  fetchTransformAndStorePrices,
} = require("../services/ingestion.service");

// Cache service provides Redis-based caching for fast price lookups
// Reduces database load by serving frequently requested data from memory
const { getLatestPrice, setLatestPrice } = require("../services/cache.service");

// Create a new router instance to modularize price-related endpoints
// This router will be mounted at /api/prices in the main application
const router = express.Router();

// POST /fetch - Manually trigger the ETL pipeline to fetch latest prices from external sources
// Returns the transformed and stored price data with 201 status (resource created)
router.post("/fetch", async (req, res) => {
  try {
    const result = await fetchTransformAndStorePrices();

    res.status(201).json({
      status: "SUCCESS",
      message: "Prices fetched, transformed and stored successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch prices",
      error: error.message,
    });
  }
});

// GET /latest - Retrieve the most recent price for all available symbols
// Used by dashboards and monitoring tools to get a complete market snapshot
// Always queries the database to ensure data accuracy
router.get("/latest", async (req, res) => {
  try {
    const prices = await findLatestPrices();

    res.json({
      status: "SUCCESS",
      source: "database",
      count: prices.length,
      data: prices,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to retrieve latest prices",
      error: error.message,
    });
  }
});

// GET /latest/:symbol - Retrieve the latest price for a specific symbol
// Implements cache-aside pattern: check Redis first, fallback to DB, then cache the result
// This optimizes for the common case where the same symbol is queried frequently
router.get("/latest/:symbol", async (req, res) => {
  try {
    // Normalize symbol input to uppercase for consistent lookup
    const symbol = req.params.symbol.toUpperCase();

    // Step 1: Check if the price exists in Redis cache (fast path)
    const cachedPrice = await getLatestPrice(symbol);

    if (cachedPrice) {
      return res.json({
        status: "SUCCESS",
        source: "cache",
        data: cachedPrice,
      });
    }

    // Step 2: Cache miss - query the database for the latest price
    const price = await findLatestPriceBySymbol(symbol);

    if (!price) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: `No price found for symbol ${symbol}`,
      });
    }

    // Step 3: Store the result in cache for future requests
    // This populates the cache so subsequent requests hit the fast path
    await setLatestPrice(symbol, price);

    res.json({
      status: "SUCCESS",
      source: "database",
      data: price,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to retrieve latest price",
      error: error.message,
    });
  }
});

// GET /history/:symbol - Retrieve historical price data for a specific symbol
// Used for charting, trend analysis, and technical analysis
// Includes input validation to prevent excessive data retrieval
router.get("/history/:symbol", async (req, res) => {
  try {
    // Parse and validate the limit query parameter
    // Default to 100 records if not specified, clamp between 1-500 to prevent abuse
    const requestedLimit = Number(req.query.limit) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 500);

    const history = await findPriceHistoryBySymbol(req.params.symbol, limit);

    res.json({
      status: "SUCCESS",
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to retrieve price history",
      error: error.message,
    });
  }
});

// Export the configured router to be mounted in the main Express application
// All routes defined above will be accessible under the /api/prices prefix
module.exports = router;
