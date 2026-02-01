# US-2.4: Scoring, Analytics & Weak Area Detection

**Epic:** Epic 2 - Exam Management
**Sprint:** 2.4 / Week 6
**Effort:** 12h
**Assigned to:** @db-sage, @dev
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** student
**I want** to see analytics on my exam performance and identify weak areas
**So that** I can focus my studying on topics where I struggle

---

## Acceptance Criteria

- [ ] Scoring calculation (database function)
  - Score = (correct_answers / total_answers) * 100
  - Determine passing: score >= passing_score
  - Identify weak areas: topics with accuracy < 50%
  - Store results in exam_results table

- [ ] Weak area detection
  - Per-topic accuracy: (correct / attempts) * 100
  - Mark topics with < 50% as \"weak\"
  - Return list of weak topics with accuracy %

- [ ] Performance analytics
  - Time per question: average + distribution
  - Accuracy trends: performance over multiple attempts
  - Comparison: your performance vs. class average (optional)

---

## Definition of Done

- [ ] Scoring calculated correctly (no off-by-one errors)
- [ ] Weak areas identified accurately
- [ ] Analytics queryable and fast (< 1s for typical user)
- [ ] E2E: attempt → completion → results show weak areas
- [ ] Vitest coverage ≥ 80%

---

## Technical Specifications

### Weak Area Algorithm

```sql
-- Calculate weak areas after exam completion
SELECT
  topic,
  COUNT(*) as total_questions,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
  (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as accuracy
FROM exam_answers ea
JOIN questions q ON ea.question_id = q.id
WHERE ea.attempt_id = $1
GROUP BY topic
HAVING (SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 < 50
ORDER BY accuracy ASC;
```

### Scoring Function (PostgreSQL)

```sql
CREATE OR REPLACE FUNCTION calculate_exam_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_questions INT;
  v_correct_answers INT;
  v_score INT;
  v_passing BOOLEAN;
  v_passing_score INT;
BEGIN
  -- Get exam passing score
  SELECT passing_score INTO v_passing_score
  FROM exams
  WHERE id = NEW.exam_id;

  -- Count total questions in exam
  SELECT COUNT(*) INTO v_total_questions
  FROM exam_answers
  WHERE attempt_id = NEW.id;

  -- Count correct answers
  SELECT COUNT(*) INTO v_correct_answers
  FROM exam_answers
  WHERE attempt_id = NEW.id AND is_correct = true;

  -- Calculate score
  v_score := CASE WHEN v_total_questions > 0
    THEN ROUND((v_correct_answers::float / v_total_questions) * 100)
    ELSE 0
  END;

  -- Determine passing
  v_passing := v_score >= v_passing_score;

  -- Update attempt with score and passing status
  UPDATE exam_attempts
  SET score = v_score, passing = v_passing, completed_at = NOW()
  WHERE id = NEW.id;

  -- Insert results record
  INSERT INTO exam_results (attempt_id, score, passing, weak_areas)
  VALUES (
    NEW.id,
    v_score,
    v_passing,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'topic', topic,
        'accuracy', ROUND(accuracy, 2),
        'total', total_questions,
        'correct', correct
      ))
      FROM (
        SELECT
          q.topic,
          COUNT(*) as total_questions,
          SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END) as correct,
          (SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as accuracy
        FROM exam_answers ea
        JOIN questions q ON ea.question_id = q.id
        WHERE ea.attempt_id = NEW.id
        GROUP BY q.topic
        HAVING (SUM(CASE WHEN ea.is_correct THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 < 50
        ORDER BY accuracy ASC
      ) weak_areas
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on exam completion
CREATE TRIGGER score_calculation_trigger
AFTER UPDATE OF completed_at ON exam_attempts
FOR EACH ROW
WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION calculate_exam_score();
```

### Performance Analytics Endpoint

```typescript
GET /api/exams/{examId}/analytics
// Response 200:
{
  exam_id: "uuid",
  exam_name: "Constitutional Law Final",
  attempts: [
    {
      attempt_id: "uuid",
      score: 78,
      passing: true,
      attempted_at: "2026-02-01T15:30:00Z",
      time_spent_minutes: 90,
      weak_areas: [
        { topic: "direito-penal", accuracy: 40 },
        { topic: "direito-administrativo", accuracy: 45 }
      ]
    }
  ],
  analytics: {
    average_score: 78,
    best_score: 85,
    worst_score: 65,
    total_attempts: 3,
    passing_rate: 66.7,
    average_time_minutes: 88,
    frequently_weak_topics: [
      { topic: "direito-penal", frequency: 3 },
      { topic: "direito-administrativo", frequency: 2 }
    ]
  }
}

GET /api/students/analytics
// Response 200 (Personal performance dashboard):
{
  total_exams_taken: 5,
  average_score: 75.4,
  total_study_hours: 12.5,
  improvement_trend: 5.2, // percentage improvement
  weak_areas_by_topic: [
    { topic: "direito-penal", accuracy: 55, attempts: 8 },
    { topic: "direito-administrativo", accuracy: 62, attempts: 6 }
  ],
  recommended_study_topics: [
    "direito-penal",
    "direito-administrativo",
    "direito-civil"
  ]
}
```

### Time Analysis

```typescript
// Calculate time statistics per question
{
  average_time_per_question: 108, // seconds
  median_time_per_question: 95,
  min_time: 15,
  max_time: 300,
  distribution: {
    '0-30s': 5,
    '30-60s': 15,
    '60-120s': 20,
    '120-180s': 8,
    '180s+': 2
  }
}
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Scoring calculation accuracy (test with examples)
- [ ] Weak area threshold validation (50% threshold correct)
- [ ] Off-by-one error checks in counts

### Pre-PR

- [ ] Query performance (< 1s for typical user)
- [ ] @db-sage review of analytics queries

### Pre-Deployment

- [ ] End-to-end: attempt → results → analytics visible

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Slow analytics queries | Create indexes on topic, add caching layer |
| Division by zero in calculations | Always check COUNT > 0 before dividing |
| Weak areas threshold too strict/loose | Test with users, adjust 50% threshold based on data |
| Analytics data out of sync | Use views or materialized views for consistency |

---

## Dependencies

- [ ] Story 2.2 (Answer submission) completed
- [ ] exam_results table created

---

## Implementation Checklist

- [ ] Create database function for score calculation
- [ ] Create trigger for automatic score computation
- [ ] Implement weak area detection logic
- [ ] Create performance analytics query functions
- [ ] Create time analysis endpoints
- [ ] Write tests for scoring accuracy
- [ ] Test weak area detection (unit tests with examples)
- [ ] Optimize analytics queries with indexes
- [ ] Create analytics dashboard endpoints
- [ ] Document scoring algorithm

---

**Created:** 2026-02-01
**Previous Story:** [07-exam-ui-interaction.md](./07-exam-ui-interaction.md)
**Next Story:** [09-csv-import-pipeline.md](./09-csv-import-pipeline.md)
