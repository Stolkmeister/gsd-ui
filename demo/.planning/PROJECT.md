# TaskFlow

## Overview
TaskFlow is a collaborative task management API built with Node.js and PostgreSQL. It provides teams with real-time project tracking, customizable workflows, and seamless third-party integrations.

## Tech Stack
- **Runtime:** Node.js 20 + Express
- **Database:** PostgreSQL 16 with pgvector for search
- **Auth:** JWT with refresh token rotation, OAuth2 (Google)
- **Real-time:** WebSocket (ws library)
- **Queue:** BullMQ + Redis for background jobs
- **Docs:** OpenAPI 3.1 auto-generated from route schemas

## Architecture
- RESTful API with versioned endpoints (`/api/v1/`)
- Repository pattern for data access
- Event-driven architecture for real-time features
- Middleware pipeline: auth -> rate-limit -> validate -> handler

## Repository
```
taskflow/
  src/
    routes/        # Express route handlers
    services/      # Business logic
    repositories/  # Database queries
    middleware/     # Auth, rate-limit, validation
    workers/       # Background job processors
    ws/            # WebSocket handlers
  migrations/      # PostgreSQL migrations
  tests/           # Jest test suites
  docs/            # Generated API documentation
```
