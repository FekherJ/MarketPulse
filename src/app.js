// Creates the main HTTP server instance
const express = require("express");

// Import route modules - each handles a specific domain of the API
// healthRoutes: /health endpoint for load balancer/health checks
// pricesRoutes: /api/prices endpoints for market data operations
const healthRoutes = require("./routes/health.routes");
const pricesRoutes = require("./routes/prices.routes");
const ingestionRoutes = require("./routes/ingestion.routes");

// Create the Express application instance
const app = express();

// Middleware: Parse incoming JSON requests into JavaScript objects
// Enables req.body access in route handlers
app.use(express.json());

// Mount route modules at their base paths
// All health routes will be accessible at /health/*
// All price routes will be accessible at /api/prices/*
app.use("/health", healthRoutes);
app.use("/api/prices", pricesRoutes);
app.use("/api/ingestions", ingestionRoutes);

// Export the configured app for use in server.js
// The app is imported and listen() is called to start the HTTP server
module.exports = app;
