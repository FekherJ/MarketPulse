const cron = require("node-cron");
const logger = require("../config/logger");
const { fetchTransformAndStorePrices } = require("../services/ingestion.service");

function startPriceIngestionJob() {
  const intervalSeconds = Number(process.env.FETCH_INTERVAL_SECONDS || 60);

  const cronExpression = `*/${intervalSeconds} * * * * *`;

  logger.info({
    event: "PRICE_INGESTION_JOB_REGISTERED",
    intervalSeconds,
    cronExpression
  });

  cron.schedule(cronExpression, async () => {
    logger.info({
      event: "PRICE_INGESTION_JOB_TRIGGERED"
    });

    try {
      const result = await fetchTransformAndStorePrices();

      logger.info({
        event: "PRICE_INGESTION_JOB_COMPLETED",
        rawPriceId: result.rawPriceId,
        recordsCount: result.recordsCount
      });
    } catch (error) {
      logger.error({
        event: "PRICE_INGESTION_JOB_FAILED",
        message: error.message
      });
    }
  });
}

module.exports = {
  startPriceIngestionJob
};