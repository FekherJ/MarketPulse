# 📈 MarketPulse Pipeline

> An event-driven data pipeline for real-time crypto market data — ingestion, transformation, caching, REST/GraphQL exposure, and observability.

---

## 🎯 Goal

Build a production-like data pipeline that answers one business question:

**"What is happening on the crypto market right now — and what happened in the last 24h?"**

This project covers the full lifecycle of a data product:

- External data ingestion from a public API
- Raw data storage and structured transformation (ETL)
- Event-driven processing between services
- Caching layer for performance
- REST API exposure with Swagger documentation
- Structured logging and observability
- Cloud-ready architecture (AWS mapping)

---

## 🏗️ Architecture

### V1 — Local (current)

```
┌─────────────────────┐
│   CoinGecko API      │  External data source (free, no auth required)
└────────┬────────────┘
         │  HTTP polling (every 60s via cron job)
         ▼
┌─────────────────────┐
│  Ingestion Service   │  Fetches BTC, ETH, SOL prices
│  (Node.js)          │  Validates and stores raw response as-is
└────────┬────────────┘
         │  Emits: PriceFetchedEvent
         ▼
┌─────────────────────┐
│  Raw Data Store      │  PostgreSQL — stores immutable raw API responses
│  (PostgreSQL)        │  Useful for reprocessing / audit trail
└────────┬────────────┘
         │  Event triggers transformation
         ▼
┌─────────────────────┐
│ Transformation Svc   │  Cleans, normalizes, computes 24h variation
│  (Node.js)          │  Produces structured MarketData records
└────────┬────────────┘
         │  Emits: PriceTransformedEvent
         ▼
┌─────────────────────┐     ┌──────────────────────┐
│ Processed Data Store │     │   Alert Service       │
│  (PostgreSQL)        │     │   (price variation    │
│  Structured records  │     │    threshold alerts)  │
└────────┬────────────┘     └──────────────────────┘
         │
         ▼
┌─────────────────────┐     ┌──────────────────────┐
│   Cache Layer        │     │   REST API            │
│   (Redis)            │◄────│   (Express)           │
│   latest:BTC/ETH/SOL │     │   /api/prices/...     │
└─────────────────────┘     └──────────────────────┘
                                        │
                             ┌──────────────────────┐
                             │   Swagger Docs        │
                             │   /api/docs           │
                             └──────────────────────┘
```

**Logging layer (transversal) :** Winston → structured JSON logs → ELK-ready

---

### V2 — AWS Cloud mapping

| V1 Local Component     | AWS Equivalent                     | Justification                                  |
| ---------------------- | ---------------------------------- | ---------------------------------------------- |
| Cron job (Node.js)     | AWS Lambda + EventBridge Scheduler | Serverless, no server to manage                |
| Raw storage (Postgres) | S3 (raw bucket)                    | Cost-effective, durable, queryable via Athena  |
| PriceFetchedEvent      | EventBridge Event                  | Decouples ingestion from transformation        |
| Transformation service | AWS Lambda                         | Triggered by EventBridge, stateless processing |
| Processed data store   | RDS (PostgreSQL)                   | Structured queries, relational integrity       |
| Redis cache            | ElastiCache (Redis)                | Managed, multi-AZ, same Redis API              |
| REST API               | API Gateway + Lambda               | Serverless API exposure, scales automatically  |
| Winston logs           | CloudWatch Logs                    | Centralized observability, metrics, alerts     |
| Docker Compose (local) | ECS Fargate (optional)             | Container orchestration without managing EC2   |

```
CoinGecko API
      │
      ▼
Lambda (Ingestion)
      │
      ├──► S3 Raw Bucket (raw JSON responses)
      │
      └──► EventBridge (PriceFetchedEvent)
                │
                ▼
         Lambda (Transformation)
                │
                ├──► RDS PostgreSQL (structured MarketData)
                │
                └──► ElastiCache Redis (latest prices)
                              │
                              ▼
                       API Gateway
                              │
                              ▼
                        Lambda (API Handler)
                              │
                              ▼
                           Client
```

---

## 🛠️ Tech Stack

| Layer            | Technology                                                               | Why                                               |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Runtime          | Node.js                                                                  | Lightweight, async, widely used in fintech APIs   |
| API Framework    | Express.js                                                               | Standard, minimal, production-proven              |
| Database         | PostgreSQL                                                               | Relational, ACID, standard in financial systems   |
| Cache            | Redis                                                                    | In-memory, sub-millisecond, industry standard     |
| HTTP Client      | Axios                                                                    | Promise-based, interceptors, error handling       |
| Scheduler        | node-cron                                                                | Cron-style jobs, replaces EventBridge locally     |
| Logging          | Winston                                                                  | Structured JSON logs, log levels, transports      |
| API Docs         | Swagger (OpenAPI)                                                        | Self-documenting API, standard in API-first teams |
| Containerization | Docker + Compose                                                         | Reproducible env, cloud-ready packaging           |
| Testing          | Jest                                                                     | Unit tests on transformation logic                |
| Cloud (V2)       | AWS (Lambda, S3, EventBridge, RDS, ElastiCache, API Gateway, CloudWatch) | Industry standard                                 |

---

## 📁 Project Structure

```
marketpulse-pipeline/
│
├── README.md
├── docker-compose.yml           # PostgreSQL + Redis + App
├── .env.example                 # Environment variables template
│
├── src/
│   ├── app.js                   # Express app setup
│   ├── server.js                # Server entry point
│   │
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection pool
│   │   ├── redis.js             # Redis client
│   │   └── logger.js            # Winston structured logger
│   │
│   ├── jobs/
│   │   └── priceIngestion.job.js  # Cron: fetch prices every 60s
│   │
│   ├── services/
│   │   ├── ingestion.service.js   # Calls CoinGecko, stores raw data
│   │   ├── transformation.service.js  # Cleans + computes metrics
│   │   ├── cache.service.js       # Redis get/set/invalidate
│   │   └── alert.service.js       # Threshold-based price alerts
│   │
│   ├── repositories/
│   │   ├── rawData.repository.js      # CRUD on raw_prices table
│   │   └── marketData.repository.js   # CRUD on market_data table
│   │
│   ├── routes/
│   │   ├── prices.routes.js     # GET /api/prices/...
│   │   └── health.routes.js     # GET /health
│   │
│   └── utils/
│       └── calculateVariation.js  # Pure function: 24h % variation
│
├── docs/
│   ├── architecture.md          # Architecture deep-dive
│   ├── adr/
│   │   ├── ADR-001-redis-vs-db-cache.md
│   │   ├── ADR-002-event-driven-local-simulation.md
│   │   └── ADR-003-postgresql-vs-dynamodb.md
│   ├── product-requirements.md  # PRD with user stories
│   ├── backlog.md               # Sprints + acceptance criteria
│   └── aws-mapping.md           # V1 → V2 cloud migration plan
│
└── tests/
    ├── transformation.test.js   # Unit tests
    └── cache.test.js
```

---

## 🔌 API Endpoints

```
GET  /health                        → Service health + DB + Redis status
GET  /api/prices/latest             → Latest prices for all symbols
GET  /api/prices/:symbol            → Latest price for BTC, ETH or SOL
GET  /api/prices/history/:symbol    → Price history (last 24h)
POST /api/prices/fetch              → Manual trigger: fetch + store prices
GET  /api/docs                      → Swagger UI documentation
```

### Sample response — `GET /api/prices/BTC`

```json
{
  "symbol": "BTC",
  "price": 65230.42,
  "currency": "USD",
  "variation24h": 2.37,
  "high24h": 66100.0,
  "low24h": 63800.0,
  "source": "cache",
  "capturedAt": "2026-04-24T10:00:00Z"
}
```

---

## 📦 Data Model

### `raw_prices` table — immutable raw responses

```sql
CREATE TABLE raw_prices (
  id           SERIAL PRIMARY KEY,
  payload      JSONB NOT NULL,        -- full API response, untouched
  fetched_at   TIMESTAMP DEFAULT NOW()
);
```

### `market_data` table — processed, structured records

```sql
CREATE TABLE market_data (
  id            SERIAL PRIMARY KEY,
  symbol        VARCHAR(10) NOT NULL,
  price         DECIMAL(18, 6) NOT NULL,
  currency      VARCHAR(5) DEFAULT 'USD',
  variation24h  DECIMAL(8, 4),
  high24h       DECIMAL(18, 6),
  low24h        DECIMAL(18, 6),
  raw_price_id  INTEGER REFERENCES raw_prices(id),
  captured_at   TIMESTAMP NOT NULL
);
```

---

## 🔔 Event Flow (local simulation)

```
CronJob fires
    │
    ▼
ingestion.service.fetchAndStore()
    │
    ├──► rawData.repository.save(rawPayload)
    │
    └──► emit('PriceFetchedEvent', { rawPriceId })
                │
                ▼
    transformation.service.transform(rawPriceId)
                │
                ├──► marketData.repository.save(marketData)
                │
                ├──► cache.service.set(`latest:${symbol}`, marketData)
                │
                └──► emit('PriceTransformedEvent', { symbol, variation24h })
                                │
                                ▼
                    alert.service.checkThreshold(variation24h)
```

> **Interview note:** In a production system, `PriceFetchedEvent` would be published to a Kafka topic or AWS EventBridge. The transformation service would be a separate consumer/Lambda subscribed to that topic. This local simulation replicates the same logical flow, decoupled by events, without the infrastructure overhead.

---

## 📊 Logging — Sample structured logs

```json
{ "level": "info",  "event": "INGESTION_START",     "timestamp": "2026-04-24T10:00:00Z" }
{ "level": "info",  "event": "PRICE_FETCHED",        "symbol": "BTC", "price": 65230.42, "durationMs": 210 }
{ "level": "info",  "event": "PRICE_TRANSFORMED",    "symbol": "BTC", "variation24h": 2.37 }
{ "level": "info",  "event": "CACHE_SET",            "key": "latest:BTC" }
{ "level": "warn",  "event": "ALERT_TRIGGERED",      "symbol": "BTC", "variation24h": 5.2, "threshold": 3.0 }
{ "level": "error", "event": "INGESTION_FAILED",     "reason": "CoinGecko API timeout", "durationMs": 5000 }
{ "level": "info",  "event": "CACHE_HIT",            "key": "latest:ETH", "servedFromCache": true }
```

> These logs are structured JSON — ready to be shipped to an ELK Stack (Elasticsearch + Logstash + Kibana) or AWS CloudWatch Logs.

---

## 🗂️ Backlog

### Sprint 1 — Local MVP

| #   | User Story                                                               | Acceptance Criteria                                       |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| US1 | As a system, I want to fetch BTC/ETH/SOL prices every 60s                | Cron job runs, API called, response logged                |
| US2 | As a system, I want to store raw API responses before transformation     | Raw payload saved in `raw_prices` with timestamp          |
| US3 | As a system, I want to transform raw data into structured market records | `market_data` row created with price, variation, high/low |
| US4 | As a user, I want to retrieve the latest price for a symbol via REST API | `GET /api/prices/BTC` returns valid JSON in < 100ms       |
| US5 | As a PO, I want structured logs on every ingestion cycle                 | Winston logs event, duration, symbol, success/error       |

### Sprint 2 — Technical credibility

| #    | User Story                                                    | Acceptance Criteria                                        |
| ---- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| US6  | As a system, I want Redis to cache latest prices              | Cache hit on second request, `source: "cache"` in response |
| US7  | As a dev, I want to run the full stack with one command       | `docker-compose up` starts API + PostgreSQL + Redis        |
| US8  | As a consumer, I want self-documented API endpoints           | Swagger UI accessible at `/api/docs`                       |
| US9  | As a dev, I want unit tests on the transformation logic       | Jest tests pass on variation calculation edge cases        |
| US10 | As an architect, I want to simulate event-driven flow locally | EventEmitter connects ingestion → transformation → alert   |

### Sprint 3 — AWS Cloud version

| #    | User Story                                                         | Acceptance Criteria                                              |
| ---- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| US11 | As a team, I want ingestion logic deployable as AWS Lambda         | Lambda deployed via SAM/CDK, triggered by EventBridge Scheduler  |
| US12 | As a team, I want raw data stored in S3                            | JSON objects uploaded to raw bucket per ingestion cycle          |
| US13 | As a team, I want transformation triggered by an EventBridge event | Lambda triggered by `PriceFetchedEvent` published to EventBridge |
| US14 | As a team, I want processed data stored in RDS                     | MarketData rows written to RDS PostgreSQL                        |
| US15 | As a user, I want the API exposed via API Gateway                  | GET /prices/BTC returns 200 via API Gateway endpoint             |

---

## ⚙️ Local Setup

### Prerequisites

- Node.js >= 18
- Docker + Docker Compose
- Git

### Run

```bash
git clone https://github.com/your-username/marketpulse-pipeline.git
cd marketpulse-pipeline
cp .env.example .env
docker-compose up -d        # Starts PostgreSQL + Redis
npm install
npm run dev                 # Starts API + cron job
```

### Environment variables

```env
# API
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketpulse
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Ingestion
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
FETCH_INTERVAL_SECONDS=60

# Alerts
ALERT_VARIATION_THRESHOLD_PCT=3.0
```

---

## 🗣️ Interview Story

> _"I built a small event-driven data pipeline to develop hands-on understanding of modern backend and cloud architectures._
>
> _The pipeline ingests crypto market prices from a public API on a scheduled basis. Raw responses are stored before any processing — this is the equivalent of a data lake layer, keeping an immutable audit trail. An event then triggers a transformation service that cleans the data, computes 24h price variation, and stores structured records in a relational database. A Redis cache sits in front of the REST API to avoid unnecessary database reads for frequently accessed latest prices._
>
> _I added structured JSON logging throughout — every ingestion cycle is logged with event type, duration, and outcome, which makes the system observable and prepares it for an ELK stack or CloudWatch integration._
>
> _Locally, I simulated the event-driven flow using Node.js EventEmitter. I then mapped each component to its AWS equivalent: Lambda for ingestion and transformation, S3 for raw storage, EventBridge for the event bus, RDS for processed data, ElastiCache for Redis, and API Gateway to expose the REST interface. That mapping exercise was as valuable as building the pipeline itself — it forced me to understand why each service exists and what it replaces._
>
> _The goal was not to become a cloud engineer, but to close the gap between functional product delivery and the architecture decisions I need to understand and challenge as a Technical PO."_

---

## 🚀 Roadmap

- [x] Architecture design & documentation
- [x] PRD + backlog
- [ ] Sprint 1 — Local MVP (ingestion + transformation + REST API + logs)
- [ ] Sprint 2 — Redis + Docker + Swagger + tests + event simulation
- [ ] Sprint 3 — AWS Lambda + S3 + EventBridge + API Gateway + CloudWatch
- [ ] GraphQL endpoint (bonus — CACIB TEAS stack alignment)
- [ ] Kibana dashboard on Docker (ELK local stack)

---

## 📄 Documentation

- [`docs/architecture.md`](docs/architecture.md) — Architecture deep-dive
- [`docs/product-requirements.md`](docs/product-requirements.md) — Full PRD
- [`docs/backlog.md`](docs/backlog.md) — Detailed sprint backlog
- [`docs/adr/`](docs/adr/) — Architecture Decision Records
- [`docs/aws-mapping.md`](docs/aws-mapping.md) — V1 → AWS V2 migration plan

---

## 👤 Author

**Fekher** — Technical Product Owner | Financial markets & data architectures  
[LinkedIn](#) · [GitHub](#)

> _Built to deepen technical architecture knowledge across event-driven systems, cloud-native patterns, and data pipelines — applied to a financial markets context._
