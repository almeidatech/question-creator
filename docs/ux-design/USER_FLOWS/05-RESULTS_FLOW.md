# 🏆 Flow 5: Results & Score Analytics

**Timeline:** Week 7 | **Priority:** 🟠 HIGH | **Screens:** 3

---

## 📊 Flow Overview

```
Results Page (Auto-calculate after submit)
  ├─ Score percentage (78%)
  ├─ Pass/Fail indicator
  ├─ Stats cards (correct, time, accuracy)
  │
  ├─→ Breakdown by Topic
  │   └─ Table: Topic | Correct | Total | %
  │
  ├─→ Performance Comparison
  │   └─ Line chart: Previous attempts trend
  │
  └─→ Next Steps
      ├─ Recommended questions
      ├─ Weak areas to focus
      └─ Buttons: New exam, Practice, Dashboard
```

---

## 🎨 Screen 5.1: Score Summary

### Layout

```
┌──────────────────────────────────────┐
│  YOUR SCORE                          │
│  78%                                 │
│  ✓ Congratulations! You passed!      │
│     (Passing score: 60%)             │
│                                      │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ Correct      │ │ Time Spent   │  │
│  │ 32 / 40      │ │ 45:32        │  │
│  │ (80%)        │ │ Avg: 68s/Q   │  │
│  └──────────────┘ └──────────────┘  │
│                                      │
│  ┌──────────────┐                    │
│  │ Weak Areas   │                    │
│  │ 1. Direitos  │                    │
│  │ 2. Poder     │                    │
│  │ 3. Admin.    │                    │
│  └──────────────┘                    │
│                                      │
│  Achievements Unlocked:              │
│  ☆ 🎖️ First 80%+ score              │
│  ☆ 🔥 7-day streak                  │
│  ☆ 📈 Top 10% ranking               │
└──────────────────────────────────────┘
```

### Components Used

| Component | Count |
|-----------|-------|
| Card | 1 (hero) |
| StatsCard | 3 |
| Badge | 3+ (achievements) |
| Text | 8+ |

### Data Calculation

```typescript
interface ExamResults {
  attemptId: string;
  userId: string;
  examId: string;
  scorePercentage: number;  // (correct / total) * 100
  correctCount: number;
  totalQuestions: number;
  passed: boolean;  // scorePercentage >= 60
  timeTaken: number;  // seconds
  timePerQuestion: number;  // average
  weakAreas: string[];  // Topics with <70% accuracy
  achievements: Achievement[];
  createdAt: Date;
}
```

---

## 🎨 Screen 5.2: Topic Breakdown

### Layout

```
Breakdown by Topic
┌────────────────────────────────────────┐
│ Topic              │ Correct │ Accuracy │
├────────────────────┼─────────┼──────────┤
│ Direitos Fund.     │  3/5    │  60% 🔴  │
│ Poder Judiciário   │  4/4    │ 100% 🟢  │
│ Separação Poderes  │  5/6    │  83% 🟡  │
│ Supremo Tribunal   │  4/4    │ 100% 🟢  │
│ ...                │  ...    │  ...     │
├────────────────────┼─────────┼──────────┤
│ TOTAL              │ 32/40   │  80% 🟢  │
└────────────────────────────────────────┘

Performance Comparison (Line Chart)
Score trends from last 5 exams:
70% → 72% → 75% → 78% (current) ↗️
```

### Components Used

| Component | Count |
|-----------|-------|
| Table | 1 |
| ProgressBar | N (one per row) |
| LineChart | 1 |
| Text | 5+ |

### Data Structure

```typescript
interface TopicBreakdown {
  topic: {
    id: string;
    name: string;
  };
  correct: number;
  total: number;
  accuracy: number;  // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

interface PerformanceTrend {
  attempts: Array<{
    date: Date;
    score: number;
    attemptId: string;
  }>;
}
```

---

## 🎨 Screen 5.3: Next Steps & Actions

### Layout

```
What's Next?

IF PASSED:
┌──────────────────────────────────────┐
│ 🎉 You're on track for success!     │
│                                      │
│ [Try Another Exam]                  │
│ [Review Weak Areas]                 │
│ [Practice More Questions]            │
└──────────────────────────────────────┘

IF FAILED:
┌──────────────────────────────────────┐
│ Focus on these topics:               │
│ 1. Direitos Fundamentais (60%)       │
│ 2. Poder Judiciário (50%)            │
│ 3. Tributário (45%)                  │
│                                      │
│ [Practice Weak Areas]                │
│ [Review Theory Notes]                │
│ [Try Another Exam]                   │
└──────────────────────────────────────┘

[Back to Dashboard]
> Share score on social media
```

### Components Used

| Component | Count |
|-----------|-------|
| Card | 1-2 |
| Button | 3 |
| Link | 2 |
| Text | 5+ |
| Badge | 3 (topics) |

---

## 📊 Scoring Rules

```
Correct Answer
  → 1 point
  → Score % = (correct / total) * 100

Passing Score
  → 60% or higher
  → Equivalent to ~70% on real OAB exam
  → Adjustable per exam (configurable)

Time Bonus (future feature)
  → Not in MVP
  → Could add: Finish <50% of time limit = +5%

Penalty (not in MVP)
  → Wrong answers don't have penalties
  → Keep it encouraging
```

---

## 🏅 Achievement System

```
Achievements (Badges)
├─ First 100% Score
├─ 7-day Streak
├─ 100 Questions Answered
├─ Top 10% Ranking
├─ Perfect Week (all exams >80%)
├─ Speed Demon (<45s avg per question)
└─ Theory Master (all topics >90%)
```

---

## 📊 Analytics & Insights

### User Dashboard Metrics

After results page, user sees:

```
Personal Stats
├─ Total questions answered: 542
├─ Accuracy rate: 78% (all time)
├─ Current streak: 7 days
├─ Favorite domain: Direito Constitucional
├─ Weakest area: Direito Tributário
└─ Ranking: Top 15% of users
```

### Admin Analytics (Aggregated)

```
Question Analytics (per question)
├─ Attempts: 1,234
├─ Accuracy: 72%
├─ Average time: 65s
├─ Difficulty rating: Medium
├─ Feedback reports: 3 (auto-flagged if >2)
└─ Quality score: 8.2/10
```

---

## 🧪 Testing Checklist

- [ ] Score percentage calculated correctly
- [ ] Pass/fail determination correct
- [ ] Stats cards show correct numbers
- [ ] Breakdown table displays topics
- [ ] ProgressBar colors update by accuracy
- [ ] Line chart shows trend correctly
- [ ] Weak areas identified correctly
- [ ] Achievements unlock properly
- [ ] "Try Another Exam" button works
- [ ] "Practice Weak Areas" filters correctly
- [ ] "Back to Dashboard" navigates
- [ ] Share button opens social media
- [ ] All numbers match database

---

## 📱 Mobile Considerations

- Stack stats cards vertically on mobile
- Line chart scales responsively
- Table scrolls horizontally if needed
- Buttons full width on <640px

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Ready for Development

