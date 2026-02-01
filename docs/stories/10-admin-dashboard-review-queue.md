# US-3.2: Admin Dashboard & Review Queue

**Epic:** Epic 3 - Admin
**Sprint:** 3.2 / Week 7
**Effort:** 20h
**Assigned to:** @dev, @frontend
**Status:** Pronto para Desenvolvimento

---

## User Story

**As an** admin
**I want** to see system statistics and manage flagged questions
**So that** I can monitor platform health and approve/reject community feedback

---

## Acceptance Criteria

- [ ] `GET /api/admin/dashboard` - System statistics
  - Active users (last 24h, last 7d)
  - Total questions (real + generated)
  - Import count + last import date/time
  - System uptime (% last 30d)
  - API latency (P95)
  - Database size
  - Response time < 500ms

- [ ] `GET /api/admin/review-queue` - List flagged questions
  - Returns: question_id, text, report_count, feedback_list, status
  - Filter: status (pending/approved/rejected), priority, date range
  - Sort: by report count descending
  - Pagination: 20 per page
  - RLS: admin only

- [ ] `POST /api/admin/reviews` - Approve/reject feedback
  - Input: question_id, decision (approve/reject), notes
  - Updates question_reviews table
  - Changes question status (active/archived)
  - Logs reviewer_id + timestamp
  - Optional: notify reporter of decision
  - Status: 200 OK, 403 if not admin

- [ ] Admin Dashboard UI
  - Stats cards: active users, total questions, uptime %, latency
  - Import history table: date, questions added, status
  - Quick action buttons: \"Run Import\", \"View Feedback\"
  - Review queue section: list with approve/reject buttons
  - Real-time updates (polling or WebSocket, optional)

---

## Definition of Done

- [ ] Dashboard displays stats correctly
- [ ] Stats updated in real-time (or cache < 5 min)
- [ ] Review queue shows all feedback items
- [ ] Approve/reject working + notes logged
- [ ] Admin access control verified
- [ ] UI responsive on desktop
- [ ] Vitest coverage ≥ 80%
- [ ] E2E: login as admin → view stats → approve feedback

---

## Technical Specifications

### Endpoints

```typescript
GET /api/admin/dashboard
// Response 200:
{
  active_users: {
    last_24h: 127,
    last_7d: 456
  },
  total_questions: 14200,
  imports: {
    total_imports: 3,
    last_import_at: "2026-02-01T10:00:00Z"
  },
  uptime: {
    last_30d_percent: 99.97
  },
  api_metrics: {
    p95_latency_ms: 187,
    error_rate_percent: 0.02
  },
  database: {
    size_gb: 1.2
  }
}

GET /api/admin/review-queue?status=pending&limit=20
// Response 200:
{
  items: [{
    question_id: "uuid",
    question_text: "Qual é a primeira lei...",
    report_count: 3,
    feedback: [
      { type: "wrong_answer", comment: "Answer should be B" },
      { type: "unclear", comment: "Options are confusing" }
    ],
    first_reported: "2026-02-01T08:00:00Z",
    last_reported: "2026-02-01T10:00:00Z",
    status: "pending"
  }],
  pagination: { page: 1, limit: 20, total: 5 }
}

POST /api/admin/reviews
{
  question_id: "uuid",
  decision: "reject",
  notes: "Answer key incorrect, removed from platform"
}
// Response 200:
{
  review_id: "uuid",
  question_id: "uuid",
  status: "rejected",
  reviewed_at: "2026-02-01T10:30:00Z",
  reviewer_id: "uuid"
}
```

### Database Schema (Additional)

```sql
CREATE TABLE question_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approve', 'reject')),
  notes TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50),
  metric_value NUMERIC,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_question_reviews_question_id ON question_reviews(question_id);
CREATE INDEX idx_question_reviews_reviewed_at ON question_reviews(reviewed_at);
CREATE INDEX idx_system_metrics_recorded_at ON system_metrics(recorded_at);
```

### Dashboard Statistics Queries

```sql
-- Active users last 24h
SELECT COUNT(DISTINCT user_id) as active_users_24h
FROM user_question_history
WHERE answered_at >= NOW() - INTERVAL '24 hours';

-- Active users last 7d
SELECT COUNT(DISTINCT user_id) as active_users_7d
FROM user_question_history
WHERE answered_at >= NOW() - INTERVAL '7 days';

-- Total questions
SELECT COUNT(*) as total_questions FROM questions;

-- Last import
SELECT MAX(completed_at) as last_import_at
FROM question_imports
WHERE status = 'completed';

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database())) as size;
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Query performance (< 500ms for stats)
- [ ] RLS enforcement (only admins can access)

### Pre-PR

- [ ] UI responsive
- [ ] Role-based access verified

### Pre-Deployment

- [ ] E2E: admin login → view stats → manage reviews

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Dashboard queries slow down under load | Add caching layer (Redis), pre-compute stats |
| Non-admins access admin endpoints | RLS policies, verify role in middleware |
| Review queue becomes overwhelming | Implement priority levels, batch actions |
| Stats become stale | Refresh cache every 5 minutes, add manual refresh button |

---

## Dependencies

- [ ] Epic 1 + 2 completed
- [ ] Admin role implemented in database
- [ ] Question feedback/review tables created

---

## Implementation Checklist

- [ ] Create admin dashboard endpoint
- [ ] Implement system metrics queries
- [ ] Create review queue endpoint with filters
- [ ] Create approve/reject endpoint
- [ ] Implement admin UI dashboard page
  - [ ] Stats cards component
  - [ ] Import history table
  - [ ] Review queue list
  - [ ] Action buttons
- [ ] Add RLS policies for admin access
- [ ] Write tests for endpoint permissions
- [ ] Test dashboard responsiveness
- [ ] Implement caching for dashboard stats
- [ ] Document admin features

---

**Created:** 2026-02-01
**Previous Story:** [09-csv-import-pipeline.md](./09-csv-import-pipeline.md)
**Next Story:** [11-regression-testing-qa.md](./11-regression-testing-qa.md)
