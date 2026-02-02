-- Rollback: 006_create_admin_views
-- ============================================================================

-- Drop function first (depends on view)
DROP FUNCTION IF EXISTS refresh_admin_dashboard_stats();

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS admin_dashboard_stats;

-- Drop performance indexes
DROP INDEX IF EXISTS idx_question_reputation_score;
DROP INDEX IF EXISTS idx_user_question_history_answered_at;
DROP INDEX IF EXISTS idx_question_imports_status_created;
DROP INDEX IF EXISTS idx_question_feedback_status;
