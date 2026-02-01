# 👤 User Stories - Question Creator MVP

**Versão:** 1.0 | **Data:** 01 de Fevereiro de 2026 | **Status:** Pronto para Desenvolvimento

---

## 📋 Índice

### Epic 1: Core Features (Stories 1.1 - 1.4)

- [1.1 API Foundation & Auth](#us-11-api-foundation--authentication)
- [1.2 Question Generation & Retrieval](#us-12-question-generation--retrieval-rag-integration)
- [1.3 Question Submission & Reputation](#us-13-question-submission--reputation-system)
- [1.4 Dashboard & UI Base](#us-14-dashboard--navigation-ui)

### Epic 2: Exam Management (Stories 2.1 - 2.4)

- [2.1 Exam CRUD Endpoints](#us-21-exam-crud--infrastructure)
- [2.2 Exam Attempt & Scoring](#us-22-exam-attempt--answer-submission)
- [2.3 Exam UI Components](#us-23-exam-ui--interaction)
- [2.4 Analytics & Weak Area Detection](#us-24-scoring-analytics--weak-area-detection)

### Epic 3: Admin (Stories 3.1 - 3.2)

- [3.1 CSV Import Pipeline](#us-31-csv-import-pipeline)
- [3.2 Admin Dashboard](#us-32-admin-dashboard--review-queue)

### Epic 4: QA & Launch (Stories 4.1 - 4.3)

- [4.1 Regression Testing & QA](#us-41-regression-testing--qa)
- [4.2 Performance Optimization](#us-42-performance-optimization--tuning)
- [4.3 Monitoring & Launch Readiness](#us-43-monitoring-alerting--runbook)

---

# ✅ EPIC 1: Core Features & Reputation System

## US-1.1: API Foundation & Authentication

**Epic:** Epic 1 - Core Features
**Sprint:** 1.1 / Week 2
**Effort:** 22h
**Assigned to:** @dev, @architect

### User Story

**As a** user of Question Creator
**I want** to securely sign up, log in, and maintain authenticated sessions
**So that** my data and progress are protected and persisted across visits

### Acceptance Criteria

- [ ] `POST /api/auth/signup` - User can register with email + password
  - Validates email format (RFC 5322)
  - Hashes password with bcrypt (min 12 rounds)
  - Creates user record in Supabase
  - Sends verification email
  - Returns JWT token + refresh token
  - Status: 201 Created on success, 400 on validation error, 409 if email exists

- [ ] `POST /api/auth/login` - User can log in with email + password
  - Validates credentials against stored hash
  - Returns JWT (exp: 24h) + refresh token (exp: 7d)
  - Sets user_id in Supabase RLS context
  - Rate limited: 10 attempts/minute per IP
  - Status: 200 OK on success, 401 on invalid credentials

- [ ] Auth Middleware - Validates JWT on all protected routes
  - Checks token signature + expiry
  - Extracts user_id and propagates to RLS context
  - Returns 401 if token invalid/expired
  - Supports token refresh endpoint

- [ ] RLS Policies - Row-level security enforced
  - Users can only access own data (user_id match)
  - Test with role impersonation (can't access other user's data)
  - Applied to: users, user_question_history, exams, exam_attempts

### Definition of Done

- [ ] Both endpoints (signup/login) tested with Vitest (happy path + error cases)
- [ ] RLS policies applied and verified with role impersonation
- [ ] Rate limiting working (verified with load test: 11th request blocked)
- [ ] JWT tokens valid for 24h, refresh tokens for 7d
- [ ] Password hashing confirmed (bcrypt, min 12 rounds)
- [ ] Documentation: API contract (OpenAPI spec), setup instructions, RLS model
- [ ] No hardcoded secrets in code (use .env.local)
- [ ] All tests passing (Vitest coverage ≥ 80%)

### Technical Specifications

**Endpoints:**

```typescript
POST /api/auth/signup
{
  email: "user@example.com",
  password: "SecurePassword123!"
}
// Response 201:
{
  user_id: "uuid",
  email: "user@example.com",
  access_token: "jwt...",
  refresh_token: "jwt...",
  token_type: "Bearer",
  expires_in: 86400
}

POST /api/auth/login
{
  email: "user@example.com",
  password: "SecurePassword123!"
}
// Response 200:
{
  user_id: "uuid",
  access_token: "jwt...",
  refresh_token: "jwt...",
  token_type: "Bearer",
  expires_in: 86400
}
```

**Validation Schema (Zod):**

```typescript
const SignupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Password min 8 chars")
    .regex(/[A-Z]/, "Needs uppercase")
    .regex(/[0-9]/, "Needs number")
    .regex(/[!@#$%^&*]/, "Needs special char")
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required")
});
```

**RLS Policy Example:**

```sql
-- Users can only see their own data
CREATE POLICY user_isolation ON users
  USING (auth.uid() = id);

-- Users can only access their question history
CREATE POLICY question_history_isolation ON user_question_history
  USING (user_id = auth.uid());
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Security scan: No SQL injection (parameterized queries only)
- [ ] OWASP check: No hardcoded secrets, auth bypass
- [ ] Input validation: All fields validated with Zod
- [ ] RLS test: Verify role isolation (test with different user_id)

**Pre-PR:**

- [ ] JWT token expiry tests (token valid for 24h exactly)
- [ ] Rate limit verification (10 req/min enforced)
- [ ] @architect security review of RLS policies
- [ ] Password hashing verified (bcrypt 12+ rounds)

**Pre-Deployment:**

- [ ] E2E test: signup → login → access protected route → verify user_id
- [ ] Smoke test on staging environment
- [ ] Monitor auth error rates in Sentry

### Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| RLS policies misconfigured → data leak | Security audit week 2, test RLS with impersonation |
| Rate limit bypass | Redis-backed rate limit, gradually increase 10→100 req/min |
| Weak password hashing | Use bcrypt 12+ rounds, never use MD5/SHA1 |
| JWT secret exposed | Use .env.local (git-ignored), rotate in production |

### Dependencies

- [ ] Supabase project configured (database schema ready)
- [ ] Environment variables set (.env.example provided)
- [ ] Node.js 18+ / npm 9+
- No blocking dependencies from other stories

---

## US-1.2: Question Generation & Retrieval (RAG Integration)

**Epic:** Epic 1 - Core Features
**Sprint:** 1.1 & 1.2 / Weeks 2-3
**Effort:** 28h
**Assigned to:** @dev, @architect, @db-sage

### User Story

**As a** student studying for exams
**I want** to generate 5-10 personalized study questions on demand
**So that** I can get relevant practice material quickly without waiting

### Acceptance Criteria

- [ ] `POST /api/questions/generate` - Generate questions via Gemini API
  - Input: topic, difficulty (easy/medium/hard), count (5-10)
  - Uses RAG (retrieval-augmented generation) with existing questions
  - Gemini prompt includes context from stored question bank
  - Returns 5-10 new questions in < 30 seconds
  - Cache hit for identical requests (Redis 24h TTL)
  - Fallback: Return real questions if Gemini timeout (> 30s)
  - Rate limited: 10 gen/min per user
  - Status: 200 with questions, 202 if queued, 408 if timeout → fallback

- [ ] `GET /api/questions` - List questions with search
  - Search by text (full-text search in Portuguese)
  - Filter by difficulty, topic, domain
  - Pagination (default 20 per page, max 100)
  - Return: question_id, text, options (4), difficulty, topic, reputation_score
  - FTS performance: < 100ms for typical query
  - Status: 200 with results + pagination metadata

- [ ] `GET /api/questions/{id}` - Fetch single question with reputation
  - Returns: question text, 4 options, correct_answer_index, reputation (0-10)
  - Join with reputation aggregate (avg user scores)
  - Response time P95 < 50ms
  - Status: 200 OK, 404 if not found

### Definition of Done

- [ ] Generate endpoint returns 5-10 questions in < 30 seconds
- [ ] Fallback mechanism tested (Gemini timeout → real questions returned)
- [ ] FTS working for Portuguese queries (test with common Constitutional Law terms)
- [ ] Cache hit rate > 50% (measured after 24h of usage)
- [ ] Vitest: 10+ test cases covering normal + error paths
- [ ] Load test: 100 concurrent generate requests, all < 30s
- [ ] Documentation: RAG prompt structure, caching strategy, FTS config
- [ ] No N+1 queries in retrieval endpoints
- [ ] Rate limiting verified (11th request returns 429)

### Technical Specifications

**Cache Key Strategy:**

```typescript
// Redis cache for generated questions
const cacheKey = `question:generated:${user_id}:${topic}:${difficulty}:${count}`;
// TTL: 24 hours
await redis.setex(cacheKey, 86400, JSON.stringify(questions));
```

**Gemini Prompt Template:**

```text
You are an expert Constitutional Law professor. Generate ${count} unique exam-style multiple-choice questions.

Context (similar existing questions):
${retrievedContext}

Requirements:
- Difficulty: ${difficulty}
- Topic: ${topic}
- 4 options per question
- Exactly 1 correct answer
- Options should be plausible but distinct
- Return as JSON array

Format:
[{
  "text": "Question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "explanation": "Why A is correct..."
}]
```

**FTS Configuration (PostgreSQL):**

```sql
-- Enable full-text search for Portuguese
CREATE INDEX idx_questions_fts ON questions
  USING gin(to_tsvector('portuguese', text));

-- Query example
SELECT * FROM questions
  WHERE to_tsvector('portuguese', text) @@ plainto_tsquery('portuguese', 'direito constitucional')
  LIMIT 20;
```

**Endpoints:**

```typescript
POST /api/questions/generate
{
  topic: "direito-constitucional",
  difficulty: "medium",
  count: 5
}
// Response 200:
{
  questions: [{
    id: "uuid",
    text: "Qual é...",
    options: ["A", "B", "C", "D"],
    difficulty: "medium",
    topic: "direito-constitucional"
  }],
  cached: false,
  generatedAt: "2026-02-01T10:30:00Z"
}

GET /api/questions?search=direito&difficulty=medium&topic=constitucional&page=1&limit=20
// Response 200:
{
  questions: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 342,
    pages: 18
  }
}

GET /api/questions/{id}
// Response 200:
{
  id: "uuid",
  text: "Qual é...",
  options: ["A", "B", "C", "D"],
  difficulty: "medium",
  topic: "direito-constitucional",
  reputation: {
    score: 7.5,
    count: 24,
    status: "excellent"
  }
}
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Input validation (topic, difficulty, count ranges)
- [ ] Cache key collision check (no data mixing)
- [ ] FTS query performance test (< 100ms)
- [ ] SQL injection prevention (parameterized queries only)
- [ ] Prompt injection protection (sanitize topic input)

**Pre-PR:**

- [ ] Gemini API latency test (target < 30s, measure P95)
- [ ] Fallback mechanism verified (timeout → real questions)
- [ ] Cache hit rate verified (> 50% after 24h)
- [ ] @architect review of LLM prompt safety
- [ ] @db-sage review of FTS configuration

**Pre-Deployment:**

- [ ] Load test: 100 concurrent generate requests
- [ ] Monitor Gemini API quota usage + costs
- [ ] Cache memory usage check (set max size)
- [ ] FTS index health check

### Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Gemini API rate limit → degradation | 10 gen/min per user, Redis cache, fallback to real questions |
| FTS not working in Portuguese | Test locally week 1, use `portuguese` config, fallback to ILIKE |
| Cache poisoning | Validate Gemini response structure + content length limits |
| Slow FTS queries | Monitor execution time, optimize indexes, pre-compute popular searches |

### Dependencies

- [ ] Gemini API key configured (.env.local)
- [ ] Redis configured (Upstash or local)
- [ ] Database with 13.9k questions already imported
- [ ] Story 1.1 (Auth) completed first

---

## US-1.3: Question Submission & Reputation System

**Epic:** Epic 1 - Core Features
**Sprint:** 1.3, 1.4, 1.5 / Weeks 3-4
**Effort:** 42h
**Assigned to:** @dev, @db-sage, @architect

### User Story

**As a** student
**I want** to submit my answer to a question and see if I got it right
**So that** I can track my learning progress and identify weak areas

### Acceptance Criteria

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
  - Score 0-3: Red ("Needs Review")
  - Score 4-6: Yellow ("Good")
  - Score 7-10: Green ("Excellent")
  - Updates within 1s of submission

### Definition of Done

- [ ] Answer submission recorded + validated
- [ ] Reputation updates < 1s after submission
- [ ] All 5 triggers tested (no race conditions, no deadlocks)
- [ ] Reputation badges display 0-10 score correctly
- [ ] Admin review queue shows all flagged questions
- [ ] Load test: 1000 submissions/min without deadlocks
- [ ] Documentation: Reputation model, trigger logic, feedback workflow
- [ ] Vitest coverage ≥ 80% (submission + triggers)
- [ ] E2E test: submit answer → reputation updates → badge changes

### Technical Specifications

**Endpoints:**

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

**Database Triggers (PostgreSQL):**

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

**RLS Policies:**

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

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Trigger deadlock detection (test with concurrent submits)
- [ ] Reputation calculation accuracy (verify with examples)
- [ ] Answer validation (correct option must exist in question)
- [ ] Service filter check (.eq('service', 'ttcx') in RLS)

**Pre-PR:**

- [ ] Load test: 1000 submissions/min, measure latency + deadlocks
- [ ] Reputation race condition test (concurrent submits, verify consistency)
- [ ] Advisory locks verified (prevent race conditions)
- [ ] @db-sage trigger performance review

**Pre-Deployment:**

- [ ] E2E test: submit answer → verify reputation updates → check badge
- [ ] Monitor trigger execution time (target < 100ms)

### Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Reputation race conditions | Advisory locks + SERIALIZABLE isolation, load test 1000 req/min |
| Triggers slow down submissions | Monitor execution time (target < 100ms), optimize indexes |
| Trigger deadlocks under load | Test with concurrent submissions, use advisory locks |
| Flag threshold spam (3+ reports false positives) | Manual review queue for admins |

### Dependencies

- [ ] Story 1.1 (Auth) completed
- [ ] Story 1.2 (Questions) completed
- [ ] Database triggers created (migrations)
- [ ] Admin role created in users table

---

## US-1.4: Dashboard & Navigation UI

**Epic:** Epic 1 - Core Features
**Sprint:** 1.2 / Week 2
**Effort:** 24h
**Assigned to:** @dev, @ux-expert

### User Story

**As a** student
**I want** to see my dashboard with study stats and navigate to features
**So that** I can understand my progress and access study tools easily

### Acceptance Criteria

- [ ] **Layout Components** render correctly
  - Header with logo, user menu, logout
  - Sidebar with navigation links (Dashboard, Questions, Exams, Settings)
  - Footer with links + copyright
  - Responsive: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
  - Dark mode support (optional, store in localStorage)

- [ ] **Auth Pages** (Login, Signup, Recovery) work
  - Login form: email input, password input, "Remember me" checkbox, submit button
  - Shows error messages (invalid credentials, network error)
  - Signup form: email, password, confirm password, "I agree to ToS" checkbox
  - Password recovery: email input, verification code, new password
  - Form validation shows errors in real-time (Zod)
  - Submit button disabled until form valid

- [ ] **Dashboard Page** displays user stats
  - Welcome message: "Hello, [First Name]"
  - Stats cards: total_questions_attempted, correct_count, accuracy_percentage, streak_days
  - Activity chart: questions answered per day (last 7 days)
  - Weak areas list: topics with < 50% accuracy
  - Quick action buttons: "Generate Questions", "Create Exam", "Review History"
  - All stats update in real-time (< 1s latency)

- [ ] **Question Card** displays question + options
  - Shows question text
  - 4 clickable option buttons (A, B, C, D)
  - Submit button (disabled until option selected)
  - After submit: shows if correct/incorrect
  - Shows explanation of correct answer
  - "Next Question" button appears after feedback

- [ ] **Accessibility** meets WCAG 2.1 AA
  - [ ] All text has sufficient contrast ratio (> 4.5:1)
  - [ ] All interactive elements keyboard accessible (tab order)
  - [ ] Form labels associated with inputs
  - [ ] Images have alt text
  - [ ] Color not sole indicator of status (also use icons/text)

### Definition of Done

- [ ] All components render without errors
- [ ] Forms handle validation + display errors clearly
- [ ] Mobile responsive (tested on iPhone 12, iPad, desktop)
- [ ] Accessibility: WCAG 2.1 AA passed (axe DevTools scan)
- [ ] LightHouse score ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] React Testing Library coverage ≥ 80%
- [ ] Documentation: Component props, usage examples
- [ ] Bundle size < 300KB gzipped
- [ ] No console errors/warnings in production build
- [ ] E2E test: signup → dashboard → see stats → click "Generate"

### Technical Specifications

**Component Structure:**

```typescript
// Layout Components
<Layout>
  <Header user={user} onLogout={logout} />
  <Sidebar currentRoute={currentRoute} />
  <main>{children}</main>
  <Footer />
</Layout>

// Auth Pages
<LoginForm onSubmit={handleLogin} />
<SignupForm onSubmit={handleSignup} />
<PasswordRecoveryForm onSubmit={handleRecovery} />

// Dashboard
<StatsCard label="Questions Answered" value={342} trend="+12" />
<ActivityChart data={weeklyData} />
<WeakAreasList areas={weakAreas} />
<QuickActionButtons actions={['Generate', 'CreateExam', 'Review']} />

// Question Card
<QuestionCard
  question={question}
  onSubmit={handleSubmit}
  isLoading={isLoading}
/>
```

**Form Validation (Zod):**

```typescript
const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required")
});

const SignupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Min 8 chars")
    .regex(/[A-Z]/, "Need uppercase"),
  confirm_password: z.string(),
  agreed_to_tos: z.boolean().refine(val => val === true, "Must agree to ToS")
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});
```

**Responsive Breakpoints (Tailwind):**

```typescript
// Mobile first
className="flex flex-col gap-4 sm:flex-row sm:gap-6 md:gap-8"
// Mobile: 1 column
// sm (640px): 2 columns
// md (768px): wider gap
```

**Accessibility Checklist:**

```typescript
// Example: Form input with proper labeling
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={errors.email ? "true" : "false"}
    aria-describedby={errors.email ? "email-error" : undefined}
    className="mt-1 block w-full rounded-md border"
  />
  {errors.email && (
    <p id="email-error" className="mt-2 text-sm text-red-600">
      {errors.email.message}
    </p>
  )}
</div>
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] React Testing Library: button clicks, form submissions, validation
- [ ] Accessibility scan (axe DevTools): no critical issues
- [ ] Mobile responsive test (3 viewports: 320px, 768px, 1920px)
- [ ] Bundle size check (< 300KB gzipped)

**Pre-PR:**

- [ ] LightHouse CI: score ≥ 90
- [ ] @ux-expert accessibility review
- [ ] Cross-browser test (Chrome, Firefox, Safari, Edge)

**Pre-Deployment:**

- [ ] E2E test: signup → dashboard → generate → see question
- [ ] Performance test: First Contentful Paint < 2s

### Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Slow page load (bundle bloat) | Code splitting, lazy loading, bundle analysis |
| Accessibility issues | @ux-expert review, WCAG 2.1 AA testing tools |
| Responsive design breaks on specific devices | Test on real devices + emulators |

### Dependencies

- [ ] Design system / Tailwind configured
- [ ] Zustand stores created (auth, ui state)
- [ ] Story 1.1 (Auth endpoints) completed
- [ ] Story 1.2 (Questions endpoint) completed

---

# ✅ EPIC 2: Exam Management System

## US-2.1: Exam CRUD & Infrastructure

**Epic:** Epic 2 - Exams
**Sprint:** 2.1 / Week 5
**Effort:** 24h
**Assigned to:** @dev, @architect

### User Story

**As a** student
**I want** to create customized study exams by selecting specific questions
**So that** I can practice with targeted question sets for specific topics

### Acceptance Criteria

- [ ] `POST /api/exams` - Create exam
  - Input: name, description, question_ids (5-50), duration (5-180 min), passing_score (0-100%)
  - Validates: all question IDs exist, no duplicates, count 5-50, duration range
  - Deduplicates question_ids (no duplicates allowed)
  - Creates exam record, associates questions
  - Returns: exam_id, created_at, question_count
  - Status: 201 Created, 400 on validation error

- [ ] `GET /api/exams` - List user's exams
  - Returns: exam_id, name, question_count, created_at, last_attempted, best_score
  - Pagination: default 20 per page
  - Filter: status (draft/active/archived)
  - RLS: only user's own exams
  - Status: 200 OK

- [ ] `GET /api/exams/{id}` - Fetch exam details
  - Returns: exam_id, name, description, questions (with options), duration, passing_score
  - Includes attempt history (if exists)
  - RLS: verify ownership
  - Status: 200 OK, 404 if not found, 403 if not owner

- [ ] `PUT /api/exams/{id}` - Update exam
  - Input: name, description, question_ids, duration, passing_score
  - Prevents update if attempt in progress
  - Revalidates all constraints
  - Returns: updated exam metadata
  - Status: 200 OK, 409 if attempt in progress

### Definition of Done

- [ ] All 4 endpoints tested with happy + error paths
- [ ] RLS verified (user cannot access other users' exams)
- [ ] Vitest coverage ≥ 80%
- [ ] Endpoint response time P95 < 100ms
- [ ] All validation errors return 400 with clear messages
- [ ] Documentation: API contract, exam model schema
- [ ] E2E test: create → read → update exam

### Technical Specifications

**Database Schema:**

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT CHECK (duration_minutes BETWEEN 5 AND 180),
  passing_score INT CHECK (passing_score BETWEEN 0 AND 100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  UNIQUE (exam_id, question_id)
);

CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
```

**Endpoints:**

```typescript
POST /api/exams
{
  name: "Constitutional Law Final",
  description: "Topics 1-5 comprehensive exam",
  question_ids: ["uuid1", "uuid2", ...50 more],
  duration_minutes: 120,
  passing_score: 70
}
// Response 201:
{
  exam_id: "uuid",
  name: "Constitutional Law Final",
  question_count: 50,
  created_at: "2026-02-01T10:30:00Z"
}

GET /api/exams?status=active&limit=20&page=1
// Response 200:
{
  exams: [
    {
      exam_id: "uuid",
      name: "Constitutional Law Final",
      question_count: 50,
      created_at: "2026-02-01T10:30:00Z",
      last_attempted: "2026-02-01T11:00:00Z",
      best_score: 85
    }
  ],
  pagination: { page: 1, limit: 20, total: 5, pages: 1 }
}

GET /api/exams/{id}
// Response 200:
{
  exam_id: "uuid",
  name: "Constitutional Law Final",
  description: "Topics 1-5 comprehensive exam",
  duration_minutes: 120,
  passing_score: 70,
  questions: [{
    question_id: "uuid",
    text: "Qual é...",
    options: ["A", "B", "C", "D"],
    order: 1
  }],
  attempts: [{
    attempt_id: "uuid",
    score: 85,
    attempted_at: "2026-02-01T11:00:00Z"
  }]
}

PUT /api/exams/{id}
{
  name: "Updated name",
  duration_minutes: 90,
  question_ids: ["uuid1", "uuid2", ...]
}
// Response 200: { exam_id, name, updated_at }
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Input validation (question IDs exist, count 5-50, duration range)
- [ ] RLS ownership test (user cannot see other users' exams)
- [ ] Deduplication logic verified

**Pre-PR:**

- [ ] @architect review of exam data model

**Pre-Deployment:**

- [ ] E2E: create → read → update exam

### Dependencies

- [ ] Epic 1 (Questions) completed
- [ ] Database schema created (exams, exam_questions tables)

---

## US-2.2: Exam Attempt & Answer Submission

**Epic:** Epic 2 - Exams
**Sprint:** 2.2 / Week 5
**Effort:** 28h
**Assigned to:** @dev, @db-sage

### User Story

**As a** student taking an exam
**I want** to submit my answers to each question during the exam
**So that** my responses are recorded and I can see my score when finished

### Acceptance Criteria

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

### Definition of Done

- [ ] Attempt creation + state tracking working
- [ ] Answer submission recorded with timing
- [ ] Completion triggers scoring
- [ ] Score calculation accurate (verify with examples)
- [ ] E2E: full attempt flow (start → answer → answer → complete → score)
- [ ] Vitest coverage ≥ 80%
- [ ] Load test: 100 concurrent attempts, no race conditions

### Technical Specifications

**Attempt State Machine:**

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

**Endpoints:**

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

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Answer validation (option ID exists)
- [ ] Timing checks (no negative time)

**Pre-PR:**

- [ ] Trigger accuracy test (scoring verified with examples)
- [ ] @db-sage review of scoring logic

**Pre-Deployment:**

- [ ] E2E: full attempt flow

### Dependencies

- [ ] Story 2.1 (Exam CRUD) completed
- [ ] Scoring trigger created (database function)

---

## US-2.3: Exam UI & Interaction

**Epic:** Epic 2 - Exams
**Sprint:** 2.3 / Week 6
**Effort:** 28h
**Assigned to:** @dev, @ux-expert

### User Story

**As a** student taking an exam
**I want** to answer questions with a countdown timer and navigation
**So that** I can manage my time and review my answers before submitting

### Acceptance Criteria

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
  - Progress indicator: "Question X of Y"
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

### Definition of Done

- [ ] All components render and interact correctly
- [ ] Timer accurate (±1s over 1 hour)
- [ ] Results display correctly (calculated from API)
- [ ] Responsive on mobile (tested 3 viewports)
- [ ] React Testing Library coverage ≥ 80%
- [ ] Accessibility WCAG 2.1 AA
- [ ] LightHouse score ≥ 90
- [ ] E2E: create exam → take exam → view results

### Technical Specifications

**Timer Implementation:**

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

**Component Structure:**

```typescript
<ExamBuilder onSave={createExam} />
<ExamTaker attemptId={attemptId} />
<ResultsPage attemptId={attemptId} />
<ExamHistory exams={userExams} />
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Timer accuracy test (mock time)
- [ ] Answer recording verified

**Pre-PR:**

- [ ] LightHouse score ≥ 90
- [ ] Responsive on mobile
- [ ] @ux-expert review

**Pre-Deployment:**

- [ ] E2E: create exam → take → view results

### Dependencies

- [ ] Story 2.1 (Exam CRUD) completed
- [ ] Story 2.2 (Answer submission) completed

---

## US-2.4: Scoring, Analytics & Weak Area Detection

**Epic:** Epic 2 - Exams
**Sprint:** 2.4 / Week 6
**Effort:** 12h
**Assigned to:** @db-sage, @dev

### User Story

**As a** student
**I want** to see analytics on my exam performance and identify weak areas
**So that** I can focus my studying on topics where I struggle

### Acceptance Criteria

- [ ] Scoring calculation (database function)
  - Score = (correct_answers / total_answers) * 100
  - Determine passing: score >= passing_score
  - Identify weak areas: topics with accuracy < 50%
  - Store results in exam_results table

- [ ] Weak area detection
  - Per-topic accuracy: (correct / attempts) * 100
  - Mark topics with < 50% as "weak"
  - Return list of weak topics with accuracy %

- [ ] Performance analytics
  - Time per question: average + distribution
  - Accuracy trends: performance over multiple attempts
  - Comparison: your performance vs. class average (optional)

### Definition of Done

- [ ] Scoring calculated correctly (no off-by-one errors)
- [ ] Weak areas identified accurately
- [ ] Analytics queryable and fast (< 1s for typical user)
- [ ] E2E: attempt → completion → results show weak areas
- [ ] Vitest coverage ≥ 80%

### Technical Specifications

**Weak Area Algorithm:**

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

### Dependencies

- [ ] Story 2.2 (Answer submission) completed

---

# ✅ EPIC 3: Admin Dashboard & CSV Import

## US-3.1: CSV Import Pipeline

**Epic:** Epic 3 - Admin
**Sprint:** 3.1 / Week 7
**Effort:** 40h
**Assigned to:** @dev, @db-sage

### User Story

**As an** admin
**I want** to import new questions from a CSV file with deduplication
**So that** I can add large batches of questions to the question bank efficiently

### Acceptance Criteria

- [ ] CSV Parser - Validate and parse CSV
  - Accepts CSV with columns: text, options (4), correct_index, topic, difficulty, explanation
  - Detects encoding: UTF-8, ISO-8859-1
  - Validates each row: no missing fields, correct_index 0-3
  - Handles edge cases: empty rows, BOM characters
  - Returns: parsed_rows, validation_errors

- [ ] Deduplication - Fuzzy match with 85% threshold
  - For each CSV row: find similar questions in DB (Levenshtein similarity > 85%)
  - If match found: skip (mark as duplicate)
  - If no match: prepare for insert
  - Returns: new_questions, duplicates_found, duplicates_list

- [ ] Semantic Mapping - Map questions to topics
  - Uses Gemini batch API (cheaper than real-time)
  - Maps CSV question → existing topic in database
  - Falls back to predefined rules if API fails
  - Caches embeddings for future use
  - Returns: mapped_topics

- [ ] Batch Processing - Async import with error handling
  - Processes 100 rows per database transaction
  - Async job (doesn't block API)
  - Logs progress: X of Y completed
  - Retries failed rows (3 attempts)
  - Rollback on critical error
  - Returns: import_id, status, progress

- [ ] Version Management - Track imports and enable rollback
  - Stores: import_id, csv_file, questions_added, questions_count, timestamp, user_id
  - Tracks which questions added in each import
  - Enables rollback: DELETE questions WHERE import_id = X
  - Returns: import_history, import_metadata

### Definition of Done

- [ ] CSV parser handles various encodings + edge cases
- [ ] Dedup accuracy tested (unit test examples)
- [ ] Semantic mapping working (verified with sample)
- [ ] Batch processing < 15 min for 13.9k questions
- [ ] Version management tracking imports
- [ ] Error logging comprehensive
- [ ] Vitest coverage ≥ 80%

### Technical Specifications

**Endpoints:**

```typescript
POST /api/admin/import/csv
{
  file: FormData (multipart/form-data)
}
// Response 202 (Accepted):
{
  import_id: "uuid",
  status: "queued",
  estimated_time_minutes: 8,
  webhook_url: "optional" // for progress updates
}

GET /api/admin/import/{import_id}/progress
// Response 200:
{
  import_id: "uuid",
  status: "in_progress",
  processed: 256,
  total: 1000,
  progress_percent: 25.6,
  estimated_remaining_minutes: 6
}
```

**CSV Format:**

```
text,option_a,option_b,option_c,option_d,correct_index,topic,difficulty,explanation
"Question text?","Option A","Option B","Option C","Option D",0,"direito-constitucional","medium","Explanation..."
```

**Deduplication Algorithm:**

```typescript
function calculateSimilarity(str1: string, str2: string): number {
  // Levenshtein distance
  const maxLen = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return ((maxLen - distance) / maxLen) * 100;
}

function deduplicateCSVRows(csvRows: Row[], existingQuestions: Question[]): {
  newQuestions: Row[];
  duplicates: { csvIndex: number; matchedQuestion: Question; similarity: number }[];
} {
  const newQuestions = [];
  const duplicates = [];

  for (let i = 0; i < csvRows.length; i++) {
    let foundDuplicate = false;

    for (const existing of existingQuestions) {
      const similarity = calculateSimilarity(csvRows[i].text, existing.text);
      if (similarity >= 85) {
        duplicates.push({
          csvIndex: i,
          matchedQuestion: existing,
          similarity
        });
        foundDuplicate = true;
        break;
      }
    }

    if (!foundDuplicate) {
      newQuestions.push(csvRows[i]);
    }
  }

  return { newQuestions, duplicates };
}
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] CSV validation (columns, encoding)
- [ ] Dedup accuracy test

**Pre-PR:**

- [ ] Performance test (1000 rows < 10s)
- [ ] Batch transaction safety

**Pre-Deployment:**

- [ ] Load test full 13.9k import

### Dependencies

- [ ] Epic 1 + 2 completed
- [ ] CSV import endpoint created
- [ ] Async job queue configured (Redis)

---

## US-3.2: Admin Dashboard & Review Queue

**Epic:** Epic 3 - Admin
**Sprint:** 3.2 / Week 7
**Effort:** 20h
**Assigned to:** @dev, @frontend

### User Story

**As an** admin
**I want** to see system statistics and manage flagged questions
**So that** I can monitor platform health and approve/reject community feedback

### Acceptance Criteria

- [ ] `GET /api/admin/dashboard` - System statistics
  - Active users (last 24h, last 7d)
  - Total questions (real + generated)
  - Import count + last import date/time
  - System uptime (% last 30d)
  - API latency (P95)
  - Database size
  - Response time < 500ms

- [ ] `GET /api/admin/review-queue` - List flagged questions
  - Returns: question_id, text, report_count, feedback_list, status
  - Filter: status (pending/approved/rejected), priority, date range
  - Sort: by report count descending
  - Pagination: 20 per page
  - RLS: admin only

- [ ] `POST /api/admin/reviews` - Approve/reject feedback
  - Input: question_id, decision (approve/reject), notes
  - Updates question_reviews table
  - Changes question status (active/archived)
  - Logs reviewer_id + timestamp
  - Optional: notify reporter of decision
  - Status: 200 OK, 403 if not admin

- [ ] Admin Dashboard UI
  - Stats cards: active users, total questions, uptime %, latency
  - Import history table: date, questions added, status
  - Quick action buttons: "Run Import", "View Feedback"
  - Review queue section: list with approve/reject buttons
  - Real-time updates (polling or WebSocket, optional)

### Definition of Done

- [ ] Dashboard displays stats correctly
- [ ] Stats updated in real-time (or cache < 5 min)
- [ ] Review queue shows all feedback items
- [ ] Approve/reject working + notes logged
- [ ] Admin access control verified
- [ ] UI responsive on desktop
- [ ] Vitest coverage ≥ 80%
- [ ] E2E: login as admin → view stats → approve feedback

### Technical Specifications

**Endpoints:**

```typescript
GET /api/admin/dashboard
// Response 200:
{
  active_users: {
    last_24h: 127,
    last_7d: 456
  },
  total_questions: 14200,
  imports: {
    total_imports: 3,
    last_import_at: "2026-02-01T10:00:00Z"
  },
  uptime: {
    last_30d_percent: 99.97
  },
  api_metrics: {
    p95_latency_ms: 187,
    error_rate_percent: 0.02
  },
  database: {
    size_gb: 1.2
  }
}

GET /api/admin/review-queue?status=pending&limit=20
// Response 200:
{
  items: [{
    question_id: "uuid",
    question_text: "Qual é a primeira lei...",
    report_count: 3,
    feedback: [
      { type: "wrong_answer", comment: "Answer should be B" },
      { type: "unclear", comment: "Options are confusing" }
    ],
    first_reported: "2026-02-01T08:00:00Z",
    last_reported: "2026-02-01T10:00:00Z",
    status: "pending"
  }],
  pagination: { page: 1, limit: 20, total: 5 }
}

POST /api/admin/reviews
{
  question_id: "uuid",
  decision: "reject",
  notes: "Answer key incorrect, removed from platform"
}
// Response 200:
{
  review_id: "uuid",
  question_id: "uuid",
  status: "rejected",
  reviewed_at: "2026-02-01T10:30:00Z",
  reviewer_id: "uuid"
}
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Query performance (< 500ms for stats)

**Pre-PR:**

- [ ] UI responsive
- [ ] Role-based access verified

**Pre-Deployment:**

- [ ] E2E: admin login → view stats → manage reviews

### Dependencies

- [ ] Epic 1 + 2 completed
- [ ] Admin role implemented

---

# ✅ EPIC 4: QA, Performance & Launch

## US-4.1: Regression Testing & QA

**Epic:** Epic 4 - QA & Launch
**Sprint:** 4.1 / Week 8
**Effort:** 34h
**Assigned to:** @qa, @dev

### User Story

**As a** QA engineer
**I want** to verify all features work correctly end-to-end
**So that** we can confidently deploy to production

### Acceptance Criteria

- [ ] Regression Test Suite - All endpoints tested
  - Auth flows: signup → login → logout → token refresh
  - Question flows: generate → list → search → submit
  - Exam flows: create → attempt → answer → complete → score
  - Admin flows: import CSV → review queue → approve/reject
  - All tests passing

- [ ] Load Test - 1000 concurrent users
  - Ramp: 0→100 (1min) → 500 (5min) → 1000 (10min)
  - Measure: P95/P99 latency, error rate, throughput
  - Success criteria: P95 < 200ms, error rate < 0.1%, throughput ≥ 500 req/s
  - Identify bottlenecks

- [ ] Security Audit - OWASP top 10
  - SQL injection: parameterized queries ✅
  - XSS: input sanitization, CSP headers ✅
  - CSRF: tokens or SameSite cookies ✅
  - Broken auth: JWT validation, RLS ✅
  - Sensitive data: no secrets in logs, HTTPS ✅
  - Broken access control: RLS policies ✅
  - Security misconfiguration: env vars, headers ✅
  - Insecure deserialization: none used ✅
  - Vulnerable dependencies: npm audit ✅
  - Insufficient logging: audit trail present ✅

- [ ] E2E Critical Paths
  - Signup → Dashboard → Generate Questions → Submit Answer → See Score
  - Create Exam → Take Exam → View Results → See Weak Areas
  - Admin Import CSV → Approve Questions → See in Question Bank
  - All paths passing

### Definition of Done

- [ ] All regression tests passing
- [ ] Load test results meet SLA (P95 < 200ms)
- [ ] Security audit OWASP checklist complete
- [ ] E2E critical paths passing
- [ ] No new bugs found during testing
- [ ] Test report generated

### Technical Specifications

**Test Matrix:**

```text
Auth:
  ✅ signup with valid email/password
  ✅ signup with invalid email (error)
  ✅ signup with weak password (error)
  ✅ login with correct credentials
  ✅ login with wrong password (error)
  ✅ token refresh works
  ✅ access protected route with valid token
  ✅ access protected route without token (401)

Questions:
  ✅ generate 5 questions in < 30s
  ✅ generate with invalid topic (error)
  ✅ list questions with pagination
  ✅ search questions (FTS)
  ✅ submit answer and see result
  ✅ reputation updates after submit

Exams:
  ✅ create exam with 5-50 questions
  ✅ create with invalid question count (error)
  ✅ start attempt
  ✅ submit answers
  ✅ complete and see score
  ✅ view weak areas

Admin:
  ✅ upload CSV file
  ✅ monitor import progress
  ✅ view review queue
  ✅ approve question
  ✅ reject question
```

**Load Test Profile (k6):**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '10m', target: 1000 },
    { duration: '1m', target: 0 }
  ]
};

export default function () {
  // Simulate user signup
  let response = http.post(`${BASE_URL}/api/auth/signup`, {
    email: `user${__VU}-${__ITER}@example.com`,
    password: 'SecurePass123!'
  });
  check(response, {
    'signup status is 201': r => r.status === 201
  });

  // Simulate question generation
  response = http.post(`${BASE_URL}/api/questions/generate`, {
    topic: 'direito-constitucional',
    difficulty: 'medium',
    count: 5
  });
  check(response, {
    'generate status is 200': r => r.status === 200,
    'response time < 30s': r => r.timings.duration < 30000
  });

  sleep(1);
}
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] All test cases written + passing

**Pre-PR:**

- [ ] Load test results reviewed
- [ ] SLA targets met

**Pre-Deployment:**

- [ ] Full regression + E2E success

### Dependencies

- [ ] Epic 1 + 2 + 3 completed
- [ ] All features implemented

---

## US-4.2: Performance Optimization & Tuning

**Epic:** Epic 4 - QA & Launch
**Sprint:** 4.2 / Week 8
**Effort:** 22h
**Assigned to:** @dev, @db-sage, @devops

### User Story

**As a** platform owner
**I want** to optimize performance to meet SLA targets
**So that** users have a fast, responsive experience

### Acceptance Criteria

- [ ] Database Optimization
  - Run EXPLAIN ANALYZE on slow queries
  - Create missing indexes (foreign keys, filters)
  - Eliminate N+1 patterns (use joins)
  - Target: slow queries < 100ms
  - Test with realistic data volume

- [ ] Frontend Optimization
  - Code splitting: route-based bundles
  - Lazy load components (React.lazy)
  - Image optimization (next/image)
  - Target: bundle < 300KB gzipped
  - LightHouse ≥ 90

- [ ] API Optimization
  - Cache frequent queries (Redis 5 min)
  - Enable gzip compression
  - Deduplicate parallel requests
  - Set Cache-Control headers
  - Target: P95 < 200ms

- [ ] CDN Optimization
  - Image optimization
  - Edge caching
  - Cache-Control headers (1 year for hashed assets)
  - Monitor edge hit rate

### Definition of Done

- [ ] Database: slow query EXPLAIN reviewed, indexes created
- [ ] Frontend: LightHouse ≥ 90, bundle < 300KB
- [ ] API: P95 confirmed < 200ms in load test
- [ ] CDN: images cached, load time < 1s
- [ ] No performance regressions vs. baseline
- [ ] Documentation: optimization summary

### Technical Specifications

**Database Optimization Query:**

```sql
-- Find slow queries
EXPLAIN ANALYZE
SELECT q.*, AVG(uqh.is_correct) as reputation
FROM questions q
LEFT JOIN user_question_history uqh ON q.id = uqh.question_id
WHERE q.topic = 'direito-constitucional'
  AND q.difficulty = 'medium'
GROUP BY q.id
LIMIT 20;

-- Create index
CREATE INDEX idx_questions_topic_difficulty ON questions(topic, difficulty);
```

**Frontend Code Splitting (Next.js):**

```typescript
// Route-based code splitting (automatic)
// Each route bundle: pages/questions/[id].tsx

// Component-level lazy loading
const QuestionDetailCommentSection = dynamic(
  () => import('@/components/QuestionDetailCommentSection'),
  { loading: () => <Skeleton /> }
);
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Database query plans reviewed

**Pre-PR:**

- [ ] LightHouse CI pass (≥ 90)
- [ ] Bundle size check

**Pre-Deployment:**

- [ ] Load test confirms improvement

### Dependencies

- [ ] Epic 1 + 2 + 3 completed

---

## US-4.3: Monitoring, Alerting & Runbook

**Epic:** Epic 4 - QA & Launch
**Sprint:** 4.3 / Week 8
**Effort:** 17h
**Assigned to:** @devops, @dev

### User Story

**As a** DevOps engineer
**I want** to monitor system health and have a deployment runbook
**So that** we can quickly respond to issues and deploy confidently

### Acceptance Criteria

- [ ] Error Tracking (Sentry)
  - Capture unhandled errors + exceptions
  - Source maps enabled for stack traces
  - Alert on error spike (> 10/min)
  - Error dashboard accessible

- [ ] Metrics & Monitoring (CloudFlare)
  - P95/P99 latency dashboard
  - Error rate tracking
  - Uptime monitoring (% last 30d)
  - Track active users, requests/min

- [ ] Alerting Rules
  - Error rate > 1% → critical alert
  - P95 latency > 500ms → warning alert
  - Downtime detected → critical alert
  - Database growth > threshold → warning alert
  - Send to Slack/email

- [ ] Runbook Documentation
  - Deployment steps + checklist
  - Rollback procedure + command
  - Incident response flowchart
  - Common issues + solutions
  - Team trained + confident

- [ ] Pre-Deploy Checklist
  - Env vars configured
  - Database migrations ready
  - Tests passing
  - Smoke test plan
  - Monitoring verified

### Definition of Done

- [ ] Sentry capturing errors + alerting
- [ ] Metrics dashboard accessible + accurate
- [ ] Alerts firing correctly (test each)
- [ ] Runbook documented + reviewed
- [ ] Team trained + confident
- [ ] Dry run deployment successful

### Technical Specifications

**Sentry Setup:**

```typescript
// app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false
});
```

**Monitoring Dashboards:**

```text
Dashboard 1: Error Tracking (Sentry)
- Real-time errors (5 min window)
- Error rate over time
- Top errors by frequency
- Alerts: > 10 errors/min

Dashboard 2: Performance (CloudFlare)
- P95/P99 latency over 24h
- Request count
- Error rate
- Top slow endpoints

Dashboard 3: Infrastructure
- Database query time
- Cache hit rate
- API response time distribution
```

**Runbook Structure:**

```markdown
# Deployment Runbook

## Pre-Deployment Checklist
- [ ] All tests passing (npm run test)
- [ ] Environment variables set (.env.production)
- [ ] Database migrations ready (supabase migrations list)
- [ ] No breaking changes to API
- [ ] Marketing team notified

## Deployment Steps
1. git pull origin main
2. npm run build
3. vercel deploy --prod
4. Run smoke test (login → generate → score)
5. Monitor error rate + latency (5 min)

## Rollback
1. Check CloudFlare/Sentry dashboard
2. If critical error: vercel rollback
3. Verify service restored
4. Post-mortem

## Incident Response
1. Alert triggered → open dashboard
2. Error spike → check Sentry for error type
3. Latency spike → check database performance
4. If unable to resolve: escalate + rollback
```

### Predicted Quality Gates & Agents

**Pre-Commit:**

- [ ] Monitoring configured + tested
- [ ] Alerts firing correctly

**Pre-Deployment:**

- [ ] Runbook reviewed
- [ ] Dry run successful

### Dependencies

- [ ] Sentry project created
- [ ] CloudFlare metrics enabled
- [ ] Slack integration configured

---

## 📊 Summary

**Total User Stories:** 12
**Total Effort:** ~400h
**Duration:** 8 weeks
**Team Size:** 8 FTE

| Epic | Stories | Effort | Duration |
| --- | --- | --- | --- |
| Epic 1: Core Features | 4 | 154h | Weeks 2-4 |
| Epic 2: Exams | 4 | 92h | Weeks 5-6 |
| Epic 3: Admin | 2 | 60h | Week 7 |
| Epic 4: QA & Launch | 3 | 73h | Week 8 |
| **Total** | **13** | **379h** | **8 weeks** |

---

**User Stories Prepared by:** River (Scrum Master) | **Date:** 01 Fevereiro 2026 | **Status:** ✅ Pronto para Desenvolvimento
