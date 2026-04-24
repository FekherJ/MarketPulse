const redis = require("redis");
const logger = require("./logger");

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
  }
});

redisClient.on("error", (error) => {
  logger.error({
    event: "REDIS_ERROR",
    message: error.message
  });
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info({
      event: "REDIS_CONNECTED"
    });
  }
}

module.exports = {
  redisClient,
  connectRedis
};