# 🧬 Atomic Design System

**Version:** 1.0 | **Methodology:** Brad Frost's Atomic Design | **Status:** ✅ Complete

---

## 📋 Table of Contents

1. [Structure Overview](#structure-overview)
2. [Layer 1: ATOMS](#layer-1-atoms)
3. [Layer 2: MOLECULES](#layer-2-molecules)
4. [Layer 3: ORGANISMS](#layer-3-organisms)
5. [Layer 4: TEMPLATES](#layer-4-templates)
6. [Layer 5: PAGES](#layer-5-pages)
7. [Component Assembly Rules](#component-assembly-rules)

---

## Structure Overview

```
┌─────────────────────────────────────────────┐
│  PAGES (Specific Instances)                 │
│  Dashboard, SignupPage, ExamPage            │
└────────────────┬────────────────────────────┘
                 │ composed of
┌────────────────▼────────────────────────────┐
│  TEMPLATES (Page Layouts)                   │
│  DashboardLayout, ExamLayout, FormLayout    │
└────────────────┬────────────────────────────┘
                 │ composed of
┌────────────────▼────────────────────────────┐
│  ORGANISMS (Complex Sections)               │
│  QuestionCard, ExamAttempt, ReviewQueue     │
└────────────────┬────────────────────────────┘
                 │ composed of
┌────────────────▼────────────────────────────┐
│  MOLECULES (Simple Combinations)            │
│  FormField, ReputationBadge, QuestionOption │
└────────────────┬────────────────────────────┘
                 │ composed of
┌────────────────▼────────────────────────────┐
│  ATOMS (Base Components)                    │
│  Button, Input, Label, Card, Badge          │
└────────────────┬────────────────────────────┘
                 │ built with
┌────────────────▼────────────────────────────┐
│  DESIGN TOKENS (Visual Foundation)          │
│  Colors, Typography, Spacing, Shadows       │
└─────────────────────────────────────────────┘
```

---

## Layer 1: ATOMS

**Definition:** Base components that cannot be broken down further without losing meaning.

### ✅ Complete Atom List

#### Form Elements

1. **Button**
   - Variants: primary, secondary, destructive, outline, ghost, link
   - Sizes: sm, md (default), lg, icon
   - States: default, hover, active, disabled, loading
   - File: `src/components/ui/button.tsx`

2. **Input**
   - Types: text, email, password, number, search, url
   - States: default, focused, error, disabled
   - Props: placeholder, value, onChange, required, disabled
   - File: `src/components/ui/input.tsx`

3. **Select**
   - Composition: SelectTrigger, SelectContent, SelectItem
   - States: closed, open, selected, disabled
   - Props: value, onValueChange, placeholder
   - File: `src/components/ui/select.tsx`

4. **Checkbox**
   - States: unchecked, checked, indeterminate, disabled
   - Props: checked, onCheckedChange, disabled, required
   - File: `src/components/ui/checkbox.tsx`

5. **RadioGroup**
   - Composition: RadioGroup, RadioGroupItem, Label
   - Props: value, onValueChange, disabled
   - File: `src/components/ui/radio-group.tsx`

6. **Label**
   - Props: htmlFor, required, children
   - Accessibility: paired with inputs via `for` attribute
   - File: `src/components/ui/label.tsx`

#### Container Elements

7. **Card**
   - Composition: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Props: className, children
   - File: `src/components/ui/card.tsx`

8. **Dialog/Modal**
   - Composition: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter
   - Props: open, onOpenChange
   - File: `src/components/ui/dialog.tsx`

9. **Badge**
   - Variants: primary, success, error, warning, neutral
   - Sizes: sm, md
   - Props: variant, size, children
   - File: `src/components/ui/badge.tsx`

#### Other Atoms

10. **Text/Typography**
    - Uses design token styles (.heading-1, .body, .label, .caption)
    - Implemented via CSS classes or component wrapper
    - File: `src/components/atoms/text.tsx` (optional wrapper)

11. **Divider**
    - Props: orientation (horizontal/vertical), className
    - File: `src/components/ui/divider.tsx`

12. **Spinner/Loader**
    - Sizes: sm, md, lg
    - Colors: primary, success, error
    - Props: size, color
    - File: `src/components/atoms/spinner.tsx`

13. **Icon**
    - Source: React Icons library
    - Props: name, size, color, className
    - File: Lucide icons (integrated via npm)

14. **Tabs**
    - Composition: Tabs, TabsList, TabsTrigger, TabsContent
    - Props: defaultValue, value, onValueChange
    - File: `src/components/ui/tabs.tsx`

### Atoms File Structure

```
src/components/
├── ui/                    # shadcn/ui atoms
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── radio-group.tsx
│   ├── label.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── badge.tsx
│   ├── divider.tsx
│   ├── tabs.tsx
│   └── form.tsx           # React Hook Form wrapper
│
└── atoms/                 # Custom atoms
    ├── text.tsx          # Typography wrapper
    ├── spinner.tsx       # Loading indicator
    └── icon.tsx          # Icon wrapper
```

---

## Layer 2: MOLECULES

**Definition:** Simple combinations of 2-3 atoms that form reusable patterns.

### ✅ Complete Molecule List

#### Form Molecules

1. **FormField**
   - Atoms: Label + Input/Select/RadioGroup + FormMessage
   - Props: label, required, error, description, children
   - Usage: Every form input needs this wrapper
   - File: `src/components/molecules/form-field.tsx`

2. **SearchInput**
   - Atoms: Input + Icon + Button (clear)
   - Props: value, onChange, onSearch, placeholder
   - Features: Clear button, search icon
   - File: `src/components/molecules/search-input.tsx`

3. **DomainSelector**
   - Atoms: Select + Description
   - Props: domains, selected, onChange
   - Data: Links to taxonomy.domains table
   - File: `src/components/molecules/domain-selector.tsx`

4. **SubjectSelector**
   - Atoms: Select + Description
   - Props: subjects, selected, onChange, dependsOn (domain)
   - Data: Links to taxonomy.subjects table
   - File: `src/components/molecules/subject-selector.tsx`

5. **DifficultySelector**
   - Atoms: RadioGroup + Icons
   - Props: value, onChange
   - Options: Easy (1 star), Medium (2 stars), Hard (3 stars)
   - File: `src/components/molecules/difficulty-selector.tsx`

#### Display Molecules

6. **ReputationBadge**
   - Atoms: Badge + Tooltip
   - Props: score (0-10), size (sm/md/lg)
   - Color coding: Green (8+), Yellow (5-7), Orange (2-4), Red (0-1)
   - File: `src/components/molecules/reputation-badge.tsx`

7. **DifficultyBadge**
   - Atoms: Badge + Icon
   - Props: level (easy/medium/hard)
   - Colors: Green (easy), Amber (medium), Red (hard)
   - File: `src/components/molecules/difficulty-badge.tsx`

8. **SourceBadge**
   - Atoms: Badge + Icon
   - Props: source (real_exam, ai_generated, expert_approved)
   - Color coding: Blue (real), Purple (AI), Green (expert)
   - File: `src/components/molecules/source-badge.tsx`

#### Selection Molecules

9. **QuestionOption**
   - Atoms: RadioGroupItem + Label + Card
   - Props: letter, text, selected, correct (after submit), onSelect
   - States: unselected, selected, correct, incorrect
   - File: `src/components/molecules/question-option.tsx`

10. **CheckboxGroup**
    - Atoms: Checkbox × N + Label
    - Props: items, selected, onChange
    - Usage: Multi-select scenarios (rare in this app)
    - File: `src/components/molecules/checkbox-group.tsx`

### Molecules File Structure

```
src/components/
└── molecules/
    ├── form-field.tsx
    ├── search-input.tsx
    ├── domain-selector.tsx
    ├── subject-selector.tsx
    ├── difficulty-selector.tsx
    ├── reputation-badge.tsx
    ├── difficulty-badge.tsx
    ├── source-badge.tsx
    ├── question-option.tsx
    └── checkbox-group.tsx
```

---

## Layer 3: ORGANISMS

**Definition:** Complex components combining multiple molecules/atoms with internal state and logic.

### ✅ Complete Organism List

#### Form Organisms

1. **QuestionGeneratorForm**
   - Molecules: DomainSelector, SubjectSelector, DifficultySelector, SearchInput
   - Atoms: Button, Input (count)
   - Features: Form validation, loading state, error handling
   - State: domain, subject, difficulty, count, preferReal, loading
   - Props: onGenerate
   - File: `src/components/organisms/questions/question-generator-form.tsx`

#### Question Display Organisms

2. **QuestionCard**
   - Atoms: Card, Badge, Button
   - Molecules: ReputationBadge, DifficultyBadge, SourceBadge
   - Props: question, compact, onClick
   - States: hover, selected, loading
   - File: `src/components/organisms/questions/question-card.tsx`

3. **QuestionDetail**
   - Atoms: Card, RadioGroup, Button, Text
   - Molecules: QuestionOption × 5, ReputationBadge
   - Features: Question display, answer selection, feedback
   - State: selectedAnswer, submitted, isCorrect, showCommentary
   - Props: question, onSubmit, showCommentary
   - File: `src/components/organisms/questions/question-detail.tsx`

4. **QuestionFeedbackSection**
   - Atoms: TextArea, Button, RadioGroup
   - Molecules: FormField
   - Features: Show explanation, collect user feedback
   - State: feedbackHelpful, feedbackText, submitted
   - Props: question, userAnswer, correct, onFeedbackSubmit
   - File: `src/components/organisms/questions/question-feedback-section.tsx`

#### Feedback Organisms

5. **FeedbackDialog**
   - Atoms: Dialog, Button, TextArea, Select
   - Molecules: FormField
   - Features: Report problem dialog with categories
   - State: open, category, text, submitting
   - Props: questionId, onSubmit
   - File: `src/components/organisms/questions/feedback-dialog.tsx`

6. **AdminReviewQueue**
   - Atoms: Card, Button, RadioGroup, TextArea
   - Molecules: ReputationBadge, SourceBadge
   - Features: Question review with decision and notes
   - State: decision, notes, submitting
   - Props: feedback, onReview
   - File: `src/components/organisms/admin/review-queue-item.tsx`

#### Exam Organisms

7. **ExamHeader**
   - Atoms: Text, ProgressBar, Timer, Button
   - Features: Exam title, progress, time remaining
   - State: currentQuestion, totalQuestions, timeRemaining
   - Props: exam, currentQuestion, totalQuestions, timeRemaining
   - File: `src/components/organisms/exams/exam-header.tsx`

8. **ExamFooter**
   - Atoms: Button × 4, Text
   - Features: Navigation, flag, submit buttons
   - State: canGoBack, canGoForward
   - Props: canGoBack, canGoForward, onPrevious, onNext, onSubmit
   - File: `src/components/organisms/exams/exam-footer.tsx`

9. **ExamAttempt**
   - Atoms: Card, Button, RadioGroup, Timer
   - Molecules: QuestionOption × 5
   - Organisms: ExamHeader, ExamFooter, QuestionDetail
   - Features: Full exam interface with navigation and timing
   - State: currentQuestion, answers, flaggedQuestions, timeRemaining
   - Props: examId, attemptId, onComplete
   - File: `src/components/organisms/exams/exam-attempt.tsx`

#### Dashboard Organisms

10. **DashboardHeader**
    - Atoms: Text, Button, Avatar
    - Molecules: StatsCard × 3
    - Features: User profile, quick stats
    - State: user, stats
    - Props: user, stats
    - File: `src/components/organisms/dashboard/dashboard-header.tsx`

11. **StatsCard**
    - Atoms: Card, Text, Icon, Badge
    - Features: Display metric with trend
    - Props: title, value, description, icon, trend
    - File: `src/components/organisms/dashboard/stats-card.tsx`

12. **QuestionGenerationPanel**
    - Atoms: Button, Input, Spinner
    - Molecules: DomainSelector, SubjectSelector, DifficultySelector
    - Features: Complete generation workflow
    - State: loading, error, results
    - Props: onQuestionsGenerated
    - File: `src/components/organisms/generation/question-generation-panel.tsx`

### Organisms File Structure

```
src/components/
└── organisms/
    ├── questions/
    │   ├── question-card.tsx
    │   ├── question-detail.tsx
    │   ├── question-generator-form.tsx
    │   ├── question-feedback-section.tsx
    │   └── feedback-dialog.tsx
    ├── exams/
    │   ├── exam-header.tsx
    │   ├── exam-footer.tsx
    │   └── exam-attempt.tsx
    ├── admin/
    │   └── review-queue-item.tsx
    ├── dashboard/
    │   ├── dashboard-header.tsx
    │   └── stats-card.tsx
    └── generation/
        └── question-generation-panel.tsx
```

---

## Layer 4: TEMPLATES

**Definition:** Page-level layouts that organize organisms into specific arrangements.

### ✅ Complete Template List

1. **DashboardLayout**
   - Organisms: DashboardHeader, Sidebar, MainContent
   - Structure: Header + Sidebar (left) + Content (right)
   - Usage: All dashboard pages

2. **ExamLayout**
   - Organisms: ExamHeader, ExamFooter, MainContent
   - Structure: Header (timer) + Content + Footer (navigation)
   - Usage: All exam pages

3. **FormLayout**
   - Organisms: FormContent
   - Structure: Centered form with header + footer
   - Usage: Signup, login, profile setup

4. **CardGridLayout**
   - Organisms: Multiple QuestionCard
   - Structure: Responsive grid layout
   - Usage: Question listings, results summaries

### Templates File Structure

```
src/components/
└── templates/
    ├── dashboard-layout.tsx
    ├── exam-layout.tsx
    ├── form-layout.tsx
    └── card-grid-layout.tsx
```

---

## Layer 5: PAGES

**Definition:** Specific instances of templates with real data.

### ✅ Complete Page List

1. **DashboardPage** - Main dashboard with stats
2. **GenerateQuestionsPage** - Question generation interface
3. **QuestionDetailPage** - Single question view
4. **ExamAttemptPage** - Active exam attempt
5. **ExamResultsPage** - Score and breakdown
6. **SignupPage** - Registration form
7. **ProfilePage** - User profile management
8. **AdminReviewPage** - Question review queue

### Pages File Structure

```
src/app/
├── (auth)/
│   ├── signup/page.tsx
│   └── login/page.tsx
├── (dashboard)/
│   ├── page.tsx                 # Home dashboard
│   ├── questions/
│   │   ├── generate/page.tsx
│   │   └── [id]/page.tsx
│   ├── exams/
│   │   ├── page.tsx
│   │   ├── [id]/attempt/page.tsx
│   │   └── [id]/results/page.tsx
│   └── profile/page.tsx
└── admin/
    └── review/page.tsx
```

---

## Component Assembly Rules

### Rule 1: Composition Over Inheritance

Always compose components from smaller pieces:

```typescript
// ✅ GOOD: Molecule composed of atoms
function FormField({ label, children, error }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <Text className="text-error-500">{error}</Text>}
    </div>
  );
}

// ❌ BAD: Trying to extend with props
function CustomInput(props: any) {
  // Don't do this - create a molecule instead
}
```

### Rule 2: Single Responsibility

Each component has one primary purpose:

```typescript
// ✅ GOOD: Clear responsibility
function QuestionOption({ letter, text, selected, onSelect }: Props) {
  // Only handles option display and selection
}

// ❌ BAD: Too many responsibilities
function QuestionWithFeedbackAndReviewDialog() {
  // Don't mix concerns
}
```

### Rule 3: Props Drilling Prevention

Use context for deep hierarchies:

```typescript
// ✅ GOOD: Use context for deeply nested needs
<ExamProvider examId={examId}>
  <ExamAttempt>
    <QuestionDetail>
      <QuestionOption />
    </QuestionDetail>
  </ExamAttempt>
</ExamProvider>

// Then in QuestionOption:
const { timeRemaining, submit } = useExam();
```

### Rule 4: State Management Strategy

- **Atoms**: No state (pure visual)
- **Molecules**: Local state only
- **Organisms**: Local state + external state (via props/context)
- **Templates**: No state (layout only)
- **Pages**: All state (via hooks, context, or stores)

```typescript
// Atom - no state
function Button({ onClick, children }: Props) {
  return <button onClick={onClick}>{children}</button>;
}

// Molecule - local state
function FormField({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <input value={value} onChange={onChange} onFocus={() => setFocused(true)} />
    </div>
  );
}

// Organism - receives state via props
function QuestionDetail({ question, onSubmit }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  return (...);
}

// Page - manages all state
export default function QuestionDetailPage({ params }: Props) {
  const [question, setQuestion] = useState(null);
  // Fetch from API, manage state
  return <QuestionDetail question={question} onSubmit={handleSubmit} />;
}
```

### Rule 5: Prop Interface Design

Keep props minimal and clear:

```typescript
// ✅ GOOD: Clear, focused props
interface QuestionCardProps {
  question: Question;
  compact?: boolean;
  onClick?: () => void;
}

// ❌ BAD: Too many props, unclear purpose
interface ComponentProps {
  q: any;
  c?: boolean;
  h?: number;
  w?: number;
  pad?: string;
  margin?: string;
  fontSize?: string;
  // ...
}
```

---

## Component Dependency Map

```
Atoms (No dependencies on other components)
  ↓
Molecules (Depend on Atoms)
  ↓
Organisms (Depend on Molecules + Atoms)
  ↓
Templates (Depend on Organisms)
  ↓
Pages (Depend on Templates, Organisms)
```

---

## Usage Examples

### Example 1: Building a Form

```typescript
// Page
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <FormLayout>
      <QuestionGeneratorForm
        onGenerate={handleGenerate}
      />
    </FormLayout>
  );
}

// Organism
function QuestionGeneratorForm({ onGenerate }: Props) {
  const form = useForm();

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="domain"
        render={({ field }) => (
          <DomainSelector {...field} />
        )}
      />
    </Form>
  );
}

// Molecule
function DomainSelector({ value, onChange }: Props) {
  return (
    <FormField label="Domain">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        {/* Options */}
      </Select>
    </FormField>
  );
}
```

### Example 2: Building a Question Interface

```typescript
// Page
export default function QuestionDetailPage({ params }: Props) {
  const [question, setQuestion] = useState(null);

  return (
    <DashboardLayout>
      <QuestionDetail
        question={question}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}

// Organism
function QuestionDetail({ question, onSubmit }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <Card>
      <CardHeader>
        <Text className="heading-2">{question.text}</Text>
        <ReputationBadge score={question.reputation} />
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
          {question.options.map((option) => (
            <QuestionOption
              key={option.id}
              letter={option.letter}
              text={option.text}
              onSelect={() => setSelectedAnswer(option.id)}
            />
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

// Molecule
function QuestionOption({ letter, text, onSelect }: Props) {
  return (
    <Card>
      <RadioGroupItem value={letter} />
      <Label>{letter}) {text}</Label>
    </Card>
  );
}
```

---

## Best Practices

1. ✅ Test atoms independently
2. ✅ Document molecule behavior
3. ✅ Keep organisms focused
4. ✅ Use TypeScript for all components
5. ✅ Write stories for complex organisms
6. ✅ Never skip accessibility (WCAG AA minimum)
7. ✅ Follow naming conventions (e.g., `QuestionCard` not `QCard`)

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Ready for Implementation

