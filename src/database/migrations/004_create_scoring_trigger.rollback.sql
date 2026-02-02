-- Rollback: 004_create_scoring_trigger
-- ============================================================================

-- Drop trigger and function
DROP TRIGGER IF EXISTS score_calculation_trigger ON exam_attempts;
DROP FUNCTION IF EXISTS trigger_calculate_exam_score();

-- Drop analytics functions
DROP FUNCTION IF EXISTS get_exam_analytics(UUID, UUID);
DROP FUNCTION IF EXISTS get_frequent_weak_areas(UUID, UUID);
DROP FUNCTION IF EXISTS get_student_analytics(UUID);
DROP FUNCTION IF EXISTS get_time_analysis(UUID);

-- Drop unique constraint
ALTER TABLE exam_results
DROP CONSTRAINT IF EXISTS unique_result_per_attempt;
