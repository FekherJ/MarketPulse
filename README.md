# 📈 MarketPulse Pipeline

> # MarketPulse — Data Pipeline Monitoring API

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
- Redis cache for frequently accessed latest prices
- REST API exposure through Express.js
- Scheduled ingestion with `node-cron`
- Structured JSON logs with Winston
- Unit tests for transformation and cache logic
- AWS architecture mapping for a future cloud version

---

## ✅ Current Status

MarketPulse currently includes:

- Express.js REST API
- CoinGecko market data ingestion
- PostgreSQL storage for raw and processed market data
- ETL-style transformation layer
- Redis cache for latest BTC / ETH / SOL prices
- Scheduled ingestion every 60 seconds with `node-cron`
- Structured JSON logs with Winston
- Unit tests with Jest
- Docker Compose setup for PostgreSQL and Redis
- Prettier formatting

Planned next steps:

- Swagger / OpenAPI documentation
- AWS proof of concept: EventBridge Scheduler → Lambda → S3 → CloudWatch
- GraphQL endpoint
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
      ▼
Raw Data Store
PostgreSQL: raw_prices
(raw JSON payload)
      │
      ▼
Transformation Service
(normalize data + compute 24h variation)
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

| Layer            | Technology     | Purpose                         |
| ---------------- | -------------- | ------------------------------- |
| Runtime          | Node.js        | Backend runtime                 |
| API Framework    | Express.js     | REST API                        |
| Database         | PostgreSQL     | Raw and structured data storage |
| Cache            | Redis          | Latest price caching            |
| HTTP Client      | Axios          | CoinGecko API calls             |
| Scheduler        | node-cron      | Local scheduled ingestion       |
| Logging          | Winston        | Structured JSON logs            |
| Testing          | Jest           | Unit tests                      |
| Containerization | Docker Compose | Local PostgreSQL and Redis      |
| Formatting       | Prettier       | Code formatting                 |

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
├── db/
│   └── init.sql
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
│   │   └── cache.service.js
│   │
│   ├── repositories/
│   │   ├── rawData.repository.js
│   │   └── marketData.repository.js
│   │
│   ├── routes/
│   │   ├── prices.routes.js
│   │   └── health.routes.js
│   │
│   └── utils/
│       └── calculateVariation.js
│
└── tests/
    ├── transformation.test.js
    └── cache.test.js
```

---

## 🔌 API Endpoints

| Method | Endpoint                               | Description                                                      |
| ------ | -------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/health`                              | Checks API, PostgreSQL and Redis health                          |
| POST   | `/api/prices/fetch`                    | Manually triggers CoinGecko ingestion                            |
| GET    | `/api/prices/latest`                   | Returns latest prices for all tracked symbols                    |
| GET    | `/api/prices/latest/:symbol`           | Returns latest price for BTC, ETH or SOL using Redis cache first |
| GET    | `/api/prices/history/:symbol?limit=10` | Returns price history for a symbol                               |

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
    "rawPriceId": 1,
    "recordsCount": 3,
    "records": [
      {
        "id": 1,
        "symbol": "BTC",
        "price": "78000.000000",
        "currency": "USD"
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

Each ingestion cycle creates:

```text
1 row in raw_prices
3 rows in market_data: BTC, ETH, SOL
```

---

## 🔁 Pipeline Flow

```text
node-cron job or POST /api/prices/fetch
      │
      ▼
ingestion.service.fetchTransformAndStorePrices()
      │
      ├── Fetch prices from CoinGecko
      ├── Store raw JSON payload in raw_prices
      ├── Transform CoinGecko payload into market records
      ├── Store BTC / ETH / SOL records in market_data
      └── Refresh Redis cache keys:
          - latest:BTC
          - latest:ETH
          - latest:SOL
```

The local scheduled job uses `node-cron`. In a cloud version, this would naturally map to EventBridge Scheduler triggering a Lambda function.

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

- Price variation calculation
- CoinGecko payload transformation
- Missing coin handling
- Redis cache set/get/delete logic
- Cache hit and cache miss behavior
- Redis key normalization
- Cache TTL usage

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
- [x] Express.js REST API
- [x] Health check endpoint
- [x] CoinGecko ingestion service
- [x] ETL-style transformation layer
- [x] Redis cache for latest prices
- [x] Scheduled ingestion with `node-cron`
- [x] Structured JSON logging with Winston
- [x] Unit tests for transformation logic
- [x] Unit tests for cache service
- [x] Prettier formatting
- [ ] Swagger / OpenAPI documentation
- [ ] AWS proof of concept: EventBridge Scheduler → Lambda → S3 → CloudWatch
- [ ] GraphQL endpoint
- [ ] ELK / Kibana dashboard

---

## 🗣️ Interview Story

I built MarketPulse to close the gap between functional product delivery and hands-on understanding of modern backend and data architectures.

The pipeline ingests crypto market prices from CoinGecko on a scheduled basis. Raw responses are stored before transformation, which acts as a local raw landing zone similar to what S3 would provide in a cloud architecture. The transformation layer normalizes the payload into structured BTC, ETH and SOL market records, which are stored in PostgreSQL.

I added Redis as a caching layer for frequently requested latest prices. The API checks Redis first, falls back to PostgreSQL on cache miss, and refreshes the cache with a TTL. I also added structured JSON logs and unit tests around the transformation and cache layers.

Locally, scheduled ingestion is handled with `node-cron`. In an AWS version, this would map naturally to EventBridge Scheduler triggering Lambda functions, with S3 for raw storage, RDS for structured data, ElastiCache for Redis, API Gateway for HTTP exposure, and CloudWatch for logs.

The goal was not to become a cloud engineer, but to develop enough technical depth to better understand, challenge and discuss architecture decisions as a Technical Product Owner or Technical Business Analyst.

---

## 👤 Author

**Fekher** — Technical Product Owner / Technical Business Analyst  
Financial markets, data pipelines and cloud-ready architectures

GitHub: [FekherJ](https://github.com/FekherJ)
