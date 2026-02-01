# 🏫 Flow 4: Exam Simulation

**Timeline:** Week 6-7 | **Priority:** 🟠 HIGH | **Screens:** 3

---

## 📊 Flow Overview

```
Exam Attempt Page
  ├─ Timer countdown (red when <5min)
  ├─ Progress bar (Q5/Q40)
  ├─ Question with options
  ├─ Navigation: Prev/Next/Flag/Submit
  │
  ├─→ Flag question feature
  │   └─ Marks for review later
  │
  └─→ All questions answered
      ├─ Review screen (optional)
      ├─ Verify answers
      └─→ Submit exam
          └─→ Results page (Flow 5)
```

---

## 🎨 Screen 4.1: Exam Attempt Interface

### Components & Layout

```
┌────────────────────────────────────────┐
│ OAB Simulation 2023 - Question 5/40    │
│ [████████░░░░░░░░░░░░░░░░░░░] 12%     │
│ Time Remaining: 45:32                  │
│ [Pause Exam]                           │
├────────────────────────────────────────┤
│                                        │
│ Question text with full context...    │
│                                        │
│ ◯ A) Option A...                      │
│ ◉ B) Option B (selected)              │
│ ◯ C) Option C...                      │
│ ◯ D) Option D...                      │
│ ◯ E) Option E...                      │
│                                        │
├────────────────────────────────────────┤
│ [< Previous] [Flag Q5] [Submit & Next] │
│ [Submit Exam]                          │
└────────────────────────────────────────┘
```

### State Management

```typescript
interface ExamAttemptState {
  examId: string;
  attemptId: string;
  currentQuestion: number;  // 0-indexed
  totalQuestions: number;
  answers: Record<string, string>;  // q_id → answer
  flaggedQuestions: string[];
  timeRemaining: number;  // seconds
  isPaused: boolean;
  submitted: boolean;
}
```

### User Actions

- ✅ Select answer from options
- ✅ Click "< Previous" (goes back, keeps answer)
- ✅ Click "Submit & Next" (saves answer, moves forward)
- ✅ Click "Flag Q5" (marks for review)
- ✅ Click "Submit Exam" (finish and go to review)
- ✅ Click "Pause Exam" (pause timer, can resume)
- ✅ Timer counts down
- ✅ Progress bar updates

### Features

| Feature | Behavior |
|---------|----------|
| **Timer** | Red when <5 min, blinks when <1 min |
| **Previous Button** | Disabled on Q1, enabled on Q2+ |
| **Flag** | Click to toggle flag, shows flagged count |
| **Answer Saving** | Auto-saves every selection |
| **Pause** | Stops timer, shows pause overlay |

---

## 🎨 Screen 4.2: Exam Review (Optional)

### Layout

```
Review Your Answers Before Submitting
[Tabs: All | Correct | Incorrect | Flagged]

┌──────────────────────────────────┐
│ Q1: Direitos Fundamentais        │
│ You answered: B                  │
│ ✓ Correct                        │
│ [View Detail]                    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Q5: Poder Judiciário             │
│ You answered: A                  │
│ ✗ Incorrect                      │
│ Correct answer: D                │
│ [View Detail]                    │
└──────────────────────────────────┘

[View Results & Score]
```

### Components Used

| Component | Count |
|-----------|-------|
| Tabs | 1 |
| QuestionCard | N |
| Badge | N |
| Button | 3 |

---

## 📊 Exam Timing & Constraints

```
Exam Parameters
├─ Duration: Depends on exam type (typically 2-4 hours)
├─ Questions: 40-80 (typically)
├─ Time per question: ~3 minutes average
├─ Can flag for later review
├─ Can navigate back/forward freely
├─ Cannot skip (must answer or come back)
├─ Timer pauses if exam paused
└─ No time limit on review screen
```

---

## 🧪 Testing Checklist

- [ ] Timer counts down correctly
- [ ] Timer goes red at <5 minutes
- [ ] Progress bar updates with each question
- [ ] Can navigate back and forth
- [ ] Previous button disabled on Q1
- [ ] Answers persist when navigating
- [ ] Flag functionality works
- [ ] Flagged count shows
- [ ] Pause button works
- [ ] Resume works correctly
- [ ] Review screen shows correct answers
- [ ] Can view details from review
- [ ] Submit exam button finalizes attempt
- [ ] Transition to results page works

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Ready for Development

