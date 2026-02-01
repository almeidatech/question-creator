-- ============================================================================
-- Question Creator MVP - Index Creation (Supabase Optimized v2.0)
-- ============================================================================
-- This file must run AFTER 001_init_schema.sql
-- Based on: BANCO_DE_DADOS_DIAGRAMA.md
-- Performance targets: FTS <200ms, Dashboard <100ms, Reputation <50ms
-- ============================================================================

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- ============================================================================
-- TAXONOMY INDEXES (Domains, Subjects, Topics)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_domains_slug ON domains(slug);
CREATE INDEX IF NOT EXISTS idx_domains_is_active ON domains(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_subjects_domain_id ON subjects(domain_id);
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects(slug);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON subjects(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_topics_is_active ON topics(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_topics_keywords ON topics USING GIN(to_tsvector('portuguese', keywords));

-- ============================================================================
-- QUESTION_BANK_VERSIONS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_qbv_version_number ON question_bank_versions(version_number DESC);
CREATE INDEX IF NOT EXISTS idx_qbv_status ON question_bank_versions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_qbv_import_date ON question_bank_versions(import_date DESC);

-- ============================================================================
-- QUESTIONS TABLE INDEXES (Core - Most Important)
-- ============================================================================

-- Basic lookups
CREATE INDEX IF NOT EXISTS idx_questions_qbv_id ON questions(question_bank_version_id);
CREATE INDEX IF NOT EXISTS idx_questions_domain_id ON questions(domain_id);
CREATE INDEX IF NOT EXISTS idx_questions_primary_topic ON questions(primary_topic_id);

-- Filtering
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_source_type ON questions(source_type);
CREATE INDEX IF NOT EXISTS idx_questions_exam_board ON questions(exam_board);
CREATE INDEX IF NOT EXISTS idx_questions_exam_year ON questions(exam_year DESC);

-- Lifecycle
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);

-- Composite indexes for common filters (Most used)
CREATE INDEX IF NOT EXISTS idx_questions_domain_difficulty
  ON questions(domain_id, difficulty)
  WHERE source_type = 'real_exam';

CREATE INDEX IF NOT EXISTS idx_questions_source_difficulty
  ON questions(source_type, difficulty);

-- Full-text search in Portuguese (Critical for performance)
-- Target: <200ms for 13.9k questions
CREATE INDEX IF NOT EXISTS idx_questions_search_vector
  ON questions USING GIN(search_vector);

-- ============================================================================
-- QUESTION_SOURCES INDEXES (Dual-Corpus RAG - CRITICAL)
-- ============================================================================
-- CRITICAL FOR RAG PERFORMANCE: These indexes enforce source type filtering

-- Composite index for RAG queries: MUST include source_type AND rag_eligible
-- Target: <100ms for 13.9k questions with WHERE clause filtering
CREATE INDEX IF NOT EXISTS idx_question_sources_rag_filtering
  ON question_sources(source_type, rag_eligible)
  WHERE source_type = 'real_exam';

-- Quick question_id lookups
CREATE INDEX IF NOT EXISTS idx_question_sources_question_id
  ON question_sources(question_id);

-- Approval workflow tracking
CREATE INDEX IF NOT EXISTS idx_question_sources_approval_status
  ON question_sources(approved_at, approved_by)
  WHERE approved_at IS NULL;

-- ============================================================================
-- QUESTION_TOPICS INDEXES (N:M Relationship)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_question_topics_topic_id ON question_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_relevance
  ON question_topics(relevance_score DESC)
  WHERE relevance_score >= 0.5;

-- ============================================================================
-- QUESTION_REPUTATION INDEXES (Critical for ranking/filtering)
-- ============================================================================

-- Score ranking (most important)
CREATE INDEX IF NOT EXISTS idx_reputation_score_desc
  ON question_reputation(current_score DESC, last_updated DESC)
  WHERE status = 'active';

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_reputation_status
  ON question_reputation(status)
  WHERE status IN ('under_review', 'disabled');

-- Problem detection
CREATE INDEX IF NOT EXISTS idx_reputation_problem_reports
  ON question_reputation(problem_reports DESC)
  WHERE problem_reports >= 3;

CREATE INDEX IF NOT EXISTS idx_reputation_empirical_difficulty
  ON question_reputation(empirical_difficulty);

-- ============================================================================
-- USER_QUESTION_HISTORY INDEXES (Analytics & Dashboard)
-- ============================================================================

-- User-specific queries (RLS)
CREATE INDEX IF NOT EXISTS idx_history_user_id ON user_question_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_question_id ON user_question_history(question_id);

-- Dashboard analytics (Most used)
CREATE INDEX IF NOT EXISTS idx_history_user_date
  ON user_question_history(user_id, attempted_at DESC);

-- Stats calculation
CREATE INDEX IF NOT EXISTS idx_history_question_correct
  ON user_question_history(question_id, is_correct);

-- Session grouping
CREATE INDEX IF NOT EXISTS idx_history_session_id
  ON user_question_history(session_id)
  WHERE session_id IS NOT NULL;

-- Context filtering
CREATE INDEX IF NOT EXISTS idx_history_context
  ON user_question_history(context);

-- Performance tracking
CREATE INDEX IF NOT EXISTS idx_history_response_time
  ON user_question_history(response_time_ms)
  WHERE response_time_ms IS NOT NULL;

-- ============================================================================
-- QUESTION_FEEDBACK INDEXES (Review Queue)
-- ============================================================================

-- Pending feedback (high priority)
CREATE INDEX IF NOT EXISTS idx_feedback_status
  ON question_feedback(status)
  WHERE status IN ('pending', 'under_review');

CREATE INDEX IF NOT EXISTS idx_feedback_question_id ON question_feedback(question_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON question_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewer_id ON question_feedback(reviewer_id);

-- Priority filtering
CREATE INDEX IF NOT EXISTS idx_feedback_is_priority
  ON question_feedback(is_priority DESC, submitted_at DESC)
  WHERE is_priority = TRUE;

CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at
  ON question_feedback(submitted_at DESC);

-- ============================================================================
-- QUESTION_REVIEWS INDEXES (Expert Validation)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reviews_question_id ON question_reviews(question_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON question_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_decision ON question_reviews(decision);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_at ON question_reviews(reviewed_at DESC);

-- ============================================================================
-- EXAMS TABLE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exams_creator_id ON exams(creator_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status) WHERE status != 'archived';
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exams_published_at ON exams(published_at DESC) WHERE published_at IS NOT NULL;

-- ============================================================================
-- EXAM_QUESTIONS INDEXES (Ordering)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_display_order
  ON exam_questions(exam_id, display_order ASC);

-- ============================================================================
-- USER_EXAM_ATTEMPTS INDEXES (Exam Sessions)
-- ============================================================================

-- Attempt tracking
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON user_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id ON user_exam_attempts(exam_id);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_attempts_user_date
  ON user_exam_attempts(user_id, completed_at DESC)
  WHERE is_completed = TRUE;

CREATE INDEX IF NOT EXISTS idx_attempts_exam_date
  ON user_exam_attempts(exam_id, completed_at DESC);

-- Leaderboard (top scores)
CREATE INDEX IF NOT EXISTS idx_attempts_score_exam
  ON user_exam_attempts(exam_id, score_percentage DESC, completed_at DESC)
  WHERE is_completed = TRUE AND passed = TRUE;

-- Time analysis
CREATE INDEX IF NOT EXISTS idx_attempts_time_spent
  ON user_exam_attempts(time_spent_seconds)
  WHERE time_spent_seconds IS NOT NULL;

-- ============================================================================
-- USER_EXAM_ANSWERS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON user_exam_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON user_exam_answers(question_id);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_answers_is_correct ON user_exam_answers(is_correct);

-- Timing analysis
CREATE INDEX IF NOT EXISTS idx_answers_response_time
  ON user_exam_answers(response_time_ms)
  WHERE response_time_ms IS NOT NULL;

-- ============================================================================
-- SUBSCRIPTIONS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires
  ON subscriptions(expires_at)
  WHERE status = 'active' AND expires_at IS NOT NULL;

-- ============================================================================
-- INDEX USAGE MONITORING QUERIES
-- ============================================================================

/*
MONITORING UNUSED INDEXES:

SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(relid) DESC;

-- Indexes with zero scans may be redundant

PERFORMANCE ANALYSIS:

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- High idx_tup_read means index is used for filtering

SIZE ANALYSIS:

SELECT
  schemaname,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Identify large indexes that might need optimization
*/

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

/*
INDEX STRATEGY:

1. SINGLE-COLUMN INDEXES:
   - For WHERE clauses on single columns
   - Examples: idx_users_email, idx_questions_difficulty

2. COMPOSITE INDEXES:
   - For multiple column filters or sorting
   - Order matters: most selective first
   - Example: idx_history_user_date (filter by user, then sort by date)

3. PARTIAL INDEXES:
   - For filtered lookups (WHERE status = 'active')
   - Saves space and improves performance
   - Examples: idx_questions_domain_difficulty WHERE source_type = 'real_exam'

4. GIN INDEXES (Full-Text Search):
   - idx_questions_search_vector for Portuguese FTS
   - idx_topics_keywords for keyword matching
   - Target: <200ms for full-text search on 13.9k questions

5. SORTING INDEXES:
   - idx_questions_created_at DESC for "newest first"
   - idx_reputation_score_desc for reputation ranking

QUERY PERFORMANCE TARGETS:
- Full-text search: < 200ms
- Dashboard stats: < 100ms
- Reputation ranking: < 50ms
- Question generation lookup: < 50ms
- Feedback queue: < 100ms

All targets measured with typical query loads.
*/
