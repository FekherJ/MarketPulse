-- ============================================================
-- MarketPulse SQL Analysis
-- Purpose:
-- Useful SQL queries for monitoring ingestion runs, data quality,
-- and market data stored in PostgreSQL.
-- ============================================================

-- 1. Latest price per symbol
SELECT DISTINCT ON (symbol)
    symbol,
    price,
    currency,
    variation24h,
    captured_at
FROM market_data
ORDER BY symbol, captured_at DESC;

-- 2. Price history for a specific symbol
SELECT
    symbol,
    price,
    currency,
    variation24h,
    captured_at
FROM market_data
WHERE symbol = 'BTC'
ORDER BY captured_at DESC
LIMIT 10;

-- 3. Ingestion success rate by status
SELECT
    status,
    COUNT(*) AS run_count
FROM ingestion_runs
GROUP BY status
ORDER BY run_count DESC;

-- 4. Average ingestion duration by status
SELECT
    status,
    ROUND(AVG(duration_ms), 2) AS avg_duration_ms
FROM ingestion_runs
WHERE duration_ms IS NOT NULL
GROUP BY status;

-- 5. Records inserted per day
SELECT
    DATE(started_at) AS ingestion_date,
    SUM(records_inserted) AS total_records_inserted
FROM ingestion_runs
GROUP BY DATE(started_at)
ORDER BY ingestion_date DESC;

-- 6. Latest ingestion runs
SELECT
    id,
    source,
    status,
    duration_ms,
    records_fetched,
    records_inserted,
    error_message,
    started_at,
    ended_at
FROM ingestion_runs
ORDER BY started_at DESC
LIMIT 20;

-- 7. Quality checks status overview
SELECT
    status,
    COUNT(*) AS check_count
FROM data_quality_checks
GROUP BY status
ORDER BY check_count DESC;

-- 8. Quality checks by ingestion run
SELECT
    ingestion_run_id,
    status,
    COUNT(*) AS check_count
FROM data_quality_checks
GROUP BY ingestion_run_id, status
ORDER BY ingestion_run_id DESC, status;

-- 9. Failed quality checks
SELECT
    ingestion_run_id,
    check_name,
    error_message,
    checked_at
FROM data_quality_checks
WHERE status = 'FAILED'
ORDER BY checked_at DESC;

-- 10. Latest ingestion runs with quality check summary
SELECT
    ir.id AS ingestion_run_id,
    ir.source,
    ir.status AS ingestion_status,
    ir.duration_ms,
    ir.records_fetched,
    ir.records_inserted,
    COUNT(dqc.id) AS total_quality_checks,
    SUM(CASE WHEN dqc.status = 'FAILED' THEN 1 ELSE 0 END) AS failed_quality_checks,
    ir.started_at
FROM ingestion_runs ir
LEFT JOIN data_quality_checks dqc
    ON ir.id = dqc.ingestion_run_id
GROUP BY
    ir.id,
    ir.source,
    ir.status,
    ir.duration_ms,
    ir.records_fetched,
    ir.records_inserted,
    ir.started_at
ORDER BY ir.started_at DESC;

-- 11. Average price by symbol
SELECT
    symbol,
    ROUND(AVG(price), 2) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price,
    COUNT(*) AS records_count
FROM market_data
GROUP BY symbol
ORDER BY symbol;

-- 12. Data volume by symbol
SELECT
    symbol,
    COUNT(*) AS records_count,
    MIN(captured_at) AS first_capture,
    MAX(captured_at) AS last_capture
FROM market_data
GROUP BY symbol
ORDER BY records_count DESC;