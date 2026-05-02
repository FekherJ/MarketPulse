# 📈 MarketPulse — Data Pipeline Monitoring API

MarketPulse is a backend/data engineering learning project that simulates a production-grade data pipeline.

It ingests external market data, stores raw payloads, transforms them into structured PostgreSQL records, exposes them through a REST API, caches latest values in Redis, and tracks the ingestion lifecycle through logs and database records.

The crypto market API is used only as an external data source. The main goal of the project is to demonstrate data ingestion, transformation, storage, caching, monitoring, SQL analysis and cloud-ready backend architecture.

---

## 🎯 Goal

MarketPulse is a technical learning project designed to answer one business question:

**"What is happening on the crypto market right now — and what happened recently?"**

The project demonstrates a complete backend/data pipeline flow:

- External market data ingestion from CoinGecko
- Raw payload storage in PostgreSQL
- ETL-style transformation into structured market records
- Data quality checks before inserting structured data
- Ingestion run tracking for pipeline observability
- Redis cache for frequently accessed latest prices
- REST API exposure through Express.js
- Scheduled ingestion with `node-cron`
- Structured JSON logs with Winston
- SQL analysis queries for monitoring and diagnostics
- SQL index and performance documentation
- Unit and API route integration tests for transformation, cache, data quality, ingestion orchestration and Express routes
- GitHub Actions CI for automated format checks and test execution
- AWS architecture mapping for a future cloud version

---

## ✅ Current Status

MarketPulse currently includes:

- Express.js REST API
- CoinGecko market data ingestion
- PostgreSQL storage for raw and processed market data
- PostgreSQL ingestion run tracking through `ingestion_runs`
- Data quality checks stored in `data_quality_checks`
- ETL-style transformation layer
- Redis cache for latest BTC / ETH / SOL prices
- Scheduled ingestion every 60 seconds with `node-cron`
- Monitoring API for ingestion runs and quality checks
- Structured JSON logs with Winston
- SQL analysis queries for monitoring and diagnostics
- SQL index and performance documentation
- Unit and API route integration tests with Jest and Supertest for transformation, cache, data quality and ingestion orchestration
- Docker Compose setup for PostgreSQL and Redis
- Prettier formatting
- GitHub Actions CI for automated formatting checks and test execution

Planned next steps:

- Swagger / OpenAPI documentation
- Additional integration tests for ingestion and monitoring endpoints
- AWS proof of concept: EventBridge Scheduler → Lambda → S3 → CloudWatch
- ELK / Kibana dashboard

---

## 🏗️ Architecture

### V1 — Local implementation

```text
CoinGecko API
      │
      ▼
Scheduled Job / Manual Trigger
(node-cron or POST /api/prices/fetch)
      │
      ▼
Ingestion Service
(fetch BTC, ETH, SOL prices)
      │
      ├──► ingestion_runs
      │    (track status, duration, records, errors)
      │
      ▼
Raw Data Store
PostgreSQL: raw_prices
(raw JSON payload)
      │
      ▼
Transformation Service
(normalize external payload into internal records)
      │
      ▼
Data Quality Checks
PostgreSQL: data_quality_checks
(validate payload and transformed records)
      │
      ▼
Processed Data Store
PostgreSQL: market_data
(structured market records)
      │
      ▼
Redis Cache
latest:BTC / latest:ETH / latest:SOL
      │
      ▼
REST API
Express.js
```

The current implementation is local, but the architecture is designed so each component can be mapped to a cloud-native AWS equivalent later.

---

## 🧪 Testing and CI

MarketPulse includes automated tests for the main backend/data pipeline components and API routes:

- cache service
- transformation service
- data quality service
- ingestion orchestration service
- API route integration tests with Supertest

Run the test suite locally:

```bash
npm test
```

Check formatting:

```bash
npm run format:check
```

Format the codebase:

```bash
npm run format
```

The project also includes a GitHub Actions CI workflow that runs automatically on every push and pull request to `main`.

The CI pipeline performs:

- dependency installation
- Prettier formatting check
- Jest test suite execution

This ensures that the project can be installed, formatted and tested successfully in a clean environment, not only on the local machine.

---

## ☁️ AWS Mapping

The AWS version is not implemented yet. This table explains how the current local components would map to AWS services in a future version.

| Local Component             | AWS Equivalent        | Purpose                                    |
| --------------------------- | --------------------- | ------------------------------------------ |
| node-cron scheduled job     | EventBridge Scheduler | Trigger ingestion periodically             |
| Ingestion service           | AWS Lambda            | Fetch data from CoinGecko                  |
| Raw PostgreSQL JSON storage | S3 raw bucket         | Store immutable raw payloads               |
| Transformation service      | AWS Lambda            | Transform raw data into structured records |
| PostgreSQL processed data   | RDS PostgreSQL        | Store structured market records            |
| Redis cache                 | ElastiCache Redis     | Cache latest prices                        |
| Express REST API            | API Gateway + Lambda  | Expose data through HTTP endpoints         |
| Winston logs                | CloudWatch Logs       | Centralized logs and monitoring            |

Future AWS target flow:

```text
EventBridge Scheduler
      │
      ▼
Lambda Ingestion
      │
      ├──► S3 Raw Bucket
      │
      └──► EventBridge Event
                │
                ▼
        Lambda Transformation
                │
                ├──► RDS PostgreSQL
                └──► ElastiCache Redis
                            │
                            ▼
                    API Gateway + Lambda
```

---

## 🛠️ Tech Stack

| Layer            | Technology      | Purpose                              |
| ---------------- | --------------- | ------------------------------------ |
| Runtime          | Node.js         | Backend runtime                      |
| API Framework    | Express.js      | REST API                             |
| Database         | PostgreSQL      | Raw and structured data storage      |
| Cache            | Redis           | Latest price caching                 |
| HTTP Client      | Axios           | CoinGecko API calls                  |
| Scheduler        | node-cron       | Local scheduled ingestion            |
| Logging          | Winston         | Structured JSON logs                 |
| Testing          | Jest, Supertest | Unit and API route integration tests |
| CI               | GitHub Actions  | Automated checks on push/PR          |
| Containerization | Docker Compose  | Local PostgreSQL and Redis           |
| Formatting       | Prettier        | Code formatting                      |

---

## 📁 Project Structure

```text
marketpulse-pipeline/
│
├── README.md
├── docker-compose.yml
├── .env.example
├── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── db/
│   └── init.sql
│
├── docs/
│   └── sql-analysis/
│       ├── marketpulse_analysis.sql
│       └── indexes.md
│
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── logger.js
│   │
│   ├── jobs/
│   │   └── priceIngestion.job.js
│   │
│   ├── services/
│   │   ├── ingestion.service.js
│   │   ├── transformation.service.js
│   │   ├── dataQuality.service.js
│   │   └── cache.service.js
│   │
│   ├── repositories/
│   │   ├── rawData.repository.js
│   │   ├── marketData.repository.js
│   │   ├── ingestionRun.repository.js
│   │   └── dataQuality.repository.js
│   │
│   ├── routes/
│   │   ├── prices.routes.js
│   │   ├── ingestion.routes.js
│   │   └── health.routes.js
│   │
│   └── utils/
│       └── calculateVariation.js
│
└── tests/
    ├── api.test.js
    ├── cache.test.js
    ├── dataQuality.test.js
    ├── ingestion.test.js
    └── transformation.test.js
```

---

## 🔌 API Endpoints

| Method | Endpoint                                  | Description                                                      |
| ------ | ----------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/health`                                 | Checks API, PostgreSQL and Redis health                          |
| POST   | `/api/prices/fetch`                       | Manually triggers CoinGecko ingestion                            |
| GET    | `/api/prices/latest`                      | Returns latest prices for all tracked symbols                    |
| GET    | `/api/prices/latest/:symbol`              | Returns latest price for BTC, ETH or SOL using Redis cache first |
| GET    | `/api/prices/history/:symbol?limit=10`    | Returns price history for a symbol                               |
| GET    | `/api/ingestions/runs`                    | Returns latest ingestion runs                                    |
| GET    | `/api/ingestions/runs/failed`             | Returns failed ingestion runs                                    |
| GET    | `/api/ingestions/runs/:id`                | Returns details of a specific ingestion run                      |
| GET    | `/api/ingestions/runs/:id/quality-checks` | Returns data quality checks for a specific ingestion run         |
| GET    | `/api/ingestions/quality-checks/failed`   | Returns failed data quality checks                               |

---

## 🧪 Example Usage

### Health check

```bash
curl http://localhost:3000/health
```

Example response:

```json
{
  "status": "UP",
  "service": "marketpulse-api",
  "timestamp": "2026-04-24T14:00:00.000Z",
  "dependencies": {
    "database": "UP",
    "redis": "UP"
  }
}
```

### Trigger manual ingestion

```bash
curl -X POST http://localhost:3000/api/prices/fetch
```

Example response:

```json
{
  "status": "SUCCESS",
  "message": "Prices fetched, transformed and stored successfully",
  "data": {
    "ingestionRunId": 7,
    "rawPriceId": 2903,
    "recordsCount": 3,
    "records": [
      {
        "id": 8707,
        "symbol": "BTC",
        "price": "78241.000000",
        "currency": "USD",
        "variation24h": "2.5365",
        "high24h": null,
        "low24h": null,
        "raw_price_id": 2903,
        "captured_at": "2026-05-01T14:40:29.478Z"
      }
    ]
  }
}
```

### Get latest prices

```bash
curl http://localhost:3000/api/prices/latest
```

### Get latest BTC price

```bash
curl http://localhost:3000/api/prices/latest/BTC
```

Example response:

```json
{
  "status": "SUCCESS",
  "source": "cache",
  "data": {
    "id": 1,
    "symbol": "BTC",
    "price": "78000.000000",
    "currency": "USD",
    "variation24h": "0.5124",
    "high24h": null,
    "low24h": null,
    "raw_price_id": 1,
    "captured_at": "2026-04-24T14:00:00.000Z"
  }
}
```

### Get BTC history

```bash
curl "http://localhost:3000/api/prices/history/BTC?limit=10"
```

### Get ingestion runs

```bash
curl http://localhost:3000/api/ingestions/runs
```

### Get failed ingestion runs

```bash
curl http://localhost:3000/api/ingestions/runs/failed
```

### Get quality checks for an ingestion run

```bash
curl http://localhost:3000/api/ingestions/runs/7/quality-checks
```

Example response:

```json
{
  "status": "SUCCESS",
  "count": 6,
  "data": [
    {
      "id": 1,
      "ingestion_run_id": 7,
      "check_name": "PAYLOAD_NOT_EMPTY",
      "status": "PASSED",
      "checked_at": "2026-05-01T14:40:29.483Z",
      "error_message": null
    }
  ]
}
```

### Get failed quality checks

```bash
curl http://localhost:3000/api/ingestions/quality-checks/failed
```

---

## 📦 Data Model

### `raw_prices`

Stores the original CoinGecko response before transformation.

```sql
CREATE TABLE IF NOT EXISTS raw_prices (
  id SERIAL PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW()
);
```

### `market_data`

Stores structured market data records.

```sql
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
```

### `ingestion_runs`

Tracks every execution of the ingestion pipeline.

```sql
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_ms INTEGER,
    records_fetched INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    error_message TEXT
);
```

Each ingestion cycle creates one row in `ingestion_runs`.

Typical statuses:

```text
RUNNING
SUCCESS
FAILED
```

### `data_quality_checks`

Stores the result of data quality validations executed during each ingestion run.

```sql
CREATE TABLE IF NOT EXISTS data_quality_checks (
    id SERIAL PRIMARY KEY,
    ingestion_run_id INTEGER REFERENCES ingestion_runs(id),
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    checked_at TIMESTAMP DEFAULT NOW(),
    error_message TEXT
);
```

Current quality checks:

```text
PAYLOAD_NOT_EMPTY
EXPECTED_COINS_PRESENT
TRANSFORMED_RECORDS_NOT_EMPTY
SYMBOL_PRESENT
PRICE_NOT_NULL
PRICE_POSITIVE
```

Each successful ingestion cycle creates:

```text
1 row in raw_prices
1 row in ingestion_runs
6 rows in data_quality_checks
3 rows in market_data: BTC, ETH, SOL
```

If a data quality check fails, the quality check results are still stored, the ingestion run is marked as `FAILED`, and structured market data is not inserted.

---

## 🔁 Pipeline Flow

```text
node-cron job or POST /api/prices/fetch
      │
      ▼
ingestion.service.fetchTransformAndStorePrices()
      │
      ├── Create ingestion run with status RUNNING
      ├── Fetch prices from CoinGecko
      ├── Store raw JSON payload in raw_prices
      ├── Transform CoinGecko payload into market records
      ├── Run data quality checks
      ├── Store quality check results in data_quality_checks
      ├── Stop the pipeline if quality checks fail
      ├── Store BTC / ETH / SOL records in market_data
      ├── Refresh Redis cache keys:
      │     - latest:BTC
      │     - latest:ETH
      │     - latest:SOL
      └── Mark ingestion run as SUCCESS or FAILED
```

The local scheduled job uses `node-cron`. In a cloud version, this would naturally map to EventBridge Scheduler triggering a Lambda function.

---

## 🧩 Data Engineering Features

MarketPulse is designed to demonstrate backend and data engineering concepts beyond a simple API.

### Raw data storage

The original CoinGecko payload is stored in `raw_prices` before transformation. This allows auditability and potential replay if the transformation logic changes.

### Ingestion run tracking

Each pipeline execution is tracked in `ingestion_runs` with:

- source
- status
- start and end timestamps
- duration
- records fetched
- records inserted
- error message if the run fails

This makes the pipeline observable and easier to troubleshoot.

### Data quality checks

Each ingestion run executes quality checks before inserting structured records into `market_data`.

Current checks validate that:

- the payload is not empty;
- expected coins are present;
- transformed records are generated;
- each record has a symbol;
- prices are not null;
- prices are positive.

If a quality check fails, the check results are stored in `data_quality_checks`, the ingestion run is marked as `FAILED`, and the pipeline stops before inserting structured market data.

### SQL monitoring and diagnostics

The project includes SQL queries under `docs/sql-analysis/` to monitor:

- latest prices per symbol;
- ingestion success rate;
- ingestion duration;
- records inserted per day;
- failed quality checks;
- quality check summary per ingestion run.

### Performance notes

The project documents SQL index usage in:

```text
docs/sql-analysis/indexes.md
```

The main index supports price history queries by symbol and timestamp:

```sql
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_captured_at
ON market_data(symbol, captured_at DESC);
```

---

## ⚡ Redis Cache

The latest price endpoint checks Redis first:

```text
GET /api/prices/latest/BTC
      │
      ├── Cache hit  → return Redis value with source: "cache"
      └── Cache miss → query PostgreSQL, refresh Redis, return source: "database"
```

Redis keys:

```text
latest:BTC
latest:ETH
latest:SOL
```

Cache TTL:

```text
300 seconds
```

---

## 📊 Logging

The application uses structured JSON logs with Winston.

Example logs:

```json
{
  "level": "info",
  "message": {
    "event": "INGESTION_START",
    "source": "CoinGecko",
    "coins": ["bitcoin", "ethereum", "solana"]
  },
  "timestamp": "2026-04-24T14:00:00.000Z"
}
```

```json
{
  "level": "info",
  "message": {
    "event": "CACHE_HIT",
    "key": "latest:BTC"
  },
  "timestamp": "2026-04-24T14:00:10.000Z"
}
```

These logs are designed to be compatible with future observability tools such as ELK or CloudWatch.

---

## ✅ Tests

The project includes unit tests for:

- price variation calculation
- CoinGecko payload transformation
- missing coin handling
- Redis cache set/get/delete logic
- cache hit and cache miss behavior
- Redis key normalization
- cache TTL usage
- data quality validation rules
- ingestion orchestration success path
- ingestion orchestration failure path
- API health check route
- manual ingestion trigger route
- latest price routes
- price history route
- ingestion monitoring routes
- quality check monitoring routes

The API route tests use Supertest with mocked repositories and services, so they validate Express routing, status codes and response structures without requiring PostgreSQL, Redis or CoinGecko during CI.

The ingestion orchestration tests verify that:

- data quality checks are persisted before failing an ingestion run;
- market data is not inserted when quality checks fail;
- failed ingestion runs are marked as `FAILED`;
- successful ingestion runs are marked as `SUCCESS`.

Run tests:

```bash
npm test
```

Run formatting:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js >= 18
- Docker
- Docker Compose
- Git

### Run locally

```bash
git clone https://github.com/FekherJ/MarketPulse.git
cd MarketPulse
cp .env.example .env
docker-compose up -d
npm install
npm run dev
```

The API runs on:

```text
http://localhost:3000
```

The scheduled ingestion job starts automatically when the server starts.

### Stop local infrastructure

```bash
docker-compose down
```

### Check running containers

```bash
docker ps
```

---

## 🔐 Environment Variables

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketpulse
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
FETCH_INTERVAL_SECONDS=60
```

---

## 🚀 Roadmap

- [x] Local architecture design
- [x] Docker Compose setup for PostgreSQL and Redis
- [x] PostgreSQL schema: `raw_prices` and `market_data`
- [x] PostgreSQL schema: `ingestion_runs`
- [x] PostgreSQL schema: `data_quality_checks`
- [x] Express.js REST API
- [x] Health check endpoint
- [x] CoinGecko ingestion service
- [x] ETL-style transformation layer
- [x] Redis cache for latest prices
- [x] Scheduled ingestion with `node-cron`
- [x] Ingestion run tracking
- [x] Monitoring API for ingestion runs
- [x] Data quality checks
- [x] API endpoints for quality checks
- [x] Structured JSON logging with Winston
- [x] SQL analysis queries
- [x] SQL index and performance documentation
- [x] Unit tests for transformation logic
- [x] Unit tests for cache service
- [x] Unit tests for data quality service
- [x] Unit tests for ingestion orchestration
- [x] Prettier formatting
- [x] GitHub Actions CI
- [ ] Swagger / OpenAPI documentation
- [x] API route integration tests with Supertest
- [ ] Deeper end-to-end integration tests with PostgreSQL and Redis
- [ ] AWS proof of concept: EventBridge Scheduler → Lambda → S3 → CloudWatch
- [ ] ELK / Kibana dashboard

---

## 🧭 Project Rationale

I built MarketPulse to strengthen my hands-on understanding of backend, data pipeline and integration engineering concepts.

The project ingests external market data from CoinGecko on a scheduled basis. Raw responses are stored before transformation, which acts as a local raw landing zone similar to what S3 would provide in a cloud architecture. The transformation layer normalizes the payload into structured BTC, ETH and SOL market records, which are stored in PostgreSQL.

The project includes an ingestion monitoring layer through the `ingestion_runs` table. Each pipeline execution is tracked with a status, duration, number of records fetched, number of records inserted and error message if the run fails.

I also added a data quality layer through the `data_quality_checks` table. Each ingestion run validates that the payload is not empty, expected assets are present, transformed records exist, symbols are present, and prices are valid before storing structured data. If a check fails, the results are persisted and the ingestion run is marked as failed.

Redis is used as a caching layer for frequently requested latest prices. The API checks Redis first, falls back to PostgreSQL on cache miss, and refreshes the cache with a TTL.

The project also includes structured JSON logs, SQL analysis queries, performance notes around indexes, automated tests for the cache, transformation, data quality and ingestion orchestration layers, and a GitHub Actions CI workflow that checks formatting and runs the test suite on every push.

Locally, scheduled ingestion is handled with `node-cron`. In an AWS version, this could map to EventBridge Scheduler triggering Lambda functions, with S3 for raw storage, RDS PostgreSQL for structured data, ElastiCache for Redis, API Gateway for HTTP exposure, and CloudWatch for logs.

The goal of this project is to build practical experience around data ingestion, transformation, quality checks, observability, SQL diagnostics, caching and cloud-ready backend architecture.

---

## 👤 Author

**Fekher** — Technical Business Analyst transitioning toward Data / Integration Engineering  
Financial systems, data pipelines, SQL, APIs and cloud-ready architectures

GitHub: [FekherJ](https://github.com/FekherJ)
