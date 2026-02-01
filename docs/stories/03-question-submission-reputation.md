# US-1.3: Question Submission & Reputation System

**Epic:** Epic 1 - Core Features
**Sprint:** 1.3, 1.4, 1.5 / Weeks 3-4
**Effort:** 42h
**Assigned to:** @dev, @db-sage, @architect
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** student
**I want** to submit my answer to a question and see if I got it right
**So that** I can track my learning progress and identify weak areas

---

## Acceptance Criteria

- [ ] `POST /api/questions/{id}/submit` - Record answer submission
  - Input: question_id, selected_option_index (0-3)
  - Validates: question exists, user authenticated, valid option index
  - Records in user_question_history table
  - Triggers reputation update (async, < 1s)
  - Returns: correct (boolean), explanation, next_topic_suggestion
  - Rate limit: 1 submission per question per user (prevent gaming)
  - Status: 200 OK with result

- [ ] `POST /api/questions/{id}/feedback` - Report problem with question
  - Input: feedback_type (wrong_answer, unclear, offensive, etc), comment (optional)
  - Creates question_feedback record
  - Auto-flags if 3+ reports in 24h
  - Returns: feedback_id, status
  - Status: 201 Created

- [ ] `GET /api/admin/review-queue` - List flagged questions (admin only)
  - Returns: flagged questions, report count, feedback text
  - Filter by status (pending, approved, rejected)
  - Sort by report count descending
  - Status: 200 OK, 403 if not admin

- [ ] `POST /api/admin/reviews` - Approve/reject question (admin only)
  - Input: question_id, decision (approve/reject), notes
  - Updates question_reviews table
  - Changes question status
  - Logs reviewer_id + timestamp
  - Status: 200 OK, 403 if not admin

- [ ] Database Triggers - Automatic reputation updates
  - Trigger 1: `update_question_reputation_on_submit` - Average user scores, update reputation_score (0-10)
  - Trigger 2: `increment_user_correct_count` - Track user correctness stats
  - Trigger 3: `flag_controversial_questions` - Auto-flag if avg < 5/10
  - Trigger 4: `ban_spammy_users` - Auto-ban if > 10 reports in 24h
  - Trigger 5: `update_user_stats` - Aggregate user performance metrics
  - All triggers complete in < 100ms

- [ ] Reputation badges update in real-time on frontend
  - Score 0-3: Red (\"Needs Review\")
  - Score 4-6: Yellow (\"Good\")
  - Score 7-10: Green (\"Excellent\")
  - Updates within 1s of submission

---

## Definition of Done

- [ ] Answer submission recorded + validated
- [ ] Reputation updates < 1s after submission
- [ ] All 5 triggers tested (no race conditions, no deadlocks)
- [ ] Reputation badges display 0-10 score correctly
- [ ] Admin review queue shows all flagged questions
- [ ] Load test: 1000 submissions/min without deadlocks
- [ ] Documentation: Reputation model, trigger logic, feedback workflow
- [ ] Vitest coverage ≥ 80% (submission + triggers)
- [ ] E2E test: submit answer → reputation updates → badge changes

---

## Technical Specifications

### Endpoints

```typescript
POST /api/questions/{id}/submit
{
  selected_option_index: 2
}
// Response 200:
{
  correct: true,
  explanation: "Option C is correct because...",
  nextTopicSuggestion: "direito-penal",
  reputation: {
    score: 7.5,
    status: "excellent"
  }
}

POST /api/questions/{id}/feedback
{
  feedback_type: "wrong_answer",
  comment: "The correct answer should be B, not C"
}
// Response 201:
{
  feedback_id: "uuid",
  status: "pending",
  createdAt: "2026-02-01T10:30:00Z"
}

GET /api/admin/review-queue?status=pending&limit=20
// Response 200:
{
  items: [{
    question_id: "uuid",
    question_text: "Qual é...",
    report_count: 3,
    feedback: ["Wrong answer", "Unclear options"],
    last_reported: "2026-02-01T10:30:00Z"
  }],
  pagination: {...}
}

POST /api/admin/reviews
{
  question_id: "uuid",
  decision: "reject",
  notes: "Answer key was incorrect, question removed"
}
// Response 200:
{
  question_id: "uuid",
  status: "rejected",
  reviewed_at: "2026-02-01T10:30:00Z"
}
```

### Database Triggers (PostgreSQL)

```sql
-- Trigger 1: Update reputation on submission
CREATE OR REPLACE FUNCTION update_question_reputation_on_submit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions
  SET reputation_score = (
    SELECT AVG(CASE WHEN is_correct THEN 10 ELSE 0 END)
    FROM user_question_history
    WHERE question_id = NEW.question_id
  ),
  updated_at = NOW()
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reputation_update AFTER INSERT ON user_question_history
FOR EACH ROW EXECUTE FUNCTION update_question_reputation_on_submit();

-- Trigger 2: Flag controversial questions (avg < 5/10)
CREATE OR REPLACE FUNCTION flag_controversial_questions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reputation_score < 5 THEN
    UPDATE questions SET is_flagged = true WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flag_on_low_reputation AFTER UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION flag_controversial_questions();
```

### RLS Policies

```sql
-- Users can only see their own submissions
CREATE POLICY submission_isolation ON user_question_history
  USING (user_id = auth.uid());

-- Only admins can review
CREATE POLICY admin_review_access ON question_reviews
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Trigger deadlock detection (test with concurrent submits)
- [ ] Reputation calculation accuracy (verify with examples)
- [ ] Answer validation (correct option must exist in question)
- [ ] Service filter check (.eq('service', 'ttcx') in RLS)

### Pre-PR

- [ ] Load test: 1000 submissions/min, measure latency + deadlocks
- [ ] Reputation race condition test (concurrent submits, verify consistency)
- [ ] Advisory locks verified (prevent race conditions)
- [ ] @db-sage trigger performance review

### Pre-Deployment

- [ ] E2E test: submit answer → verify reputation updates → check badge
- [ ] Monitor trigger execution time (target < 100ms)

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Reputation race conditions | Advisory locks + SERIALIZABLE isolation, load test 1000 req/min |
| Triggers slow down submissions | Monitor execution time (target < 100ms), optimize indexes |
| Trigger deadlocks under load | Test with concurrent submissions, use advisory locks |
| Flag threshold spam (3+ reports false positives) | Manual review queue for admins |

---

## Dependencies

- [ ] Story 1.1 (Auth) completed
- [ ] Story 1.2 (Questions) completed
- [ ] Database triggers created (migrations)
- [ ] Admin role created in users table

---

## Implementation Checklist

- [ ] Create answer submission endpoint
- [ ] Create feedback reporting endpoint
- [ ] Create review queue endpoints (admin)
- [ ] Create database triggers (5 triggers)
- [ ] Implement reputation calculation logic
- [ ] Add RLS policies for feedback/reviews
- [ ] Write trigger performance tests
- [ ] Test deadlock scenarios
- [ ] Implement badge status logic
- [ ] Create admin approval workflow

---

**Created:** 2026-02-01
**Previous Story:** [02-question-generation-rag.md](./02-question-generation-rag.md)
**Next Story:** [04-dashboard-navigation-ui.md](./04-dashboard-navigation-ui.md)
