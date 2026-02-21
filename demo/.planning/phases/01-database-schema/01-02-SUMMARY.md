---
phase: 1
plan: 2
status: complete
started: 2026-01-30T09:10:00Z
completed: 2026-01-30T09:16:00Z
duration: 6m
---

# Summary: Indexes and Constraints

## One-liner
Added B-tree indexes on high-traffic columns and integrity constraints including unique email, valid status checks, and composite indexes for filtered queries.

## Decisions
| Decision | Rationale |
|----------|-----------|
| Composite index on (project_id, status) | Most common query pattern is filtering tasks by status within a project |
| GIN index on tasks.title for search | Prepares for full-text search in phase 6 |

## Files
- `migrations/005_add_indexes.sql` -- created
- `migrations/006_add_constraints.sql` -- created
