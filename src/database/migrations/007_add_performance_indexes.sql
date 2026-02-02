-- Migration: Add missing performance indexes
-- Purpose: Optimize N+1 query patterns and frequent lookups
-- Estimated impact: 40% reduction in query load for common operations

-- =====================================================================
-- 1. exam_questions - used in listExams() N+1 pattern
-- =====================================================================
CREATE INDEX idx_exam_questions_exam_id
ON exam_questions(exam_id);

-- Composite index for question lookup within exam
CREATE INDEX idx_exam_questions_exam_question
ON exam_questions(exam_id, question_id);


-- =====================================================================
-- 2. exam_answers - used in submitAnswer() and duplicate checking
-- =====================================================================
-- Composite index for duplicate answer checking
CREATE INDEX idx_exam_answers_attempt_question
ON exam_answers(attempt_id, question_id);

-- Index for counting answers per attempt
CREATE INDEX idx_exam_answers_attempt_id
ON exam_answers(attempt_id);


-- =====================================================================
-- 3. user_question_history - used in duplicate submission checks
-- =====================================================================
-- Composite index for duplicate submission detection (most critical)
CREATE INDEX idx_uqh_user_question
ON user_question_history(user_id, question_id);

-- Index for time-based queries (recent answers)
CREATE INDEX idx_uqh_user_created_at
ON user_question_history(user_id, created_at DESC);


-- =====================================================================
-- 4. question_feedback - used in auto-flagging logic
-- =====================================================================
-- Composite index for time-range report counting
CREATE INDEX idx_qfeedback_question_submitted
ON question_feedback(question_id, submitted_at DESC);

-- Index for report type filtering
CREATE INDEX idx_qfeedback_question_type
ON question_feedback(question_id, feedback_type);


-- =====================================================================
-- 5. exam_attempts - used in permission checks and listing
-- =====================================================================
-- Composite index for user permission checks
CREATE INDEX idx_exam_attempts_user_id
ON exam_attempts(user_id, exam_id);

-- Index for user's exam history
CREATE INDEX idx_exam_attempts_user_created
ON exam_attempts(user_id, created_at DESC);


-- =====================================================================
-- 6. question_imports - used in dashboard and admin list operations
-- =====================================================================
-- Index for status filtering (completed, in_progress, failed)
CREATE INDEX idx_qimport_status_created
ON question_imports(status, created_at DESC);

-- Index for user imports listing
CREATE INDEX idx_qimport_created_by
ON question_imports(created_by_id, created_at DESC);


-- =====================================================================
-- Verify indexes were created successfully
-- =====================================================================
-- This query will show all newly created indexes:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('exam_questions', 'exam_answers', 'user_question_history',
--                     'question_feedback', 'exam_attempts', 'question_imports')
-- ORDER BY indexname;
