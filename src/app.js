const express = require("express");

const healthRoutes = require("./routes/health.routes");
const pricesRoutes = require("./routes/prices.routes");

const app = express();

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/prices", pricesRoutes);

module.exports = app;
