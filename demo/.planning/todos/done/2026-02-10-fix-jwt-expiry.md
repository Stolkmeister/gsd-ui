---
created: 2026-02-10
completed: 2026-02-11
priority: high
phase: 2
tags: [bug, auth, jwt]
---

# Fix JWT Token Expiry Edge Case

## Problem
When a JWT access token expired at the exact second a request was made, the auth middleware would throw an unhandled `TokenExpiredError` instead of returning a clean 401 response. This caused a 500 error in production logs.

## Solution
- Added explicit catch for `TokenExpiredError` in auth middleware
- Return `401 Unauthorized` with `{ error: "token_expired", message: "Access token has expired" }`
- Client SDK already handles 401 by refreshing, so no client changes needed

## Files Changed
- `src/middleware/auth.js` -- added TokenExpiredError handling
- `tests/middleware/auth.test.js` -- added edge case test

## Verification
- Tested with token expiring at request time using `jest.useFakeTimers()`
- Confirmed 401 response with correct error body
- No more 500 errors for expired tokens in staging logs
