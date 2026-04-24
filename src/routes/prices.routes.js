const express = require("express");
const {
  findLatestPrices,
  findLatestPriceBySymbol,
  findPriceHistoryBySymbol,
} = require("../repositories/marketData.repository");
const {
  fetchTransformAndStorePrices,
} = require("../services/ingestion.service");

const { getLatestPrice, setLatestPrice } = require("../services/cache.service");

const router = express.Router();

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

router.get("/latest/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const cachedPrice = await getLatestPrice(symbol);

    if (cachedPrice) {
      return res.json({
        status: "SUCCESS",
        source: "cache",
        data: cachedPrice,
      });
    }

    const price = await findLatestPriceBySymbol(symbol);

    if (!price) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: `No price found for symbol ${symbol}`,
      });
    }

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

router.get("/history/:symbol", async (req, res) => {
  try {
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

module.exports = router;
