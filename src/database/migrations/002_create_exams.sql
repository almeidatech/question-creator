-- Migration: 002_create_exams
-- Description: Creates exams and exam_questions tables for exam management
-- Date: 2026-02-01
-- Author: @dev
-- ============================================================================

-- Create ENUM type for exam status
CREATE TYPE exam_status_enum AS ENUM ('draft', 'active', 'archived');

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL CHECK (duration_minutes BETWEEN 5 AND 180),
  passing_score INT NOT NULL CHECK (passing_score BETWEEN 0 AND 100),
  status exam_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create exam_questions junction table
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  UNIQUE (exam_id, question_id)
);

-- ============================================================================
-- CRITICAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding exams by user
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);

-- Index for finding exam questions by exam
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);

-- Index for user_id and status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_exams_user_status ON exams(user_id, status);

-- ============================================================================
-- AUDIT TRIGGER: Logs all changes to exams
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_exams_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(table_name, operation, record_id, old_value, new_value, changed_by, changed_at)
    VALUES (
      'exams',
      'UPDATE',
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW),
      current_user_id(),
      NOW()
    );
    RETURN NEW;

  -- Log DELETE operations
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(table_name, operation, record_id, old_value, changed_by, changed_at)
    VALUES (
      'exams',
      'DELETE',
      OLD.id,
      row_to_json(OLD),
      current_user_id(),
      NOW()
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS trg_audit_exams_changes ON exams;

-- Create trigger on UPDATE
CREATE TRIGGER trg_audit_exams_changes
AFTER UPDATE OR DELETE ON exams
FOR EACH ROW
EXECUTE FUNCTION audit_exams_changes();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on exams table
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own exams
CREATE POLICY exam_ownership ON exams
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Enable RLS on exam_questions table
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see exam_questions for their exams
CREATE POLICY exam_questions_isolation ON exam_questions
  FOR ALL
  USING (
    exam_id IN (
      SELECT id FROM exams WHERE user_id = current_user_id()
    )
  );
