function createCheckResult(ingestionRunId, checkName, status, errorMessage = null) {
  return {
    ingestionRunId,
    checkName,
    status,
    errorMessage,
  };
}

function runDataQualityChecks(ingestionRunId, payload, transformedRecords, expectedCoins) {
  const checks = [];

  // Check 1: payload is not empty
  if (payload && Object.keys(payload).length > 0) {
    checks.push(createCheckResult(ingestionRunId, "PAYLOAD_NOT_EMPTY", "PASSED"));
  } else {
    checks.push(
      createCheckResult(
        ingestionRunId,
        "PAYLOAD_NOT_EMPTY",
        "FAILED",
        "Payload is empty or null"
      )
    );
  }

  // Check 2: all expected coins are present in raw payload
  const missingCoins = expectedCoins.filter((coin) => !payload || !payload[coin]);

  if (missingCoins.length === 0) {
    checks.push(createCheckResult(ingestionRunId, "EXPECTED_COINS_PRESENT", "PASSED"));
  } else {
    checks.push(
      createCheckResult(
        ingestionRunId,
        "EXPECTED_COINS_PRESENT",
        "FAILED",
        `Missing coins in payload: ${missingCoins.join(", ")}`
      )
    );
  }

  // Check 3: transformed records exist
  if (transformedRecords && transformedRecords.length > 0) {
    checks.push(createCheckResult(ingestionRunId, "TRANSFORMED_RECORDS_NOT_EMPTY", "PASSED"));
  } else {
    checks.push(
      createCheckResult(
        ingestionRunId,
        "TRANSFORMED_RECORDS_NOT_EMPTY",
        "FAILED",
        "No transformed records generated"
      )
    );
  }

  // Check 4: symbols are present
  const recordsWithoutSymbol = transformedRecords.filter((record) => !record.symbol);

  if (recordsWithoutSymbol.length === 0) {
    checks.push(createCheckResult(ingestionRunId, "SYMBOL_PRESENT", "PASSED"));
  } else {
    checks.push(
      createCheckResult(
        ingestionRunId,
        "SYMBOL_PRESENT",
        "FAILED",
        `${recordsWithoutSymbol.length} records have no symbol`
      )
    );
  }

  // Check 5: prices are not null
  const recordsWithNullPrice = transformedRecords.filter(
    (record) => record.price === null || record.price === undefined
  );

  if (recordsWithNullPrice.length === 0) {
    checks.push(createCheckResult(ingestionRunId, "PRICE_NOT_NULL", "PASSED"));
  } else {
    checks.push(
      createCheckResult(
        ingestionRunId,
        "PRICE_NOT_NULL",
        "FAILED",
        `${recordsWithNullPrice.length} records have null price`
      )
    );
  }

  // Check 6: prices are positive
  const recordsWithInvalidPrice = transformedRecords.filter(
    (record) => Number(record.price) <= 0
  );

  if (recordsWithInvalidPrice.length === 0) {
    checks.push(createCheckResult(ingestionRunId, "PRICE_POSITIVE", "PASSED"));
  } else {
    checks.push(
      createCheckResult(
        ingestionRunId,
        "PRICE_POSITIVE",
        "FAILED",
        `${recordsWithInvalidPrice.length} records have non-positive price`
      )
    );
  }

  return checks;
}

function hasFailedQualityChecks(checks) {
  return checks.some((check) => check.status === "FAILED");
}

module.exports = {
  runDataQualityChecks,
  hasFailedQualityChecks,
};