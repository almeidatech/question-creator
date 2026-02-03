-- Migration: 006_create_admin_views
-- Purpose: Create materialized views for admin dashboard performance optimization
-- ============================================================================

-- Materialized view for dashboard statistics
-- Aggregates frequently queried metrics for fast access
-- Should be refreshed every 5 minutes or after data mutations
CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE is_active = true AND user_role != 'admin') as total_users,
  (SELECT COUNT(DISTINCT user_id) FROM user_question_history WHERE attempted_at >= NOW() - INTERVAL '30 days') as active_users_30d,
  (SELECT COUNT(DISTINCT user_id) FROM user_question_history WHERE attempted_at >= NOW() - INTERVAL '7 days') as active_users_7d,
  (SELECT COUNT(DISTINCT user_id) FROM user_question_history WHERE attempted_at >= NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM questions) as total_questions,
  (SELECT COUNT(*) FROM questions WHERE source_type = 'real_exam') as real_exam_questions,
  (SELECT COUNT(*) FROM questions WHERE source_type = 'ai_generated') as ai_generated_questions,
  (SELECT COUNT(*) FROM question_imports WHERE status = 'completed') as total_completed_imports,
  (SELECT COUNT(*) FROM question_imports WHERE status = 'failed') as total_failed_imports,
  (SELECT MAX(created_at) FROM question_imports WHERE status = 'completed') as last_import_date,
  (SELECT AVG(current_score) FROM question_reputation) as avg_question_reputation,
  (SELECT COUNT(*) FROM question_feedback WHERE status = 'pending') as pending_feedback_count,
  NOW() as last_updated;

-- Create unique index on last_updated for refresh operations
CREATE UNIQUE INDEX idx_admin_dashboard_stats_updated ON admin_dashboard_stats (last_updated);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_admin_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_admin_dashboard_stats TO authenticated;

-- Index for frequently queried columns
CREATE INDEX idx_question_reputation_score ON question_reputation(current_score);
CREATE INDEX idx_user_question_history_attempted_at ON user_question_history(attempted_at);
CREATE INDEX idx_question_imports_status_created ON question_imports(status, created_at DESC);
CREATE INDEX idx_question_feedback_status ON question_feedback(status);
