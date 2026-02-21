---
phase: 3
plan: 3
status: complete
started: 2026-01-31T09:20:00Z
completed: 2026-01-31T09:27:00Z
duration: 7m
---

# Summary: Task Comments and Attachments

## One-liner
Added task commenting with nested replies and S3-based file attachments using presigned URLs for secure direct uploads.

## Decisions
| Decision | Rationale |
|----------|-----------|
| Presigned URLs for uploads | Client uploads directly to S3; reduces server load |
| Max 10 MB per attachment | Reasonable limit for task docs; large files should use external links |

## Files
- `src/routes/comments.js` -- created
- `src/services/comments.js` -- created
- `src/repositories/comments.js` -- created
- `migrations/009_create_comments.sql` -- created
- `migrations/010_create_attachments.sql` -- created
