# US-2.2: Exam Attempt & Answer Submission

**Epic:** Epic 2 - Exam Management
**Sprint:** 2.2 / Week 5
**Effort:** 28h
**Assigned to:** @dev, @db-sage
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** student taking an exam
**I want** to submit my answers to each question during the exam
**So that** my responses are recorded and I can see my score when finished

---

## Acceptance Criteria

- [ ] `POST /api/exams/{id}/attempts` - Start exam attempt
  - Creates attempt record with status='in_progress'
  - Sets start_time = NOW()
  - Locks exam (prevents edits during attempt)
  - Returns: attempt_id, exam_id, duration_minutes, questions_count
  - Status: 201 Created

- [ ] `POST /api/exams/{attemptId}/answers` - Submit single answer
  - Input: question_id, selected_option_index (0-3)
  - Records user_answer, time_spent
  - Validates: option exists, user hasn't answered this question yet
  - Prevents duplicate answers (one answer per question)
  - Returns: correct (boolean), next question suggestion
  - Status: 200 OK, 409 if already answered

- [ ] `PUT /api/exams/{attemptId}/complete` - Finish exam
  - Sets end_time = NOW()
  - Triggers scoring calculation (async)
  - Returns: score, passing (boolean), weak_areas
  - Status: 200 OK with results

- [ ] `GET /api/exams/{attemptId}` - Fetch attempt state
  - Returns: attempt_id, score, answers, time_spent, status
  - Includes answer review (question + user answer + correct answer)
  - Status: 200 OK

- [ ] **Scoring Trigger** - Auto-calculate results
  - Calculates: (correct_answers / total_answers) * 100 = score
  - Determines: passing = score >= passing_score
  - Identifies weak areas: topics with < 50% accuracy
  - Logs to exam_results table

---

## Definition of Done

- [ ] Attempt creation + state tracking working
- [ ] Answer submission recorded with timing
- [ ] Completion triggers scoring
- [ ] Score calculation accurate (verify with examples)
- [ ] E2E: full attempt flow (start → answer → answer → complete → score)
- [ ] Vitest coverage ≥ 80%
- [ ] Load test: 100 concurrent attempts, no race conditions

---

## Technical Specifications

### Attempt State Machine

```typescript
// States
'created' -> (start_attempt) -> 'in_progress'
'in_progress' -> (submit_answer) -> 'in_progress'
'in_progress' -> (complete) -> 'completed'

// Timing
start_time: ISO8601 timestamp
end_time: ISO8601 timestamp
duration_minutes: from exam
time_spent: calculated per answer
```

### Endpoints

```typescript
POST /api/exams/{id}/attempts
// Response 201:
{
  attempt_id: "uuid",
  exam_id: "uuid",
  status: "in_progress",
  duration_minutes: 120,
  questions_count: 50,
  started_at: "2026-02-01T14:00:00Z"
}

POST /api/exams/{attemptId}/answers
{
  question_id: "uuid",
  selected_option_index: 2
}
// Response 200:
{
  correct: true,
  answer_number: 1,
  total_questions: 50
}
// Or Response 409:
{
  error: "Already answered this question"
}

PUT /api/exams/{attemptId}/complete
// Response 200:
{
  attempt_id: "uuid",
  score: 78,
  passing: true,
  passed_at: "2026-02-01T15:30:00Z",
  weak_areas: [
    { topic: "direito-penal", accuracy: 40 },
    { topic: "direito-administrativo", accuracy: 45 }
  ]
}

GET /api/exams/{attemptId}
// Response 200:
{
  attempt_id: "uuid",
  exam_id: "uuid",
  status: "completed",
  score: 78,
  started_at: "2026-02-01T14:00:00Z",
  completed_at: "2026-02-01T15:30:00Z",
  total_time_minutes: 90,
  answers: [{
    question_id: "uuid",
    question_text: "Qual é...",
    user_answer_index: 2,
    correct_answer_index: 2,
    is_correct: true,
    time_spent_seconds: 45
  }]
}
```

### Database Schema (Additional)

```sql
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score INT,
  passing BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_index INT NOT NULL CHECK (selected_option_index BETWEEN 0 AND 3),
  is_correct BOOLEAN,
  time_spent_seconds INT,
  answered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  score INT NOT NULL,
  passing BOOLEAN NOT NULL,
  weak_areas JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Answer validation (option ID exists)
- [ ] Timing checks (no negative time)

### Pre-PR

- [ ] Trigger accuracy test (scoring verified with examples)
- [ ] @db-sage review of scoring logic

### Pre-Deployment

- [ ] E2E: full attempt flow

---

## Dependencies

- [ ] Story 2.1 (Exam CRUD) completed
- [ ] Scoring trigger created (database function)

---

## Implementation Checklist

- [ ] Create exam attempt start endpoint
- [ ] Create answer submission endpoint
- [ ] Create exam completion endpoint
- [ ] Create attempt detail/review endpoint
- [ ] Implement scoring calculation function (database)
- [ ] Create weak area detection logic
- [ ] Add state validation (prevent invalid transitions)
- [ ] Write tests for scoring accuracy
- [ ] Test race conditions in answer submission
- [ ] Load test with concurrent attempts
- [ ] Document attempt workflow

---

**Created:** 2026-02-01
**Previous Story:** [05-exam-crud-infrastructure.md](./05-exam-crud-infrastructure.md)
**Next Story:** [07-exam-ui-interaction.md](./07-exam-ui-interaction.md)
