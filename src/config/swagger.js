const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MarketPulse API",
      version: "1.0.0",
      description:
        "Backend/data pipeline monitoring API for market data ingestion, transformation, caching and observability.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "API and dependency health checks",
      },
      {
        name: "Prices",
        description: "Market price ingestion and retrieval endpoints",
      },
      {
        name: "Ingestions",
        description: "Ingestion run monitoring and data quality endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
