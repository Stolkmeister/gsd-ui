---
created: 2026-02-15
completed: 2026-02-16
priority: medium
phase: 3
tags: [enhancement, pagination, api]
---

# Implement Cursor-Based Pagination

## Problem
The initial task list endpoint used offset-based pagination (`?page=2&limit=20`). This caused issues with duplicate or missing items when tasks were created/deleted between page loads -- a common scenario in active projects.

## Solution
- Switched to cursor-based pagination using `created_at` + `id` as composite cursor
- Cursor is base64-encoded and opaque to clients
- Response includes `next_cursor` and `has_more` fields
- Maintained backward compatibility: offset params still work but are deprecated
- Added `Link` header with next/prev page URLs per RFC 8288

## Files Changed
- `src/repositories/tasks.js` -- cursor query logic
- `src/routes/tasks.js` -- response format with cursor fields
- `src/utils/pagination.js` -- cursor encode/decode helpers
- `tests/routes/tasks.test.js` -- pagination tests updated

## Verification
- Tested with concurrent inserts during pagination -- no missing items
- Performance: cursor-based queries 3x faster than offset at page 50+
- Backward compatibility confirmed: old offset params still return correct results
