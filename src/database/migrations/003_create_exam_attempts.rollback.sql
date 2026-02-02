-- Rollback Migration: 003_create_exam_attempts

-- Drop stored procedure
DROP FUNCTION IF EXISTS calculate_exam_score(UUID, UUID);

-- Disable RLS and drop policies
ALTER TABLE exam_results DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exam_results_isolation ON exam_results;

ALTER TABLE exam_answers DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exam_answers_isolation ON exam_answers;

ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exam_attempts_ownership ON exam_attempts;

-- Drop tables
DROP TABLE IF EXISTS exam_results;
DROP TABLE IF EXISTS exam_answers;
DROP TABLE IF EXISTS exam_attempts;

-- Drop ENUMs
DROP TYPE IF EXISTS attempt_status_enum;
