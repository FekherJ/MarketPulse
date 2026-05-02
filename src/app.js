// Creates the main HTTP server instance
const express = require("express");

// Swagger UI middleware for API documentation
const swaggerUi = require("swagger-ui-express");
// Swagger specification configuration
const swaggerSpec = require("./config/swagger");

// Import route modules - each handles a specific domain of the API
// healthRoutes: /health endpoint for load balancer/health checks
// pricesRoutes: /api/prices endpoints for market data operations
// ingestionRoutes: /api/ingestions endpoints for ingestion control and status
const healthRoutes = require("./routes/health.routes");
const pricesRoutes = require("./routes/prices.routes");
const ingestionRoutes = require("./routes/ingestion.routes");

// Create the Express application instance
const app = express();

// Middleware: Parse incoming JSON requests into JavaScript objects
// Enables req.body access in route handlers
app.use(express.json());

// Mount Swagger UI at /api-docs for interactive API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount route modules at their base paths
// All health routes will be accessible at /health/*
// All price routes will be accessible at /api/prices/*
// All ingestion routes will be accessible at /api/ingestions/*
app.use("/health", healthRoutes);
app.use("/api/prices", pricesRoutes);
app.use("/api/ingestions", ingestionRoutes);

// Export the configured app for use in server.js
// The app is imported and listen() is called to start the HTTP server
module.exports = app;
