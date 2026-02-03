-- ============================================================================
-- Question Creator MVP - Database Views
-- ============================================================================
-- This file must run AFTER 004_enable_rls.sql
-- Views simplify complex queries and improve maintainability
-- ============================================================================

-- ============================================================================
-- VIEW 1: Questions with Reputation (for ranking/filtering)
-- ============================================================================

CREATE OR REPLACE VIEW v_questions_ranked AS
SELECT
  q.id,
  q.question_text,
  q.option_a,
  q.option_b,
  q.option_c,
  q.option_d,
  q.option_e,
  q.correct_answer,
  q.commentary,
  q.difficulty,
  q.source_type,
  d.name AS domain_name,
  d.slug AS domain_slug,
  t.name AS topic_name,
  t.slug AS topic_slug,
  qr.current_score AS reputation_score,
  qr.empirical_difficulty,
  qr.total_attempts,
  qr.correct_attempts,
  qr.status,
  q.created_at,
  CASE
    WHEN qr.current_score >= 7 THEN 'excellent'
    WHEN qr.current_score >= 5 THEN 'good'
    WHEN qr.current_score >= 3 THEN 'needs_review'
    ELSE 'new'
  END AS quality_status
FROM questions q
LEFT JOIN question_reputation qr ON q.id = qr.question_id
LEFT JOIN domains d ON q.domain_id = d.id
LEFT JOIN topics t ON q.primary_topic_id = t.id
WHERE qr.status = 'active';

-- ============================================================================
-- VIEW 2: User Dashboard Statistics
-- ============================================================================

CREATE OR REPLACE VIEW v_user_dashboard_stats AS
SELECT
  u.id AS user_id,
  u.email,
  u.full_name,
  COUNT(DISTINCT uqh.id) AS total_questions_attempted,
  COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END) AS correct_answers,
  ROUND(
    100 * COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT uqh.id), 0)::NUMERIC, 2
  ) AS accuracy_percentage,
  MAX(uqh.attempted_at) AS last_attempt_at,
  -- Study streak calculation (simplified)
  COALESCE((
    SELECT COUNT(DISTINCT DATE(attempted_at))
    FROM user_question_history
    WHERE user_id = u.id
      AND attempted_at >= NOW() - INTERVAL '30 days'
  ), 0) AS study_days_last_month
FROM users u
LEFT JOIN user_question_history uqh ON u.id = uqh.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.email, u.full_name;

-- ============================================================================
-- VIEW 3: Weak Areas (Topics with < 50% accuracy)
-- ============================================================================

CREATE OR REPLACE VIEW v_user_weak_areas AS
SELECT
  uqh.user_id,
  t.id AS topic_id,
  t.name AS topic_name,
  COUNT(DISTINCT uqh.id) AS total_attempts,
  COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END) AS correct_attempts,
  ROUND(
    100 * COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT uqh.id), 0)::NUMERIC, 2
  ) AS accuracy_percentage
FROM user_question_history uqh
JOIN questions q ON uqh.question_id = q.id
JOIN question_topics qt ON q.id = qt.question_id
JOIN topics t ON qt.topic_id = t.id
WHERE uqh.is_correct IS NOT NULL
GROUP BY uqh.user_id, t.id, t.name
HAVING ROUND(
  100 * COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END)::NUMERIC /
  NULLIF(COUNT(DISTINCT uqh.id), 0)::NUMERIC, 2
) < 50;

-- ============================================================================
-- VIEW 4: Question Quality Metrics
-- ============================================================================

CREATE OR REPLACE VIEW v_question_quality_metrics AS
SELECT
  q.id,
  q.question_text,
  q.source_type,
  qr.current_score,
  qr.total_attempts,
  qr.correct_attempts,
  ROUND(
    100 * qr.correct_attempts::NUMERIC / NULLIF(qr.total_attempts, 0)::NUMERIC, 2
  ) AS success_rate,
  qr.problem_reports,
  qr.expert_validations,
  qr.status,
  CASE
    WHEN qr.problem_reports >= 3 THEN 'FLAGGED'
    WHEN qr.status = 'under_review' THEN 'REVIEWING'
    WHEN qr.status = 'disabled' THEN 'DISABLED'
    WHEN qr.current_score < 5 THEN 'LOW_QUALITY'
    WHEN qr.total_attempts < 5 THEN 'INSUFFICIENT_DATA'
    ELSE 'OK'
  END AS quality_flag,
  q.created_at,
  qr.last_updated
FROM questions q
LEFT JOIN question_reputation qr ON q.id = qr.question_id;

-- ============================================================================
-- VIEW 5: Exam Performance Analytics
-- ============================================================================

CREATE OR REPLACE VIEW v_exam_performance AS
SELECT
  e.id AS exam_id,
  e.title AS exam_name,
  u.id AS user_id,
  u.email,
  COUNT(uea.id) AS total_questions,
  SUM(CASE WHEN uea.is_correct THEN 1 ELSE 0 END) AS correct_answers,
  ROUND(
    100 * SUM(CASE WHEN uea.is_correct THEN 1 ELSE 0 END)::NUMERIC /
    NULLIF(COUNT(uea.id), 0)::NUMERIC, 2
  ) AS accuracy_percentage,
  ueat.score_percentage,
  ueat.passed,
  EXTRACT(EPOCH FROM (ueat.completed_at - ueat.started_at)) / 60 AS duration_minutes,
  ueat.completed_at
FROM exams e
JOIN user_exam_attempts ueat ON e.id = ueat.exam_id
JOIN users u ON ueat.user_id = u.id
LEFT JOIN user_exam_answers uea ON ueat.id = uea.attempt_id
WHERE ueat.is_completed = TRUE
GROUP BY e.id, e.title, u.id, u.email, ueat.id;

-- ============================================================================
-- VIEW 6: Feedback Queue (High Priority)
-- ============================================================================

CREATE OR REPLACE VIEW v_feedback_queue AS
SELECT
  qf.id AS feedback_id,
  q.id AS question_id,
  q.question_text,
  COUNT(*) OVER (PARTITION BY q.id) AS report_count,
  qf.category,
  qf.feedback_text,
  qf.status,
  qf.submitted_at,
  qr.current_score AS question_reputation,
  u.email AS reported_by,
  CASE
    WHEN COUNT(*) OVER (PARTITION BY q.id) >= 5 THEN 'CRITICAL'
    WHEN COUNT(*) OVER (PARTITION BY q.id) >= 3 THEN 'HIGH'
    ELSE 'NORMAL'
  END AS priority
FROM question_feedback qf
JOIN questions q ON qf.question_id = q.id
LEFT JOIN question_reputation qr ON q.id = qr.question_id
JOIN users u ON qf.user_id = u.id
WHERE qf.status IN ('pending', 'under_review')
ORDER BY report_count DESC, qf.submitted_at DESC;

-- ============================================================================
-- VIEW 7: Import History
-- ============================================================================

CREATE OR REPLACE VIEW v_import_history AS
SELECT
  qbv.id,
  qbv.version_number,
  qbv.source_files,
  u.email AS imported_by,
  qbv.total_questions,
  (qbv.metadata->>'error_count')::INT AS error_count,
  qbv.status,
  qbv.import_date,
  -- Count questions in this version
  (SELECT COUNT(*) FROM questions WHERE question_bank_version_id = qbv.id) AS actual_count
FROM question_bank_versions qbv
LEFT JOIN users u ON qbv.imported_by = u.id
ORDER BY qbv.import_date DESC;

-- ============================================================================
-- VIEW 8: Active Student Sessions
-- ============================================================================

CREATE OR REPLACE VIEW v_active_sessions AS
SELECT
  e.id AS exam_id,
  e.title AS exam_name,
  u.id AS user_id,
  u.email,
  u.full_name,
  ueat.id AS attempt_id,
  ueat.started_at,
  e.time_limit_minutes,
  EXTRACT(EPOCH FROM (NOW() - ueat.started_at)) / 60 AS elapsed_minutes,
  (COALESCE(e.time_limit_minutes, 180) - EXTRACT(EPOCH FROM (NOW() - ueat.started_at)) / 60) AS remaining_minutes,
  CASE
    WHEN (COALESCE(e.time_limit_minutes, 180) - EXTRACT(EPOCH FROM (NOW() - ueat.started_at)) / 60) <= 5 THEN 'WARNING'
    WHEN (COALESCE(e.time_limit_minutes, 180) - EXTRACT(EPOCH FROM (NOW() - ueat.started_at)) / 60) <= 0 THEN 'EXPIRED'
    ELSE 'OK'
  END AS status
FROM user_exam_attempts ueat
JOIN exams e ON ueat.exam_id = e.id
JOIN users u ON ueat.user_id = u.id
WHERE ueat.is_completed = FALSE
  AND ueat.started_at >= NOW() - INTERVAL '5 hours';

-- ============================================================================
-- VIEW 9: Topic Coverage Analysis
-- ============================================================================

CREATE OR REPLACE VIEW v_topic_coverage AS
SELECT
  t.id,
  t.name AS topic_name,
  s.name AS subject_name,
  d.name AS domain_name,
  COUNT(DISTINCT q.id) AS total_questions,
  COUNT(DISTINCT CASE WHEN q.source_type = 'real_exam' THEN q.id END) AS real_exam_count,
  COUNT(DISTINCT CASE WHEN q.source_type = 'ai_generated' THEN q.id END) AS ai_generated_count,
  ROUND(AVG(qr.current_score)::NUMERIC, 2) AS avg_reputation,
  COUNT(DISTINCT uqh.id) AS total_attempts,
  ROUND(
    100 * COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT uqh.id), 0)::NUMERIC, 2
  ) AS avg_accuracy
FROM topics t
JOIN subjects s ON t.subject_id = s.id
JOIN domains d ON s.domain_id = d.id
LEFT JOIN question_topics qt ON t.id = qt.topic_id
LEFT JOIN questions q ON qt.question_id = q.id
LEFT JOIN question_reputation qr ON q.id = qr.question_id
LEFT JOIN user_question_history uqh ON q.id = uqh.question_id
GROUP BY t.id, t.name, s.name, d.name;

-- ============================================================================
-- VIEW 10: Reviewer Workload
-- ============================================================================

CREATE OR REPLACE VIEW v_reviewer_workload AS
SELECT
  u.id AS reviewer_id,
  u.email,
  u.full_name,
  COUNT(DISTINCT CASE WHEN qf.status = 'pending' THEN qf.id END) AS pending_reviews,
  COUNT(DISTINCT qr.id) AS completed_reviews,
  COUNT(DISTINCT CASE WHEN qr.decision = 'approve' THEN qr.id END) AS approved_count,
  COUNT(DISTINCT CASE WHEN qr.decision = 'reject' THEN qr.id END) AS rejected_count,
  COUNT(DISTINCT CASE WHEN qr.decision = 'request_revision' THEN qr.id END) AS revision_requested_count,
  MAX(qr.reviewed_at) AS last_review_at
FROM users u
LEFT JOIN question_feedback qf ON qf.status IN ('pending', 'under_review')
LEFT JOIN question_reviews qr ON qf.question_id = qr.question_id AND qr.reviewer_id = u.id
WHERE u.user_role = 'reviewer'
GROUP BY u.id, u.email, u.full_name;

-- ============================================================================
-- MATERIALIZED VIEW (for expensive queries)
-- ============================================================================

-- This view caches complex aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_stats AS
SELECT
  DATE(uqh.attempted_at) AS attempt_date,
  COUNT(DISTINCT uqh.user_id) AS active_users,
  COUNT(DISTINCT uqh.id) AS total_attempts,
  COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END) AS correct_answers,
  ROUND(
    100 * COUNT(DISTINCT CASE WHEN uqh.is_correct THEN uqh.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT uqh.id), 0)::NUMERIC, 2
  ) AS platform_accuracy,
  COUNT(DISTINCT ueat.id) AS exams_taken,
  COUNT(DISTINCT CASE WHEN ueat.passed THEN ueat.id END) AS exams_passed
FROM user_question_history uqh
LEFT JOIN user_exam_attempts ueat ON DATE(ueat.completed_at) = DATE(uqh.attempted_at) AND ueat.is_completed = TRUE
GROUP BY DATE(uqh.attempted_at)
ORDER BY attempt_date DESC;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_daily_stats_date ON mv_daily_stats(attempt_date DESC);

-- ============================================================================
-- HELPER: Refresh Materialized Views
-- ============================================================================

/*
To refresh materialized views with new data:

  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;

To see last refresh time:

  SELECT schemaname, matviewname, pg_stat_user_tables.last_vacuum
  FROM pg_matviews
  JOIN pg_stat_user_tables ON pg_matviews.matviewname = pg_stat_user_tables.relname;
*/

-- ============================================================================
-- VIEW USAGE EXAMPLES
-- ============================================================================

/*
-- Find top performing questions
SELECT id, text, reputation_score, success_rate
FROM v_questions_ranked
WHERE status = 'active'
ORDER BY reputation_score DESC
LIMIT 10;

-- Check user weak areas
SELECT topic_name, accuracy_percentage
FROM v_user_weak_areas
WHERE user_id = '<user-id>'
ORDER BY accuracy_percentage ASC;

-- Monitor feedback queue
SELECT question_id, question_text, report_count, priority
FROM v_feedback_queue
ORDER BY priority DESC;

-- Check active exam sessions
SELECT exam_name, user_email, remaining_minutes, status
FROM v_active_sessions
WHERE status = 'WARNING';

-- Get daily platform statistics
SELECT attempt_date, active_users, platform_accuracy
FROM mv_daily_stats
WHERE attempt_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY attempt_date DESC;

-- Analyze topic coverage
SELECT domain_name, subject_name, topic_name, total_questions, avg_accuracy
FROM v_topic_coverage
WHERE total_questions > 0
ORDER BY domain_name, subject_name;
*/

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
VIEW PERFORMANCE:

1. Regular Views (no storage, computed on query):
   - v_questions_ranked - Small overhead (JOINs)
   - v_user_dashboard_stats - Moderate (multiple GROUP BY)
   - v_user_weak_areas - Moderate (subqueries)
   - v_feedback_queue - Fast (WHERE filter on status)

2. Materialized Views (cached, needs REFRESH):
   - mv_daily_stats - Refreshed daily via cron job

OPTIMIZATION:
- Use materialized views for expensive aggregations
- Refresh during low-usage windows
- Monitor view query time with EXPLAIN

SECURITY:
- Views respect RLS policies
- SET app.current_user_id before querying

MAINTENANCE:
- Add indexes on materialized views for sorting/filtering
- Document refresh schedule
- Test query performance before deploying
*/