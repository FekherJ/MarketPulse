CREATE TABLE IF NOT EXISTS raw_prices (
  id SERIAL PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  price DECIMAL(18, 6) NOT NULL,
  currency VARCHAR(5) DEFAULT 'USD',
  variation24h DECIMAL(8, 4),
  high24h DECIMAL(18, 6),
  low24h DECIMAL(18, 6),
  raw_price_id INTEGER REFERENCES raw_prices(id),
  captured_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_market_data_symbol_captured_at
ON market_data(symbol, captured_at DESC);