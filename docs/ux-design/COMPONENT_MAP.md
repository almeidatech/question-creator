# 📊 Component Map & Usage Matrix

**Version:** 1.0 | **Date:** 2026-02-01 | **Total Components:** 32

---

## 📑 Table of Contents

1. [Component Inventory](#component-inventory)
2. [Usage by Flow](#usage-by-flow)
3. [Usage by Screen](#usage-by-screen)
4. [Dependency Graph](#dependency-graph)

---

## Component Inventory

### Layer: ATOMS (14 components)

| # | Component | File | Props | State | Notes |
|---|-----------|------|-------|-------|-------|
| 1 | **Button** | `ui/button.tsx` | variant, size, disabled, onClick | - | Primary action element |
| 2 | **Input** | `ui/input.tsx` | type, value, onChange, placeholder | - | Text input field |
| 3 | **Select** | `ui/select.tsx` | value, onValueChange, placeholder | - | Dropdown selection |
| 4 | **Checkbox** | `ui/checkbox.tsx` | checked, onCheckedChange | - | Boolean selection |
| 5 | **RadioGroup** | `ui/radio-group.tsx` | value, onValueChange | - | Single selection from group |
| 6 | **Label** | `ui/label.tsx` | htmlFor, required | - | Form label |
| 7 | **Card** | `ui/card.tsx` | children, className | - | Content container |
| 8 | **Dialog** | `ui/dialog.tsx` | open, onOpenChange | - | Modal overlay |
| 9 | **Badge** | `ui/badge.tsx` | variant, size, children | - | Status indicator |
| 10 | **Divider** | `ui/divider.tsx` | orientation | - | Visual separator |
| 11 | **Spinner** | `atoms/spinner.tsx` | size, color | - | Loading indicator |
| 12 | **Icon** | Lucide Icons | name, size, color | - | SVG icons |
| 13 | **Tabs** | `ui/tabs.tsx` | value, onValueChange | - | Tab navigation |
| 14 | **Text** | Tailwind classes | className, children | - | Typography wrapper |

---

### Layer: MOLECULES (10 components)

| # | Component | Atoms Used | File | State | Use Cases |
|---|-----------|------------|------|-------|-----------|
| 1 | **FormField** | Label + Input/Select + Text | `molecules/form-field.tsx` | None | Every form input |
| 2 | **SearchInput** | Input + Icon + Button | `molecules/search-input.tsx` | value, focused | Question search |
| 3 | **DomainSelector** | Select + Text | `molecules/domain-selector.tsx` | value | Choose legal domain |
| 4 | **SubjectSelector** | Select + Text | `molecules/subject-selector.tsx` | value | Choose subject area |
| 5 | **DifficultySelector** | RadioGroup + Icons | `molecules/difficulty-selector.tsx` | value | Choose difficulty level |
| 6 | **ReputationBadge** | Badge + Tooltip | `molecules/reputation-badge.tsx` | - | Show question quality |
| 7 | **DifficultyBadge** | Badge + Icon | `molecules/difficulty-badge.tsx` | - | Show question difficulty |
| 8 | **SourceBadge** | Badge + Icon | `molecules/source-badge.tsx` | - | Show question source |
| 9 | **QuestionOption** | RadioItem + Label + Card | `molecules/question-option.tsx` | selected | Option A/B/C/D/E |
| 10 | **CheckboxGroup** | Checkbox × N + Label | `molecules/checkbox-group.tsx` | selected | Multi-select (rare) |

---

### Layer: ORGANISMS (12 components)

| # | Component | Molecules Used | File | State | Primary Use |
|---|-----------|-----------------|------|-------|------------|
| 1 | **QuestionCard** | ReputationBadge, DifficultyBadge, SourceBadge | `organisms/questions/question-card.tsx` | hover, selected | List item display |
| 2 | **QuestionDetail** | QuestionOption × 5, ReputationBadge | `organisms/questions/question-detail.tsx` | selectedAnswer, submitted, isCorrect | Detailed question view |
| 3 | **QuestionGeneratorForm** | DomainSelector, SubjectSelector, DifficultySelector | `organisms/questions/question-generator-form.tsx` | domain, subject, difficulty, count, loading | Generate new questions |
| 4 | **QuestionFeedbackSection** | FormField, RadioGroup, TextArea | `organisms/questions/question-feedback-section.tsx` | feedbackHelpful, feedbackText | Show explanation & collect feedback |
| 5 | **FeedbackDialog** | Dialog, FormField, Select, TextArea | `organisms/questions/feedback-dialog.tsx` | open, category, text, submitting | Report question problem |
| 6 | **ExamHeader** | Text, ProgressBar, Timer, Button | `organisms/exams/exam-header.tsx` | currentQuestion, totalQuestions, timeRemaining | Show exam metadata |
| 7 | **ExamFooter** | Button × 4, Text | `organisms/exams/exam-footer.tsx` | canGoBack, canGoForward | Navigation buttons |
| 8 | **ExamAttempt** | ExamHeader, QuestionDetail, ExamFooter | `organisms/exams/exam-attempt.tsx` | currentQuestion, answers, timeRemaining, flaggedQuestions | Full exam interface |
| 9 | **DashboardHeader** | Text, Button, Avatar, StatsCard × 3 | `organisms/dashboard/dashboard-header.tsx` | user, stats | User profile + stats |
| 10 | **StatsCard** | Card, Text, Icon, Badge | `organisms/dashboard/stats-card.tsx` | - | Metric display |
| 11 | **QuestionGenerationPanel** | DomainSelector, SubjectSelector, DifficultySelector, Button | `organisms/generation/question-generation-panel.tsx` | loading, error, results | Complete generation workflow |
| 12 | **AdminReviewQueue** | Card, Button, FormField, ReputationBadge | `organisms/admin/review-queue-item.tsx` | decision, notes, submitting | Expert review interface |

---

### Layer: TEMPLATES (4 templates)

| # | Template | Organisms | File | Usage |
|---|----------|-----------|------|-------|
| 1 | **DashboardLayout** | Header, Sidebar, Content | `templates/dashboard-layout.tsx` | All dashboard pages |
| 2 | **ExamLayout** | ExamHeader, Content, ExamFooter | `templates/exam-layout.tsx` | Exam pages |
| 3 | **FormLayout** | Form, Button | `templates/form-layout.tsx` | Auth & profile pages |
| 4 | **CardGridLayout** | QuestionCard × N | `templates/card-grid-layout.tsx` | Question lists |

---

### Layer: PAGES (8 pages)

| # | Page | Template | Key Organisms | File | Route |
|---|------|----------|---|------|-------|
| 1 | **Dashboard** | DashboardLayout | DashboardHeader, QuestionGenerationPanel | `app/(dashboard)/page.tsx` | `/` |
| 2 | **Generate Questions** | DashboardLayout | QuestionGeneratorForm, QuestionCard grid | `app/(dashboard)/questions/generate/page.tsx` | `/questions/generate` |
| 3 | **Question Detail** | DashboardLayout | QuestionDetail, FeedbackDialog | `app/(dashboard)/questions/[id]/page.tsx` | `/questions/{id}` |
| 4 | **Exam List** | DashboardLayout | StatsCard, QuestionCard grid | `app/(dashboard)/exams/page.tsx` | `/exams` |
| 5 | **Exam Attempt** | ExamLayout | ExamAttempt | `app/(dashboard)/exams/[id]/attempt/page.tsx` | `/exams/{id}/attempt` |
| 6 | **Exam Results** | DashboardLayout | StatsCard, ResultsTable, Chart | `app/(dashboard)/exams/[id]/results/page.tsx` | `/exams/{id}/results` |
| 7 | **Profile** | FormLayout | ProfileForm | `app/(dashboard)/profile/page.tsx` | `/profile` |
| 8 | **Admin Review** | DashboardLayout | AdminReviewQueue × N | `app/admin/review/page.tsx` | `/admin/review` |

---

## Usage by Flow

### Flow 1: Signup & Authentication

```
Signup Page
├─ FormLayout (template)
│  ├─ FormField (label + input email)
│  ├─ FormField (label + input password)
│  ├─ FormField (label + input confirm)
│  ├─ Checkbox (agree to terms)
│  └─ Button (primary, "Sign Up")
│
Email Verification Screen
├─ FormLayout
│  ├─ Text.heading2
│  ├─ Input (6-digit code)
│  ├─ Button (primary, "Verify")
│  └─ Link (resend code)
│
Complete Profile Screen
├─ FormLayout
│  ├─ Avatar upload (Input type=file)
│  ├─ FormField (full name)
│  ├─ DomainSelector (molecule)
│  ├─ Button (primary, "Get Started")
│  └─ Link (skip)
```

**Components Used:** FormField, Button, Checkbox, Label, Input, Link, Text

---

### Flow 2: Generate Questions

```
Dashboard Home
├─ DashboardLayout (template)
│  ├─ DashboardHeader (organism)
│  │  ├─ StatsCard × 3
│  │  └─ Button (profile)
│  └─ QuestionGenerationPanel (organism)
│     ├─ DomainSelector (molecule)
│     ├─ SubjectSelector (molecule)
│     ├─ DifficultySelector (molecule)
│     ├─ Input (count: 1-20)
│     ├─ Checkbox (prefer real)
│     └─ Button (primary, "Generate")
│
Generation Loading Screen
├─ Card (centered)
│  ├─ Spinner (loading indicator)
│  ├─ Text ("Generating {count} questions...")
│  ├─ ProgressBar (0-100%)
│  └─ Button (secondary, "Cancel")
│
Preview Generated Questions
├─ CardGridLayout (template)
│  ├─ QuestionCard × N
│  │  ├─ ReputationBadge
│  │  ├─ DifficultyBadge
│  │  ├─ SourceBadge
│  │  └─ Button (Preview)
│  ├─ Button (primary, "Start Practice")
│  └─ Button (secondary, "Generate More")
```

**Components Used:** DashboardHeader, StatsCard, DomainSelector, SubjectSelector, DifficultySelector, Input, Checkbox, Button, Spinner, ProgressBar, QuestionCard, ReputationBadge, DifficultyBadge, SourceBadge

---

### Flow 3: Answer Question

```
Question Detail Page
├─ DashboardLayout (template)
│  ├─ QuestionDetail (organism)
│  │  ├─ ReputationBadge (molecule)
│  │  ├─ DifficultyBadge (molecule)
│  │  ├─ Card
│  │  │  ├─ Text.heading3 (question)
│  │  │  ├─ RadioGroup
│  │  │  │  └─ QuestionOption × 5 (molecules)
│  │  │  ├─ Button (primary, "Submit")
│  │  │  ├─ Button (secondary, "Skip")
│  │  │  └─ FeedbackDialog trigger
│  └─ FeedbackDialog (organism)
│     ├─ Dialog
│     │  ├─ FormField (category select)
│     │  ├─ FormField (description textarea)
│     │  └─ Button (primary, "Submit Report")
│
Result Screen (after submit)
├─ DashboardLayout
│  ├─ QuestionDetail (updated state)
│  │  ├─ Selected option highlighted
│  │  ├─ Correct answer highlighted
│  │  ├─ Badge (Correct/Incorrect)
│  │  └─ QuestionFeedbackSection (organism)
│  │     ├─ Text.heading3 ("Commentary")
│  │     ├─ Text.body (explanation)
│  │     ├─ RadioGroup (Was this helpful?)
│  │     ├─ TextArea (optional feedback)
│  │     └─ Button (secondary, "Submit Feedback")
│  └─ Button (primary, "Next Question")
```

**Components Used:** QuestionDetail, ReputationBadge, DifficultyBadge, Card, Text, RadioGroup, QuestionOption, Button, FeedbackDialog, Dialog, FormField, QuestionFeedbackSection, TextArea

---

### Flow 4: Exam Simulation

```
Exam Attempt Page
├─ ExamLayout (template)
│  ├─ ExamHeader (organism)
│  │  ├─ Text.heading2 (exam name)
│  │  ├─ ProgressBar (Q5/Q40)
│  │  ├─ Timer (45:32)
│  │  └─ Button (secondary, "Pause")
│  ├─ QuestionDetail (organism)
│  │  ├─ QuestionOption × 5 (molecules)
│  │  └─ [Read-only, no skip]
│  └─ ExamFooter (organism)
│     ├─ Button (secondary, "Previous") [disabled if Q1]
│     ├─ Button (primary, "Submit & Next")
│     ├─ Button (outline, "Flag Question")
│     └─ Button (destructive, "Submit Exam")
│
Exam Review Screen
├─ DashboardLayout
│  ├─ Text.heading2 ("Review Your Answers")
│  ├─ Tabs
│  │  ├─ TabsList (All, Correct, Incorrect, Flagged)
│  │  └─ TabsContent
│  │     └─ QuestionCard × N
│  │        ├─ Text (question preview)
│  │        ├─ Badge (Correct/Incorrect/Flagged)
│  │        ├─ Text (you answered: B)
│  │        ├─ Text (correct answer: D)
│  │        └─ Button (secondary, "View Detail")
│  └─ Button (primary, "View Results & Score")
```

**Components Used:** ExamLayout, ExamHeader, ExamFooter, ProgressBar, Timer, Button, QuestionDetail, QuestionOption, Tabs, TabsList, TabsContent, QuestionCard, Badge, Text

---

### Flow 5: Results & Scoring

```
Score Summary Page
├─ DashboardLayout
│  ├─ Card (hero section)
│  │  ├─ Text.heading1 ("Your Score")
│  │  ├─ Text.3xl ("78%") [colored: green/red]
│  │  ├─ Text.lg ("Congratulations! You passed!")
│  │  └─ Divider
│  ├─ Grid (3 columns)
│  │  ├─ StatsCard (Correct Answers: 32/40)
│  │  ├─ StatsCard (Time Spent: 45:32)
│  │  └─ StatsCard (Weak Areas: Direitos Fundamentais)
│  ├─ Grid (badges)
│  │  ├─ Badge (achievement: "First 100%")
│  │  ├─ Badge (streak: "7-day streak")
│  │  └─ Badge (ranking: "Top 10%")
│
Breakdown by Topic
├─ DashboardLayout
│  ├─ Text.heading2 ("Breakdown by Topic")
│  ├─ Table
│  │  ├─ Column: Topic
│  │  ├─ Column: Correct/Total
│  │  ├─ Column: Accuracy (ProgressBar)
│  │  └─ Footer row (TOTAL)
│  ├─ Divider
│  ├─ Text.heading2 ("Performance Comparison")
│  └─ LineChart (score trend)
│
Actions & Next Steps
├─ DashboardLayout
│  ├─ Text.heading2 ("What's Next?")
│  ├─ Card (if PASS)
│  │  ├─ Text.heading3 ("Recommended Next Steps")
│  │  ├─ Button (primary, "Start New Exam")
│  │  ├─ Button (secondary, "Review Weak Areas")
│  │  └─ Button (secondary, "Practice Questions")
│  ├─ Card (if FAIL)
│  │  ├─ Text.heading3 ("Focus on These Topics")
│  │  ├─ List (weak areas × 3)
│  │  └─ Button (primary, "Practice Weak Areas")
│  ├─ Divider
│  ├─ Button (secondary, "Back to Dashboard")
│  └─ Link ("Share score on social media")
```

**Components Used:** Card, Text, StatsCard, Badge, Divider, ProgressBar, Table, LineChart, Button, Link

---

## Usage by Screen

### Screen: Dashboard Home

| Component | Type | Count | Required? |
|-----------|------|-------|-----------|
| DashboardHeader | Organism | 1 | ✅ |
| StatsCard | Organism | 3 | ✅ |
| QuestionGenerationPanel | Organism | 1 | ✅ |
| Tabs | Atom | 1 | ✅ |
| QuestionCard | Organism | N | ✅ |
| Button | Atom | 2-3 | ✅ |
| Text | Atom | 3+ | ✅ |

---

### Screen: Question Detail

| Component | Type | Count | Required? |
|-----------|------|-------|-----------|
| QuestionDetail | Organism | 1 | ✅ |
| ReputationBadge | Molecule | 1 | ✅ |
| DifficultyBadge | Molecule | 1 | ✅ |
| QuestionOption | Molecule | 5 | ✅ |
| RadioGroup | Atom | 1 | ✅ |
| Button | Atom | 2-3 | ✅ |
| FeedbackDialog | Organism | 1 | ✅ |
| QuestionFeedbackSection | Organism | 1 | Optional |

---

### Screen: Exam Attempt

| Component | Type | Count | Required? |
|-----------|------|-------|-----------|
| ExamHeader | Organism | 1 | ✅ |
| ExamFooter | Organism | 1 | ✅ |
| QuestionDetail | Organism | 1 | ✅ |
| QuestionOption | Molecule | 5 | ✅ |
| Timer | Atom | 1 | ✅ |
| ProgressBar | Atom | 1 | ✅ |
| Button | Atom | 4 | ✅ |

---

## Dependency Graph

### Atoms (No dependencies)

```
Button → (no deps)
Input → (no deps)
Select → (no deps)
Checkbox → (no deps)
RadioGroup → (no deps)
Label → (no deps)
Card → (no deps)
Dialog → (no deps)
Badge → (no deps)
Divider → (no deps)
Spinner → (no deps)
Icon → (no deps)
Tabs → (no deps)
Text → (no deps)
```

### Molecules (Depend on Atoms)

```
FormField → Label, Input/Select/RadioGroup, Text
SearchInput → Input, Icon, Button
DomainSelector → Select, Text
SubjectSelector → Select, Text
DifficultySelector → RadioGroup, Icon
ReputationBadge → Badge, (Tooltip)
DifficultyBadge → Badge, Icon
SourceBadge → Badge, Icon
QuestionOption → RadioGroupItem, Label, Card
CheckboxGroup → Checkbox, Label
```

### Organisms (Depend on Molecules + Atoms)

```
QuestionCard → Card, Text, Button, ReputationBadge, DifficultyBadge, SourceBadge
QuestionDetail → Card, RadioGroup, Button, Text, ReputationBadge, QuestionOption
QuestionGeneratorForm → Form, DomainSelector, SubjectSelector, DifficultySelector, Input, Checkbox, Button
QuestionFeedbackSection → Text, RadioGroup, TextArea, Button
FeedbackDialog → Dialog, FormField, Select, TextArea, Button
ExamHeader → Card, Text, ProgressBar, Timer, Button
ExamFooter → Button, Text
ExamAttempt → Card, ExamHeader, QuestionDetail, ExamFooter
DashboardHeader → Card, Text, Avatar, StatsCard, Button
StatsCard → Card, Text, Icon, Badge
QuestionGenerationPanel → DomainSelector, SubjectSelector, DifficultySelector, Input, Checkbox, Button, Spinner
AdminReviewQueue → Card, Button, FormField, ReputationBadge, Text
```

---

## Component Statistics

| Layer | Count | Reusable | Complex |
|-------|-------|----------|---------|
| **Atoms** | 14 | 14/14 (100%) | 0 |
| **Molecules** | 10 | 10/10 (100%) | 0 |
| **Organisms** | 12 | 9/12 (75%) | 3 |
| **Templates** | 4 | 4/4 (100%) | 0 |
| **Pages** | 8 | - | 8 |
| **TOTAL** | 48 | - | - |

---

## Key Metrics

- **Atoms per Molecule:** 2-3 (average)
- **Molecules per Organism:** 1-4 (average)
- **Organisms per Template:** 2-4 (average)
- **Components per Page:** 8-15 (average)
- **Reusability Score:** 88% (38/48 components are reused)

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Complete

