// Express framework for creating HTTP route handlers
const express = require("express");

// Market data service contains application logic for price retrieval
// It coordinates repository access and Redis cache lookups
const {
  getLatestPrices,
  getLatestPriceBySymbol,
  getPriceHistoryBySymbol,
} = require("../services/marketData.service");

// Ingestion service orchestrates the ETL pipeline: fetch external data → transform → store
const {
  fetchTransformAndStorePrices,
} = require("../services/ingestion.service");

// Create a new router instance to modularize price-related endpoints
// This router will be mounted at /api/prices in the main application
const router = express.Router();

/**
 * @swagger
 * /api/prices/fetch:
 *   post:
 *     summary: Trigger manual market data ingestion
 *     description: Manually triggers the CoinGecko ingestion pipeline, stores raw data, transforms records, runs data quality checks, stores structured market data and refreshes Redis cache.
 *     tags:
 *       - Prices
 *     responses:
 *       201:
 *         description: Prices fetched, transformed and stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 message:
 *                   type: string
 *                   example: Prices fetched, transformed and stored successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     ingestionRunId:
 *                       type: integer
 *                       example: 7
 *                     rawPriceId:
 *                       type: integer
 *                       example: 2903
 *                     recordsCount:
 *                       type: integer
 *                       example: 3
 *                     records:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Failed to fetch prices
 */

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

/**
 * @swagger
 * /api/prices/latest:
 *   get:
 *     summary: Get latest prices for all tracked symbols
 *     description: Returns the latest BTC, ETH and SOL prices from PostgreSQL.
 *     tags:
 *       - Prices
 *     responses:
 *       200:
 *         description: Latest prices returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 source:
 *                   type: string
 *                   example: database
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                         example: BTC
 *                       price:
 *                         type: string
 *                         example: "78000.000000"
 *                       currency:
 *                         type: string
 *                         example: USD
 *       500:
 *         description: Failed to retrieve latest prices
 */

// GET /latest - Retrieve the most recent price for all available symbols
// Used by dashboards and monitoring tools to get a complete market snapshot
// Always queries the database to ensure data accuracy
router.get("/latest", async (req, res) => {
  try {
    const prices = await getLatestPrices();

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

/**
 * @swagger
 * /api/prices/latest/{symbol}:
 *   get:
 *     summary: Get latest price for a specific symbol
 *     description: Returns the latest price for a symbol. Redis is checked first, then PostgreSQL is used on cache miss.
 *     tags:
 *       - Prices
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *           example: BTC
 *         description: Market symbol such as BTC, ETH or SOL.
 *     responses:
 *       200:
 *         description: Latest price returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 source:
 *                   type: string
 *                   example: cache
 *                 data:
 *                   type: object
 *                   properties:
 *                     symbol:
 *                       type: string
 *                       example: BTC
 *                     price:
 *                       type: string
 *                       example: "78000.000000"
 *                     currency:
 *                       type: string
 *                       example: USD
 *       404:
 *         description: No price found for the requested symbol
 *       500:
 *         description: Failed to retrieve latest price
 */

// GET /latest/:symbol - Retrieve the latest price for a specific symbol
// Implements cache-aside pattern: check Redis first, fallback to DB, then cache the result
// This optimizes for the common case where the same symbol is queried frequently
router.get("/latest/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const result = await getLatestPriceBySymbol(symbol);

    if (!result) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: `No price found for symbol ${symbol}`,
      });
    }

    res.json({
      status: "SUCCESS",
      source: result.source,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to retrieve latest price",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/prices/history/{symbol}:
 *   get:
 *     summary: Get price history for a specific symbol
 *     description: Returns historical market data records for a symbol, ordered by capture time.
 *     tags:
 *       - Prices
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *           example: BTC
 *         description: Market symbol such as BTC, ETH or SOL.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 500
 *         description: Maximum number of historical records to return.
 *     responses:
 *       200:
 *         description: Price history returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to retrieve price history
 */

// GET /history/:symbol - Retrieve historical price data for a specific symbol
// Used for charting, trend analysis, and technical analysis
// Includes input validation to prevent excessive data retrieval
router.get("/history/:symbol", async (req, res) => {
  try {
    // Parse and validate the limit query parameter
    // Default to 100 records if not specified, clamp between 1-500 to prevent abuse
    const requestedLimit = Number(req.query.limit) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 500);

    const history = await getPriceHistoryBySymbol(req.params.symbol, limit);

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