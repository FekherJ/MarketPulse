require("dotenv").config();

const app = require("./app");
const logger = require("./config/logger");
const { testDatabaseConnection } = require("./config/database");
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await testDatabaseConnection();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info({
        event: "SERVER_STARTED",
        port: PORT
      });
    });
  } catch (error) {
    logger.error({
      event: "SERVER_START_FAILED",
      message: error.message
    });

    process.exit(1);
  }
}

startServer();