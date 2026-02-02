-- Migration: 003_create_exam_attempts
-- Description: Creates exam_attempts, exam_answers, and exam_results tables
-- Date: 2026-02-01
-- Author: @dev
-- ============================================================================

-- Create ENUM type for attempt status
CREATE TYPE attempt_status_enum AS ENUM ('in_progress', 'completed');

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status attempt_status_enum NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  score INT CHECK (score IS NULL OR (score BETWEEN 0 AND 100)),
  passing BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create exam_answers table
CREATE TABLE IF NOT EXISTS exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_index INT NOT NULL CHECK (selected_option_index BETWEEN 0 AND 3),
  is_correct BOOLEAN,
  time_spent_seconds INT CHECK (time_spent_seconds IS NULL OR time_spent_seconds >= 0),
  answered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);

-- Create exam_results table
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  passing BOOLEAN NOT NULL,
  weak_areas JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CRITICAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding attempts by user
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON exam_attempts(user_id);

-- Index for finding attempts by exam
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON exam_attempts(exam_id);

-- Index for finding answers by attempt
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt_id ON exam_answers(attempt_id);

-- Index for finding answers by question
CREATE INDEX IF NOT EXISTS idx_exam_answers_question_id ON exam_answers(question_id);

-- Index for finding results by attempt
CREATE INDEX IF NOT EXISTS idx_exam_results_attempt_id ON exam_results(attempt_id);

-- Index for user_id and status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_status ON exam_attempts(user_id, status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on exam_attempts table
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own attempts
CREATE POLICY exam_attempts_ownership ON exam_attempts
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Enable RLS on exam_answers table
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see answers for their attempts
CREATE POLICY exam_answers_isolation ON exam_answers
  FOR ALL
  USING (
    attempt_id IN (
      SELECT id FROM exam_attempts WHERE user_id = current_user_id()
    )
  );

-- Enable RLS on exam_results table
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see results for their attempts
CREATE POLICY exam_results_isolation ON exam_results
  FOR ALL
  USING (
    attempt_id IN (
      SELECT id FROM exam_attempts WHERE user_id = current_user_id()
    )
  );

-- ============================================================================
-- STORED PROCEDURE: Calculate Exam Score and Weak Areas
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_exam_score(
  p_attempt_id UUID,
  p_exam_id UUID
)
RETURNS TABLE(
  score INT,
  passing BOOLEAN,
  weak_areas JSONB
) AS $$
DECLARE
  v_score INT;
  v_total_questions INT;
  v_correct_answers INT;
  v_passing_score INT;
  v_weak_areas JSONB;
  v_topic_stats RECORD;
BEGIN
  -- Get total questions in exam
  SELECT COUNT(*) INTO v_total_questions
  FROM exam_questions
  WHERE exam_id = p_exam_id;

  -- Get correct answer count
  SELECT COUNT(*) INTO v_correct_answers
  FROM exam_answers
  WHERE attempt_id = p_attempt_id AND is_correct = true;

  -- Calculate score (0-100)
  v_score := CASE
    WHEN v_total_questions = 0 THEN 0
    ELSE ROUND((v_correct_answers::DECIMAL / v_total_questions) * 100)::INT
  END;

  -- Get passing score from exam
  SELECT passing_score INTO v_passing_score
  FROM exams
  WHERE id = p_exam_id;

  -- Determine if passing
  RETURN QUERY
  SELECT
    v_score,
    v_score >= v_passing_score,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'topic', q.topic_id,
          'accuracy', COALESCE(
            ROUND((correct_count::DECIMAL / total_count) * 100)::INT,
            0
          )
        )
      )
      FROM (
        SELECT
          q.topic_id,
          COUNT(*) as total_count,
          COUNT(CASE WHEN ea.is_correct THEN 1 END) as correct_count
        FROM questions q
        JOIN exam_questions eq ON q.id = eq.question_id
        LEFT JOIN exam_answers ea ON ea.question_id = q.id
          AND ea.attempt_id = p_attempt_id
        WHERE eq.exam_id = p_exam_id AND q.topic_id IS NOT NULL
        GROUP BY q.topic_id
        HAVING ROUND((COUNT(CASE WHEN ea.is_correct THEN 1 END)::DECIMAL / COUNT(*)) * 100)::INT < 50
      ) subq
    );
END;
$$ LANGUAGE plpgsql;
