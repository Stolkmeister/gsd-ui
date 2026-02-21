---
phase: 8
type: research
created: 2026-02-18T14:00:00Z
---

# Research: WebSocket Patterns

## Transport Options
- **ws (npm):** Minimal, fast, no bloat. Best for server-to-server or when clients are modern.
- **Socket.IO:** Auto-reconnect, fallbacks, rooms. Heavier but more features out of the box.
- **SSE:** One-way only. Simpler but limited to server-to-client.
- **Decision:** ws library. Our clients are modern web/mobile apps; no need for long-polling fallback.

## Scaling WebSockets
- Single server: In-memory connection map, sufficient for < 10k connections.
- Multi-server: Need pub/sub layer (Redis) to broadcast across instances.
- **Decision:** Start with in-memory; add Redis pub/sub adapter when scaling horizontally (phase 12).

## Message Format
- JSON with type/payload structure: `{ type: "task.updated", payload: { ... } }`
- Include event ID for idempotency on client side.
- Include timestamp for ordering.

## Authentication
- JWT token in query param during WebSocket upgrade handshake.
- Validate token before completing upgrade.
- Close connection on token expiry; client reconnects with refreshed token.

## Heartbeat
- Server sends ping every 30s.
- Client must respond with pong within 10s.
- No pong = connection terminated as stale.
