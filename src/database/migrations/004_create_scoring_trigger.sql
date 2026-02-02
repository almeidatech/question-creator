-- Migration: 004_create_scoring_trigger
-- Description: Creates trigger to automatically calculate exam scores and weak areas on completion
-- Date: 2026-02-02
-- Author: @dev
-- ============================================================================

-- Create trigger function that calls calculate_exam_score
CREATE OR REPLACE FUNCTION trigger_calculate_exam_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score INT;
  v_passing BOOLEAN;
  v_weak_areas JSONB;
  v_exam_id UUID;
BEGIN
  -- Only trigger when exam is completed (completed_at becomes NOT NULL)
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    -- Get exam_id from the attempt
    SELECT exam_id INTO v_exam_id FROM exam_attempts WHERE id = NEW.id;

    -- Call scoring function
    SELECT score, passing, weak_areas
    INTO v_score, v_passing, v_weak_areas
    FROM calculate_exam_score(NEW.id, v_exam_id);

    -- Update attempt with score and passing status
    UPDATE exam_attempts
    SET
      score = v_score,
      passing = v_passing,
      status = 'completed'
    WHERE id = NEW.id;

    -- Insert results record
    INSERT INTO exam_results (attempt_id, score, passing, weak_areas)
    VALUES (NEW.id, v_score, v_passing, v_weak_areas)
    ON CONFLICT (attempt_id) DO UPDATE SET
      score = EXCLUDED.score,
      passing = EXCLUDED.passing,
      weak_areas = EXCLUDED.weak_areas;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on exam_attempts table
DROP TRIGGER IF EXISTS score_calculation_trigger ON exam_attempts;
CREATE TRIGGER score_calculation_trigger
AFTER UPDATE OF completed_at ON exam_attempts
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_exam_score();

-- ============================================================================
-- ANALYTICS QUERY FUNCTIONS
-- ============================================================================

-- Function to get performance analytics for a specific exam
CREATE OR REPLACE FUNCTION get_exam_analytics(
  p_exam_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  exam_id UUID,
  exam_name TEXT,
  total_attempts INT,
  average_score DECIMAL,
  best_score INT,
  worst_score INT,
  passing_rate DECIMAL,
  average_time_minutes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    COUNT(ea_all.id)::INT as total_attempts,
    ROUND(AVG(ea_all.score)::DECIMAL, 2) as average_score,
    MAX(ea_all.score) as best_score,
    MIN(ea_all.score) as worst_score,
    ROUND((COUNT(CASE WHEN ea_all.passing THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2) as passing_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM (ea_all.completed_at - ea_all.started_at)) / 60))::INT as average_time_minutes
  FROM exams e
  LEFT JOIN exam_attempts ea_all ON e.id = ea_all.exam_id AND ea_all.user_id = p_user_id
  WHERE e.id = p_exam_id
  GROUP BY e.id, e.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get weak areas frequency across all attempts for an exam
CREATE OR REPLACE FUNCTION get_frequent_weak_areas(
  p_exam_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  topic_id UUID,
  topic_name TEXT,
  frequency INT,
  average_accuracy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.topic_id,
    q.topic_name,
    COUNT(*)::INT as frequency,
    ROUND(AVG(
      CASE
        WHEN ea.is_correct THEN 100
        ELSE 0
      END
    )::DECIMAL, 2) as average_accuracy
  FROM exam_answers ea
  JOIN exam_attempts eat ON ea.attempt_id = eat.id
  JOIN questions q ON ea.question_id = q.id
  WHERE eat.exam_id = p_exam_id AND eat.user_id = p_user_id
  GROUP BY q.topic_id, q.topic_name
  HAVING ROUND(AVG(
    CASE
      WHEN ea.is_correct THEN 100
      ELSE 0
    END
  )::DECIMAL, 2) < 50
  ORDER BY average_accuracy ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get student's overall performance analytics
CREATE OR REPLACE FUNCTION get_student_analytics(
  p_user_id UUID
)
RETURNS TABLE (
  total_exams_taken INT,
  average_score DECIMAL,
  improvement_trend DECIMAL,
  total_study_time_minutes INT
) AS $$
DECLARE
  v_earliest_score DECIMAL;
  v_latest_score DECIMAL;
BEGIN
  -- Get earliest and latest scores for trend calculation
  SELECT score INTO v_earliest_score
  FROM exam_attempts
  WHERE user_id = p_user_id AND completed_at IS NOT NULL
  ORDER BY completed_at ASC
  LIMIT 1;

  SELECT score INTO v_latest_score
  FROM exam_attempts
  WHERE user_id = p_user_id AND completed_at IS NOT NULL
  ORDER BY completed_at DESC
  LIMIT 1;

  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_exams_taken,
    ROUND(AVG(ea.score)::DECIMAL, 2) as average_score,
    ROUND((v_latest_score - v_earliest_score)::DECIMAL, 2) as improvement_trend,
    ROUND(SUM(EXTRACT(EPOCH FROM (ea.completed_at - ea.started_at)) / 60))::INT as total_study_time_minutes
  FROM exam_attempts ea
  WHERE ea.user_id = p_user_id AND ea.completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze time per question
CREATE OR REPLACE FUNCTION get_time_analysis(
  p_attempt_id UUID
)
RETURNS TABLE (
  average_time_seconds DECIMAL,
  median_time_seconds INT,
  min_time_seconds INT,
  max_time_seconds INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(ea.time_spent_seconds)::DECIMAL, 2) as average_time_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ea.time_spent_seconds) as median_time_seconds,
    MIN(ea.time_spent_seconds) as min_time_seconds,
    MAX(ea.time_spent_seconds) as max_time_seconds
  FROM exam_answers ea
  WHERE ea.attempt_id = p_attempt_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADD UNIQUE CONSTRAINT FOR EXAM_RESULTS
-- ============================================================================

ALTER TABLE exam_results
ADD CONSTRAINT unique_result_per_attempt UNIQUE (attempt_id);
