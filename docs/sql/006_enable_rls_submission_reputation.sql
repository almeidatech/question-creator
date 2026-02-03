-- ============================================================================
-- Row Level Security (RLS) Policies for Submission & Reputation System
-- US-1.3: Question Submission & Reputation System
-- ============================================================================
-- Enable RLS on critical tables and enforce submission isolation + admin review access
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON SUBMISSION & FEEDBACK TABLES
-- ============================================================================

-- Enable RLS on user_question_history (submissions)
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;

-- Enable RLS on question_feedback (user reports)
ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;

-- Enable RLS on question_reviews (admin decisions)
ALTER TABLE question_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: Submission Isolation
-- ============================================================================
-- Users can ONLY view their own submissions
-- SELECT: Enforced
-- INSERT: User can only insert for themselves
-- UPDATE: Users cannot update (read-only history)
-- DELETE: Users cannot delete (audit trail)

CREATE POLICY submission_isolation_select ON user_question_history
  FOR SELECT
  USING (user_id = public.app_uid());

CREATE POLICY submission_isolation_insert ON user_question_history
  FOR INSERT
  WITH CHECK (user_id = public.app_uid());

-- Prevent updates to history (immutable audit trail)
CREATE POLICY submission_no_update ON user_question_history
  FOR UPDATE
  USING (false);

-- Prevent deletes from history (immutable audit trail)
CREATE POLICY submission_no_delete ON user_question_history
  FOR DELETE
  USING (false);

-- ============================================================================
-- POLICY 2: Admin Review Access
-- ============================================================================
-- Only admins can view and modify question_reviews
-- Service role can bypass for internal operations

CREATE POLICY admin_review_access_select ON question_reviews
  FOR SELECT
  USING (
    (SELECT user_role FROM users WHERE id = public.app_uid()) = 'admin'
  );

CREATE POLICY admin_review_access_insert ON question_reviews
  FOR INSERT
  WITH CHECK (
    (SELECT user_role FROM users WHERE id = public.app_uid()) = 'admin'
  );

CREATE POLICY admin_review_access_update ON question_reviews
  FOR UPDATE
  USING (
    (SELECT user_role FROM users WHERE id = public.app_uid()) = 'admin'
  );

-- ============================================================================
-- POLICY 3: Feedback Submission Access
-- ============================================================================
-- Users can view their own feedback
-- Users can submit feedback for any question
-- Only admins/reviewers can see all feedback for review

CREATE POLICY feedback_isolation_select ON question_feedback
  FOR SELECT
  USING (
    -- Own feedback
    user_id = public.app_uid()
    -- Or admin/reviewer
    OR (SELECT user_role FROM users WHERE id = public.app_uid()) IN ('admin', 'reviewer')
  );

CREATE POLICY feedback_isolation_insert ON question_feedback
  FOR INSERT
  WITH CHECK (user_id = public.app_uid());

CREATE POLICY feedback_reviewer_update ON question_feedback
  FOR UPDATE
  USING (
    (SELECT user_role FROM users WHERE id = public.app_uid()) IN ('admin', 'reviewer')
  );

-- ============================================================================
-- POLICY 4: Question Reputation Access
-- ============================================================================
-- Everyone can view reputation scores (public data)
-- Only triggers/service role can modify

CREATE POLICY reputation_public_select ON question_reputation
  FOR SELECT
  USING (true);

-- Prevent direct updates (only via triggers)
CREATE POLICY reputation_no_direct_update ON question_reputation
  FOR UPDATE
  USING (false);

-- ============================================================================
-- SERVICE ROLE BYPASS CONFIGURATION
-- ============================================================================
-- Service role (backend) can perform all operations
-- The queries using getSupabaseServiceClient() will bypass RLS
-- This is configured via connection role = 'service_role'

-- ============================================================================
-- TESTING RLS POLICIES
-- ============================================================================

/*
-- Test submission isolation
SELECT * FROM user_question_history
WHERE user_id = public.app_uid();
-- Should return only current user's submissions

-- Test admin review access (as non-admin)
SELECT * FROM question_reviews;
-- Should return: new row(0) - denied

-- Test admin review access (as admin)
-- Set Supabase role to admin user
SELECT * FROM question_reviews;
-- Should return: reviews visible to admins

-- Test feedback submission
INSERT INTO question_feedback (question_id, user_id, category, feedback_text)
VALUES ('q-uuid', public.app_uid(), 'wrong_answer', 'Test feedback');
-- Should succeed

INSERT INTO question_feedback (question_id, user_id, category, feedback_text)
VALUES ('q-uuid', 'different-user-uuid', 'wrong_answer', 'Test feedback');
-- Should fail with: "new row violates row-level security policy"

-- Test immutable history
UPDATE user_question_history
SET is_correct = true
WHERE user_id = public.app_uid();
-- Should fail with: "new row violates row-level security policy"

DELETE FROM user_question_history
WHERE user_id = public.app_uid();
-- Should fail with: "new row violates row-level security policy"
*/

-- ============================================================================
-- AUDIT: Verify RLS is enabled
-- ============================================================================

/*
-- Check which tables have RLS enabled:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_question_history', 'question_feedback', 'question_reviews', 'question_reputation')
ORDER BY tablename;

-- Expected output:
-- | schemaname | tablename             | rowsecurity |
-- |------------|------------------------|------------|
-- | public     | question_feedback      | t           |
-- | public     | question_reputation    | t           |
-- | public     | question_reviews       | t           |
-- | public     | user_question_history  | t           |

-- Verify policies are in place:
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_question_history', 'question_feedback', 'question_reviews', 'question_reputation')
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
CRITICAL SECURITY NOTES:

1. SUBMISSION ISOLATION (submission_isolation)
   - Enforces that users can ONLY see their own submission history
   - Prevents any user from viewing other users' answers
   - Immutable: No updates or deletes allowed (audit trail protection)

2. ADMIN REVIEW ACCESS (admin_review_access)
   - Only users with role='admin' can view/manage question_reviews
   - Blocks non-admins from accessing sensitive review decisions
   - Service role connection bypasses this for backend operations

3. FEEDBACK ISOLATION (feedback_isolation)
   - Users can only see their own feedback submissions
   - Admins/reviewers can see all feedback for review purposes
   - Prevents users from deleting their feedback

4. REPUTATION PUBLIC (reputation_public_select)
   - Question reputation scores are public (no privacy concern)
   - Prevents direct user modification (only triggers can update)
   - Maintains data integrity

5. TRIGGER COMPLIANCE
   - All triggers use SERVICE ROLE connection (via getSupabaseServiceClient)
   - Triggers bypass RLS and can perform all modifications
   - Database-level constraints enforce business rules

6. SERVICE ROLE USAGE
   - Use getSupabaseClient() for user-initiated operations (RLS enforced)
   - Use getSupabaseServiceClient() for backend/trigger operations (RLS bypassed)
   - Never expose service key to frontend

7. RATE LIMITING
   - Application level: Check duplicate submission before insert
   - Database level: UNIQUE constraint on (user_id, question_id)
   - Result: 1 submission per question per user, enforced by constraints

8. TESTING
   - Test with Supabase auth context: SET auth.uid = '<user-id>'
   - Test with service role: Use service role connection
   - Verify RLS blocks unauthorized access: "new row violates..."
*/
