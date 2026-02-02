-- Rollback: 002_create_exams
-- ============================================================================

-- Drop RLS policies
DROP POLICY IF EXISTS exam_ownership ON exams;
DROP POLICY IF EXISTS exam_questions_isolation ON exam_questions;

-- Disable RLS
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_audit_exams_changes ON exams;
DROP FUNCTION IF EXISTS audit_exams_changes();

-- Drop indexes
DROP INDEX IF EXISTS idx_exams_user_status;
DROP INDEX IF EXISTS idx_exam_questions_exam_id;
DROP INDEX IF EXISTS idx_exams_user_id;

-- Drop tables
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS exams;

-- Drop ENUM type
DROP TYPE IF EXISTS exam_status_enum;
