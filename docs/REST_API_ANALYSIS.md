# 🏛️ REST API Architecture Analysis

The API.md defines a well-structured REST API. Here's the comprehensive architectural assessment:

## 📋 API Structure Overview

**14 Endpoints Organized in 5 Resource Groups:**

**Questions (5 endpoints):**

- `POST /questions/generate` - Generate questions
- `POST /questions/{id}/submit` - Submit answer
- `GET /questions/{id}` - Get single question
- `GET /questions` - List & search questions
- `POST /questions/{id}/feedback` - Report problem

**Exams (4 endpoints):**

- `POST /exams` - Create exam
- `POST /exams/{id}/attempts` - Start attempt
- `POST /exams/{attemptId}/answers` - Submit answer
- `PUT /exams/{attemptId}/complete` - Finish exam

**Admin (4 endpoints):**

- `POST /admin/import/csv` - Import question bank
- `GET /admin/review-queue` - Get feedback queue
- `POST /admin/reviews` - Expert review decision
- `GET /admin/dashboard` - Admin statistics

### ✅ Architectural Strengths

**1. Clear Authentication Model (JWT via Supabase):**

`All endpoints require Bearer token from Supabase auth
Token obtained from: supabase.auth.getSession()
No API keys needed—leverage Supabase's JWT + RLS`

**Why This Works:**

- Stateless (distributed deployment ready)
- Integrates with Supabase RLS policies
- User identity available in every request
- Scales without session store

**2. Granular Role-Based Access Control (RBAC):**

`POST /questions/generate       → All authenticated users
POST /exams                    → role: educator+
POST /admin/import/csv         → role: admin
POST /admin/reviews            → role: reviewer+`

Good separation of concerns without explicit role checks in endpoint descriptions.

**3. Intelligent Rate Limiting by Endpoint:**

`POST /questions/generate       10 req/min  (most expensive)
POST /questions/[id]/submit    60 req/min  (practice mode)
POST /questions/feedback       5 req/min   (prevents spam)
POST /import/csv              1 req/min   (long-running)
POST /exams                   20 req/min`

**Rationale:** Aligns with operation cost (AI generation most expensive, practice submission cheap)

**Response Headers:**

`X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1706710800`

Client can see when they'll be unblocked.

**4. Consistent Response Format:**
All endpoints return JSON with predictable structure:

`{
  "data": { /* or top-level key */ },
  "stats": { /* metadata */ },
  "meta": { /* pagination, if applicable */ }
}`

**5. Comprehensive Error Handling:**

`{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable message",
    "details": { "field": "domain", "received": null }
  }
}`

**Codes Defined:** 7 standard codes (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, RATE_LIMITED, DATABASE_ERROR, INTERNAL_ERROR)

**6. Request/Response Mapping to Database:**

**GET /questions/generate → questions table:**

`Request:  domain, subject, topics, difficulty, count, preferReal
→ Query questions table (with FTS, filters, ordering)
→ If insufficient: trigger AI generation via Claude
→ Response: populated questions + stats`

**POST /questions/{id}/submit → user_question_history + question_reputation:**

`Request: selectedAnswer, responseTimeMs, sessionId, context
→ INSERT user_question_history (immutable record)
→ Trigger: update_reputation_on_attempt (auto-recalc)
→ Response: isCorrect, commentary, stats`

**POST /admin/reviews → question_reviews + question_reputation:**

`Request: questionId, decision, notes
→ INSERT question_reviews (approval audit trail)
→ Trigger: update_reputation_on_review (score adjustment)
→ Response: before/after reputation change`

**7. Exam Flow Consistency:**

`POST /exams/{id}/attempts     → INSERT user_exam_attempts (start)
POST /exams/{attemptId}/answers → INSERT user_exam_answers (record each response)
PUT /exams/{attemptId}/complete → Trigger: calculate_exam_results (finalize)`

Follows write-once pattern, immutable history.

### 🔍 API Design Patterns

**Pattern 1: Resource Hierarchy:**

`/exams/{id}/attempts/{attemptId}/answers`

Nested resources show containment relationship. Good for clarity.

**Pattern 2: Action-Oriented Endpoints (Mix of RESTful + RPC):**

`POST /questions/generate     ← RPC-style (action verb)
POST /questions/{id}/submit  ← RPC-style (action verb)
POST /exams/{id}/attempts    ← RESTful POST (creates sub-resource)
PUT /exams/{attemptId}/complete ← RPC-style (state transition)`

**Assessment:** Pragmatic blend. Strict REST would be:

- `POST /questions/generate` → `GET /questions?generate=true` (less clear)
- `POST /questions/{id}/submit` → PUT /questions/{id} with submission data (confusing)

Using `/submit` and `/complete` for clarity over pure REST.

**Pattern 3: List Pagination:**

`GET /api/questions?domain=constitucional&limit=20&offset=0
Response:
{
  "questions": [...],
  "total": 1234,
  "page": 0,
  "pageSize": 20,
  "hasMore": true
}`

Supports both offset-based and cursor-based pagination (via `hasMore` flag).

**Pattern 4: Full-Text Search Integration:**

`GET /api/questions?search=liberdade+de+expressao`

Leverages PostgreSQL FTS (search_vector) from database schema. Good integration.

**Pattern 5: Stats Alongside Core Response:**

`{
  "questions": [...],
  "stats": {
    "total": 10,
    "realExam": 7,
    "aiGenerated": 3
  }
}`

API returns breakdown (real vs AI-generated) for transparency. Aligns with reputation system.

### ⚠️ Architectural Gaps & Recommendations

**Gap 1: Missing Taxonomy/Taxonomy Endpoints:**
Current API doesn't expose taxonomy CRUD:

`Missing:
GET /api/domains
GET /api/domains/{id}/subjects
GET /api/subjects/{id}/topics`

**Impact:** Frontend must hardcode domains/subjects or fetch separately
**Recommendation:** Add these GET endpoints for UI discovery

**Gap 2: No Bulk Operations:**

`Missing:
POST /api/questions/bulk-submit (for rapid-fire practice)
POST /api/exams/bulk-create (for educators batch-creating exams)`

**Impact:** 10 questions = 10 separate API calls to submit
**Recommendation:** Add batch endpoints with transactional guarantees

**Gap 3: Search Filtering Inconsistency:**

`GET /api/questions?domain=constitucional (by slug)
POST /api/questions/generate with domain: "constitucional" (by slug)`

But:

`POST /api/exams expects questionIds: ["uuid", "uuid"] (by UUID)
POST /api/admin/reviews expects questionId: "uuid" (by UUID)`

**Assessment:** Mix of slugs and UUIDs. Better to standardize on UUIDs internally, slugs for human URLs.

**Gap 4: Missing Websocket/Real-Time Events:**
Document mentions "Webhooks (Future)" but no subscription model for:

- Exam results delivered in real-time
- Question reputation updates streamed
- Feedback queue notifications

**Gap 5: No Soft Deletion Handling:**
If a question is deleted, what happens to:

- User exam attempts referencing it?
- user_question_history records?

**Recommendation:** Document soft delete behavior (status='deleted' instead of hard delete).

**Gap 6: Missing Sorting/Ordering Parameters:**

`GET /api/questions

- No ?sort=difficulty:asc or ?sort=-created_at
- No defined ordering (alphabetic? by reputation?)`

**Impact:** Results may be unpredictable
**Recommendation:** Add `sort` parameter: `?sort=difficulty,reputation:desc`

**Gap 7: No Cache Headers:**

`Missing:
Cache-Control: max-age=3600
ETag: "abc123"
Last-Modified: 2026-01-31T10:00:00Z`

**Impact:** Every request hits the database (no browser/CDN caching)
**Recommendation:** Add cache directives for GET endpoints

### 📊 API Performance Characteristics

**Request/Response Sizes:**

`GET /questions (50 results):
  Request: ~200 bytes
  Response: ~100KB (questions + options + commentary)

POST /questions/generate (10 questions):
  Request: ~150 bytes
  Response: ~75KB + network latency for AI generation

POST /admin/import/csv:
  Request: 50MB CSV file
  Response: ~500 bytes (import stats)`

**Latency SLAs (from Architecture doc):**

| Endpoint | Target | Current Gap |
| --- | --- | --- |
| GET /questions/{id} | < 100ms | ✅ (index lookup) |
| POST /questions/generate | < 30s | ⚠️ (depends on Claude API) |
| GET /questions + filtering | < 200ms | ✅ (composite index) |
| POST /admin/import/csv | < 1 min | ⚠️ (depends on file size) |

**Rate Limit Implications:**

`10 gen/min = 6 seconds per generation
60 submit/min = 1 second per attempt
5 feedback/min = 12 seconds per report`

Conservative but necessary for AI cost control.

### 🔐 Security Assessment

**Strengths:**
✅ JWT authentication required (no public endpoints)
✅ Role-based access control (educator, reviewer, admin)
✅ Rate limiting prevents abuse
✅ Input validation via request schema
✅ SQL injection prevented (Supabase parameterized queries)

**Considerations:**
⚠️ No explicit CORS configuration mentioned
⚠️ No API versioning (/api/v1 missing)
⚠️ No request signing for sensitive operations (import CSV)
⚠️ No audit logging for admin operations mentioned

**Recommendations:**

`1. Add CORS policy: Allow only yourapp.com origins
2. Version API: /api/v1/questions (v2 compatibility)
3. Require X-Signature header for CSV imports
4. Log all admin operations to audit_logs table`

### 🎯 Request-Response Mapping Examples

**Example 1: Generate Questions Flow:**

Request:

`POST /api/questions/generate
{
  "domain": "constitucional",
  "subject": "direitos-fundamentais",
  "difficulty": "medium",
  "count": 5,
  "preferReal": true
}`

Backend Processing:

    ```sql
    -- Backend Logic
    1. SELECT * FROM questions
       WHERE domain_id = (SELECT id FROM domains WHERE slug='constitucional')
       AND subject_id = (SELECT id FROM subjects WHERE slug='direitos-fundamentais')
       AND difficulty = 'medium'
       AND status = 'active'
       AND reputation >= 5
       LIMIT 5;  -- try to get 5 real questions
    
    2. If count(results) < 5:
       -- Trigger AI generation via Claude API
       -- Use RAG: include similar questions as context
       -- INSERT INTO questions (new AI-generated)
    
    3. SELECT ... with reputation JOIN
    4. Return questions + stats breakdown
    
    ```
    

Response:

`{
  "questions": [
    {
      "id": "uuid-1",
      "questionText": "A Constituição Federal...",
      "difficulty": "medium",
      "sourceType": "real_exam",  // transparency!
      "reputation": { "currentScore": 10 }
    },
    // ... more questions
  ],
  "stats": {
    "total": 5,
    "realExam": 3,
    "aiGenerated": 2
  }
}`

**Example 2: Submit Answer Flow:**

Request:

`POST /api/questions/{id}/submit
{
  "selectedAnswer": "a",
  "responseTimeMs": 5230,
  "sessionId": "session-123",
  "context": "practice"
}`

Backend Processing:

    ```sql
    -- Backend Logic
    1. SELECT * FROM questions WHERE id = '{id}';  -- get question
    
    2. INSERT INTO user_question_history (
         user_id, question_id, selected_answer, is_correct, response_time_ms, session_id, context
       ) VALUES (...);  -- immutable record
    
    3. TRIGGER: update_reputation_on_attempt
       -- Increments total_attempts
       -- Increments correct_attempts (if is_correct)
       -- Recalculates empirical_difficulty
    
    4. SELECT stats FROM question_reputation;  -- return updated stats
    
    5. SELECT topic accuracy stats...
    
    ```
    

Response:

`{
  "isCorrect": true,
  "correctAnswer": "a",
  "commentary": "A resposta correta é...",
  "stats": {
    "topicAccuracy": 0.62,
    "totalAttempts": 15,
    "correctAttempts": 9
  }
}`

### 🏗️ API Readiness Assessment

**Overall Grade: B+:**

**Strengths:**

- ✅ Well-organized by resource
- ✅ Clear authentication & RBAC
- ✅ Intelligent rate limiting
- ✅ Good error handling
- ✅ Comprehensive endpoint docs
- ✅ cURL examples provided

**Gaps:**

- ⚠️ No taxonomy endpoints (GET /domains, etc.)
- ⚠️ No bulk operations
- ⚠️ Missing cache headers
- ⚠️ No API versioning
- ⚠️ Inconsistent sorting/ordering
- ⚠️ Soft delete behavior undefined

**For Implementation Priority:**

**Sprint 1 (MVP):**

1. Implement 14 endpoints as documented
2. Add RBAC checks in middleware
3. Implement rate limiting (Upstash Redis)
4. Add request validation (Zod)

**Sprint 2:**

1. Add GET /domains, /subjects, /topics endpoints
2. Add cache headers (Browser + CDN)
3. Add API versioning (/api/v1/...)
4. Document soft delete behavior

**Sprint 3:**

1. Add bulk operations endpoints
2. Add Webhook support
3. Add audit logging for admin
4. Add request signing for sensitive ops

### 📐 Endpoint Implementation Order

**Phase 1: Core Questions (days 1-3):**

1. `POST /questions/generate`
2. `POST /questions/{id}/submit`
3. `GET /questions/{id}`
4. `GET /questions` (search + filter)

**Phase 2: Feedback & Quality (days 4-5):**
5. `POST /questions/{id}/feedback`

**Phase 3: Exams (days 6-8):**
6. `POST /exams`
7. `POST /exams/{id}/attempts`
8. `POST /exams/{attemptId}/answers`
9. `PUT /exams/{attemptId}/complete`

**Phase 4: Admin & Taxonomy (days 9-10):**
10. `POST /admin/import/csv`
11. `GET /admin/review-queue`
12. `POST /admin/reviews`
13. `GET /admin/dashboard`
14. `GET /domains`, `GET /subjects`, `GET /topics` (NEW)
