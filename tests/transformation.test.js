const calculateVariation = require("../src/utils/calculateVariation");
const { transformCoinGeckoPayload } = require("../src/services/transformation.service");

describe("calculateVariation", () => {
  test("should calculate positive variation percentage", () => {
    const result = calculateVariation(110, 100);
    expect(result).toBe(10);
  });

  test("should calculate negative variation percentage", () => {
    const result = calculateVariation(90, 100);
    expect(result).toBe(-10);
  });

  test("should return null when previous price is zero", () => {
    const result = calculateVariation(100, 0);
    expect(result).toBeNull();
  });

  test("should return null when previous price is missing", () => {
    const result = calculateVariation(100, null);
    expect(result).toBeNull();
  });

  test("should round variation to 4 decimals", () => {
    const result = calculateVariation(105.55555, 100);
    expect(result).toBe(5.5555);
  });
});

describe("transformCoinGeckoPayload", () => {
  test("should transform CoinGecko payload into market data records", () => {
    const rawRecord = {
      id: 1,
      fetched_at: "2026-04-24T14:00:00.000Z",
      payload: {
        bitcoin: {
          usd: 78000,
          usd_24h_change: 1.23456
        },
        ethereum: {
          usd: 2300,
          usd_24h_change: -0.98765
        },
        solana: {
          usd: 86,
          usd_24h_change: 0.12345
        }
      }
    };

    const result = transformCoinGeckoPayload(rawRecord);

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      symbol: "BTC",
      price: 78000,
      currency: "USD",
      variation24h: 1.2346,
      high24h: null,
      low24h: null,
      rawPriceId: 1,
      capturedAt: "2026-04-24T14:00:00.000Z"
    });

    expect(result[1].symbol).toBe("ETH");
    expect(result[1].price).toBe(2300);
    expect(result[1].variation24h).toBe(-0.9877);

    expect(result[2].symbol).toBe("SOL");
    expect(result[2].price).toBe(86);
    expect(result[2].variation24h).toBe(0.1235);
  });

  test("should throw an error when a coin is missing from payload", () => {
    const rawRecord = {
      id: 1,
      fetched_at: "2026-04-24T14:00:00.000Z",
      payload: {
        bitcoin: {
          usd: 78000,
          usd_24h_change: 1.2
        },
        ethereum: {
          usd: 2300,
          usd_24h_change: -0.5
        }
      }
    };

    expect(() => transformCoinGeckoPayload(rawRecord)).toThrow("Missing data for solana");
  });
});