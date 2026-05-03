// Test file for health.service.js
// Verifies PostgreSQL and Redis dependency health checks

// Mock PostgreSQL pool to avoid real database access during tests
jest.mock("../src/config/database", () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock Redis client to avoid real Redis access during tests
jest.mock("../src/config/redis", () => ({
  redisClient: {
    isOpen: true,
    ping: jest.fn(),
  },
}));

const { pool } = require("../src/config/database");
const { redisClient } = require("../src/config/redis");
const { checkHealth } = require("../src/services/health.service");

describe("health.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.isOpen = true;
  });

  test("should return UP when PostgreSQL and Redis are healthy", async () => {
    pool.query.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    redisClient.ping.mockResolvedValue("PONG");

    const result = await checkHealth();

    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
    expect(redisClient.ping).toHaveBeenCalledTimes(1);

    expect(result.status).toBe("UP");
    expect(result.service).toBe("marketpulse-api");
    expect(result.dependencies.database).toBe("UP");
    expect(result.dependencies.redis).toBe("UP");
    expect(result.timestamp).toBeDefined();
  });

  test("should return DEGRADED when PostgreSQL is down", async () => {
    pool.query.mockRejectedValue(new Error("Database unavailable"));
    redisClient.ping.mockResolvedValue("PONG");

    const result = await checkHealth();

    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
    expect(redisClient.ping).toHaveBeenCalledTimes(1);

    expect(result.status).toBe("DEGRADED");
    expect(result.dependencies.database).toBe("DOWN");
    expect(result.dependencies.redis).toBe("UP");
  });

  test("should return DEGRADED when Redis client is not open", async () => {
    pool.query.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    redisClient.isOpen = false;

    const result = await checkHealth();

    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
    expect(redisClient.ping).not.toHaveBeenCalled();

    expect(result.status).toBe("DEGRADED");
    expect(result.dependencies.database).toBe("UP");
    expect(result.dependencies.redis).toBe("DOWN");
  });

  test("should return DEGRADED when Redis ping fails", async () => {
    pool.query.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    redisClient.ping.mockRejectedValue(new Error("Redis unavailable"));

    const result = await checkHealth();

    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
    expect(redisClient.ping).toHaveBeenCalledTimes(1);

    expect(result.status).toBe("DEGRADED");
    expect(result.dependencies.database).toBe("UP");
    expect(result.dependencies.redis).toBe("DOWN");
  });

  test("should return DEGRADED when both PostgreSQL and Redis are down", async () => {
    pool.query.mockRejectedValue(new Error("Database unavailable"));
    redisClient.ping.mockRejectedValue(new Error("Redis unavailable"));

    const result = await checkHealth();

    expect(pool.query).toHaveBeenCalledWith("SELECT 1");
    expect(redisClient.ping).toHaveBeenCalledTimes(1);

    expect(result.status).toBe("DEGRADED");
    expect(result.dependencies.database).toBe("DOWN");
    expect(result.dependencies.redis).toBe("DOWN");
  });
});
