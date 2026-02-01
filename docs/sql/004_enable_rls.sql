-- ============================================================================
-- Question Creator MVP - Row Level Security (RLS) Policies
-- ============================================================================
-- This file must run AFTER 003_create_triggers.sql
-- RLS provides row-level access control at the database level
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_answers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get current user ID
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
  SELECT current_setting('app.current_user_id')::uuid;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS VARCHAR AS $$
  SELECT current_setting('app.current_user_role', true)::varchar;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- PUBLIC TABLES (No RLS needed, but defined for clarity)
-- ============================================================================

-- Domains: Everyone can read
CREATE POLICY "Public read access" ON domains
  FOR SELECT USING (is_active = TRUE);

-- Subjects: Everyone can read
CREATE POLICY "Public read access" ON subjects
  FOR SELECT USING (is_active = TRUE);

-- Topics: Everyone can read
CREATE POLICY "Public read access" ON topics
  FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================

-- Students can only see active questions
CREATE POLICY "Students see active questions" ON questions
  FOR SELECT
  USING (
    (
      -- Questions with reputation >= 5 and active
      id IN (
        SELECT question_id FROM question_reputation
        WHERE current_score >= 5 AND status = 'active'
      )
      -- OR real exam questions (always safe)
      OR source_type = 'real_exam'
    )
  );

-- Educators can see active + under review
CREATE POLICY "Educators see active and under review" ON questions
  FOR SELECT
  USING (
    CASE
      WHEN auth.user_role() = 'educator' THEN
        id IN (
          SELECT question_id FROM question_reputation
          WHERE status IN ('active', 'under_review')
        )
      WHEN auth.user_role() = 'student' THEN
        id IN (
          SELECT question_id FROM question_reputation
          WHERE status = 'active' AND current_score >= 5
        )
      ELSE FALSE
    END
  );

-- Admins and reviewers can see all
CREATE POLICY "Admins and reviewers see all" ON questions
  FOR SELECT
  USING (
    auth.user_role() IN ('admin', 'reviewer')
  );

-- Only system can insert questions
CREATE POLICY "System inserts only" ON questions
  FOR INSERT
  WITH CHECK (FALSE);

-- ============================================================================
-- QUESTION REPUTATION TABLE
-- ============================================================================

-- Everyone can read (needed for filtering)
CREATE POLICY "Public read reputation" ON question_reputation
  FOR SELECT USING (TRUE);

-- Only system updates via triggers
CREATE POLICY "System updates only" ON question_reputation
  FOR UPDATE
  USING (FALSE);

-- ============================================================================
-- USER QUESTION HISTORY TABLE
-- ============================================================================

-- Users can only see their own history
CREATE POLICY "Users see own history" ON user_question_history
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert for themselves
CREATE POLICY "Users insert own history" ON user_question_history
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users cannot update or delete history (append-only)
CREATE POLICY "No updates to history" ON user_question_history
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "No deletes from history" ON user_question_history
  FOR DELETE
  USING (FALSE);

-- Educators can see their students' history (if relationship exists)
CREATE POLICY "Educators see student history" ON user_question_history
  FOR SELECT
  USING (
    CASE
      WHEN auth.user_role() = 'educator' THEN
        user_id IN (
          -- Implement relationship between educators and students
          -- For now, educators see all (should be restricted in future)
          SELECT id FROM users WHERE role = 'student'
        )
      ELSE FALSE
    END
  );

-- Admins can see all
CREATE POLICY "Admins see all history" ON user_question_history
  FOR SELECT
  USING (auth.user_role() = 'admin');

-- ============================================================================
-- QUESTION FEEDBACK TABLE
-- ============================================================================

-- Users can see their own feedback
CREATE POLICY "Users see own feedback" ON question_feedback
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert feedback
CREATE POLICY "Users submit feedback" ON question_feedback
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- Reviewers can see all pending feedback
CREATE POLICY "Reviewers see pending feedback" ON question_feedback
  FOR SELECT
  USING (
    CASE
      WHEN auth.user_role() = 'reviewer' THEN
        status IN ('pending', 'under_review')
      ELSE FALSE
    END
  );

-- Only reviewers can update feedback status
CREATE POLICY "Reviewers update feedback" ON question_feedback
  FOR UPDATE
  USING (auth.user_role() = 'reviewer')
  WITH CHECK (auth.user_role() = 'reviewer');

-- Admins can see and update all
CREATE POLICY "Admins manage feedback" ON question_feedback
  FOR ALL
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

-- ============================================================================
-- QUESTION REVIEWS TABLE
-- ============================================================================

-- Reviewers can see their reviews
CREATE POLICY "Reviewers see own reviews" ON question_reviews
  FOR SELECT
  USING (reviewer_id = auth.uid());

-- Only reviewers can insert reviews
CREATE POLICY "Only reviewers insert" ON question_reviews
  FOR INSERT
  WITH CHECK (
    auth.user_role() = 'reviewer'
    AND reviewer_id = auth.uid()
  );

-- Admins can see all reviews
CREATE POLICY "Admins see all reviews" ON question_reviews
  FOR SELECT
  USING (auth.user_role() = 'admin');

-- ============================================================================
-- EXAMS TABLE
-- ============================================================================

-- Users can see exams they created
CREATE POLICY "Users see own exams" ON exams
  FOR SELECT
  USING (creator_id = auth.uid());

-- Users can create exams
CREATE POLICY "Users create exams" ON exams
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Users can update their own exams
CREATE POLICY "Users update own exams" ON exams
  FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Admins can see all exams
CREATE POLICY "Admins see all exams" ON exams
  FOR SELECT
  USING (auth.user_role() = 'admin');

-- ============================================================================
-- EXAM QUESTIONS TABLE
-- ============================================================================

-- Users can see questions in their exams
CREATE POLICY "Users see exam questions" ON exam_questions
  FOR SELECT
  USING (
    exam_id IN (
      SELECT id FROM exams WHERE creator_id = auth.uid()
    )
  );

-- ============================================================================
-- USER EXAM ATTEMPTS TABLE
-- ============================================================================

-- Users can see their own attempts
CREATE POLICY "Users see own attempts" ON user_exam_attempts
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create attempts
CREATE POLICY "Users create attempts" ON user_exam_attempts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their in-progress attempts
CREATE POLICY "Users update own attempts" ON user_exam_attempts
  FOR UPDATE
  USING (user_id = auth.uid() AND is_completed = FALSE)
  WITH CHECK (user_id = auth.uid());

-- Educators can see their students' attempts
CREATE POLICY "Educators see student attempts" ON user_exam_attempts
  FOR SELECT
  USING (
    CASE
      WHEN auth.user_role() = 'educator' THEN
        user_id IN (SELECT id FROM users WHERE role = 'student')
      ELSE FALSE
    END
  );

-- Admins can see all
CREATE POLICY "Admins see all attempts" ON user_exam_attempts
  FOR SELECT
  USING (auth.user_role() = 'admin');

-- ============================================================================
-- USER EXAM ANSWERS TABLE
-- ============================================================================

-- Users can see answers from their attempts
CREATE POLICY "Users see own answers" ON user_exam_answers
  FOR SELECT
  USING (
    attempt_id IN (
      SELECT id FROM user_exam_attempts WHERE user_id = auth.uid()
    )
  );

-- Users can insert answers to their attempts
CREATE POLICY "Users insert own answers" ON user_exam_answers
  FOR INSERT
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM user_exam_attempts
      WHERE user_id = auth.uid() AND is_completed = FALSE
    )
  );

-- Users cannot update or delete answers (append-only)
CREATE POLICY "No updates to answers" ON user_exam_answers
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "No deletes from answers" ON user_exam_answers
  FOR DELETE
  USING (FALSE);

-- Admins can see all
CREATE POLICY "Admins see all answers" ON user_exam_answers
  FOR SELECT
  USING (auth.user_role() = 'admin');

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

-- Users can see their own subscription
CREATE POLICY "Users see own subscription" ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can see all subscriptions
CREATE POLICY "Admins see subscriptions" ON subscriptions
  FOR SELECT
  USING (auth.user_role() = 'admin');

-- ============================================================================
-- USERS TABLE (Sensitive - Limited Access)
-- ============================================================================

-- Users can see their own profile
CREATE POLICY "Users see own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users cannot view other users
CREATE POLICY "No cross-user viewing" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (email, name, etc.)
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- Admins can see all users
CREATE POLICY "Admins see all users" ON users
  FOR SELECT
  USING (auth.user_role() = 'admin');

-- ============================================================================
-- HELPER: Set authentication context
-- ============================================================================

/*
TO USE THESE POLICIES:

Before running queries, set the auth context:

  SET app.current_user_id = '<user-uuid>';
  SET app.current_user_role = 'student';

  -- Or for admin:
  SET app.current_user_role = 'admin';

Then all queries will respect RLS policies.

EXAMPLE:

  -- As a student
  SET app.current_user_id = '550e8400-e29b-41d4-a716-446655440000';
  SET app.current_user_role = 'student';

  SELECT * FROM questions;
  -- Only returns active questions with reputation >= 5

  -- As an admin
  SET app.current_user_role = 'admin';
  SELECT * FROM questions;
  -- Returns all questions
*/

-- ============================================================================
-- RLS TESTING SCRIPT
-- ============================================================================

/*
-- Test 1: Student isolation
SET app.current_user_id = '550e8400-e29b-41d4-a716-446655440001';
SET app.current_user_role = 'student';
SELECT COUNT(*) FROM user_question_history;
-- Should only see this student's history

-- Test 2: Reviewer access
SET app.current_user_id = '550e8400-e29b-41d4-a716-446655440002';
SET app.current_user_role = 'reviewer';
SELECT COUNT(*) FROM question_feedback WHERE status = 'pending';
-- Should see pending feedback

-- Test 3: Admin access
SET app.current_user_id = '550e8400-e29b-41d4-a716-446655440003';
SET app.current_user_role = 'admin';
SELECT COUNT(*) FROM users;
-- Should see all users

-- Test 4: Cross-user attempt (should fail)
SET app.current_user_id = '550e8400-e29b-41d4-a716-446655440001';
SET app.current_user_role = 'student';
SELECT * FROM user_exam_attempts WHERE user_id = '550e8400-e29b-41d4-a716-446655440002';
-- Should return nothing
*/

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

/*
RLS POLICY STRATEGY:

1. PUBLIC DATA (everyone can read):
   - domains, subjects, topics (metadata)
   - question_reputation (for filtering)

2. USER DATA (users see own only):
   - user_question_history (append-only)
   - user_exam_attempts (can see own)
   - user_exam_answers (can see own)
   - subscriptions (can see own)

3. QUESTION ACCESS (graduated access):
   - Students: active questions with reputation >= 5
   - Educators: active + under_review
   - Admins: all questions
   - Reviewers: under_review only

4. FEEDBACK SYSTEM (role-based):
   - Students: see own feedback
   - Reviewers: see pending feedback
   - Admins: see all

PERFORMANCE NOTES:
- RLS policies use IN subqueries
- Consider materialized views for complex policies
- Monitor policy performance with EXPLAIN

AUDIT:
All queries that violate RLS will silently return no rows.
Enable query logging if needed:
  SET log_statement = 'all';
*/
