# US-2.3: Exam UI & Interaction

**Epic:** Epic 2 - Exam Management
**Sprint:** 2.3 / Week 6
**Effort:** 28h
**Assigned to:** @dev, @ux-expert
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** student taking an exam
**I want** to answer questions with a countdown timer and navigation
**So that** I can manage my time and review my answers before submitting

---

## Acceptance Criteria

- [ ] **Exam Builder** (Create/Edit UI)
  - Question selector: search + filter by difficulty/topic
  - Drag-to-reorder questions
  - Show selected question count + duration estimate
  - Duration input (5-180 min)
  - Passing score input (0-100%)
  - Save button
  - All inputs validated in real-time

- [ ] **Exam Taker** (During exam)
  - Countdown timer: displays remaining time (HH:MM:SS)
  - 5-minute warning: toast notification
  - Auto-submit on timeout (graceful)
  - Question navigation: Previous / Next buttons
  - Progress indicator: \"Question X of Y\"
  - Can go back to previous questions (before submit)
  - Review answers before submitting
  - Submit answer button
  - Visual feedback: correct/incorrect after submit

- [ ] **Results Page**
  - Overall score: percentage + pass/fail status
  - Per-topic breakdown: accuracy by topic (chart or table)
  - Weak areas: topics < 50% accuracy highlighted
  - Time spent: total + per question
  - Option to review answers
  - Option to retake exam
  - Share button (copy link with results)

- [ ] **Exam History**
  - List past attempts
  - Filter: date range, passing/failing
  - Show: score, date, time spent
  - Review link (view detailed results)
  - Delete attempt option (optional)

---

## Definition of Done

- [ ] All components render and interact correctly
- [ ] Timer accurate (±1s over 1 hour)
- [ ] Results display correctly (calculated from API)
- [ ] Responsive on mobile (tested 3 viewports)
- [ ] React Testing Library coverage ≥ 80%
- [ ] Accessibility WCAG 2.1 AA
- [ ] LightHouse score ≥ 90
- [ ] E2E: create exam → take exam → view results

---

## Technical Specifications

### Timer Implementation

```typescript
// useTimer hook
const useTimer = (durationSeconds: number) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        // Warn at 5 minutes
        if (prev === 300) {
          showWarningToast("5 minutes remaining");
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { remaining, isExpired, timeDisplay: formatTime(remaining) };
};
```

### Component Structure

```typescript
<ExamBuilder onSave={createExam} />
<ExamTaker attemptId={attemptId} />
<ResultsPage attemptId={attemptId} />
<ExamHistory exams={userExams} />
```

### Exam Builder Form Structure

```typescript
// Form state
{
  name: string;
  description: string;
  duration_minutes: number; // 5-180
  passing_score: number; // 0-100
  question_ids: string[]; // 5-50 questions
}

// UI Flow
1. Search and select questions (with filters)
2. Drag to reorder questions
3. Review summary (X questions, Y minutes)
4. Set duration and passing score
5. Save exam
```

### Results Display

```typescript
// Results structure returned from API
{
  attempt_id: string;
  score: number; // 0-100
  passing: boolean;
  total_questions: number;
  correct_answers: number;
  started_at: ISO8601;
  completed_at: ISO8601;
  time_spent_minutes: number;
  weak_areas: Array<{
    topic: string;
    accuracy: number; // percentage
    total: number;
    correct: number;
  }>;
  answers: Array<{
    question_id: string;
    question_text: string;
    user_answer_index: number;
    correct_answer_index: number;
    is_correct: boolean;
    time_spent_seconds: number;
  }>;
}
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Timer accuracy test (mock time)
- [ ] Answer recording verified

### Pre-PR

- [ ] LightHouse score ≥ 90
- [ ] Responsive on mobile
- [ ] @ux-expert review

### Pre-Deployment

- [ ] E2E: create exam → take → view results

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Timer becomes out of sync | Use server-side time, sync on each answer |
| User loses progress on timeout | Auto-save answers as they submit |
| Results calculation mismatch | Verify client-side matches API response |
| Mobile responsiveness issues | Test on real devices (not just emulator) |

---

## Dependencies

- [ ] Story 2.1 (Exam CRUD) completed
- [ ] Story 2.2 (Answer submission) completed

---

## Implementation Checklist

- [ ] Create ExamBuilder component
  - [ ] Question search/filter component
  - [ ] Drag-and-drop reordering
  - [ ] Summary panel
  - [ ] Form with validation
- [ ] Create ExamTaker component
  - [ ] Timer display
  - [ ] Question card
  - [ ] Navigation buttons
  - [ ] Progress indicator
  - [ ] Auto-save answers
- [ ] Create ResultsPage component
  - [ ] Score display
  - [ ] Topic breakdown chart
  - [ ] Weak areas highlighting
  - [ ] Time analysis
- [ ] Create ExamHistory component
  - [ ] Attempts list
  - [ ] Filters and sorting
  - [ ] Review links
- [ ] Write timer tests
- [ ] Write component tests (React Testing Library)
- [ ] Test accessibility (axe DevTools)
- [ ] Optimize performance (LightHouse)

---

**Created:** 2026-02-01
**Previous Story:** [06-exam-attempt-answer-submission.md](./06-exam-attempt-answer-submission.md)
**Next Story:** [08-scoring-analytics-weak-areas.md](./08-scoring-analytics-weak-areas.md)
