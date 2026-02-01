-- ============================================================================
-- RLS (Row Level Security) Policies for Authentication
-- ============================================================================
-- Enable RLS on auth-related tables
-- Execute after 004_enable_rls.sql
-- ============================================================================

-- ============================================================================
-- USERS TABLE - RLS Policies
-- ============================================================================
-- Users can only access their own user record

CREATE POLICY "users_self_access" ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin override (authenticated users with admin role can see all)
CREATE POLICY "users_admin_access" ON users
  FOR SELECT
  USING (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- USER_QUESTION_HISTORY TABLE - RLS Policies
-- ============================================================================
-- Users can only access their own question history

CREATE POLICY "uqh_user_isolation" ON user_question_history
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can access all
CREATE POLICY "uqh_admin_access" ON user_question_history
  FOR SELECT
  USING (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- EXAMS TABLE - RLS Policies
-- ============================================================================
-- Users can only access exams they created or are assigned to
-- Educators can see their own exams

CREATE POLICY "exams_owner_access" ON exams
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM exam_attempts
    WHERE exam_attempts.exam_id = exams.id
    AND exam_attempts.user_id = auth.uid()
  ))
  WITH CHECK (created_by = auth.uid());

-- Everyone can read public exams (is_public = true)
CREATE POLICY "exams_public_read" ON exams
  FOR SELECT
  USING (is_public = true);

-- Admins can access all
CREATE POLICY "exams_admin_access" ON exams
  FOR SELECT
  USING (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- EXAM_ATTEMPTS TABLE - RLS Policies
-- ============================================================================
-- Users can only access their own exam attempts

CREATE POLICY "ea_user_isolation" ON exam_attempts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Educators can view attempts on their exams
CREATE POLICY "ea_educator_view" ON exam_attempts
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT created_by FROM exams WHERE id = exam_attempts.exam_id
    )
  );

-- Admins can access all
CREATE POLICY "ea_admin_access" ON exam_attempts
  FOR SELECT
  USING (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- QUESTIONS TABLE - RLS Policies
-- ============================================================================
-- All authenticated users can read questions
-- Only admins can insert/update

CREATE POLICY "questions_authenticated_read" ON questions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "questions_admin_write" ON questions
  FOR INSERT
  WITH CHECK (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "questions_admin_update" ON questions
  FOR UPDATE
  USING (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT user_role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- TOPICS TABLE - RLS Policies
-- ============================================================================
-- All authenticated users can read topics

CREATE POLICY "topics_authenticated_read" ON topics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- Verify RLS is enabled on all tables
-- ============================================================================

-- Enable RLS (this should have been done in 004_enable_rls.sql)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Test RLS with sample data (optional - comment out in production)
-- ============================================================================

-- This ensures that when a user logs in with their JWT token,
-- Supabase sets auth.uid() to their user_id in the JWT payload
-- and all queries are filtered by the policies above
