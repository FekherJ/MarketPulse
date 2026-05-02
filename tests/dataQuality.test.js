const {
  runDataQualityChecks,
  hasFailedQualityChecks,
} = require("../src/services/dataQuality.service");

describe("dataQuality.service", () => {
  const ingestionRunId = 1;
  const expectedCoins = ["bitcoin", "ethereum"];

  const validPayload = {
    bitcoin: {
      usd: 65000,
      usd_market_cap: 1200000000000,
      usd_24h_vol: 25000000000,
      usd_24h_change: 2.5,
      last_updated_at: 1710000000,
    },
    ethereum: {
      usd: 3500,
      usd_market_cap: 420000000000,
      usd_24h_vol: 12000000000,
      usd_24h_change: 1.2,
      last_updated_at: 1710000000,
    },
  };

  const validTransformedRecords = [
    {
      coinId: "bitcoin",
      symbol: "BTC",
      price: 65000,
      marketCap: 1200000000000,
      volume24h: 25000000000,
      priceChange24h: 2.5,
      fetchedAt: new Date(),
    },
    {
      coinId: "ethereum",
      symbol: "ETH",
      price: 3500,
      marketCap: 420000000000,
      volume24h: 12000000000,
      priceChange24h: 1.2,
      fetchedAt: new Date(),
    },
  ];

  function findCheck(checks, checkName) {
    return checks.find((check) => check.checkName === checkName);
  }

  test("valid payload and valid transformed records should pass all checks", () => {
    const checks = runDataQualityChecks(
      ingestionRunId,
      validPayload,
      validTransformedRecords,
      expectedCoins,
    );

    expect(checks).toHaveLength(6);
    expect(checks.every((check) => check.status === "PASSED")).toBe(true);
    expect(hasFailedQualityChecks(checks)).toBe(false);

    expect(findCheck(checks, "PAYLOAD_NOT_EMPTY").status).toBe("PASSED");
    expect(findCheck(checks, "EXPECTED_COINS_PRESENT").status).toBe("PASSED");
    expect(findCheck(checks, "TRANSFORMED_RECORDS_NOT_EMPTY").status).toBe(
      "PASSED",
    );
    expect(findCheck(checks, "SYMBOL_PRESENT").status).toBe("PASSED");
    expect(findCheck(checks, "PRICE_NOT_NULL").status).toBe("PASSED");
    expect(findCheck(checks, "PRICE_POSITIVE").status).toBe("PASSED");
  });

  test("empty transformed records should fail TRANSFORMED_RECORDS_NOT_EMPTY", () => {
    const checks = runDataQualityChecks(
      ingestionRunId,
      validPayload,
      [],
      expectedCoins,
    );

    const transformedRecordsCheck = findCheck(
      checks,
      "TRANSFORMED_RECORDS_NOT_EMPTY",
    );

    expect(transformedRecordsCheck.status).toBe("FAILED");
    expect(transformedRecordsCheck.errorMessage).toBe(
      "No transformed records generated",
    );
    expect(hasFailedQualityChecks(checks)).toBe(true);
  });

  test("record without symbol should fail SYMBOL_PRESENT", () => {
    const recordsWithMissingSymbol = [
      {
        coinId: "bitcoin",
        symbol: null,
        price: 65000,
        marketCap: 1200000000000,
        volume24h: 25000000000,
        priceChange24h: 2.5,
        fetchedAt: new Date(),
      },
    ];

    const checks = runDataQualityChecks(
      ingestionRunId,
      validPayload,
      recordsWithMissingSymbol,
      expectedCoins,
    );

    const symbolCheck = findCheck(checks, "SYMBOL_PRESENT");

    expect(symbolCheck.status).toBe("FAILED");
    expect(symbolCheck.errorMessage).toBe("1 records have no symbol");
    expect(hasFailedQualityChecks(checks)).toBe(true);
  });

  test("record with null price should fail PRICE_NOT_NULL", () => {
    const recordsWithNullPrice = [
      {
        coinId: "bitcoin",
        symbol: "BTC",
        price: null,
        marketCap: 1200000000000,
        volume24h: 25000000000,
        priceChange24h: 2.5,
        fetchedAt: new Date(),
      },
    ];

    const checks = runDataQualityChecks(
      ingestionRunId,
      validPayload,
      recordsWithNullPrice,
      expectedCoins,
    );

    const priceNotNullCheck = findCheck(checks, "PRICE_NOT_NULL");

    expect(priceNotNullCheck.status).toBe("FAILED");
    expect(priceNotNullCheck.errorMessage).toBe("1 records have null price");
    expect(hasFailedQualityChecks(checks)).toBe(true);
  });

  test("record with negative price should fail PRICE_POSITIVE", () => {
    const recordsWithNegativePrice = [
      {
        coinId: "bitcoin",
        symbol: "BTC",
        price: -100,
        marketCap: 1200000000000,
        volume24h: 25000000000,
        priceChange24h: 2.5,
        fetchedAt: new Date(),
      },
    ];

    const checks = runDataQualityChecks(
      ingestionRunId,
      validPayload,
      recordsWithNegativePrice,
      expectedCoins,
    );

    const pricePositiveCheck = findCheck(checks, "PRICE_POSITIVE");

    expect(pricePositiveCheck.status).toBe("FAILED");
    expect(pricePositiveCheck.errorMessage).toBe(
      "1 records have non-positive price",
    );
    expect(hasFailedQualityChecks(checks)).toBe(true);
  });

  test("missing expected coin in payload should fail EXPECTED_COINS_PRESENT", () => {
    const payloadMissingEthereum = {
      bitcoin: validPayload.bitcoin,
    };

    const checks = runDataQualityChecks(
      ingestionRunId,
      payloadMissingEthereum,
      validTransformedRecords,
      expectedCoins,
    );

    const expectedCoinsCheck = findCheck(checks, "EXPECTED_COINS_PRESENT");

    expect(expectedCoinsCheck.status).toBe("FAILED");
    expect(expectedCoinsCheck.errorMessage).toBe(
      "Missing coins in payload: ethereum",
    );
    expect(hasFailedQualityChecks(checks)).toBe(true);
  });

  test("empty payload should fail PAYLOAD_NOT_EMPTY", () => {
    const checks = runDataQualityChecks(
      ingestionRunId,
      {},
      validTransformedRecords,
      expectedCoins,
    );

    const payloadCheck = findCheck(checks, "PAYLOAD_NOT_EMPTY");

    expect(payloadCheck.status).toBe("FAILED");
    expect(payloadCheck.errorMessage).toBe("Payload is empty or null");
    expect(hasFailedQualityChecks(checks)).toBe(true);
  });
});
