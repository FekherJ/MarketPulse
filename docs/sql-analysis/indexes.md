# SQL Indexes and Performance Notes

## Existing index

```sql
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_captured_at
ON market_data(symbol, captured_at DESC);
```

## Why this index exists

This index supports queries that retrieve the latest price or historical prices for a specific symbol.

The most common access pattern is:

```sql
SELECT *
FROM market_data
WHERE symbol = 'BTC'
ORDER BY captured_at DESC
LIMIT 10;
```

This query needs to:

1. filter rows by `symbol`;
2. order them by `captured_at` from newest to oldest;
3. return only the latest rows.

The composite index on `(symbol, captured_at DESC)` helps PostgreSQL find the relevant symbol and read the newest records efficiently.

## Query supported by this index

```sql
EXPLAIN
SELECT *
FROM market_data
WHERE symbol = 'BTC'
ORDER BY captured_at DESC
LIMIT 10;
```

## Expected benefit

Without this index, PostgreSQL may need to scan many rows and sort them by `captured_at`.

With this index, PostgreSQL can use the index to directly access the latest records for a given symbol.

## Notes

This index is useful because the query filters by the first indexed column:

```sql
WHERE symbol = 'BTC'
```

and orders by the second indexed column:

```sql
ORDER BY captured_at DESC
```

This matches the index structure:

```sql
(symbol, captured_at DESC)
```

## Future indexes to consider

If the number of ingestion runs grows significantly, we may add:

```sql
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at
ON ingestion_runs(started_at DESC);
```

This would help queries like:

```sql
SELECT *
FROM ingestion_runs
ORDER BY started_at DESC
LIMIT 20;
```

If quality checks become large, we may add:

```sql
CREATE INDEX IF NOT EXISTS idx_data_quality_checks_status_checked_at
ON data_quality_checks(status, checked_at DESC);
```

This would help queries like:

```sql
SELECT *
FROM data_quality_checks
WHERE status = 'FAILED'
ORDER BY checked_at DESC
LIMIT 20;
```

## Why indexes should not be added blindly

Indexes improve read performance, but they also have costs:

- they use disk space;
- they slow down inserts and updates slightly;
- they must be maintained by the database.

So indexes should be added based on real query patterns, not randomly.