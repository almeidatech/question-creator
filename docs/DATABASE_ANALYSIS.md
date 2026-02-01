# 🏛️ Database Architecture Analysis

## The BANCO_DE_DADOS_DIAGRAMA.md reveals a sophisticated, well-structured database design. Here's the architectural assessment

### 📊 Database Shape Overview

**15 Tables Organized in 6 Logical Domains:**

1. **Authentication** (1 table) - users
2. **Taxonomy** (4 tables) - domains, subjects, topics, question_bank_versions
3. **Questions** (3 tables) - questions, question_topics, question_reputation
4. **Quality & Feedback** (2 tables) - question_feedback, question_reviews
5. **History & Subscriptions** (2 tables) - user_question_history, subscriptions
6. **Exams** (4 tables) - exams, exam_questions, user_exam_attempts, user_exam_answers

### ✅ Architectural Strengths

**1. Hierarchical Taxonomy Design (Smart Denormalization):**

`DOMAINS (Direito Constitucional)
  ↓ 1:N
SUBJECTS (Direitos Fundamentais)
  ↓ 1:N
TOPICS (Liberdade de Expressão)
  ↓ N:M bridge
QUESTION_TOPICS
  ↑ N:M
QUESTIONS`

**Why This Works:**

- Supports recursive filtering (domain → subjects → topics → questions)
- Display order preserved at each level for UI ordering
- Keywords field on TOPICS enables semantic matching for AI generation

**2. Question Bank Versioning (Excellent for Governance):**

`QUESTION_BANK_VERSIONS (tracks CSV imports)
  ↓ 1:N
QUESTIONS (imported questions)`

**Value:**

- Audit trail of all imports
- Enables rollback to previous versions
- Status tracking: 'active', 'deprecated', 'rollback'
- Metadata JSONB captures import statistics
- Single responsibility: one version per import batch

**3. Reputation System as Trust Layer:**

`QUESTION_REPUTATION (1:1 with questions)
├─ current_score (0-10)
├─ total_attempts (empirical validation)
├─ correct_attempts (success rate)
├─ problem_reports (feedback count)
├─ expert_validations (review count)
├─ status (active, under_review, disabled)
└─ empirical_difficulty (calculated)`

**Decoupled from questions table:** Allows independent updates without touching question content.

**4. Feedback & Review Audit Trail:**

- `question_feedback`: user-reported problems with status workflow
- `question_reviews`: expert validation with decision history
- Both tables preserve full audit trail (submitted_at, reviewed_at, resolved_at)

**5. N:M with Relevance Scoring:**

`QUESTION_TOPICS (N:M bridge)
├─ question_id (PK)
├─ topic_id (PK)
└─ relevance_score (0.0-1.0) ← semantic confidence!`

Allows questions to belong to multiple topics with confidence levels.

**6. Exam Structure Supports Ordering & Grading:**

`EXAMS (course definition)
  ↓ 1:N
EXAM_QUESTIONS (ordered, points-weighted)
  ↑ references
QUESTIONS

USER_EXAM_ATTEMPTS (test session)
  ↓ 1:N
USER_EXAM_ANSWERS (individual responses)`

- Display order enforced at EXAM_QUESTIONS level
- Points per question enables weighted scoring
- UNIQUE constraints prevent duplicates

### 🔍 Critical Database Patterns

**Pattern 1: Append-Only History:**

`USER_QUESTION_HISTORY (immutable audit log)
├─ user_id + question_id + timestamp = unique attempt
├─ is_correct (boolean)
├─ response_time_ms (metric)
└─ session_id (groups related questions)`

Good for analytics and prevents score manipulation.

**Pattern 2: Trigger-Driven Reputation Updates:**
Five triggers automate reputation calculations:

1. `create_reputation_for_question` - on INSERT questions
2. `update_reputation_on_attempt` - on INSERT user_question_history
3. `flag_question_on_feedback` - on INSERT question_feedback (3+ reports = auto-flag)
4. `update_reputation_on_review`- on INSERT question_reviews
5. `calculate_exam_results`- on UPDATE user_exam_attempts

**Benefit:** Business logic lives in database, no race conditions.

**Pattern 3: JSON for Flexibility (JSONB Fields):**

- `questions.generation_metadata` - RAG context, temperature, model
- `questions.metadata` - other stats
- `exams.metadata` - custom fields
- `question_reviews.suggested_changes` - revision guidance

**Benefit:** Extensible without schema migration.

**Pattern 4: Composite Indexes for Query Performance:**

    ```sql
    -- Frequent filters
    idx_questions_domain_difficulty (domain_id, difficulty)
    idx_history_user_date (user_id, attempted_at DESC)
    
    -- Rankings
    idx_reputation_score (current_score DESC, last_updated DESC)
    
    -- Conditional indexes (saves space)
    idx_reputation_status (status) WHERE status != 'active'
    idx_feedback_pending (status, submitted_at)
      WHERE status IN ('pending', 'under_review')
    
    ```
    

### ⚠️ Architectural Considerations

**1. Full-Text Search Implementation:**

`search_vector (tsvector) using GIN`

- Portuguese language support required (`portuguese` configuration)
- Needs migration to set up: `CREATE TEXT SEARCH CONFIGURATION portuguese (...)`
- **Risk:** If not configured, search_vector won't work
- **Mitigation:** Document in setup that PostgreSQL extensions must be enabled

**2. Domain/Subject/Topic Hierarchy Denormalization:**
Currently each level has `display_order` + UNIQUE constraints:

`UNIQUE(domain_id, slug)
UNIQUE(subject_id, slug)`

This is correct, but:

- **Risk:**Moving a topic between subjects requires updates in QUESTION_TOPICS
- **Mitigation:**API should enforce this constraint (not manual SQL)

**3. Exam Question Ordering with Weighted Points:**

`UNIQUE(exam_id, question_id)    -- no duplicates
UNIQUE(exam_id, display_order)  -- order preserved`

Good, but:

- **Risk:**If display_order is non-sequential (0, 1, 3, 5), UI might break
- **Mitigation:**Use VIEW or API to re-normalize on read

**4. Reputation Score Mutations:**
Current rules:

- Real exam: 10 (locked)
- AI-generated: 0 → 4 (after 20 attempts) → 7 (after expert approval) → 10
- User-submitted: 5

**Question:** What prevents a question from being used if reputation < 5?

- Current design: No filtering at retrieval layer
- **Recommendation:**Add `status` check in WHERE clauses (RLS policy)

**5. Row-Level Security (RLS) Not Shown in Schema:**
The document mentions RLS policies exist but doesn't detail them:

    ```
    -- Missing from schema:
    QUESTIONS: Users can only see active/approved questions
    USER_QUESTION_HISTORY: Users can only see their own history
    QUESTION_REVIEWS: Only reviewers can see pending reviews
    
    ```
    

**Recommendation:** Document RLS policies separately or in migration files

### 🚀 Performance Characteristics

**Query Performance Targets (from doc):**

| Query | Target | Index Used |
| --- | --- | --- |
| Full-text search (13k questions) | < 200ms | search_vector (GIN) |
| Dashboard stats | < 100ms | (user_id, attempted_at) |
| Reputation ranking | < 50ms | (current_score DESC) |
| Feedback queue | < 100ms | (status, submitted_at) |

**Scalability Assumptions:**

- 13.9k questions in V1
- Grows to 63k+ in V2
- Full-text search index (GIN) handles this well
- No sharding needed unless > 1M questions

**Potential Bottlenecks:**

1. **QUESTION_TOPICS joins** - If questions have 5+ topics each:
    - SELECT questions + N:M join = N+1 risk
    - **Mitigation:** Use JOIN or materialized view
2. **Exam attempt scoring calculation** - Trigger complexity:
    - Counts correct answers across N exam answers
    - **Mitigation:** Use stored procedure or temporary table

### 🔗 Data Flow Architecture

**6 Critical Flows:**

**Flow 1: CSV Import (Batch):**

`CSV → Parser → Validate → Dedup → INSERT questions
  → INSERT question_topics (semantic mapping)
  → trigger: create_reputation (initial score)
  → UPDATE question_bank_versions`

**Volume:** 50k questions/hour (from performance section)

**Flow 2: AI Generation (Streaming):**

`User Request → RAG: SELECT * FROM questions (similarity search)
  → Claude API (generate with context)
  → INSERT questions (new AI-generated)
  → INSERT question_topics (semantic mapping)
  → trigger: create_reputation (score=0)`

**Latency:** < 30s P95 (from architecture doc)

**Flow 3: User Attempts (Real-time):**

`User submits answer → INSERT user_question_history
  → trigger: update_reputation (increment counters, recalc difficulty)
  → Return result + reputation badge`

**Latency:** < 200ms (immediate feedback needed)

**Flow 4: Problem Reports (Async):**

`User reports → INSERT question_feedback
  → trigger: flag_question_on_feedback (count problems)
  → IF >= 3 problems: UPDATE question_reputation (status=flagged)`

**SLA:** < 24h expert review for priority questions

**Flow 5: Expert Review (Admin):**

`Reviewer decision → INSERT question_reviews
  → trigger: update_reputation_on_review
  → UPDATE question_reputation (score adjustment)`

**Decision rules:** Approve +2, Reject 0, Revise → under_review

**Flow 6: Exam Administration:**

`Educator creates → INSERT exams + INSERT exam_questions (ordered)
User takes → INSERT user_exam_attempts + INSERT user_exam_answers
  → trigger: calculate_exam_results (compute score, pass/fail)`

### 💡 Recommendations for Implementation

**Priority 1: Define RLS Policies:**
Document who can see what:

    ```sql
    -- Suggested policies
    QUESTIONS:
      - Students: only status='active' AND reputation>=5
      - Reviewers: only status='under_review'
      - Admins: all
    
    USER_QUESTION_HISTORY:
      - Students: own history only
      - Educators: their students' history
      - Admins: all
    
    ```
    

**Priority 2: Create Database Views for Complex Queries:**

    ```sql
    -- Example: question ranking by reputation
    CREATE VIEW v_questions_ranked AS
    SELECT
      q.*,
      qr.current_score,
      qr.empirical_difficulty,
      COUNT(qt.topic_id) as topic_count
    FROM questions q
    JOIN question_reputation qr ON q.id = qr.question_id
    LEFT JOIN question_topics qt ON q.id = qt.question_id
    WHERE qr.status = 'active'
    GROUP BY q.id, qr.id
    ORDER BY qr.current_score DESC;
    
    ```
    

**Priority 3: Migration Strategy:**
Order matters:

1. Create domains, subjects, topics (taxonomy)
2. Create QUESTION_BANK_VERSIONS
3. Create questions with search_vector setup
4. Create question_topics (N:M)
5. Create triggers
6. Create indexes (last!)
7. Apply RLS policies

**Priority 4: Seed Data:**
Document initial data:

- 1 domain (Direito Constitucional)
- ~15 subjects
- ~50 topics
- 13.9k real exam questions
- 0 AI-generated (generated on-demand)

### 🎯 Architectural Assessment

**Overall Grade: A-:**

**Strengths:**

- ✅ Well-normalized design (3NF)
- ✅ Hierarchical taxonomy with flexibility
- ✅ Versioned question imports
- ✅ Comprehensive audit trails
- ✅ Trigger-driven business logic
- ✅ Proper indexing strategy
- ✅ N:M with relevance scoring

**Gaps:**

- ⚠️ RLS policies not documented in schema
- ⚠️ Full-text search configuration not in migrations
- ⚠️ No materialized views for complex joins
- ⚠️ Reputation rules hard-coded (could be in config)

**For SQL Migrations:**
This schema is ready for Supabase migrations. Create:

1. `001_init_schema.sql` - All table definitions
2. `002_create_indexes.sql` - All indexes (order matters)
3. `003_create_triggers.sql` - All trigger functions
4. `004_enable_rls.sql` - RLS policies
5. `005_create_views.sql` - Any helper views
