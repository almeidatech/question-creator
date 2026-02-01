-- Rollback: 001_create_question_sources
-- Description: Removes question_sources table and related objects
-- ============================================================================

-- Drop trigger first (dependencies)
DROP TRIGGER IF EXISTS trg_audit_question_sources_changes ON question_sources;

-- Drop function
DROP FUNCTION IF EXISTS audit_question_sources_changes();

-- Drop indexes
DROP INDEX IF EXISTS idx_qs_type_eligible;
DROP INDEX IF EXISTS idx_qs_question_id;
DROP INDEX IF EXISTS idx_qs_approved;

-- Drop table
DROP TABLE IF EXISTS question_sources;

-- Drop audit log table (only if created by this migration)
DROP TABLE IF EXISTS audit_log;

-- Drop enum type
DROP TYPE IF EXISTS source_type_enum;
