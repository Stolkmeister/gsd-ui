---
phase: 8
type: context
created: 2026-02-18T14:30:00Z
---

# Context: Real-time Notifications

## References
- Phase 5 notification service: `src/services/notifications.js` -- existing in-app notification system
- Activity feed events: `src/services/activityFeed.js` -- event types to broadcast
- Auth middleware: `src/middleware/auth.js` -- JWT validation to reuse for WS auth

## Dependencies
- ws@8.16.0 -- WebSocket server
- bullmq@5.1.0 -- Job queue for email digests
- nodemailer@6.9.0 -- SMTP email sending
- mjml@4.15.0 -- Email template rendering

## Architecture Notes
- WebSocket server shares HTTP server via upgrade event
- Events flow: service action -> event emitter -> WS broadcaster + notification queue
- Email digest worker runs on separate process, shares Redis with rate limiter

## Open Questions
- Should we support push notifications (FCM/APNs) in this phase or defer?
  - **Decision:** Defer to v1.3. Focus on WebSocket + email for now.
