# 🎯 Epics - Question Creator MVP

**Versão:** 1.0 | **Data:** 01 de Fevereiro de 2026 | **Status:** Pronto para Desenvolvimento

---

## 📋 Índice de Epics

1. [Epic 1: Core Features & Reputation System](#epic-1-core-features--reputation-system-mvp-phase-1)
2. [Epic 2: Exam Management System](#epic-2-exam-management-system-phase-2)
3. [Epic 3: Admin Dashboard & CSV Import](#epic-3-admin-dashboard--csv-import-phase-3)
4. [Epic 4: QA, Performance & Launch Readiness](#epic-4-qa-performance--launch-readiness-phase-4)

---

## Epic 1: Core Features & Reputation System (MVP Phase 1)

**Duration:** Semanas 2-4 (3 semanas) | **Effort:** 154h | **Team:** 3 Frontend + 2 Backend + 1 Data Eng + 1 QA

### Epic Goal

Estabelecer a base do Question Creator MVP com geração de questões via IA, sistema de reputação dinâmico, histórico de usuário e submissão de respostas. Isso permitirá que usuários façam login, gerem questões de estudo personalizadas e submetam respostas, estabelecendo a fundação para features futuras de provas customizadas.

### Epic Description

#### Existing System Context

- **Stack:** Next.js 14 + Supabase PostgreSQL + Gemini API
- **Database:** 15 tabelas prontas, 5 triggers, 11 índices críticos
- **Data:** 13.9k questões reais de Direito Constitucional já importadas
- **Auth:** Supabase Auth (JWT) configurado

#### Enhancement Details

**O que está sendo adicionado:**

1. **API REST Endpoints** (6 core endpoints):
   - POST /api/questions/generate - Gerar 5-10 questões com IA
   - GET /api/questions - Listar + search full-text
   - GET /api/questions/{id} - Detalhe com reputação
   - POST /api/questions/{id}/submit - Submeter resposta + trigger
   - POST /api/questions/{id}/feedback - Reportar problema
   - POST /auth/{signup/login} - Autenticação

2. **UI Components** (MVP essencial):
   - Auth Pages (Login, Signup, Recovery)
   - Question Card (display question + options + submit)
   - Dashboard (welcome, stats)
   - Reputation Badge (0-10 visual)
   - Feedback Form

3. **Sistema de Reputação**:
   - 5 triggers para atualizar reputation em tempo real
   - Badges visuais (0-10 score)
   - Admin review queue para questões flagged

#### Integration Approach

- **API Layer:** Next.js API Routes → Supabase RLS Policies
- **Frontend:** React Components → Zustand State → API Routes
- **Database:** Triggers atualizam reputation_score automaticamente após cada submission
- **Auth:** Supabase Auth middleware valida JWT em cada request

#### Success Criteria

- [ ] Usuários conseguem fazer signup/login
- [ ] Gerar 5-10 questões em < 30s (com fallback se Gemini timeout)
- [ ] Submeter resposta e receber feedback imediato
- [ ] Ver histórico de tentativas
- [ ] Ver reputation score das questões (0-10)
- [ ] Reportar problemas em questões
- [ ] Admin consegue revisar questões flagged
- [ ] 80%+ test coverage
- [ ] API response time P95 < 200ms

---

### Stories (Fase 1)

#### Story 1.1: API Foundation & Authentication

**Description:** Implementar middleware de autenticação, RLS policies e 2 endpoints base (login/signup) com validação segura, JWT handling e rate limiting.

**Duration:** 1 semana (Sprint 1.1 + 1.3) | **Effort:** 22h

**Predicted Agents:**

- @dev (backend implementation)
- @architect (security review - RLS policies)

**Quality Gates:**

- **Pre-Commit:**
  - Security scan (OWASP: injection, auth bypass)
  - RLS policy validation (test with role impersonation)
  - Input validation (Zod schemas)
- **Pre-PR:**
  - JWT token expiry tests
  - Rate limit verification
  - @architect security review of RLS
- **Pre-Deployment:**
  - Smoke test: login → token → protected route
  - Monitor for auth spike/outage

**Stories Details:**

| Endpoint | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| POST /auth/signup | User creation, email verification, JWT generation | 6h | Input validation, password hashing (Supabase), test role isolation |
| POST /auth/login | JWT validation, session creation, RLS context | 8h | Token refresh logic, 2FA placeholder, rate limit (10/min) |
| Middleware | Auth check, RLS row-level context, error handling | 4h | Verify user_id propagates to RLS, test unauthorized access |
| Unit Tests | Vitest coverage (sign up / login / token validation) | 4h | Achieve 80%+ in auth module |

**Key Risks & Mitigations:**

- **Risk:** RLS policies misconfigured → data leak
  - **Mitigation:** Security audit week 2, test RLS with impersonation
- **Risk:** Rate limit bypass
  - **Mitigation:** Redis-backed rate limit, implement gradually (10 req/min → 100)

**Definition of Done:**

- [ ] Both endpoints tested with Vitest (happy path + error cases)
- [ ] RLS policies applied and verified with role impersonation
- [ ] Rate limiting working (verified with load test)
- [ ] JWT tokens valid for 24h, refresh tokens for 7d
- [ ] Documentation: API contract + setup instructions

---

#### Story 1.2: Question Generation & Retrieval (RAG Integration)

**Description:** Implementar geração de questões via Gemini API com RAG (retrieval-augmented generation), caching Redis 24h, fallback para questões reais, busca full-text em português.

**Duration:** 1 semana (Sprint 1.1 + 1.2) | **Effort:** 28h

**Predicted Agents:**

- @dev (backend - API + cache)
- @architect (LLM integration review)
- @db-sage (FTS index optimization)

**Quality Gates:**

- **Pre-Commit:**
  - Input validation (topic, difficulty, count)
  - Cache key collision check
  - FTS query performance (< 100ms)
  - SQL injection prevention (parameterized queries)
- **Pre-PR:**
  - Gemini API latency test (< 30s target)
  - Fallback mechanism verification (return real questions if timeout)
  - Cache hit rate > 50%
  - @architect review of LLM prompt safety
- **Pre-Deployment:**
  - Load test: 100 concurrent generate requests
  - Monitor Gemini API quota usage
  - Cache memory usage (set max size)

**Stories Details:**

| Endpoint | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| POST /questions/generate | RAG retrieval, Gemini prompt, response parsing | 16h | Timeout handling (30s max), prompt injection prevention, response validation |
| GET /questions | Full-text search, filtering (difficulty/topic), pagination | 8h | FTS português config, index usage, N+1 query prevention |
| GET /questions/{id} | Single question + reputation join + metadata | 4h | Verify reputation is fresh (< 1s stale ok) |

**Cache Strategy:**

- Redis 24h TTL: `question:generated:{user_id}:{topic}:{difficulty}`
- Fallback: Query real questions (pre-calculated embeddings)
- Monitor: Log cache hits/misses, adjust TTL based on usage

**Key Risks & Mitigations:**

- **Risk:** Gemini API rate limit → service degradation
  - **Mitigation:** Implement 10 gen/min per user, Redis cache, fallback to real questions
- **Risk:** FTS not working in Portuguese
  - **Mitigation:** Test locally week 1, use `portuguese` config, fallback to ILIKE

**Definition of Done:**

- [ ] Generate endpoint returns 5-10 questions in < 30s
- [ ] Fallback mechanism tested (Gemini timeout → real questions)
- [ ] FTS working for Portuguese queries
- [ ] Cache hit rate > 50% (measured after 24h)
- [ ] Vitest: 10+ test cases covering normal + error paths
- [ ] Documentation: RAG prompt, caching strategy

---

#### Story 1.3: Question Submission & Reputation System

**Description:** Implementar endpoint de submissão de respostas, triggers para atualizar reputation em tempo real, badges visuais 0-10, admin review queue para questões flagged.

**Duration:** 1 semana (Sprint 1.3 + 1.4 + 1.5) | **Effort:** 42h

**Predicted Agents:**

- @dev (backend - submission endpoint)
- @db-sage (triggers, reputation calculation)
- @architect (trigger transaction safety)

**Quality Gates:**

- **Pre-Commit:**
  - Trigger deadlock detection (@db-sage review)
  - Reputation calculation accuracy (test examples)
  - Answer validation (correct option exists)
  - Service filter check (.eq('service', 'ttcx') in RLS)
- **Pre-PR:**
  - Load test: 1000 submissions/min
  - Verify no reputation race conditions (advisory locks tested)
  - Transaction isolation (SERIALIZABLE for critical sections)
  - Admin review queue populated correctly
- **Pre-Deployment:**
  - E2E test: submit answer → reputation updates → badge appears
  - Monitor trigger execution time (< 100ms)

**Stories Details:**

| Component | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| POST /questions/{id}/submit | Record answer, validate, trigger update flow | 8h | Check answer correctness, RLS user ownership, rate limit |
| 5 Database Triggers | Update reputation, flag low-score, auto-ban spam | 10h | SERIALIZABLE isolation, advisory locks, test race conditions |
| Reputation Badge UI | Display 0-10 score + status text | 4h | Update in real-time (< 1s latency after submission) |
| Feedback Form + Queue | POST /questions/{id}/feedback, GET /admin/review-queue | 10h | Filter by priority/status, bulk operations, flagging logic |
| Admin Review Endpoint | POST /admin/reviews (approve/reject) | 8h | Update question status, log reviewer notes |
| Unit + E2E Tests | Vitest + Playwright workflows | 6h | Cover submission flow, reputation update, admin review |

**Triggers Implemented:**

1. `update_question_reputation_on_submit` - Average user scores
2. `increment_user_correct_count` - Track correctness
3. `flag_controversial_questions` - Auto-flag if avg < 5/10
4. `ban_spammy_users` - Auto-ban if > 10 reports in 24h
5. `update_user_stats` - Aggregate user metrics

**Key Risks & Mitigations:**

- **Risk:** Reputation race conditions (concurrent submits)
  - **Mitigation:** Advisory locks + SERIALIZABLE isolation, load test 1000 req/min
- **Risk:** Triggers slow down submissions
  - **Mitigation:** Monitor trigger time (target < 100ms), optimize indexes

**Definition of Done:**

- [ ] Answer submission recorded + validated
- [ ] Reputation updates < 1s after submission
- [ ] All 5 triggers tested (no race conditions)
- [ ] Reputation badges display 0-10 score correctly
- [ ] Admin review queue shows flagged questions
- [ ] Load test: 1000 submissions/min without deadlocks
- [ ] Documentation: Reputation model, trigger logic

---

#### Story 1.4: Dashboard & Navigation UI

**Description:** Criar componentes de interface base: layout (header/sidebar), páginas de auth, dashboard com stats, navigation menu, question card display.

**Duration:** 1 semana (Sprint 1.2) | **Effort:** 24h

**Predicted Agents:**

- @dev (React component implementation)
- @ux-expert (UX review - accessibility, layouts)

**Quality Gates:**

- **Pre-Commit:**
  - React Testing Library: button click, form submission
  - Accessibility check (WCAG 2.1 AA): headings, labels, contrast
  - Mobile responsive (Tailwind breakpoints tested)
- **Pre-PR:**
  - LightHouse score ≥ 90 (Lighthouse CI)
  - Bundle size check (< 300KB total)
  - @ux-expert accessibility review
- **Pre-Deployment:**
  - E2E test: login flow → dashboard → generate question
  - Performance: First Contentful Paint < 2s

**Stories Details:**

| Component | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| Layout Base (Header, Sidebar, Footer) | Navigation, branding, responsive | 6h | Frontend |
| Auth Pages (Login, Signup, Recovery) | Forms with react-hook-form + Zod, error display | 8h | Frontend |
| Question Card | Display question + 4 options + submit button + result feedback | 6h | Frontend |
| Dashboard Stats | Welcome widget, user stats (correct/total, topics), quick actions | 4h | Frontend |

**Component Tests:**

- Login form: valid/invalid inputs, error messages
- Question card: click option, submit, show feedback
- Dashboard: display stats, navigate to questions page

**Key Risks & Mitigations:**

- **Risk:** Slow page load (bundle bloat)
  - **Mitigation:** Code splitting, lazy loading, bundle analysis
- **Risk:** Accessibility issues
  - **Mitigation:** @ux-expert review, WCAG 2.1 AA test tools

**Definition of Done:**

- [ ] All components render correctly
- [ ] Forms handle validation + errors
- [ ] Mobile responsive (tested on 3 breakpoints)
- [ ] Accessibility: WCAG 2.1 AA passed
- [ ] LightHouse score ≥ 90
- [ ] React Testing Library coverage 80%+
- [ ] Documentation: Component props, usage examples

---

### Compatibility Requirements

- [ ] Existing Supabase schema untouched (only add indexes/triggers)
- [ ] No breaking API changes (all endpoints new)
- [ ] RLS policies only restrict, never grant unintended access
- [ ] Frontend API contracts backward compatible (v1.0)
- [ ] Database migrations idempotent (safe to re-run)

### Risk Mitigation Summary

| Risco | Mitigation | Owner | Timeline |
| ------- | ----------- | ------- | ---------- |
| Gemini API rate limits | Redis cache 24h + fallback real questions | @dev | Week 2 |
| RLS policy breach | Security audit + role impersonation tests | @architect | Week 2 |
| Reputation race conditions | Advisory locks + SERIALIZABLE isolation | @db-sage | Week 3 |
| FTS Portuguese failure | Test locally week 1, fallback to ILIKE | @dev | Week 1 |
| Bundle size bloat | Code splitting + lazy loading | @dev | Week 2 |

### Definition of Done

- [ ] All 4 stories completed with acceptance criteria met
- [ ] Vitest coverage ≥ 80% (auth, API, utils)
- [ ] React Testing Library coverage ≥ 80% (components)
- [ ] Playwright E2E: signup → generate → submit → view history
- [ ] API response times P95 < 200ms (load tested)
- [ ] RLS policies verified with role impersonation tests
- [ ] No reputation race conditions (load test 1000 req/min)
- [ ] LightHouse score ≥ 90
- [ ] Documentation: API, RLS model, setup instructions
- [ ] Database migrations applied + tested locally

### Validation Checklist

- [ ] Epic can be completed in 4 focused stories ✅
- [ ] No architectural changes needed (uses existing schema) ✅
- [ ] Integration complexity low (RLS + triggers) ✅
- [ ] Risk to existing data is low (only additions) ✅
- [ ] Stories properly sequenced (auth → generation → submission) ✅
- [ ] Success criteria clear and measurable ✅
- [ ] All dependencies identified (none blocking) ✅

---

## Epic 2: Exam Management System (Phase 2)

**Duration:** Semanas 5-6 (2 semanas) | **Effort:** 92h | **Team:** 3 Frontend + 2 Backend + 1 Data Eng

### Epic 2 Goal

Implementar sistema completo de criação, execução e scoring de provas customizadas. Usuários poderão criar provas selecionando questões específicas, executar com timer, submeter respostas e receber análise de performance com identificação de áreas fracas.

### Epic 2 Description

#### Existing System Context 2

- **Built On:** Epic 1 (questions geradas/reais funcionando)
- **Database:** Tabelas `exams`, `exam_attempts`, `exam_answers` já criadas
- **Triggers:** Scoring trigger pronto na Fase 1

#### Enhancement Details 2

**O que está sendo adicionado:**

1. **API Endpoints** (7 endpoints):
   - POST /api/exams - Criar prova customizada
   - GET /api/exams - Listar provas do usuário
   - GET /api/exams/{id} - Detalhe da prova
   - PUT /api/exams/{id} - Editar prova
   - POST /api/exams/{id}/attempts - Iniciar tentativa
   - POST /api/exams/{attemptId}/answers - Submeter resposta individual
   - PUT /api/exams/{attemptId}/complete - Finalizar + trigger scoring

2. **UI Components**:
   - Exam Builder (selector de questões, ordenação, configuração)
   - Exam Taker (timer, navegação, submit individual)
   - Results Page (score, breakdown por topic, weak areas)
   - Exam History (listar tentativas anteriores)

3. **Scoring & Analytics**:
   - Scoring trigger automático
   - Cálculo de acurácia por topic
   - Identificação de áreas fracas

#### Integration Approach 2

- **CRUD Sequence:** Create → Retrieve → Attempt → Answer → Complete → Score
- **RLS:** Each user sees only their exams + answers
- **Triggers:** Auto-score on attempt completion
- **Frontend:** Zustand for exam state, timed submission with warning

#### Success Criteria 2

- [ ] Criar prova com 5-50 questões
- [ ] Executar prova com timer (60 min default)
- [ ] Submeter resposta individual ou finalizar
- [ ] Receber score + análise imediata
- [ ] Ver histórico de tentativas
- [ ] Identificar áreas fracas (< 50% acurácia)
- [ ] API response time P95 < 200ms
- [ ] 80%+ test coverage

### Stories (Fase 2)

#### Story 2.1: Exam CRUD & Infrastructure

**Description:** Implementar 4 endpoints CRUD (create, read, update, list) para provas com validação de questões, RLS ownership, metadata (duration, passing score, description).

**Duration:** 1 semana (Sprint 2.1) | **Effort:** 24h

**Predicted Agents:**

- @dev (CRUD endpoints)
- @architect (schema + RLS design review)

**Quality Gates:**

- **Pre-Commit:** Input validation (question IDs exist, count 5-50), RLS ownership test
- **Pre-PR:** @architect review of exam data model
- **Pre-Deployment:** E2E: create → read → update

**Stories Details:**

| Endpoint | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| POST /exams | Create with question selector, duration, settings | 8h | Validate questions exist, RLS user_id, dedup questions |
| GET /exams | List user exams with pagination + filters | 4h | Order by created_at, test RLS isolation |
| GET /exams/{id} | Fetch exam + associated questions | 6h | Join with question table, verify ownership |
| PUT /exams/{id} | Update exam (name, duration, questions, passing_score) | 6h | Prevent update if attempt in progress |

**Key Validations:**

- Question IDs must exist in questions table
- User cannot select duplicate questions
- Duration 5-180 minutes
- Passing score 0-100%
- RLS ensures user can only see own exams

**Definition of Done:**

- [ ] All 4 endpoints tested with happy + error paths
- [ ] RLS verified (user cannot access other users' exams)
- [ ] Vitest coverage ≥ 80%

---

#### Story 2.2: Exam Attempt Management

**Description:** Implementar endpoints para iniciar tentativa, submeter respostas individuais, finalizar prova. Tracking de tempo por questão, estado de tentativa (in_progress/completed).

**Duration:** 1 semana (Sprint 2.2) | **Effort:** 28h

**Predicted Agents:**

- @dev (attempt + answer endpoints)
- @db-sage (trigger timing, scoring)

**Quality Gates:**

- **Pre-Commit:** Answer validation (option ID exists), timing checks
- **Pre-PR:** Trigger accuracy test (verify scoring calculates correctly)
- **Pre-Deployment:** E2E: attempt flow complete, score calculated

**Stories Details:**

| Endpoint | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| POST /exams/{id}/attempts | Start attempt, create attempt record, set timer | 8h | Lock exam (prevent edits during attempt), set start_time |
| POST /exams/{attemptId}/answers | Submit single answer with timing | 8h | Record user_answer, time_spent, validate option, prevent re-answer |
| PUT /exams/{attemptId}/complete | Finish attempt, trigger scoring, calculate results | 8h | Set end_time, call scoring trigger, return preliminary results |
| GET /exams/{attemptId} | Fetch attempt state + results | 4h | Include answer review, timing data, score |

**Attempt State Machine:**

- `created` → (start attempt) → `in_progress`
- `in_progress` → (answer) → `in_progress` (answer recorded)
- `in_progress` → (complete) → `completed` (trigger scoring)

**Scoring Trigger:**

- Calculate correctness per question
- Sum score = (correct / total) * 100
- Identify weak topics (< 50% accuracy)
- Log performance metrics

**Key Validations:**

- Cannot answer after completion
- Cannot submit unknown question ID
- Timer prevents answer after time expires (graceful, warn 5min before)

**Definition of Done:**

- [ ] Attempt creation + state tracking working
- [ ] Answer submission recorded with timing
- [ ] Completion triggers scoring
- [ ] Score calculation accurate (unit test examples)
- [ ] E2E: full attempt flow

---

#### Story 2.3: Exam UI & Interaction

**Description:** Criar componentes React para builder (seletor de questões), taker (timer, navegação, answering), results (score breakdown), history (tentativas anteriores).

**Duration:** 1 semana (Sprint 2.3) | **Effort:** 28h

**Predicted Agents:**

- @dev (React components)
- @ux-expert (timer UX, results visualization)

**Quality Games:**

- **Pre-Commit:** Timer accuracy (test with mock), answer recording
- **Pre-PR:** LightHouse score ≥ 90, responsive on mobile
- **Pre-Deployment:** E2E: build exam → take exam → view results

**Stories Details:**

| Component | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| Exam Builder | Question selector (search + filter), ordering, duration input | 8h | Frontend |
| Exam Taker | Timer (countdown), question nav (prev/next), answer submit, warning at 5min | 10h | Frontend |
| Results Page | Score display, breakdown per topic, weak areas highlighted, review link | 6h | Frontend |
| Exam History | List past attempts, filters (date, passing), review option | 4h | Frontend |

**Timer Implementation:**

- Countdown timer starting from duration
- 5 minute warning (toast notification)
- Auto-submit on timeout (graceful)
- Display time spent per question

**Results Visualization:**

- Overall score (percentage + pass/fail)
- Per-topic breakdown (chart or table)
- Weak areas (topics < 50% accuracy)
- Option to review answers

**Key Features:**

- Keyboard navigation (arrow keys)
- Progress indicator (X of Y questions)
- Can go back to previous questions (before submit)
- Review answers before submitting

**Definition of Done:**

- [ ] All components render and interact correctly
- [ ] Timer accurate (±1s over 1 hour)
- [ ] Results display correctly
- [ ] Responsive on mobile (tested 3 viewports)
- [ ] React Testing Library ≥ 80% coverage
- [ ] Accessibility WCAG 2.1 AA
- [ ] LightHouse ≥ 90

---

#### Story 2.4: Scoring, Analytics & Weak Area Detection

**Description:** Implementar trigger de scoring automático, cálculo de acurácia por topic, identificação de áreas fracas, API para analytics de performance.

**Duration:** 1 semana (Sprint 2.4) | **Effort:** 12h

**Predicted Agents:**

- @db-sage (trigger + analytics queries)
- @dev (analytics endpoint)

**Quality Gates:**

- **Pre-Commit:** Scoring logic accuracy (unit test examples), weak area threshold
- **Pre-PR:** Analytics query performance (< 1s for typical user)
- **Pre-Deployment:** E2E: complete attempt → verify score + weak areas

**Stories Details:**

| Component | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| Scoring Trigger | Calculate results on complete (correctness %, pass/fail) | 6h | Test accuracy, handle edge cases (no questions answered) |
| Weak Areas Detection | Identify topics with < 50% accuracy | 2h | Query exam_answers grouped by topic |
| Performance Analytics | Time per question, accuracy trends | 4h | Store in performance table for trends |

**Weak Area Algorithm:**

```text
For each topic in attempt:
  accuracy = (correct_answers / total_answers_in_topic) * 100
  IF accuracy < 50% THEN mark as weak area
```

**Definition of Done:**

- [ ] Scoring calculated correctly (no off-by-one errors)
- [ ] Weak areas identified accurately
- [ ] Analytics queryable and fast (< 1s)
- [ ] E2E: attempt → completion → results show weak areas

---

### Compatibility Requirements 2

- [ ] Exam creation doesn't affect existing question data
- [ ] RLS ensures question visibility unchanged
- [ ] Exam table doesn't conflict with existing schema
- [ ] Scoring trigger doesn't impact question reputation system

### Risk Mitigation 2

| Risco | Mitigation | Owner | Timeline |
| ------- | ----------- | ------- | ---------- |
| Trigger slow performance | Monitor execution time, optimize indexes | @db-sage | Week 5 |
| Timer inaccuracy | Test with mock time, e2e with real timer | @dev | Week 6 |
| Scoring miscalculation | Unit test examples, verify with load test | @db-sage | Week 6 |

### Definition of Done 2

- [ ] All 4 stories completed with acceptance criteria
- [ ] Vitest coverage ≥ 80% (endpoints + triggers)
- [ ] React Testing Library coverage ≥ 80% (components)
- [ ] Playwright E2E: create exam → take → score → review history
- [ ] API P95 response time < 200ms
- [ ] LightHouse score ≥ 90
- [ ] No regression in Epic 1 functionality
- [ ] Documentation: Exam model, scoring algorithm, API contracts

### Validation Checklist 2

- [ ] Depends on Epic 1 (questions) ✅
- [ ] No architectural changes ✅
- [ ] Risk to existing features is low ✅
- [ ] Stories properly sequenced ✅

---

## Epic 3: Admin Dashboard & CSV Import (Phase 3)

**Duration:** Semana 7 (1 semana) | **Effort:** 60h | **Team:** 1 Backend + 1 Data Eng + 1 Frontend

### Epic 3 Goal

Implementar infraestrutura de administração: importação de questões via CSV com deduplicação fuzzy e mapeamento semântico, versionamento de importações, dashboard admin para monitoramento de sistema, gestão de fila de reviews.

### Epic 3 Description

#### Existing System Context 3

- **Built On:** Epic 1 + Epic 2
- **Data:** CSV com novas questões aguardando import
- **Requirements:** 13.9k questões já importadas; novas podem chegar via CSV

#### Enhancement Details 3

**O que está sendo adicionado:**

1. **CSV Import Pipeline**:
   - Parser CSV validado
   - Deduplicação fuzzy (85% threshold)
   - Semantic mapping (questões → topics)
   - Async batch processing (100 rows/transaction)
   - Version management (rollback capability)

2. **Admin Dashboard**:
   - System stats (users, questions, uptime)
   - Import history + progress
   - Review queue management
   - Analytics (usage trends)

3. **API Endpoints** (5 endpoints):
   - POST /api/admin/import/csv - Upload + process CSV
   - GET /api/admin/dashboard - System stats
   - GET /api/admin/review-queue - Feedback items
   - POST /api/admin/reviews - Approve/reject + notes
   - GET /api/admin/import-history - Import versions

#### Integration Approach 3

- **Processing:** Async job (Redis queue or background task)
- **Storage:** Version table tracks each import
- **Rollback:** Can revert to previous version
- **RLS:** Admin-only endpoints (role check in middleware)

#### Success Criteria 3

- [ ] CSV parsed + validated em < 1s
- [ ] Duplicatas detectadas com 85% fuzzy match
- [ ] 13.9k questões processadas em < 15 min
- [ ] Admin pode revisar + approve/reject imports
- [ ] Dashboard mostra stats em tempo real
- [ ] Rollback para versão anterior funciona

### Stories (Fase 3)

#### Story 3.1: CSV Import Pipeline

**Description:** Implementar parser CSV, validação, deduplicação fuzzy, semantic mapping (LLM), batch async processing, version tracking.

**Duration:** 1 semana (Sprint 3.1) | **Effort:** 40h

**Predicted Agents:**

- @dev (CSV import endpoint + processing)
- @db-sage (batch logic, transaction safety)

**Quality Gates:**

- **Pre-Commit:** CSV validation (columns, encoding), dedup accuracy test
- **Pre-PR:** Performance test (1000 rows < 10s), batch transaction safety
- **Pre-Deployment:** Load test full 13.9k import

**Stories Details:**

| Component | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| CSV Parser | Validate columns, detect encoding, parse rows | 8h | Handle different encodings (UTF-8, ISO-8859-1), missing fields |
| Deduplication | Fuzzy match 85% threshold, compare with existing | 8h | Use string similarity (Levenshtein), log matched questions |
| Semantic Mapping | Map questions → topics using LLM embeddings or predefined rules | 10h | Call Gemini API (batch mode cheaper), cache embeddings |
| Batch Processing | Process 100 rows/transaction, async queue, error logging | 8h | Rollback on failure, retry logic, progress tracking |
| Version Management | Track import history, enable rollback | 6h | Store CSV file, question IDs added, timestamp, user |

**Dedup Algorithm:**

```text
For each CSV row:
  Find similar questions in DB (Levenshtein > 85%)
  IF found THEN skip (duplicate)
  ELSE insert new question
```

**Semantic Mapping:**

- Use Gemini batch API (cheaper than real-time)
- Map CSV question title → existing topic
- Fallback: predefined mapping rules

**Batch Processing:**

- Queue 100 rows per transaction
- Log failures separately
- Retry failed rows (3 attempts)
- Progress file (% complete)

**Key Risks & Mitigations:**

- **Risk:** Import > 15 min → blocks database
  - **Mitigation:** Async queue (not blocking API), batch processing
- **Risk:** Dedup matches incorrectly
  - **Mitigation:** 85% threshold (conservative), manual review queue

**Definition of Done:**

- [ ] CSV parser handles various encodings + edge cases
- [ ] Dedup accuracy tested (unit test examples)
- [ ] Semantic mapping working (verified with sample)
- [ ] Batch processing < 15 min for 13.9k questions
- [ ] Version management tracking imports
- [ ] Error logging comprehensive

---

#### Story 3.2: Admin Dashboard & Review Queue

**Description:** Criar dashboard admin com stats (users, questions, uptime), import history, review queue (feedback items), approve/reject com notas.

**Duration:** 1 semana (Sprint 3.2) | **Effort:** 20h

**Predicted Agents:**

- @dev (dashboard endpoint + review endpoint)
- @frontend (admin dashboard UI)

**Quality Gates:**

- **Pre-Commit:** Query performance (< 500ms for stats)
- **Pre-PR:** UI responsive, role-based access (admin only)
- **Pre-Deployment:** E2E: login as admin → view stats → manage reviews

**Stories Details:**

| Component | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| GET /api/admin/dashboard | System stats (active users, total questions, uptime %) | 6h | Query aggregations, cache results (5min TTL) |
| Admin Dashboard UI | Stats cards, import history table, quick actions | 6h | Show loading state, real-time updates (polling or WebSocket) |
| GET /api/admin/review-queue | List feedback items (reported problems), filter by status | 4h | Join with questions, show reporter info |
| POST /api/admin/reviews | Approve/reject feedback, update question status, log notes | 4h | RLS check (admin only), audit trail |

**Admin Stats:**

- Active users (last 24h / last 7d)
- Total questions (real + generated)
- Import count + last import date
- System uptime (% last 30d)
- API latency (P95)
- Database size

**Review Queue:**

- List feedback items (problem reports)
- Filter: status (pending/approved/rejected), priority, date
- For each: show question, feedback text, reporter, reported_count
- Action: approve, reject, request more info

**Key Validations:**

- Only admin role can access
- Notes logged for audit trail
- Status update triggers notification to reporter (optional)

**Definition of Done:**

- [ ] Dashboard displays stats correctly
- [ ] Stats updated in real-time (or reasonable cache)
- [ ] Review queue shows all feedback items
- [ ] Approve/reject working + notes logged
- [ ] Admin access control verified
- [ ] UI responsive on desktop (admin primary)

---

### Compatibility Requirements 3

- [ ] CSV import doesn't modify existing questions
- [ ] Version management allows full rollback
- [ ] Admin endpoints don't affect user-facing APIs
- [ ] RLS enforces admin-only access

### Risk Mitigation 3

| Risco | Mitigation | Owner | Timeline |
| ------- | ----------- | ------- | ---------- |
| Import performance | Async processing, batch 100 rows | @db-sage | Week 7 |
| Dedup false positives | 85% threshold (conservative), manual review | @dev | Week 7 |
| Admin access abuse | RLS role check, audit logging | @architect | Week 7 |

### Definition of Done 3

- [ ] All 2 stories completed with acceptance criteria
- [ ] CSV import pipeline tested with sample + full dataset
- [ ] Admin dashboard functional + responsive
- [ ] Review queue working
- [ ] 13.9k import completes in < 15 min
- [ ] Rollback tested + documented
- [ ] Documentation: CSV format, admin guide

### Validation Checklist 3

- [ ] Depends on Epic 1 + 2 ✅
- [ ] No architectural changes ✅
- [ ] Risk low (isolated to admin features) ✅

---

## Epic 4: QA, Performance & Launch Readiness (Phase 4)

**Duration:** Semana 8 (1 semana) | **Effort:** 73h | **Team:** 1 QA + 1 Backend + 1 Data Eng + 1 DevOps

### Epic 4 Goal

Completar validação de qualidade em todas as funcionalidades (regression testing, load testing, security audit), otimizar performance (queries, frontend, CDN), implementar monitoramento, preparar runbook de deploy. MVP pronto para produção.

### Epic 4 Description

#### Existing System Context 4

- **Built On:** Epic 1 + 2 + 3 (todas features implementadas)
- **Metrics Target:** P95 response < 200ms, LightHouse ≥ 90, uptime ≥ 99%

#### Enhancement Details 4

**O que está sendo adicionado:**

1. **QA Testing**:
   - Regression testing (todos endpoints)
   - Load testing (100-1000 concurrent)
   - Security audit (OWASP top 10)
   - E2E critical paths (login → generate → exam → score)

2. **Performance Optimization**:
   - Database: query analysis, index tuning
   - Frontend: code splitting, bundle optimization
   - API: caching strategy, compression
   - CDN: image optimization, edge caching

3. **Production Readiness**:
   - Monitoring setup (Sentry, CloudFlare metrics)
   - Alerting (errors, latency spikes)
   - Runbook (deploy, rollback, incident response)
   - Documentation complete

#### Success Criteria 4

- [ ] Todos endpoints passando regression tests
- [ ] Load test: 1000 concurrent users sem degradação
- [ ] Security audit: OWASP top 10 verificado
- [ ] P95 latency < 200ms (measured)
- [ ] LightHouse ≥ 90
- [ ] Bundle < 300KB (gzipped)
- [ ] Uptime monitoring configured
- [ ] Deploy runbook documented
- [ ] Team trained + ready for launch

### Stories (Fase 4)

#### Story 4.1: Regression Testing & QA

**Description:** Executar regression tests em todos endpoints, componentes, fluxos críticos end-to-end. Validar não há regressions de Epics 1-3. Load test 1000 concurrent users.

**Duration:** 1 semana (Sprint 4.1) | **Effort:** 34h

**Predicted Agents:**

- @qa (test execution, load testing)
- @dev (API endpoint validation)

**Quality Gates:**

- **Pre-Commit:** All test cases written + passing
- **Pre-PR:** Load test results reviewed, SLA targets met
- **Pre-Deployment:** Full regression + E2E success

**Stories Details:**

| Tipo | Tarefas | Esforço | Focus |
| ------ | --------- | --------- | ------- |
| Regression Testing | Vitest + Playwright all scenarios | 12h | Auth flows, question CRUD, exam flow, admin functions |
| Load Testing | k6 script: 100→500→1000 concurrent users | 8h | Measure P95 latency, error rate, throughput |
| Security Audit | OWASP top 10 checklist | 8h | SQL injection, XSS, CSRF, broken auth, sensitive data, etc |
| E2E Critical Path | Playwright: signup → generate → take exam → score | 6h | Verify all critical flows working end-to-end |

**Regression Test Coverage:**

| Flow | Test Cases | Expected |
| ------ | ----------- | ---------- |
| Auth | signup/login/logout, token refresh, invalid credentials, rate limit | All pass |
| Questions | generate, list, search, submit, feedback, reputation | All pass, P95 < 200ms |
| Exams | create, list, take, score, history | All pass, scoring accurate |
| Admin | import CSV, review queue, approve/reject | All pass, RLS enforced |

**Load Test Profile:**

- Ramp: 0→100 users over 1 min, hold 5 min, ramp to 500, hold 5 min, ramp to 1000, hold 10 min
- Measure: Response time (P95, P99), error rate, throughput
- Success: P95 < 200ms, error rate < 0.1%, throughput ≥ 500 req/s

**Security Audit Checklist (OWASP):**

- [ ] SQL injection: parameterized queries ✅
- [ ] XSS: input sanitization, CSP headers ✅
- [ ] CSRF: CSRF tokens or SameSite cookies ✅
- [ ] Broken auth: JWT validation, RLS ✅
- [ ] Sensitive data: no secrets in logs, HTTPS ✅
- [ ] Broken access control: RLS policies tested ✅
- [ ] Security misconfiguration: env vars, headers ✅
- [ ] Insecure deserialization: none used ✅
- [ ] Using components with known vulnerabilities: npm audit ✅
- [ ] Insufficient logging: audit trail present ✅

**Definition of Done:**

- [ ] All regression tests passing
- [ ] Load test results meet SLA (P95 < 200ms)
- [ ] Security audit checklist complete
- [ ] E2E critical paths passing
- [ ] No new bugs found during testing

---

#### Story 4.2: Performance Optimization & Tuning

**Description:** Otimizar database queries (EXPLAIN, indexes), frontend bundle (code splitting, lazy loading), API caching, CDN images. Target: P95 < 200ms, LightHouse ≥ 90, bundle < 300KB.

**Duration:** 1 semana (Sprint 4.2) | **Effort:** 22h

**Predicted Agents:**

- @dev (database + API optimization)
- @db-sage (index tuning)
- @devops (CDN setup)

**Quality Gates:**

- **Pre-Commit:** Database query plans reviewed, index created
- **Pre-PR:** Lighthouse CI pass (≥ 90), bundle size check
- **Pre-Deployment:** Load test confirms latency improvement

**Stories Details:**

| Area | Tarefas | Esforço | Focus |
| ------ | --------- | --------- | ------- |
| Database | Query EXPLAIN analysis, create missing indexes, optimize N+1 | 6h | Target: slow queries < 100ms, no N+1 |
| Frontend | Code splitting, lazy loading, bundle analysis | 8h | Target: bundle < 300KB gzipped |
| API | Cache strategy, compression (gzip), request dedup | 4h | Target: P95 < 200ms for common queries |
| CDN | Image optimization, edge caching, Cache-Control headers | 4h | Target: image load < 1s |

**Database Optimization:**

- Run EXPLAIN on slow queries
- Create indexes on foreign keys + frequently filtered columns
- Verify no N+1 patterns (use joins, not loop queries)
- Test with realistic data volume

**Frontend Optimization:**

- Next.js code splitting (route-based)
- Lazy load components (React.lazy)
- Image optimization (next/image)
- Bundle analysis: identify large libraries

**API Optimization:**

- Cache frequent queries (Redis 5 min)
- Enable gzip compression
- Deduplicate parallel requests
- Set Cache-Control headers

**CDN Optimization:**

- Use next/image for responsive images
- Set max-age cache headers (1 year for hashed assets)
- Monitor edge hit rate

**Definition of Done:**

- [ ] Database: slow query EXPLAIN reviewed, indexes created
- [ ] Frontend: Lighthouse ≥ 90, bundle < 300KB
- [ ] API: P95 confirmed < 200ms in load test
- [ ] CDN: images cached, load time < 1s
- [ ] No performance regressions

---

#### Story 4.3: Monitoring, Alerting & Runbook

**Description:** Setup Sentry/error tracking, CloudFlare metrics, performance alerts, incident response runbook, team training, deploy checklist.

**Duration:** 1 semana (Sprint 4.3) | **Effort:** 17h

**Predicted Agents:**

- @devops (monitoring setup, runbook)
- @dev (incident response coordination)

**Quality Gates:**

- **Pre-Commit:** Monitoring configured + tested, alerts firing correctly
- **Pre-Deployment:** Runbook reviewed by team, dry run successful

**Stories Details:**

| Component | Tarefas | Esforço | Focus |
| ---------- | --------- | --------- | ------- |
| Error Tracking | Sentry setup, capture unhandled errors, source maps | 3h | Alert on error spike (> 10/min) |
| Metrics & Monitoring | CloudFlare metrics, P95 latency dashboard, uptime monitor | 3h | Track P95, P99, error rate, uptime daily |
| Alerting | Configure alerts: latency spike, error spike, downtime | 2h | Slack/email notification for serious issues |
| Runbook | Document: deploy steps, rollback, incident response | 4h | Include: deploy command, check health, monitor errors, rollback steps |
| Team Training | Review runbook, practice deploy + rollback | 3h | Ensure team confidence |
| Pre-Deploy Checklist | Database migration script, env config, smoke test | 2h | Run checklist before each deploy |

**Monitoring Dashboards:**

- Real-time errors (Sentry)
- API latency (CloudFlare / APM tool)
- Database performance
- User activity (active users, requests/min)
- Infrastructure (CPU, memory, disk)

**Alerting Rules:**

- Error rate > 1% → critical alert
- P95 latency > 500ms → warning alert
- Downtime detected → critical alert
- Database growth > threshold → warning alert

**Runbook Structure:**

1. **Deployment:**
   - Checklist: env vars set, migrations ready, tests passing
   - Command: `vercel deploy --prod`
   - Verification: smoke test (login → generate → score)
   - Monitoring: watch error rate + latency (5 min)

2. **Rollback:**
   - Command: `vercel rollback`
   - Verification: same smoke test
   - Notify stakeholders if issue

3. **Incident Response:**
   - Alert triggered → check dashboard
   - If error spike: check Sentry for error type
   - If latency: check database/API performance
   - Escalate if unable to resolve

**Definition of Done:**

- [ ] Sentry capturing errors
- [ ] Metrics dashboard accessible
- [ ] Alerts firing correctly
- [ ] Runbook documented + reviewed
- [ ] Team trained + confident
- [ ] Dry run deployment successful

---

### Compatibility Requirements 4

- [ ] No breaking changes to existing APIs
- [ ] Database optimizations backward compatible
- [ ] Performance changes transparent to users

### Risk Mitigation 4

| Risco | Mitigation | Owner | Timeline |
| ------- | ----------- | ------- | ---------- |
| Test finds critical bug | Immediate fix + re-test before deploy | @dev | Week 8 |
| Performance targets not met | Extend week 8 or deferFeatures to V2 | @dev | Week 8 |
| Monitoring misconfigured | Dry run verify alerts firing | @devops | Week 8 |

### Definition of Done 4

- [ ] All 3 stories completed with acceptance criteria
- [ ] Regression tests 100% passing
- [ ] Load test P95 < 200ms confirmed
- [ ] Security audit OWASP checklist complete
- [ ] LightHouse ≥ 90
- [ ] Bundle < 300KB
- [ ] Monitoring + alerting active
- [ ] Runbook ready + team trained
- [ ] Ready for production deployment
- [ ] Documentation complete

### Validation Checklist 4

- [ ] Depends on Epic 1 + 2 + 3 ✅
- [ ] No architectural changes ✅
- [ ] Risk low (testing + optimization only) ✅
- [ ] Success criteria clear and measurable ✅

---

## 📊 Epic Timeline & Dependencies

```mermaid
Semana 1: Fase 0 (Setup)
  ↓
Semanas 2-4: Epic 1 (Core Features)
  ├─ Story 1.1 (Auth) → Story 1.2 (Generation) → Story 1.3 (Submission) → Story 1.4 (UI)
  ↓
Semanas 5-6: Epic 2 (Exams)
  ├─ Story 2.1 (CRUD) → Story 2.2 (Attempt) → Story 2.3 (UI) → Story 2.4 (Scoring)
  ↓
Semana 7: Epic 3 (Admin)
  ├─ Story 3.1 (CSV Import) → Story 3.2 (Dashboard)
  ↓
Semana 8: Epic 4 (QA & Launch)
  ├─ Story 4.1 (Testing) → Story 4.2 (Performance) → Story 4.3 (Monitoring)
  ↓
Pronto para Produção ✅
```

---

## 🎯 Próximas Ações

1. ✅ **Epics criados** - 4 epics, 12 stories, todos com agents preditos + quality gates
2. **Revisar com Tech Lead** - Validar agents, duração, esforço
3. **Ajustar capacidade** - Se 8 FTE não disponível, reduzir escopo
4. **Criar stories detalhadas** - Passar para @sm para breakdown em user stories
5. **Iniciar Fase 0** - Setup semana que vem

---

**Epics Preparados por:** Morgan (PM) | **Data:** 01 Fevereiro 2026 | **Status:** ✅ Pronto para Review
