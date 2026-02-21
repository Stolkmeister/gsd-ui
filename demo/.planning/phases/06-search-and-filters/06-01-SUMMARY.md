---
phase: 6
plan: 1
status: complete
started: 2026-02-08T09:00:00Z
completed: 2026-02-08T09:07:00Z
duration: 7m
---

# Summary: Full-text Search with PostgreSQL

## One-liner
Implemented full-text search using PostgreSQL tsvector/tsquery with GIN indexes, ranked results, and headline highlighting across tasks, projects, and comments.

## Decisions
| Decision | Rationale |
|----------|-----------|
| Native PG full-text over Elasticsearch | Simpler ops; sufficient for current scale; avoids extra infra |
| english dictionary config | Primary user base is English; can add multi-language later |

## Files
- `src/services/search.js` -- created
- `src/routes/search.js` -- created
- `migrations/014_add_search_indexes.sql` -- created
