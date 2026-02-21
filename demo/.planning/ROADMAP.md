# TaskFlow Roadmap

### Shipped

- [x] **v1.0 Core Platform** - Phases 1-5 (shipped 2026-02-01)
- [x] **v1.1 Search & Docs** - Phases 6-7 (shipped 2026-02-10)

<details>
<summary>v1.0 Core Platform</summary>

### Phase 1: Database Schema
**Goal**: Design and implement the core PostgreSQL schema for users, tasks, projects, and teams

- [x] 01-01-PLAN.md -- Core tables: users, tasks, projects, teams
- [x] 01-02-PLAN.md -- Indexes and constraints
- [x] 01-03-PLAN.md -- Seed data and migrations

### Phase 2: Authentication System
**Goal**: Implement JWT-based auth with OAuth2 and role-based access control

- [x] 02-01-PLAN.md -- JWT auth with refresh tokens
- [x] 02-02-PLAN.md -- OAuth2 Google integration
- [x] 02-03-PLAN.md -- Role-based access control
- [x] 02-04-PLAN.md -- Rate limiting middleware

### Phase 3: Task CRUD
**Goal**: Build complete task lifecycle management with assignments and comments

- [x] 03-01-PLAN.md -- Create, read, update, delete tasks
- [x] 03-02-PLAN.md -- Task assignments and due dates
- [x] 03-03-PLAN.md -- Task comments and attachments

### Phase 4: Project Management
**Goal**: Enable project creation, member management, and templates

- [x] 04-01-PLAN.md -- Project creation and settings
- [x] 04-02-PLAN.md -- Project members and permissions
- [x] 04-03-PLAN.md -- Project templates

### Phase 5: Team Collaboration
**Goal**: Build team workspaces with activity feeds and mentions

- [x] 05-01-PLAN.md -- Team workspaces
- [x] 05-02-PLAN.md -- Activity feed
- [x] 05-03-PLAN.md -- @mentions and notifications

</details>

<details>
<summary>v1.1 Search & Docs</summary>

### Phase 6: Search and Filters
**Goal**: Full-text search across tasks, projects, and comments

- [x] 06-01-PLAN.md -- Full-text search with PostgreSQL
- [x] 06-02-PLAN.md -- Advanced filter builder

### Phase 7: API Documentation
**Goal**: Auto-generated OpenAPI documentation with interactive explorer

- [x] 07-01-PLAN.md -- OpenAPI spec generation
- [x] 07-02-PLAN.md -- Interactive docs site

</details>

### Go-Live Gate

- [ ] **v1.2 Real-time & Integrations** - Phases 8-10

<details>
<summary>v1.2 Real-time & Integrations</summary>

### Phase 8: Real-time Notifications
**Goal**: WebSocket-based real-time updates with notification preferences

- [x] 08-01-PLAN.md -- WebSocket event broadcasting
- [x] 08-02-PLAN.md -- Notification preferences API
- [ ] 08-03-PLAN.md -- Email digest worker

### Phase 9: Webhook System
**Goal**: Webhook registration, delivery queue with retry logic

- [ ] 09-01-PLAN.md -- Webhook registration and management
- [ ] 09-02-PLAN.md -- Delivery queue with retries

### Phase 10: Third-party Integrations
**Goal**: Slack and GitHub integrations for task management

- [ ] 10-01-PLAN.md -- Slack integration
- [ ] 10-02-PLAN.md -- GitHub integration

</details>

### Post-Launch

- [ ] **v1.3 Analytics & Scale** - Phases 11-12

<details>
<summary>v1.3 Analytics & Scale</summary>

### Phase 11: Analytics Dashboard
**Goal**: Metrics collection and dashboard API endpoints

- [ ] 11-01-PLAN.md -- Metrics collection pipeline
- [ ] 11-02-PLAN.md -- Dashboard API endpoints

### Phase 12: Performance & Scale
**Goal**: Query optimization, caching, and horizontal scaling

- [ ] 12-01-PLAN.md -- Query optimization and caching
- [ ] 12-02-PLAN.md -- Horizontal scaling strategy

</details>
