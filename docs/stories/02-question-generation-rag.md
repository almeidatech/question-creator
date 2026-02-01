# US-1B.1-7: RAG System & Question Generation with Dual-Corpus

**Epic:** Epic 1B - RAG System & Question Generation
**Sprint:** Weeks 7-8 (MVP) + Week 4 Phase 2 (pgvector upgrade)
**Total Effort:** 42 hours (MVP) + 6 hours (Phase 2)
**Assigned to:** @dev (backend), @architect (system design), @data-architect (schema)
**Status:** ✅ REFINED & READY FOR DEVELOPMENT
**Approved by:** @pm (Morgan), @architect (Aria), @analyst (Atlas)
**Validated by:** @sm (River) - Scrum Master

---

## Critical Context for Developers

**⚠️ DUAL-CORPUS ARCHITECTURE IS NON-NEGOTIABLE**

Every single RAG query MUST filter by `source_type='real_exam' AND rag_eligible=true`. This is enforced in the database schema. If AI-generated questions ever appear in RAG results, the system is broken.

**KPIs That Gate MVP Launch:**
- Expert approval rate >80% (or MVP blocks)
- Error rate <5% (or MVP blocks)
- Zero corpus contamination (or MVP blocks)
- Generation latency P95 <2-3s

---

## User Stories (Epic 1B - 7 Stories Refined)

### Story Overview

```
Week 7-8 (MVP - FTS RAG):
├─ US-1B.1: Dual-Corpus Schema + Audit
├─ US-1B.2: FTS Query Development
├─ US-1B.3: Claude Integration
├─ US-1B.4: Cache Strategy
├─ US-1B.5: Expert Review Queue
├─ US-1B.6: Corpus Isolation Testing
└─ (Phase 2 Week 4) US-1B.7: pgvector Setup

Total Effort: 42h
Timeline: 2 weeks MVP (FTS) + 3-4 days Phase 2 (pgvector)
```

---

## US-1B.1: Dual-Corpus Schema & Audit Trigger

**🎯 Story Intent:** Establish database-level enforcement of corpus isolation. AI-generated questions must NEVER contaminate the RAG corpus through this table structure.

**User Story:**
**As a** system architect
**I want** to create a question_sources table that prevents AI-generated questions from contaminating the RAG corpus
**So that** quality degradation is prevented through "fiction influencing fiction"

**Acceptance Criteria (TESTABLE & MEASURABLE):**

- [ ] **Table Creation:**
  - [ ] `question_sources` table exists with exact schema:
    ```
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    question_id UUID UNIQUE NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('real_exam', 'ai_generated', 'expert_approved'))
    rag_eligible BOOLEAN NOT NULL DEFAULT false
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
    approved_at TIMESTAMP
    approved_by UUID REFERENCES users(user_id)
    ```
  - [ ] No nullable fields except `approved_at`, `approved_by`
  - [ ] `source_type` enum strictly enforced (ENUM type or CHECK constraint)

- [ ] **Data Migration (13,917 questions):**
  - [ ] Migration script created: `migrations/001_create_question_sources.sql`
  - [ ] All 13,917 real exam questions inserted with `source_type='real_exam'`, `rag_eligible=true`
  - [ ] Migration rollback script exists
  - [ ] Execution time: <5 minutes on production database
  - [ ] **TEST:** `SELECT COUNT(*) FROM question_sources WHERE source_type='real_exam'` returns exactly 13,917

- [ ] **Audit Trigger Implementation:**
  - [ ] Trigger created: `audit_question_sources_changes`
  - [ ] Fires on UPDATE to `question_sources`
  - [ ] Logs to `audit_log` table: `{old_value, new_value, changed_by, changed_at, table_name, operation}`
  - [ ] Cannot be dropped or disabled by non-admin users
  - [ ] **TEST:** Update 1 question's source_type, verify audit_log entry created

- [ ] **Indexes for Performance:**
  - [ ] `idx_qs_type_eligible`: Composite index `(source_type, rag_eligible)` for RAG queries
  - [ ] `idx_qs_question_id`: Index on `question_id` for FK lookups
  - [ ] **TEST:** EXPLAIN ANALYZE on RAG query shows <1ms index scan

- [ ] **Contamination Check Query Available:**
  - [ ] Query documented: `SELECT COUNT(*) FROM question_sources WHERE source_type='ai_generated' AND rag_eligible=true`
  - [ ] Expected result: always 0
  - [ ] Alert configured in monitoring (Datadog/New Relic) to trigger if > 0
  - [ ] **TEST:** Run query manually, verify returns 0

- [ ] **Test Data:**
  - [ ] 10 test records inserted with mixed source_types:
    - 5 × `source_type='real_exam'`, `rag_eligible=true`
    - 3 × `source_type='ai_generated'`, `rag_eligible=false`
    - 2 × `source_type='expert_approved'`, `rag_eligible=false`
  - [ ] **TEST:** Query each type, verify counts correct

**Technical Details:**

- **Effort:** 4 hours
- **Duration:** 1 day
- **Owner:** @data-architect (schema design) + @dev (implementation)
- **Blocker for:** US-1B.2, US-1B.3, US-1B.5

**CodeRabbit Integration (Automated Quality Gate):**

- [ ] **Security Review:**
  - Verify CHECK constraint prevents invalid source_type values
  - Confirm FK constraint on question_id prevents orphaned records
  - Validate audit trigger captures all mutations

- [ ] **Performance Review:**
  - EXPLAIN ANALYZE shows composite index used for `(source_type, rag_eligible)` filter
  - Index creation doesn't exceed 30 seconds on 13k rows
  - Query plans show <1ms index scans

- [ ] **Schema Review:**
  - Naming conventions: snake_case, clear semantics
  - Data types match downstream usage (UUID for question_id)
  - No redundant indexes

**Definition of Done:**

- [ ] Migration runs successfully in dev, staging, production
- [ ] Rollback tested and documented
- [ ] 10+ unit tests pass (table creation, migration, audit trigger)
- [ ] Performance benchmark: migration <5min, queries <1ms
- [ ] Documentation: Schema diagram, migration procedure, contamination check script

---

## US-1B.2: FTS Query Development & RAG Retrieval

**🎯 Story Intent:** Implement the retrieval mechanism that feeds real exam questions into Claude's context window. This is the RAG "R" - everything downstream depends on getting this right.

**User Story:**
**As a** developer
**I want** to implement FTS-based RAG queries that retrieve only real exam questions by topic/difficulty
**So that** Claude can generate questions grounded in authentic exam patterns

**Acceptance Criteria (TESTABLE & MEASURABLE):**

- [ ] **FTS Index Creation:**
  - [ ] PostgreSQL `tsvector` index created on `questions.text` with Portuguese language config
  - [ ] Index name: `idx_questions_fts_portuguese`
  - [ ] SQL:
    ```sql
    CREATE INDEX idx_questions_fts_portuguese ON questions
      USING gin(to_tsvector('portuguese', text));
    ```
  - [ ] Index creation time: <30 seconds
  - [ ] **TEST:** EXPLAIN ANALYZE confirms index used in query plans

- [ ] **RAG Retrieval Function Implemented:**
  - [ ] Function signature (TypeScript):
    ```typescript
    async function retrieveRagContext(
      topic: string,
      difficulty: 'easy' | 'medium' | 'hard',
      count: number = 10
    ): Promise<Question[]>
    ```
  - [ ] **CRITICAL:** SQL ALWAYS includes: `WHERE source_type='real_exam' AND rag_eligible=true`
  - [ ] Filters applied in ORDER:
    1. `source_type='real_exam' AND rag_eligible=true` (corpus isolation)
    2. `difficulty=$1` (user request)
    3. `topic_id=$2` (user request)
    4. FTS ranking on question text (relevance)
  - [ ] Returns exactly `count` questions (default 10, max 20)
  - [ ] Response includes: `{id, text, options, difficulty, topic, source_type, reputation}`
  - [ ] Latency target: <100ms P95
  - [ ] **TEST:** Query 50 questions, verify all have `source_type='real_exam'`

- [ ] **Fallback Mechanism (Graceful Degradation):**
  - [ ] If FTS returns <3 results:
    - Try keyword ILIKE matching on topic
    - If still <3 results: Return random real exam questions by difficulty
  - [ ] Fallback counts logged to monitoring (alert if >10% of requests)
  - [ ] **TEST:** Query for obscure topic, verify fallback activates and returns results

- [ ] **Performance Testing:**
  - [ ] Load test: 50 concurrent requests
  - [ ] **TEST:** All requests complete in <150ms P95
  - [ ] **TEST:** N+1 query check passes (no per-question lookups in loop)
  - [ ] Database connection pooling verified
  - [ ] **TEST:** Memory usage stable under load

- [ ] **Test Coverage (8+ Test Cases):**
  - [ ] Test: Normal query returns 10 real exam questions
  - [ ] Test: Difficulty filtering works (easy/medium/hard)
  - [ ] Test: Topic filtering works
  - [ ] Test: FTS query with special characters doesn't crash
  - [ ] Test: Fallback activates when <3 FTS results
  - [ ] Test: source_type='ai_generated' NEVER appears in results
  - [ ] Test: rag_eligible=false NEVER appears in results
  - [ ] Test: Returns exactly requested count (5, 10, 20)

**Technical Details:**

- **Effort:** 8 hours
- **Duration:** 2 days
- **Owner:** @dev (backend) + @data-architect (query optimization)
- **Depends on:** US-1B.1 (schema) COMPLETE
- **Blocker for:** US-1B.3 (Claude integration)

**CodeRabbit Integration (Automated Quality Gate):**

- [ ] **Query Safety Review:**
  - Verify parameterized queries (no SQL injection)
  - Confirm source_type filter is ALWAYS in WHERE clause
  - Check for connection pooling (no resource leaks)

- [ ] **Performance Review:**
  - EXPLAIN ANALYZE output shows index usage
  - No N+1 patterns in fallback logic
  - Proper async/await for database calls

- [ ] **Test Coverage Review:**
  - All edge cases covered (special chars, empty results, max results)
  - Corpus isolation tested explicitly

**Definition of Done:**

- [ ] `retrieveRagContext()` function deployed and tested
- [ ] FTS index created and verified on production
- [ ] 8+ tests passing (vitest)
- [ ] Load test: 50 concurrent requests, all <150ms
- [ ] Performance benchmark: <100ms P95 on typical query
- [ ] Documentation: Query examples, fallback behavior, performance tuning
- [ ] Monitoring: Query latency dashboard, fallback rate alert

---

## US-1B.3: Claude 3.5 Sonnet Integration

**🎯 Story Intent:** Core value delivery - generate novel questions grounded in real exam patterns. This is where RAG + LLM combine. Quality gate: Expert review 100% before any user sees generated questions.

**User Story:**
**As a** student
**I want** to generate 5-10 new study questions on demand grounded in real exam patterns
**So that** I get unlimited personalized practice material without quality degradation

**Acceptance Criteria (TESTABLE & MEASURABLE):**

- [ ] **Endpoint Implementation:**
  - [ ] Route: `POST /api/questions/generate`
  - [ ] Input validation schema:
    ```typescript
    {
      topic: string;              // Required, max 100 chars
      difficulty: 'easy'|'medium'|'hard';  // Required
      count: number;              // Required, 5-20 inclusive
    }
    ```
  - [ ] Input validation rejects invalid values (400 response)
  - [ ] **TEST:** POST with count=21 returns 400 error
  - [ ] **TEST:** POST with invalid difficulty returns 400 error

- [ ] **RAG Context Retrieval:**
  - [ ] Calls `retrieveRagContext(topic, difficulty, count)` from US-1B.2
  - [ ] Receives 10-20 real exam questions as context
  - [ ] **TEST:** Verify all returned questions have `source_type='real_exam'`

- [ ] **Claude API Integration:**
  - [ ] Claude 3.5 Sonnet API configured (via Anthropic SDK)
  - [ ] API key loaded from `.env.local` (CLAUDE_API_KEY)
  - [ ] Prompt template (EXACT format - no variations):
    ```
    You are a Constitutional Law expert professor.
    Generate ${count} unique exam-style multiple-choice questions.

    Context (real exam patterns from Constitutional Law exams):
    ${ragContext}

    Requirements:
    - Difficulty level: ${difficulty}
    - Topic: ${topic}
    - Style: CESPE/FCC exam format
    - 100% legal accuracy - no hallucinations
    - Exactly 4 options per question
    - Exactly 1 correct answer per question
    - Options should be plausible but distinct

    Return as JSON array only (no markdown, no explanation):
    [
      {
        "text": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Why option 0 is correct..."
      }
    ]
    ```
  - [ ] Temperature: 0.7 (balance creativity + consistency)
  - [ ] Max tokens: 4000
  - [ ] **TEST:** API call returns valid JSON response

- [ ] **Response Validation (Zod Schema):**
  - [ ] Parse Claude response as JSON
  - [ ] Validate schema:
    ```typescript
    const questionSchema = z.object({
      text: z.string().min(10).max(1000),
      options: z.array(z.string()).length(4),
      correctAnswer: z.number().min(0).max(3),
      explanation: z.string().optional()
    });
    ```
  - [ ] Validate exactly `count` questions returned
  - [ ] Each question has exactly 4 options
  - [ ] Each question has exactly 1 correct answer (0-3)
  - [ ] **TEST:** Invalid JSON response rejected with 500 error
  - [ ] **TEST:** Response with 3 questions when 5 requested returns error

- [ ] **Store Generated Questions:**
  - [ ] Insert into `questions` table:
    ```typescript
    {
      text: response.text,
      options: [A, B, C, D],
      correct_answer: response.correctAnswer,
      difficulty: input.difficulty,
      topic_id: input.topic_id,
      created_by: user_id,
      reputation_score: 0
    }
    ```
  - [ ] Insert into `question_sources`:
    ```typescript
    {
      question_id: new_question.id,
      source_type: 'ai_generated',  // CRITICAL
      rag_eligible: false,           // CRITICAL
      created_at: NOW()
    }
    ```
  - [ ] Store metadata:
    ```typescript
    {
      generation_id: uuid(),
      user_id: user_id,
      model: 'claude-3.5-sonnet',
      temperature: 0.7,
      rag_context_count: 10,
      tokens_input: api_response.usage.input_tokens,
      tokens_output: api_response.usage.output_tokens,
      cost_usd: (input_tokens * 0.003 + output_tokens * 0.015) / 1000,
      latency_ms: response_time_ms
    }
    ```
  - [ ] **TEST:** Verify generated questions have `source_type='ai_generated'`, `rag_eligible=false`

- [ ] **Response Latency:**
  - [ ] End-to-end time: <2-3 seconds P95 (RAG retrieval + Claude API + validation + storage)
  - [ ] Claude API timeout: 30 seconds max
  - [ ] **TEST:** Load test with 10 concurrent requests, all <3s

- [ ] **Fallback Mechanism (Claude Timeout/Error):**
  - [ ] If Claude API fails or times out (>30s):
    - Call fallback: `retrieveRagContext(topic, difficulty, count)`
    - Return real exam questions instead
    - Log fallback with reason: `{reason: 'timeout'|'api_error'|'validation_error', timestamp, user_id}`
    - Alert if fallback rate >20% in 1-hour window
  - [ ] **TEST:** Mock Claude timeout, verify fallback returns real questions
  - [ ] **TEST:** Fallback questions have `source_type='real_exam'`

- [ ] **Rate Limiting:**
  - [ ] Per-user limit: 10 generations per minute
  - [ ] Per-project limit: 100k tokens per minute
  - [ ] Token count from Claude response included in project limit
  - [ ] Return 429 (Too Many Requests) with Retry-After header if exceeded
  - [ ] **TEST:** 11 requests from same user in 1 minute returns 429

- [ ] **Cost Tracking & Budget:**
  - [ ] Log cost per request: `(input_tokens * $0.003 + output_tokens * $0.015) / 1000`
  - [ ] Expected cost per 5-question batch: ~$0.022
  - [ ] Dashboard metric: cumulative API spend per day/month
  - [ ] Alert if daily spend exceeds threshold
  - [ ] **TEST:** Cost calculation correct for known input/output token counts

- [ ] **Error Handling:**
  - [ ] Exponential backoff on API errors:
    - Retry 1: 1s delay
    - Retry 2: 2s delay
    - Retry 3: 4s delay
    - After 3 retries: Fall back to real questions
  - [ ] Clear error responses (400, 429, 500, 503)
  - [ ] Log all errors with context: `{endpoint, user_id, error_type, timestamp, stack_trace}`

**Technical Details:**

- **Effort:** 8 hours
- **Duration:** 2 days
- **Owner:** @dev (backend)
- **Depends on:** US-1B.2 (FTS retrieval) COMPLETE
- **Blocker for:** US-1B.4, US-1B.5

**CodeRabbit Integration (Automated Quality Gate):**

- [ ] **API Security Review:**
  - Validate input escaping (topic parameter sanitized)
  - Verify no prompt injection vulnerabilities
  - Confirm API key never logged
  - Check rate limiting implemented correctly

- [ ] **LLM Prompt Safety Review:**
  - Prompt doesn't allow jailbreak instructions
  - No indirect instruction injection possible
  - Validate response before storing (schema + content checks)

- [ ] **Error Handling Review:**
  - All error paths have proper logging
  - No silent failures
  - Fallback mechanism tested

**Definition of Done:**

- [ ] Endpoint returns 5-20 valid JSON questions in <3s
- [ ] Generated questions have `source_type='ai_generated'`, `rag_eligible=false`
- [ ] Fallback mechanism tested (mock timeout, verify real questions returned)
- [ ] Rate limiting verified (11th request = 429)
- [ ] Cost tracking working (dashboard shows API spend)
- [ ] 10+ tests passing (normal path, validation, errors, timeout, rate limit)
- [ ] Load test: 10 concurrent requests, all <3s
- [ ] Documentation: Prompt template, cost estimates, fallback behavior, error handling
- [ ] Monitoring: Latency dashboard, error rate alert, fallback rate alert, cost tracking

---

## US-1B.4: Redis Cache Strategy

**🎯 Story Intent:** Reduce API costs by caching generated question lists. Target >70% hit rate by end of Week 8.

**User Story:**
**As a** system
**I want** to cache generated question lists for 24 hours
**So that** repeated requests don't consume Claude API tokens

**Acceptance Criteria (TESTABLE & MEASURABLE):**

- [ ] **Redis Cache Configuration:**
  - [ ] Upstash Redis account configured (already in stack)
  - [ ] TTL: 86400 seconds (24 hours)
  - [ ] Cache key format: `question:gen:${userId}:${topic}:${difficulty}:${count}`
  - [ ] **TEST:** Cache entry expires after 24 hours

- [ ] **Cache Operations:**
  - [ ] **Before Claude call:** Check cache for key, return if exists
  - [ ] **After Claude success:** Store result in Redis with 24h TTL
  - [ ] **On fallback:** Don't cache (real exam questions shouldn't be cached)
  - [ ] **TEST:** Same request returns cached result within 100ms second time

- [ ] **Cache Hit Tracking:**
  - [ ] Log every request: `{user_id, topic, difficulty, count, cache_hit: true|false, timestamp}`
  - [ ] Dashboard metric: cache_hit_rate = hits / (hits + misses)
  - [ ] Target: >70% hit rate (measured daily)
  - [ ] **TEST:** After 48h usage, hit rate >50%

- [ ] **Cache Invalidation:**
  - [ ] Manual: Admin endpoint to clear user's cache
  - [ ] Automatic: No auto-invalidation (24h TTL is safe)
  - [ ] **TEST:** Admin can invalidate specific cache key

- [ ] **Monitoring & Alerts:**
  - [ ] Dashboard: Hit rate, memory usage, response times
  - [ ] Alert if hit rate drops <60% (indicates issue)
  - [ ] Alert if Redis connection fails (fallback to direct Claude call)

**Technical Details:**

- **Effort:** 4 hours
- **Duration:** 1 day
- **Owner:** @dev (backend)
- **Depends on:** US-1B.3 (Claude integration) COMPLETE

**CodeRabbit Integration (Automated Quality Gate):**

- [ ] **Performance Review:**
  - Verify cache hit timing <100ms
  - Check for memory leaks in cache operations
  - Validate TTL enforcement

- [ ] **Reliability Review:**
  - Connection pooling to Redis
  - Fallback if Redis unavailable
  - No cache corruption possible

**Definition of Done:**

- [ ] Cache working end-to-end (hit 2nd identical request)
- [ ] Hit/miss logging accurate
- [ ] Dashboard shows hit rate metric
- [ ] Admin invalidation working
- [ ] 5+ tests passing (hit, miss, invalidation, expiry, error handling)
- [ ] Monitoring alerts configured

---

## US-1B.5: Expert Review Queue & Reputation System

**🎯 Story Intent:** Quality gate - 100% of AI-generated questions must be approved by expert before user exposure. This is non-negotiable for MVP gating.

**User Story:**
**As a** Constitutional Law expert reviewer
**I want** to review all AI-generated questions before they're shown to students
**So that** only accurate, high-quality questions are available to learners

**Acceptance Criteria (TESTABLE & MEASURABLE):**

- [ ] **Review Queue Endpoint:**
  - [ ] Route: `GET /api/admin/review-queue?page=1&limit=20`
  - [ ] Returns all questions with:
    - `source_type='ai_generated'` AND `status='pending'`
    - Ordered by `created_at DESC` (newest first)
    - Pagination: 20 per page (configurable 10-100)
  - [ ] Response includes: `{id, text, options, difficulty, topic, created_at, generated_by}`
  - [ ] **TEST:** New generated question appears in review queue within 1 second

- [ ] **Review Decision Endpoint:**
  - [ ] Route: `POST /api/admin/review/{questionId}`
  - [ ] Input validation:
    ```typescript
    {
      decision: 'approve' | 'request_revision' | 'reject',
      notes: string  // Required if decision != 'approve'
    }
    ```
  - [ ] Updates in database:
    - `status`: 'pending' → 'approved'|'revision_requested'|'rejected'
    - `reputation_score`: 0 → 7|3|-1
    - `approved_by`: expert_user_id
    - `approved_at`: NOW()
    - `review_notes`: notes (if provided)
  - [ ] **TEST:** Approve sets reputation=7, status='approved'
  - [ ] **TEST:** Reject sets reputation=-1, status='rejected'

- [ ] **Reputation Scoring:**
  - [ ] AI-generated starts at: `reputation = 0` (pending review)
  - [ ] Expert approval: `reputation = 7/10` (released to students)
  - [ ] Request revision: `reputation = 3/10` (awaiting fixes)
  - [ ] Expert rejection: `reputation = -1/10` (disabled, never shown)
  - [ ] **TEST:** Only approved questions (reputation >= 7) shown to students

- [ ] **Student Visibility Rule:**
  - [ ] Questions shown to students ONLY if:
    - `source_type='real_exam'` OR
    - (`source_type='ai_generated'` AND `reputation >= 7` AND `status='approved'`)
  - [ ] **TEST:** Pending questions (reputation=0) NOT visible to students
  - [ ] **TEST:** Rejected questions (reputation=-1) NEVER visible to students

- [ ] **SLA Tracking:**
  - [ ] Track review time: `approved_at - created_at`
  - [ ] Target: Average review time <24 hours
  - [ ] Alert if any question pending >24 hours
  - [ ] Dashboard metrics: pending count, avg review time, approval rate
  - [ ] **TEST:** Alert triggers if question pending >1440 minutes

- [ ] **Notifications:**
  - [ ] Email expert when 5+ questions in review queue
  - [ ] Slack notification on review completion
  - [ ] Email developer if revision requested (include review notes)

**Technical Details:**

- **Effort:** 6 hours
- **Duration:** 1.5 days
- **Owner:** @dev (backend)
- **Depends on:** US-1B.1 (schema) COMPLETE + US-1B.3 (generation) producing data

**CodeRabbit Integration (Automated Quality Gate):**

- [ ] **Authorization Review:**
  - Verify only 'admin' or 'expert_reviewer' roles can access
  - Check @dev cannot bypass expert approval
  - Validate no permission escalation possible

- [ ] **Data Integrity Review:**
  - Verify reputation updates are immutable (no re-approval)
  - Check audit trail logged for all reviews
  - Validate no orphaned reviews possible

**Definition of Done:**

- [ ] Review queue endpoint returns pending questions
- [ ] Expert can approve/reject questions
- [ ] Reputation scores update correctly
- [ ] Only approved questions visible to students
- [ ] SLA alerts configured
- [ ] Notifications sent correctly
- [ ] 8+ tests passing (queue, approve, reject, visibility, SLA, alerts)
- [ ] Documentation: Review workflow, SLA policy, notification triggers

---

## US-1B.6: Corpus Isolation Testing

**🎯 Story Intent:** Verify corpus isolation is unbreakable. This test suite is your insurance policy against quality degradation. Must pass 100%.

**User Story:**
**As a** QA engineer
**I want** to verify that AI-generated questions never contaminate the RAG retrieval corpus
**So that** quality degradation through "fiction influencing fiction" is prevented

**Acceptance Criteria (TESTABLE & MEASURABLE):**

- [ ] **Unit Tests (Corpus Isolation):**
  - [ ] `test_rag_query_filters_by_source_type()` - WHERE clause enforced
  - [ ] `test_rag_query_filters_by_rag_eligible()` - rag_eligible=false excluded
  - [ ] `test_source_type_enum_validation()` - Invalid types rejected
  - [ ] `test_real_exam_questions_always_retrievable()` - Real questions never filtered
  - [ ] `test_ai_generated_never_in_rag_results()` - 100 test queries return zero ai_generated
  - [ ] **TEST:** Run 100 RAG queries, verify all results have `source_type='real_exam'`

- [ ] **Integration Tests (End-to-End Flow):**
  - [ ] Generate 20 questions via Claude endpoint
  - [ ] Verify all 20 have `source_type='ai_generated'`, `rag_eligible=false`
  - [ ] Run RAG retrieval 10 times
  - [ ] Verify ZERO ai_generated questions in any RAG results
  - [ ] Verify real exam questions still retrievable
  - [ ] **TEST:** After 20 generations, contamination check returns 0

- [ ] **Load Testing (Concurrency):**
  - [ ] 100 concurrent RAG retrieval requests
  - [ ] All requests complete successfully
  - [ ] All requests return only `source_type='real_exam'`
  - [ ] No race conditions possible
  - [ ] **TEST:** Load test passes 5+ times, zero failures

- [ ] **Contamination Automated Check:**
  - [ ] Daily cron job: `SELECT COUNT(*) FROM question_sources WHERE source_type='ai_generated' AND rag_eligible=true`
  - [ ] Expected result: always 0
  - [ ] If > 0: CRITICAL alert to Slack #alerts channel with:
    - Count of contaminated records
    - List of question_ids
    - Recommendation to rollback
  - [ ] **TEST:** Alert fires when contamination introduced (test then rollback)

- [ ] **Performance Benchmarks:**
  - [ ] FTS query latency: <100ms P95
  - [ ] RAG context generation: <500ms P95
  - [ ] Full generation (retrieve + Claude + storage): <3s P95
  - [ ] **TEST:** Load test 50 concurrent requests, measure P95 latencies

**Technical Details:**

- **Effort:** 6 hours
- **Duration:** 1.5 days
- **Owner:** @dev (testing) + @architect (architecture review)
- **Depends on:** US-1B.1-5 COMPLETE

**CodeRabbit Integration (Automated Quality Gate):**

- [ ] **Test Coverage Review:**
  - Verify 8+ unit tests cover corpus isolation
  - Verify integration tests cover end-to-end flow
  - Verify load tests cover concurrent access

- [ ] **Database Query Review:**
  - Verify WHERE clauses include both source_type AND rag_eligible filters
  - Verify indexes used correctly
  - Verify no N+1 query patterns

**Definition of Done:**

- [ ] 8+ unit tests passing (corpus isolation)
- [ ] 5+ integration tests passing (end-to-end)
- [ ] Load test: 100 concurrent, all <3s, zero contamination
- [ ] Daily contamination check configured
- [ ] Slack alert configured for contamination
- [ ] Performance benchmarks documented
- [ ] All tests can run via: `npm run test:rag-isolation`

---

## US-1B.7: pgvector Setup & Hybrid Search (Phase 2 - Week 4)

**🎯 Story Intent:** Upgrade RAG from FTS-only to hybrid semantic + keyword search. Deferral from MVP is intentional (MVP proves FTS sufficient). Phase 2 decision gate: if FTS latency acceptable AND quality good, pgvector is optional optimization.

**User Story:**
**As a** system architect
**I want** to upgrade RAG from FTS-only to hybrid search using pgvector embeddings
**So that** semantic relevance improves and retrieval latency optimizes

**Acceptance Criteria (TESTABLE & MEASURABLE):**

**⚠️ PHASE 2 ONLY - Week 4 (Post-MVP)**
**Gating:** MVP FTS performance must meet targets. If FTS latency <100ms AND quality >80% expert approval, pgvector is optional.

- [ ] **pgvector Extension Setup:**
  - [ ] pgvector extension enabled in Supabase PostgreSQL
  - [ ] Create `question_embeddings` table:
    ```sql
    CREATE TABLE question_embeddings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id UUID UNIQUE NOT NULL REFERENCES questions(question_id),
      embedding vector(1536),  -- OpenAI text-embedding-3-small
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    ```
  - [ ] **TEST:** Extension enabled, table created, no errors

- [ ] **Embeddings Batch Job:**
  - [ ] Use OpenAI Embeddings API: `text-embedding-3-small`
  - [ ] Process all 13,917 Constitutional Law questions
  - [ ] Batch size: 2000 questions per API call (respects rate limits)
  - [ ] Retry logic: Exponential backoff on rate limit (429)
  - [ ] Cost: ~$2.78 total (~$0.00002 per embedding)
  - [ ] Duration: 30-60 minutes total (expected)
  - [ ] Progress tracking: Log every 1000 embeddings
  - [ ] **TEST:** Batch job completes successfully, 13,917 embeddings stored

- [ ] **Vector Index Creation:**
  - [ ] HNSW index type (hierarchical navigable small world)
  - [ ] Parameters: `m=16, ef_construction=200`
  - [ ] Distance metric: `cosine` (0-1 similarity)
  - [ ] Index performance target: <150ms query for top-10
  - [ ] **TEST:** Index creation completes, query latency <150ms

- [ ] **Hybrid RAG Query Development:**
  - [ ] Retrieve Top-5 from FTS (BM25 ranking)
  - [ ] Retrieve Top-5 from pgvector (cosine similarity)
  - [ ] Merge results (remove duplicates, combine scores)
  - [ ] Scoring: `hybrid_score = (bm25_score * 0.5) + (cosine_similarity * 0.5)`
  - [ ] Return: Top-10 merged results by hybrid_score
  - [ ] Latency target: <300ms total query (FTS + vector search + merge)
  - [ ] **TEST:** Hybrid query returns 10 results in <300ms

- [ ] **A/B Test & Decision:**
  - [ ] Phase: Requires 48 hours of production data
  - [ ] Compare: FTS-only (MVP) vs. Hybrid (pgvector)
  - [ ] Expert review: Sample 50 generated questions each approach
  - [ ] Metrics:
    - Quality: expert approval rate (target >80%)
    - Speed: latency P95 comparison
    - Relevance: % top-5 results rated "relevant" by expert
  - [ ] Decision:
    - If quality ≥ FTS AND latency improved: **COMMIT** pgvector
    - If quality similar but latency worse: **ROLLBACK** to FTS
    - If quality improved: **COMMIT** pgvector immediately
  - [ ] **TEST:** A/B test completed, decision documented

- [ ] **Monitoring & Dashboards:**
  - [ ] Vector quality metric: Cosine similarity score distribution
  - [ ] Latency dashboards: FTS vs. Hybrid comparison
  - [ ] Embedding freshness: Days since last batch update
  - [ ] Alert: If query latency >500ms (indicates index issue)

**Technical Details:**

- **Effort:** 6 hours (Phase 2 only)
- **Duration:** 3-4 days Week 4 (after MVP validation)
- **Owner:** @dev (backend) + @data-architect (schema)
- **Depends on:** US-1B.1-6 COMPLETE + MVP performance validated

**CodeRabbit Integration (Automated Quality Gate):**

- [ ] **Performance Review:**
  - Verify HNSW index used in query plans
  - Validate hybrid scoring algorithm
  - Check embedding dimension matches API response (1536)

- [ ] **Batch Job Review:**
  - Verify rate limit handling
  - Check retry logic correct
  - Validate progress tracking complete

**Definition of Done:**

- [ ] pgvector extension enabled
- [ ] 13,917 embeddings computed and stored
- [ ] HNSW index created and optimized
- [ ] Hybrid query returns top-10 in <300ms
- [ ] A/B test completed with decision documented
- [ ] Monitoring dashboards live
- [ ] Decision: COMMIT pgvector or ROLLBACK to FTS-only
- [ ] If COMMIT: Documentation updated; if ROLLBACK: Cleanup complete

---

---

## Cross-Story Dependencies & Sequencing

**Critical Path (Must Complete in Order):**

```
US-1B.1 (Schema) [4h]
    ↓
US-1B.2 (FTS) [8h] + US-1B.3 (Claude) [8h] (parallel after 1B.1)
    ↓
US-1B.4 (Cache) [4h] + US-1B.5 (Review) [6h] (parallel after 1B.3)
    ↓
US-1B.6 (Testing) [6h] (all previous complete)
    ↓
US-1B.7 (pgvector) [6h] Phase 2 - Week 4 (after MVP validation)
```

**Blocking Matrix:**

| Story | Blocked By | Unblocks |
|-------|-----------|----------|
| US-1B.1 | None (starts immediately) | US-1B.2, US-1B.3, US-1B.5 |
| US-1B.2 | US-1B.1 complete | US-1B.3, US-1B.6 |
| US-1B.3 | US-1B.2 complete | US-1B.4, US-1B.5, US-1B.6 |
| US-1B.4 | US-1B.3 complete | None (parallel with others) |
| US-1B.5 | US-1B.1 complete | US-1B.6 |
| US-1B.6 | US-1B.1-5 complete | MVP readiness |
| US-1B.7 | US-1B.6 complete + MVP validation | Phase 2 launch |

---

## MVP Success Criteria (Exit Gate - End of Week 8)

**All of the following MUST pass for MVP to launch:**

- [ ] ✅ Expert approval rate: >80% (mandatory gate)
- [ ] ✅ Error rate: <5% (mandatory gate)
- [ ] ✅ Zero corpus contamination (mandatory gate - verified daily)
- [ ] ✅ Generation latency P95: <2-3 seconds
- [ ] ✅ FTS query latency: <100ms
- [ ] ✅ Cache hit rate: >50% (after 48h usage)
- [ ] ✅ Load test: 100 concurrent requests, all <3s
- [ ] ✅ 50+ beta users active
- [ ] ✅ System uptime: 99%+ (verified)
- [ ] ✅ Documentation complete

**If ANY mandatory gate fails:**
- [ ] MVP launch blocked
- [ ] Root cause analysis required
- [ ] Fix + retest before re-gating

---

---

## Key Risks & Mitigations

| Risk | Severity | Mitigation | Story |
| --- | --- | --- | --- |
| **LLM Hallucination** | CRITICAL | Expert review 100% + RAG grounding | US-1B.5 |
| **Corpus Contamination** | CRITICAL | source_type filtering + audit trigger | US-1B.1, US-1B.6 |
| **Claude API Timeout** | HIGH | Fallback to real questions + retry logic | US-1B.3 |
| **FTS Performance** | MEDIUM | Index monitoring + pgvector Phase 2 | US-1B.2, US-1B.7 |
| **Cache Poisoning** | MEDIUM | Response validation before caching | US-1B.4 |
| **Rate Limit Bypass** | LOW | Rate limiter enforced at endpoint | US-1B.3 |

---

## Environment Variables Required

```bash
# Claude API
CLAUDE_API_KEY=sk-proj-xxx

# Redis Cache
REDIS_URL=https://xxx.upstash.io
REDIS_TOKEN=xxx

# Database (Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db
DB_PRIVATE_URL=postgresql://private-host/db  # For pgvector batch jobs

# Monitoring
DATADOG_API_KEY=xxx
DATADOG_APP_KEY=xxx

# OpenAI (Phase 2 pgvector embeddings only)
OPENAI_API_KEY=sk-proj-xxx
```

---

## Testing Strategy Summary

**Unit Tests:** 8+ tests per story (corpus isolation, validation, error handling)

**Integration Tests:** End-to-end flows (generate → store → retrieve → review → approve)

**Load Tests:** 100 concurrent requests across all endpoints

**Performance Tests:** Latency P95 for all operations, memory usage under load

**Security Tests:** SQL injection, prompt injection, rate limiting bypass attempts

---

## Monitoring & Observability

**Critical Metrics (Dashboard Required):**

- Generation latency (P50, P95, P99)
- Cache hit rate (daily average)
- Expert approval rate (cumulative %)
- Error rate (by type: API errors, validation errors, etc.)
- Corpus contamination check (daily, alert if >0)
- API spend (daily, monthly)
- System uptime (rolling 30-day %)

**Alerts (Slack Notifications):**

- Corpus contamination > 0 → #alerts CRITICAL
- Expert approval < 75% → #alerts HIGH
- Generation latency > 3s (P95) → #alerts MEDIUM
- Cache hit < 60% → #alerts LOW
- API spend > daily threshold → #alerts INFO

---

## Document Control

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | Feb 1, 2026 | @sm (River) | **REFINED:** Stories US-1B.1-7 with crystal-clear acceptance criteria, CodeRabbit integration sections, dependencies matrix, and MVP exit gates |

**Refinements Applied:**

✅ **Acceptance Criteria:** All criteria now testable & measurable (no vague requirements)

✅ **CodeRabbit Integration:** Automated quality gates defined for each story

✅ **Dependencies:** Clear blocking matrix showing story sequencing

✅ **MVP Exit Gates:** 3 mandatory gates (approval rate >80%, error rate <5%, zero contamination)

✅ **Technical Clarity:** Exact SQL, TypeScript signatures, API contracts specified

✅ **Risk Mitigations:** All identified risks mapped to stories

---

## Story Readiness Checklist for @dev

Before starting implementation:

- [ ] Read entire stories document (this file)
- [ ] Understand corpus isolation is non-negotiable (every RAG query must filter)
- [ ] Review database schema requirements (question_sources table)
- [ ] Review API endpoints (POST /api/questions/generate, GET /api/admin/review-queue)
- [ ] Review acceptance criteria for YOUR assigned story
- [ ] Review dependencies (what story must complete before yours)
- [ ] Review CodeRabbit quality gates (automated checks you'll encounter)
- [ ] Clarify any ambiguities with @sm (River) or @architect (Aria)

---

**Created:** Feb 1, 2026
**Refined by:** @sm (River) - Scrum Master
**Approved by:** @pm (Morgan), @architect (Aria), @analyst (Atlas)
**Status:** ✅ READY FOR SPRINT 7-8 IMPLEMENTATION
**Next:** Begin US-1B.1 (Dual-Corpus Schema) on Monday Week 7
