const express = require("express");
const {
  findLatestPrices,
  findLatestPriceBySymbol,
  findPriceHistoryBySymbol
} = require("../repositories/marketData.repository");
const { fetchTransformAndStorePrices } = require("../services/ingestion.service");

const router = express.Router();

router.post("/fetch", async (req, res) => {
  try {
    const result = await fetchTransformAndStorePrices();

    res.status(201).json({
      status: "SUCCESS",
      message: "Prices fetched, transformed and stored successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch prices",
      error: error.message
    });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const prices = await findLatestPrices();

    res.json({
      status: "SUCCESS",
      count: prices.length,
      data: prices
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to retrieve latest prices",
      error: error.message
    });
  }
});

router.get("/latest/:symbol", async (req, res) => {
  try {
    const price = await findLatestPriceBySymbol(req.params.symbol);

    if (!price) {
      return res.status(404).json({
        status: "NOT_FOUND",
        message: `No price found for symbol ${req.params.symbol.toUpperCase()}`
      });
    }

    res.json({
      status: "SUCCESS",
      data: price
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to retrieve latest price",
      error: error.message
    });
  }
});

router.get("/history/:symbol", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const history = await findPriceHistoryBySymbol(req.params.symbol, limit);

    res.json({
      status: "SUCCESS",
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Failed to retrieve price history",
      error: error.message
    });
  }
});

module.exports = router;