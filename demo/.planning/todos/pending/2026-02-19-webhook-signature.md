---
created: 2026-02-19
priority: high
phase: 9
tags: [security, webhooks]
---

# Add HMAC Signatures to Webhook Deliveries

## Problem
Phase 9 webhook delivery needs request signing so consumers can verify payloads originated from TaskFlow and haven't been tampered with.

## Proposed Solution
- Generate a unique secret per webhook registration (stored hashed in DB)
- Sign each delivery payload with HMAC-SHA256 using the webhook secret
- Include signature in `X-TaskFlow-Signature` header as `sha256=<hex>`
- Document signature verification in API docs with code examples

## Verification Steps
1. Consumer computes HMAC-SHA256 of raw request body using their secret
2. Compare computed signature with header value using timing-safe comparison
3. Reject requests with invalid or missing signatures

## Files Affected
- `src/workers/webhookDelivery.js`
- `src/services/webhooks.js`
- `docs/webhooks.md`
