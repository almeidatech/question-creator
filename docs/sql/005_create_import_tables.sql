-- Migration: 005_create_import_tables
-- Description: Creates tables for CSV import tracking and version management
-- Date: 2026-02-02
-- Author: @dev
-- ============================================================================

-- Create ENUM type for import status
CREATE TYPE import_status_enum AS ENUM ('queued', 'in_progress', 'completed', 'failed', 'rollback');

-- Create question_imports table for tracking imports
CREATE TABLE IF NOT EXISTS question_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csv_filename VARCHAR(255) NOT NULL,
  total_rows INT NOT NULL CHECK (total_rows > 0),
  successful_imports INT DEFAULT 0,
  duplicate_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status import_status_enum NOT NULL DEFAULT 'queued',
  error_details JSONB,
  estimated_completion_time TIMESTAMP,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create import_question_mapping table to track which questions were added in each import
CREATE TABLE IF NOT EXISTS import_question_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES question_imports(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (import_id, question_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding imports by admin
CREATE INDEX IF NOT EXISTS idx_question_imports_admin_id ON question_imports(admin_id);

-- Index for finding imports by status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_question_imports_status ON question_imports(status);

-- Index for finding imports by date range
CREATE INDEX IF NOT EXISTS idx_question_imports_created_at ON question_imports(created_at DESC);

-- Index for finding question mappings by import
CREATE INDEX IF NOT EXISTS idx_import_question_mapping_import_id ON import_question_mapping(import_id);

-- Index for finding what import a question came from
CREATE INDEX IF NOT EXISTS idx_import_question_mapping_question_id ON import_question_mapping(question_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on question_imports table
ALTER TABLE question_imports ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can see their own imports
CREATE POLICY question_imports_admin_access ON question_imports
  FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Enable RLS on import_question_mapping table
ALTER TABLE import_question_mapping ENABLE ROW LEVEL SECURITY;

-- Policy: Access mapping through the import (admin can see mappings for their imports)
CREATE POLICY import_question_mapping_isolation ON import_question_mapping
  FOR ALL
  USING (
    import_id IN (
      SELECT id FROM question_imports WHERE admin_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get import progress
CREATE OR REPLACE FUNCTION get_import_progress(p_import_id UUID)
RETURNS TABLE (
  import_id UUID,
  status TEXT,
  processed INT,
  total INT,
  progress_percent DECIMAL,
  duplicate_count INT,
  error_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qi.id,
    qi.status::TEXT,
    (qi.successful_imports + qi.duplicate_count + qi.error_count)::INT,
    qi.total_rows,
    ROUND((((qi.successful_imports + qi.duplicate_count + qi.error_count)::DECIMAL / qi.total_rows) * 100), 2),
    qi.duplicate_count,
    qi.error_count
  FROM question_imports qi
  WHERE qi.id = p_import_id;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback an import (delete all questions added in this import)
CREATE OR REPLACE FUNCTION rollback_import(p_import_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  questions_deleted INT,
  message TEXT
) AS $$
DECLARE
  v_count INT;
  v_admin_id UUID;
BEGIN
  -- Verify the import exists and get admin_id
  SELECT admin_id INTO v_admin_id
  FROM question_imports
  WHERE id = p_import_id;

  IF v_admin_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Import not found'::TEXT;
    RETURN;
  END IF;

  -- Get count of questions to delete
  SELECT COUNT(*) INTO v_count
  FROM import_question_mapping
  WHERE import_id = p_import_id;

  -- Delete questions added in this import
  DELETE FROM questions
  WHERE id IN (
    SELECT question_id FROM import_question_mapping WHERE import_id = p_import_id
  );

  -- Update import status to rollback
  UPDATE question_imports
  SET status = 'rollback', completed_at = NOW()
  WHERE id = p_import_id;

  RETURN QUERY SELECT true, v_count, format('Rolled back %s questions', v_count)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get import history
CREATE OR REPLACE FUNCTION get_import_history(
  p_admin_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  import_id UUID,
  csv_filename VARCHAR,
  total_rows INT,
  successful_imports INT,
  duplicate_count INT,
  error_count INT,
  status TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qi.id,
    qi.csv_filename,
    qi.total_rows,
    qi.successful_imports,
    qi.duplicate_count,
    qi.error_count,
    qi.status::TEXT,
    qi.created_at
  FROM question_imports qi
  WHERE qi.admin_id = p_admin_id
  ORDER BY qi.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
