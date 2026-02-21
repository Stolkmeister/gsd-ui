---
phase: 2
type: research
created: 2026-01-30T09:45:00Z
---

# Research: Authentication Patterns

## JWT vs Session Tokens
- JWT: Stateless, scalable, but harder to revoke
- Sessions: Easy revocation, but requires shared store
- **Decision:** JWT with refresh token rotation — best of both worlds

## Refresh Token Rotation
- Each refresh grants a new refresh token and invalidates the old
- Token families track lineage; reuse of old token invalidates entire family
- Reference: [Auth0 Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)

## Password Hashing
- bcrypt: Well-established, 10 rounds standard
- argon2id: Memory-hard, recommended by OWASP for new projects
- **Decision:** argon2id with default params (19 MiB memory, 2 iterations)

## Rate Limiting Algorithms
- Fixed window: Simple but allows burst at boundary
- Sliding window log: Accurate but memory-intensive
- Sliding window counter: Good balance of accuracy and memory
- **Decision:** Sliding window counter
