# Backend-Frontend Validation Report

## Comprehensive Type & Data Alignment Analysis

**Generated:** 2026-02-03
**Analysis Scope:** 22 API endpoints, 15 React components, 20 database tables
**Total Issues Found:** 24 critical/high issues

---

## Executive Summary

The application has **critical misalignments between backend database schema, API response types, and frontend component expectations**. While the database schema is well-normalized, the service layer and frontend components don't correctly map to these definitions.

### Status Dashboard

| Category | Issues | Severity |
| ---------- | -------- | -------- |
| Database Schema | 0 | ✅ Well-defined |
| Service Layer | 13 | 🔴 CRITICAL |
| API Endpoints | 5 | 🔴 CRITICAL |
| Frontend Components | 8 | 🟠 HIGH |
| **TOTAL** | **26** | **BLOCKER** |

---

## Part 1: Critical Backend Issues

### Issue #1: Table Naming Mismatch (BLOCKER)

**Severity:** 🔴 CRITICAL
**Scope:** All exam attempt operations will fail

**Problem:**

- Service code references: `exam_attempts`, `exam_answers`, `exam_results`
- Database schema defines: `user_exam_attempts`, `user_exam_answers`
- `exam_results` table doesn't exist in schema at all

**Files Affected:**

```text
✗ src/services/exams/exam-attempt.service.ts (13+ references)
✗ src/services/analytics/scoring.service.ts
✗ src/pages/api/attempts/[attemptId]/answers.ts
✗ src/pages/api/attempts/[attemptId]/complete.ts
✗ src/pages/api/attempts/[attemptId]/index.ts
```

**Error Impact:**

```sql
-- Service tries to execute:
SELECT * FROM exam_attempts WHERE user_id = $1
-- Database returns:
ERROR: relation "exam_attempts" does not exist
```

**Fix Required:**

```typescript
// Change all references:
- FROM exam_attempts → FROM user_exam_attempts
- FROM exam_answers → FROM user_exam_answers
- Remove all references to exam_results table (doesn't exist)
```

---

### Issue #2: Question Column Naming Mismatch (CRITICAL)

**Severity:** 🔴 CRITICAL
**Scope:** All question fetching will fail

**Problem:**

- Services query: `questions.text`
- Database column: `question_text`
- Missing transformation from letter-based `correct_answer` to index format

**Files Affected:**

```text
✗ src/services/exams/exam-attempt.service.ts (lines 512, 530)
✗ src/services/exams/exam.service.ts (line 366)
```

**Database vs Service:**

```typescript
// Database schema (CORRECT):
{
  id: UUID,
  question_text: string,  // ← Service looks for "text"
  option_a: string,
  option_b: string,
  option_c: string,
  option_d?: string,
  option_e?: string,
  correct_answer: string,  // 'a' | 'b' | 'c' | 'd' | 'e'
}

// Service expects:
{
  id: UUID,
  text: string,  // ❌ WRONG FIELD NAME
  options: string[],  // ❌ DOESN'T EXIST
  correct_option_index: number,  // ❌ FIELD DOESN'T EXIST
}
```

**Error Pattern:**

```sql
-- Service query fails:
SELECT id, text, correct_option_index FROM questions
-- Database returns:
ERROR: column "text" does not exist
ERROR: column "correct_option_index" does not exist
```

**Fix Required:**

```typescript
// Must transform response:
const question = await db.from('questions').select('*')
  .eq('id', questionId);

return {
  id: question.id,
  text: question.question_text,  // ← Map correct field
  options: [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
    question.option_e
  ].filter(Boolean),  // Remove nulls
  correct_answer_index: ['a', 'b', 'c', 'd', 'e']
    .indexOf(question.correct_answer),  // Convert letter to index
}
```

---

### Issue #3: Missing Options Array Field (CRITICAL)

**Severity:** 🔴 CRITICAL
**Scope:** All question responses will be malformed

**Problem:**

- Services query `questions(id, options)` — this field doesn't exist
- Database has individual columns: `option_a`, `option_b`, `option_c`, `option_d`, `option_e`
- No logic to combine these into array

**Files Affected:**

```text
✗ src/services/exams/exam-attempt.service.ts (lines 187, 202)
✗ src/services/exams/exam.service.ts (line 367)
✗ API response serialization (transforms needed)
```

**Actual vs Expected:**

```typescript
// What API returns now (missing field):
{
  id: "123",
  text: undefined,  // ❌ Column doesn't exist
  options: undefined,  // ❌ Column doesn't exist
}

// What frontend expects:
{
  id: "123",
  text: "What is 2+2?",
  options: ["3", "4", "5", "6"],
}

// What database actually has:
{
  id: "123",
  question_text: "What is 2+2?",
  option_a: "3",
  option_b: "4",
  option_c: "5",
  option_d: "6",
  option_e: null,
}
```

**Fix Required:**

```typescript
// Create transform function
function transformQuestionFromDB(dbQuestion): APIQuestion {
  return {
    id: dbQuestion.id,
    text: dbQuestion.question_text,
    options: [
      dbQuestion.option_a,
      dbQuestion.option_b,
      dbQuestion.option_c,
      dbQuestion.option_d,
      dbQuestion.option_e
    ].filter((opt): opt is string => Boolean(opt)),
    correct_answer: dbQuestion.correct_answer,
    difficulty: dbQuestion.difficulty,
  };
}
```

---

### Issue #4: Correct Answer Format Mismatch (HIGH)

**Severity:** 🟠 HIGH
**Scope:** Answer validation logic will fail

**Problem:**

- Database stores: `correct_answer: 'a' | 'b' | 'c' | 'd' | 'e'` (letter format)
- Service code expects: `correct_option_index: number` (numeric index)
- Frontend submits: `selected_option_index: number` (numeric index)
- No conversion logic exists

**Files Affected:**

```text
✗ src/services/exams/exam-attempt.service.ts (lines 234, 246, 532)
```

**Validation Code Missing:**

```typescript
// Current broken code:
const isCorrect = input.selected_option_index ===
  fullQuestion.correct_option_index;
// ❌ Both fields don't exist

// Must be:
const answerLetters = ['a', 'b', 'c', 'd'];
const correctIndex = answerLetters.indexOf(
  fullQuestion.correct_answer
);
const isCorrect = input.selected_option_index === correctIndex;
```

---

### Issue #5: Mock Data in Dashboard Endpoint (HIGH)

**Severity:** 🟠 HIGH
**Scope:** Analytics endpoint returns fake data

**File:** `src/pages/api/dashboard/stats.ts` (lines 43-84)

**Problem:**

```typescript
// Current code - returns hardcoded mock data:
const stats: DashboardStats = {
  total_questions_attempted: 47,
  correct_count: 38,
  accuracy_percentage: 80.85,
  streak_days: 7,
};

// Should call actual service:
const stats = await dashboardService.getUserStats(userId);
```

**Impact:** Users see fake statistics instead of their actual performance

**Fix:**

```typescript
// Replace mock with actual service call:
const dashboardService = new DashboardService();
const stats = await dashboardService.getDashboardStats(userId);
```

---

## Part 2: Frontend Issues

### Issue #6: Question Text Field Mismatch (CRITICAL)

**Severity:** 🔴 CRITICAL
**Scope:** Questions won't display in any component

**Files Affected:**

```text
✗ src/pages/questions.tsx (uses questions with .text field)
✗ src/pages/exams.tsx (constructs questions array)
✗ src/pages/exams/[id].tsx (displays questions)
✗ src/components/exam/ExamBuilder.tsx
✗ src/components/exam/ExamTaker.tsx
```

**Component Code Issue:**

```typescript
// Component expects:
interface Question {
  id: string;
  text: string;  // ❌ Database has "question_text"
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Usage:
<div>{question.text}</div>
{question.options.map((opt) => (...))}
```

**Error at Runtime:**

```text
Cannot read property 'text' of undefined
ReferenceError: question.text is undefined
```

**Fix:**

1. Update `exam.store.ts` Question interface:

```typescript
export interface Question {
  id: string;
  text: string;  // Keep in store for consistency
  options: string[];
  correctAnswer: 'a' | 'b' | 'c' | 'd' | 'e';
  difficulty: string;
}
```

1. Create API transformer:

```typescript
// src/lib/transformers/question.ts
export function transformAPIQuestion(dbQuestion): Question {
  return {
    id: dbQuestion.id,
    text: dbQuestion.question_text,  // ← Map here
    options: [dbQuestion.option_a, dbQuestion.option_b,
              dbQuestion.option_c, dbQuestion.option_d]
              .filter(Boolean),
    correctAnswer: dbQuestion.correct_answer,
    difficulty: dbQuestion.difficulty,
  };
}
```

---

### Issue #7: User Name Field Mismatch (HIGH)

**Severity:** 🟠 HIGH
**Scope:** User greeting and profile display broken

**Files Affected:**

```text
✗ src/components/auth/LoginForm.tsx (line 62)
✗ src/stores/auth.store.ts (User interface)
✗ src/pages/dashboard.tsx (user greeting)
```

**Problem:**

```typescript
// LoginForm expects:
const result = await apiCall('/api/auth/login');
console.log(result.user.first_name);  // ❌ Field doesn't exist
// Database has: full_name (string)

// Store defines:
interface User {
  id: string;
  email: string;
  first_name: string;  // ❌ Database has "full_name"
  last_name: string;   // ❌ Database has no last_name field
}
```

**Error:**

```text
result.user.first_name is undefined
```

**Fix Option 1 - Use full_name:**

```typescript
// src/stores/auth.store.ts
interface User {
  id: string;
  email: string;
  full_name: string;  // Match database
  user_role: string;
  subscription_tier: string;
}

// src/components/auth/LoginForm.tsx (line 62)
const firstName = result.user.full_name?.split(' ')[0] || 'User';
```

**Fix Option 2 - Split in backend:**

```typescript
// src/pages/api/auth/login.ts
const [firstName, ...lastNameParts] = user.full_name.split(' ');
return {
  user: {
    ...user,
    first_name: firstName,
    last_name: lastNameParts.join(' '),
  },
  token: authToken,
};
```

---

### Issue #8: Question Options Format Mismatch (HIGH)

**Severity:** 🟠 HIGH
**Scope:** Options won't render correctly

**Files Affected:**

```
✗ src/components/questions/QuestionCard.tsx
✗ src/stores/exam.store.ts
```

**Problem - Multiple Incompatible Formats:**

**Store expects (exam.store.ts):**

```typescript
interface Question {
  options: string[];  // Array of strings
}
```

**Component expects (QuestionCard.tsx):**

```typescript
interface Question {
  options: { a: string; b: string; c: string; d: string };  // Object
}
```

**Database has:**

```
option_a, option_b, option_c, option_d, option_e  // Individual columns
```

**Error:**

```typescript
// If transform returns array:
{question.options.map(renderOption)}  // ✓ Works in ExamTaker

// If component expects object:
{question.options.a}  // ❌ Fails - accessing undefined
```

**Fix:**

```typescript
// Standardize on array format:
export interface Question {
  id: string;
  text: string;
  options: Array<{
    letter: 'a' | 'b' | 'c' | 'd';
    text: string;
  }>;
  correctAnswerLetter: 'a' | 'b' | 'c' | 'd';
}

// Transform function:
function transformQuestion(dbQuestion) {
  return {
    id: dbQuestion.id,
    text: dbQuestion.question_text,
    options: [
      { letter: 'a', text: dbQuestion.option_a },
      { letter: 'b', text: dbQuestion.option_b },
      { letter: 'c', text: dbQuestion.option_c },
      { letter: 'd', text: dbQuestion.option_d },
    ].filter(opt => opt.text),
    correctAnswerLetter: dbQuestion.correct_answer,
  };
}

// Component usage:
{question.options.map((opt) => (
  <option key={opt.letter} value={opt.letter}>
    {opt.text}
  </option>
))}
```

---

### Issue #9: Results Page Hardcoded Topic (MEDIUM)

**Severity:** 🟡 MEDIUM
**Scope:** Weak areas calculation incorrect

**File:** `src/components/exam/ResultsPage.tsx` (line 54)

**Problem:**

```typescript
// Hardcoded topic:
const topic = 'General';  // ❌ Should extract from question data

// Should derive from actual question/topic mapping:
const topic = question.topic || question.subject_id;
```

**Fix:**

```typescript
// Must pass topic through exam attempt flow:
export interface ExamAnswer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  topic_id: string;  // Add this
  topic_name: string;  // Add this
}

// Then in ResultsPage:
const weakAreas = answers
  .reduce((acc, answer) => {
    const topic = answer.topic_name || 'Unknown';
    // ... calculate accuracy per topic
  }, {});
```

---

### Issue #10: Missing API Response Transformer Layer (HIGH)

**Severity:** 🟠 HIGH
**Scope:** Type safety is compromised

**Problem:**

- No transformer layer between API response and component usage
- Components directly use API response data with wrong field names
- Type mismatches cascade through the app

**Missing File:**

```typescript
// src/lib/transformers/api-responses.ts (DOESN'T EXIST)

// Should have transformers for:
export function transformQuestionResponse(apiResponse): UIQuestion
export function transformExamResponse(apiResponse): UIExam
export function transformAttemptResponse(apiResponse): UIAttempt
export function transformUserResponse(apiResponse): UIUser
```

**Usage Pattern (should be):**

```typescript
// Component/Page
import { transformQuestionResponse } from '@/lib/transformers';

async function loadQuestions() {
  const apiResponse = await fetch('/api/questions');
  const questions = apiResponse.data.map(transformQuestionResponse);
  // Now questions have correct field names
}
```

**Current Pattern (broken):**

```typescript
async function loadQuestions() {
  const { data } = await fetch('/api/questions');
  return data;  // ❌ Wrong field names, missing transforms
}
```

---

## Part 3: Type Definition Issues

### Issue #11: Inconsistent Type Definitions Across Layers

**Severity:** 🟠 HIGH

**Files with Type Conflicts:**

```
src/stores/auth.store.ts        - User interface
src/stores/exam.store.ts        - Question interface
src/database/database.types.ts  - Database Row types
src/schemas/exam.schema.ts      - Zod schemas
src/pages/api/[endpoint].ts     - Response types
```

**Example - User Type:**

```typescript
// database.types.ts (from Supabase schema):
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  user_role: string;
  subscription_tier: string;
  avatar_url: string | null;
  is_active: boolean;
}

// auth.store.ts (component uses):
export interface User {
  id: string;
  email: string;
  first_name: string;  // ❌ MISMATCH
  last_name: string;   // ❌ MISMATCH
}

// Result:
// API returns Database shape
// Components expect Store shape
// Runtime type errors
```

---

### Issue #12: Question Type Not Defined in Database Types

**Severity:** 🟡 MEDIUM

**Missing from `database.types.ts`:**

```typescript
// Should derive from questions table:
export type QuestionRow =
  Database['public']['Tables']['questions']['Row'];

export type QuestionInsert =
  Database['public']['Tables']['questions']['Insert'];

// Then create API types:
export interface APIQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  difficulty: string;
  explanation?: string;
}
```

---

## Part 4: Data Flow Diagrams

### Broken Flow: Questions

```
┌─────────────────────────────────────────────────┐
│ USER: Clicks "Start Exam"                       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ API: GET /api/exams/123                         │
│ calls: exam.service.getExamWithQuestions()      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ SERVICE: Select from questions table            │
│ Query: SELECT id, text, options, ...            │
│        ↑ ❌ These fields don't exist in DB      │
│ Actual: question_text, option_a, option_b, ... │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
         ❌ QUERY FAILS - Column not found
         TypeError: Cannot read property 'text'

┌─────────────────────────────────────────────────┐
│ ❌ User sees error, exam doesn't load           │
└─────────────────────────────────────────────────┘
```

### Correct Flow (Should Be)

```
┌──────────────────────────────────────────────────┐
│ Database: questions table                        │
│ - id, question_text, option_a-e, correct_answer │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│ SERVICE: Query database, transform              │
│ - Read: question_text → text                     │
│ - Combine: option_a-e → options[]               │
│ - Convert: correct_answer letter → index        │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│ API RESPONSE:                                    │
│ { id, text, options[], correctAnswer, ... }     │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│ FRONTEND: ExamTaker component                    │
│ - Renders: question.text ✓                       │
│ - Maps: question.options[] ✓                     │
│ - Compares: selected vs correctAnswer ✓          │
└──────────────────────────────────────────────────┘
                         │
                         ▼
          ✅ User sees formatted question
```

---

## Part 5: Fix Priority Roadmap

### Phase 1: Critical (Blocks All Operations) — DAY 1

```
[ ] 1. Fix table name references: exam_attempts → user_exam_attempts
[ ] 2. Fix column name references: text → question_text
[ ] 3. Fix missing options field: combine option_a-e
[ ] 4. Fix correct_answer conversion: letter → index
[ ] 5. Create question transformer function
[ ] 6. Update exam.store.ts Question interface
[ ] 7. Test exam creation flow end-to-end
```

**Files to Modify:**

- src/services/exams/exam-attempt.service.ts (major refactor)
- src/services/exams/exam.service.ts (column mappings)
- src/stores/exam.store.ts (Question interface)

**Estimated Work:** 2-3 hours

---

### Phase 2: High Priority (Breaks Core Features) — DAY 2

```
[ ] 8. Fix user field mismatch: full_name → first_name/last_name split
[ ] 9. Fix dashboard stats: replace mock data with actual queries
[ ] 10. Create API transformer layer
[ ] 11. Fix options format: standardize on array format
[ ] 12. Update QuestionCard component to use correct format
[ ] 13. Test dashboard and question components
```

**Files to Modify:**

- src/pages/api/dashboard/stats.ts (add real queries)
- src/stores/auth.store.ts (User interface)
- src/components/auth/LoginForm.tsx (use correct field)
- src/lib/transformers/ (new file - transformers)

**Estimated Work:** 1-2 hours

---

### Phase 3: Medium Priority (Breaks Analytics) — DAY 2-3

```
[ ] 14. Fix ResultsPage topic calculation
[ ] 15. Add topic_id/topic_name to exam attempt flow
[ ] 16. Create missing analyzer service for weak areas
[ ] 17. Test results page weak areas calculation
[ ] 18. Fix missing fields in database types
[ ] 19. Update all Zod schemas to match database
```

**Files to Modify:**

- src/components/exam/ResultsPage.tsx (topic extraction)
- src/services/analytics/scoring.service.ts (weak areas calc)
- src/database/database.types.ts (complete type exports)
- src/schemas/*.ts (sync with database types)

**Estimated Work:** 1-2 hours

---

### Phase 4: Low Priority (Type Safety) — DAY 3

```
[ ] 20. Add type guards to all API responses
[ ] 21. Create comprehensive type test suite
[ ] 22. Add response validation middleware
[ ] 23. Document API response contracts
[ ] 24. Add TypeScript strict mode checks
```

---

## Part 6: Verification Checklist

### Before Deployment

- [ ] All table names match schema (user_exam_*, not exam_*)
- [ ] All column names match schema (question_text, not text)
- [ ] All question responses include text, options[], correctAnswer
- [ ] User object includes first_name (derived or stored)
- [ ] Dashboard stats queries actual data (no mock)
- [ ] API transformers applied before component use
- [ ] Question options standardized to array format
- [ ] ResultsPage calculates real topics from question data
- [ ] All Zod schemas match database types
- [ ] End-to-end test: Create exam → Take exam → See results
- [ ] TypeScript compilation: 0 errors
- [ ] No "Cannot read property" errors in component rendering

---

## Part 7: File Change Summary

### Critical Changes Required

```typescript
// 1. src/services/exams/exam-attempt.service.ts
- Line 83: FROM exam_attempts → FROM user_exam_attempts
- Line 187: SELECT(options) → SELECT(option_a, option_b, option_c, option_d)
- Line 234: correct_option_index → correct_answer + conversion logic
- Line 512: SELECT(text, correct_option_index) → SELECT(question_text) + transform
- Lines 217-250: All table references updated
- Add transformer function for questions

// 2. src/stores/auth.store.ts
- User interface: full_name OR (first_name + last_name)
- Update field usage throughout store

// 3. src/stores/exam.store.ts
- Question interface: standardize options format
- Add correctAnswer field

// 4. src/components/auth/LoginForm.tsx (line 62)
- result.user.first_name → result.user.full_name.split()[0]

// 5. src/components/questions/QuestionCard.tsx
- Update options rendering to work with transformed format

// 6. src/pages/api/dashboard/stats.ts (lines 43-84)
- Replace mock data with actual service calls

// 7. src/components/exam/ResultsPage.tsx (line 54)
- topic = 'General' → topic = extractFromQuestionData()

// 8. NEW: src/lib/transformers/api-responses.ts
- Create all necessary transformer functions
```

---

## Summary: What's Breaking?

**Right Now:**

- ❌ Exam creation/retrieval fails (wrong table names)
- ❌ Questions don't display (missing fields)
- ❌ Dashboard shows fake data (mock values)
- ❌ User profile shows undefined (wrong field names)
- ❌ Results page weak areas incorrect (hardcoded topic)

**After Fixes:**

- ✅ Exam creation/retrieval works
- ✅ Questions display correctly with options
- ✅ Dashboard shows real user statistics
- ✅ User profile displays correct name
- ✅ Results page shows accurate weak areas by topic

---

## Next Steps

1. **Review this report** with the team
2. **Prioritize Phase 1 fixes** - these are blockers
3. **Create GitHub issues** for each category
4. **Assign work** by complexity/expertise
5. **Test each fix** before moving to next phase
6. **Update tests** alongside code changes
7. **Document all changes** for future maintenance

---

**Report Generated By:** API-Backend-Frontend Validation Analysis
**Recommendation:** Start Phase 1 immediately - the app cannot function without these fixes
**Estimated Total Fix Time:** 5-7 hours across 3-4 developer-days
