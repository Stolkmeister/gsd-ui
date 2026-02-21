---
created: 2026-02-18
priority: medium
phase: 8
tags: [infrastructure, redis, rate-limiting]
---

# Switch Rate Limiting from In-Memory to Redis

## Problem
The current rate limiting middleware uses an in-memory Map for tracking request counts. This works for a single server instance but breaks when running multiple instances behind a load balancer -- each instance has its own counter, effectively multiplying the actual limit.

## Proposed Solution
- Replace the in-memory store with Redis using `ioredis`
- Use Redis MULTI/EXEC for atomic increment + TTL operations
- Reuse the existing Redis connection from BullMQ worker config
- Add fallback to in-memory if Redis is unavailable (graceful degradation)

## Files Affected
- `src/middleware/rateLimit.js`
- `src/config/rateLimits.js`
- `src/config/redis.js` (shared connection)

## Notes
This became relevant now that we're adding the WebSocket server and email worker -- we'll likely move to multi-instance soon. Should be addressed before phase 12 (horizontal scaling).
