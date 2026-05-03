# AWS Architecture Mapping

This document describes how the current local MarketPulse architecture can be mapped to AWS cloud services.

MarketPulse currently runs as a local backend/data pipeline application using Node.js, Express.js, PostgreSQL, Redis, Docker Compose, and a scheduled ingestion job.

The goal of this document is not to describe a full production deployment, but to show a clean cloud-ready architecture and the AWS services that could support each component.

---

## 1. Current Local Architecture

The current local architecture is composed of the following components:

```text
Client / API Consumer
        │
        ▼
Express.js API
        │
        ├── Routes
        ├── Services
        └── Repositories
        │
        ├── PostgreSQL
        ├── Redis
        └── CoinGecko API

node-cron
        │
        ▼
Ingestion service
        │
        ├── Raw data storage
        ├── Transformation
        ├── Data quality checks
        ├── Structured market data storage
        └── Redis cache refresh
```

The application follows a layered backend structure:

```text
HTTP routes
      │
      ▼
Services
      │
      ▼
Repositories / infrastructure clients
      │
      ▼
PostgreSQL / Redis / external APIs
```

---

## 2. AWS Service Mapping

The local components can be mapped to AWS services as follows:

| Local Component | Responsibility | AWS Equivalent |
|---|---|---|
| Express.js API | Expose REST endpoints | Amazon ECS Fargate or Elastic Beanstalk |
| Docker container | Package and run the API | Amazon ECR + ECS Fargate |
| PostgreSQL | Store raw and processed market data | Amazon RDS for PostgreSQL |
| Redis | Cache latest market prices | Amazon ElastiCache for Redis |
| node-cron | Trigger scheduled ingestion | Amazon EventBridge Scheduler |
| Ingestion service | Fetch, transform, validate and store data | ECS scheduled task or AWS Lambda |
| Application logs | Runtime visibility | Amazon CloudWatch Logs |
| `.env` variables | Configuration and secrets | AWS Systems Manager Parameter Store or AWS Secrets Manager |
| Health endpoint | Service availability check | Load Balancer health check / ECS health check |

---

## 3. Target AWS Architecture

A possible AWS target architecture would be:

```text
API Consumer
    │
    ▼
Application Load Balancer
    │
    ▼
ECS Fargate Service
    │
    ├── Express.js API container
    ├── Routes
    ├── Services
    └── Repositories
    │
    ├── Amazon RDS PostgreSQL
    ├── Amazon ElastiCache Redis
    └── CoinGecko API

EventBridge Scheduler
    │
    ▼
ECS Scheduled Task or Lambda
    │
    ▼
Ingestion service
    │
    ├── Fetch market data
    ├── Store raw payload
    ├── Transform records
    ├── Run data quality checks
    ├── Store structured market data
    └── Refresh Redis cache

CloudWatch Logs
    ▲
    │
API container and ingestion task
```

---

## 4. Recommended AWS Deployment Options

### Option 1: Elastic Beanstalk

Elastic Beanstalk is the simplest option for deploying the Express.js API.

It can manage:

- application deployment;
- environment variables;
- load balancing;
- health checks;
- logs;
- basic scaling.

This option is easier to start with, but it gives less control than ECS.

---

### Option 2: ECS Fargate

ECS Fargate is a more modern container-based deployment option.

It can run the MarketPulse API as a Docker container without managing servers.

A typical setup would include:

- Amazon ECR to store the Docker image;
- ECS Fargate to run the API container;
- Application Load Balancer to expose the API;
- Amazon RDS for PostgreSQL;
- Amazon ElastiCache for Redis;
- CloudWatch Logs for application logs;
- AWS Secrets Manager or SSM Parameter Store for configuration.

This option is more aligned with containerized cloud-native architecture.

---

### Option 3: EventBridge Scheduler for Ingestion

In the local version, scheduled ingestion is triggered with `node-cron`.

In AWS, this responsibility could be moved to EventBridge Scheduler.

Possible patterns:

```text
EventBridge Scheduler
        │
        ▼
Call an ingestion endpoint
```

or:

```text
EventBridge Scheduler
        │
        ▼
Run a dedicated ingestion task
```

The second option is cleaner because ingestion becomes an independent scheduled workload instead of being tightly coupled to the API runtime.

---

## 5. Cloud-Ready Design Principles

The current project is already designed around several cloud-ready principles:

- the API is stateless;
- PostgreSQL is externalized from the application;
- Redis is externalized from the application;
- configuration is provided through environment variables;
- health checks are exposed through `/health`;
- logs are written in a structured way;
- the application can run inside Docker;
- the code is split into routes, services and repositories.

These principles make it easier to move from a local Docker Compose setup to a cloud deployment.

---

## 6. Recommended Evolution Path

A safe migration path would be:

```text
Step 1
Document the AWS target architecture.

Step 2
Ensure all configuration is environment-based.

Step 3
Deploy PostgreSQL to Amazon RDS.

Step 4
Deploy Redis to Amazon ElastiCache.

Step 5
Deploy the Express.js API with Elastic Beanstalk or ECS Fargate.

Step 6
Replace local node-cron with EventBridge Scheduler.

Step 7
Move ingestion into a dedicated scheduled ECS task or Lambda function.

Step 8
Add CloudWatch dashboards and alarms for monitoring.
```

---

## 7. Cost-Aware Notes

For a learning or portfolio project, a full AWS deployment should be kept small and controlled.

Recommended cost-aware choices:

- start with documentation and architecture mapping before deploying;
- use small RDS instances only if needed;
- avoid running expensive always-on services unnecessarily;
- shut down non-essential resources when not in use;
- monitor AWS billing alerts;
- avoid over-engineering the first cloud version.

The main objective is to demonstrate cloud architecture understanding, not to build an expensive production platform.

---

## 8. Summary

MarketPulse can be mapped cleanly to AWS without changing its core architecture.

The most relevant AWS services for this project are:

```text
ECS Fargate / Elastic Beanstalk
Amazon RDS PostgreSQL
Amazon ElastiCache Redis
EventBridge Scheduler
CloudWatch Logs
AWS Secrets Manager / SSM Parameter Store
Amazon ECR
Application Load Balancer
```

This mapping reinforces the project’s positioning as a backend/data-flow system that can evolve from a local Docker Compose setup to a cloud-ready architecture.
