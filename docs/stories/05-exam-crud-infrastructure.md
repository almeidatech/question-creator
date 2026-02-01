# US-2.1: Exam CRUD & Infrastructure

**Epic:** Epic 2 - Exam Management
**Sprint:** 2.1 / Week 5
**Effort:** 24h
**Assigned to:** @dev, @architect
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** student
**I want** to create customized study exams by selecting specific questions
**So that** I can practice with targeted question sets for specific topics

---

## Acceptance Criteria

- [ ] `POST /api/exams` - Create exam
  - Input: name, description, question_ids (5-50), duration (5-180 min), passing_score (0-100%)
  - Validates: all question IDs exist, no duplicates, count 5-50, duration range
  - Deduplicates question_ids (no duplicates allowed)
  - Creates exam record, associates questions
  - Returns: exam_id, created_at, question_count
  - Status: 201 Created, 400 on validation error

- [ ] `GET /api/exams` - List user's exams
  - Returns: exam_id, name, question_count, created_at, last_attempted, best_score
  - Pagination: default 20 per page
  - Filter: status (draft/active/archived)
  - RLS: only user's own exams
  - Status: 200 OK

- [ ] `GET /api/exams/{id}` - Fetch exam details
  - Returns: exam_id, name, description, questions (with options), duration, passing_score
  - Includes attempt history (if exists)
  - RLS: verify ownership
  - Status: 200 OK, 404 if not found, 403 if not owner

- [ ] `PUT /api/exams/{id}` - Update exam
  - Input: name, description, question_ids, duration, passing_score
  - Prevents update if attempt in progress
  - Revalidates all constraints
  - Returns: updated exam metadata
  - Status: 200 OK, 409 if attempt in progress

---

## Definition of Done

- [ ] All 4 endpoints tested with happy + error paths
- [ ] RLS verified (user cannot access other users' exams)
- [ ] Vitest coverage ≥ 80%
- [ ] Endpoint response time P95 < 100ms
- [ ] All validation errors return 400 with clear messages
- [ ] Documentation: API contract, exam model schema
- [ ] E2E test: create → read → update exam

---

## Technical Specifications

### Database Schema

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT CHECK (duration_minutes BETWEEN 5 AND 180),
  passing_score INT CHECK (passing_score BETWEEN 0 AND 100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  UNIQUE (exam_id, question_id)
);

CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
```

### Endpoints

```typescript
POST /api/exams
{
  name: "Constitutional Law Final",
  description: "Topics 1-5 comprehensive exam",
  question_ids: ["uuid1", "uuid2", ...50 more],
  duration_minutes: 120,
  passing_score: 70
}
// Response 201:
{
  exam_id: "uuid",
  name: "Constitutional Law Final",
  question_count: 50,
  created_at: "2026-02-01T10:30:00Z"
}

GET /api/exams?status=active&limit=20&page=1
// Response 200:
{
  exams: [
    {
      exam_id: "uuid",
      name: "Constitutional Law Final",
      question_count: 50,
      created_at: "2026-02-01T10:30:00Z",
      last_attempted: "2026-02-01T11:00:00Z",
      best_score: 85
    }
  ],
  pagination: { page: 1, limit: 20, total: 5, pages: 1 }
}

GET /api/exams/{id}
// Response 200:
{
  exam_id: "uuid",
  name: "Constitutional Law Final",
  description: "Topics 1-5 comprehensive exam",
  duration_minutes: 120,
  passing_score: 70,
  questions: [{
    question_id: "uuid",
    text: "Qual é...",
    options: ["A", "B", "C", "D"],
    order: 1
  }],
  attempts: [{
    attempt_id: "uuid",
    score: 85,
    attempted_at: "2026-02-01T11:00:00Z"
  }]
}

PUT /api/exams/{id}
{
  name: "Updated name",
  duration_minutes: 90,
  question_ids: ["uuid1", "uuid2", ...]
}
// Response 200: { exam_id, name, updated_at }
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Input validation (question IDs exist, count 5-50, duration range)
- [ ] RLS ownership test (user cannot see other users' exams)
- [ ] Deduplication logic verified

### Pre-PR

- [ ] @architect review of exam data model

### Pre-Deployment

- [ ] E2E: create → read → update exam

---

## Dependencies

- [ ] Epic 1 (Questions) completed
- [ ] Database schema created (exams, exam_questions tables)

---

## Implementation Checklist

- [ ] Create exam creation endpoint
- [ ] Implement question validation and deduplication
- [ ] Create exam listing endpoint with filters
- [ ] Create exam detail endpoint
- [ ] Create exam update endpoint
- [ ] Add RLS policies for exam ownership
- [ ] Write unit tests for validation
- [ ] Write integration tests for endpoints
- [ ] Document API contract
- [ ] Setup database indexes

---

**Created:** 2026-02-01
**Previous Story:** [04-dashboard-navigation-ui.md](./04-dashboard-navigation-ui.md)
**Next Story:** [06-exam-attempt-answer-submission.md](./06-exam-attempt-answer-submission.md)
