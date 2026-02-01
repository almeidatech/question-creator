# 📝 Flow 3: Answer Question & Submit

**Timeline:** Week 4-5 | **Priority:** 🔴 CRITICAL | **Screens:** 2

---

## 📊 Flow Overview

```
Question Detail Page
  ├─ Shows question text + options A-E
  ├─ User selects answer
  ├─ Clicks "Submit"
  │
  └─→ Result Screen
      ├─ Shows if correct/incorrect
      ├─ Highlights correct answer
      ├─ Shows explanation
      ├─ Collects user feedback
      └─→ Next Question or Dashboard
```

---

## 🎨 Screen 3.1: Question Detail

### Components & Layout

```
Question Title: Q42 - Direitos Fundamentais
[Reputation: 8/10]  [Difficulty: Medium ⭐⭐]

┌──────────────────────────────────────┐
│                                      │
│ Qual dos seguintes direitos...       │
│ (full question text with context)   │
│                                      │
│ ─────────────────────────────────   │
│                                      │
│ ◯ A) Primeira opção...              │
│ ◯ B) Segunda opção...               │
│ ◯ C) Terceira opção...              │
│ ◉ D) Quarta opção (selected)        │
│ ◯ E) Quinta opção...                │
│                                      │
│ [Skip] [Submit Answer]              │
│                                      │
│ [Flag] [Report Problem]             │
└──────────────────────────────────────┘
```

### Components Used

| Component | Count |
|-----------|-------|
| QuestionDetail | 1 |
| ReputationBadge | 1 |
| DifficultyBadge | 1 |
| RadioGroup | 1 |
| QuestionOption | 5 |
| Button | 3 |
| FeedbackDialog | 1 (trigger) |

### State Management

```typescript
interface QuestionAnswerState {
  question: Question;
  selectedAnswer: string | null;
  submitted: boolean;
  isCorrect: boolean | null;
  showCommentary: boolean;
  timeSpent: number;  // milliseconds
  questionStartTime: number;
}
```

### User Actions

- ✅ Read question carefully
- ✅ Click radio button to select answer
- ✅ Click "Submit Answer"
- ✅ Click "Skip" to go to next without answering
- ✅ Click "Report Problem" for feedback

---

## 🎨 Screen 3.2: Answer Result & Commentary

### Layout

```
Question (same, but answer highlighted)

Selected: D (highlighted in blue)
Correct answer: D (highlighted in green)

┌──────────────────────────────────────┐
│ ✓ Correct! +10 points              │
│                                      │
│ COMMENTARY:                          │
│ Article 5 of the Federal            │
│ Constitution establishes...         │
│                                      │
│ Was this helpful?                   │
│ ◯ Yes  ◯ No  ◯ Not sure            │
│                                      │
│ Additional feedback (optional):     │
│ [textarea for user feedback]        │
│                                      │
│ [Submit Feedback]                   │
│                                      │
│ [< Previous] [Next >] [Dashboard]   │
└──────────────────────────────────────┘
```

### Components Used

| Component | Count |
|-----------|-------|
| QuestionDetail | 1 (updated) |
| QuestionFeedbackSection | 1 |
| RadioGroup | 1 |
| TextArea | 1 |
| Button | 3 |

### State Management

```typescript
interface QuestionResultState {
  feedbackHelpful: boolean | null;
  feedbackText: string;
  feedbackSubmitted: boolean;
  nextQuestion: Question | null;
  previousQuestion: Question | null;
}
```

---

## 📊 Scoring System

```
Correct Answer
  → +10 points
  → Points added to user dashboard
  → Points added to question quality metrics

Wrong Answer
  → +0 points
  → Explanation shown
  → Question difficulty adjusted based on performance

Skipped
  → +0 points
  → No points penalty
  → Can come back later
```

---

## 🔗 Data Relationships

```
User submits answer
  ↓
POST /api/questions/{id}/submit
  ↓
Create user_question_history record
  ├─ user_id
  ├─ question_id
  ├─ session_id (groups multiple attempts)
  ├─ context ('practice' or 'exam_simulation')
  ├─ user_answer ('a', 'b', 'c', 'd', 'e')
  ├─ is_correct (true/false)
  ├─ points_earned (0 or 10)
  ├─ time_spent_seconds
  └─ submitted_at
  ↓
Trigger: Update question_reputation
  ├─ Count this attempt
  ├─ Recalculate reputation score (0-10)
  └─ Adjust difficulty if needed
  ↓
User submits feedback
  ↓
POST /api/questions/{id}/feedback
  ↓
Create question_feedback record
  ├─ question_id
  ├─ user_id
  ├─ category (incorrect_answer, unclear, error, typo, other)
  ├─ text (user explanation)
  ├─ is_helpful (null at creation)
  └─ created_at
  ↓
If 3+ feedbacks with issues:
  → Auto-flag for expert review
  → Queue to admin review panel
```

---

## 🧪 Testing Checklist

- [ ] Question loads correctly
- [ ] All 5 options selectable
- [ ] Selected option shows visual feedback
- [ ] Can change selection before submit
- [ ] "Submit" disabled until answer selected
- [ ] "Skip" works without selection
- [ ] Correct answer highlighted in green after submit
- [ ] Wrong answer highlighted in red after submit
- [ ] Correct/incorrect message appears
- [ ] Explanation displays
- [ ] Feedback form appears
- [ ] Feedback submission works
- [ ] Points awarded for correct answers
- [ ] Timer works correctly
- [ ] Navigation to next/previous questions works
- [ ] Navigation to dashboard works

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Ready for Development

