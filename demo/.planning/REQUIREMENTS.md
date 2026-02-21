# Requirements

## Core (v1.0)
- [x] TF-01: Users can create, read, update, and delete tasks with title, description, status, priority, and due date
- [x] TF-02: Tasks can be assigned to team members within a project
- [x] TF-03: JWT-based authentication with refresh token rotation
- [x] TF-04: Role-based access control (admin, member, viewer) per project
- [x] TF-05: Projects support custom task statuses and workflows

## Search & Docs (v1.1)
- [x] TF-06: Full-text search across tasks, projects, and comments
- [x] TF-07: Auto-generated OpenAPI documentation with interactive explorer

## Real-time (v1.2)
- [ ] TF-08: Real-time updates via WebSocket for task changes
- [ ] TF-09: Configurable notification preferences per user
- [ ] TF-10: Webhook delivery with at-least-once guarantee and retry logic

## Scale (v1.3)
- [ ] TF-11: Sub-100ms p95 response time for all list endpoints
- [ ] TF-12: Team analytics dashboard with velocity and completion metrics
