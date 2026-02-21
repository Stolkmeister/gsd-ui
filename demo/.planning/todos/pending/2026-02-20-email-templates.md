---
created: 2026-02-20
priority: medium
phase: 8
tags: [email, templates, design]
---

# Design Email Notification Templates

## Problem
Plan 8.3 (email digest worker) needs HTML email templates for notification digests. Currently there's a placeholder template that needs proper design and content.

## Proposed Solution
- Use MJML for responsive email templates (compiles to compatible HTML)
- Create 3 templates:
  1. **Instant notification** -- single event (task assigned, comment added)
  2. **Hourly digest** -- grouped notifications from the last hour
  3. **Daily digest** -- summary with counts and highlights
- Include TaskFlow branding, unsubscribe link, and preference management link
- Test rendering across Gmail, Outlook, and Apple Mail

## Design Requirements
- Mobile-responsive (MJML handles this)
- Dark mode support via media queries
- Max width 600px
- Inline CSS for email client compatibility

## Files Affected
- `src/templates/instant.mjml`
- `src/templates/hourly-digest.mjml`
- `src/templates/daily-digest.mjml`
- `src/services/emailRenderer.js`
