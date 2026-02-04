-- ============================================================================
-- Fix RLS Infinite Recursion Issue
-- ============================================================================
-- This script fixes the infinite recursion in RLS policies by:
-- 1. Dropping problematic policies
-- 2. Creating a SECURITY DEFINER function to check admin role
-- 3. Recreating policies using the safe function
-- ============================================================================

-- Drop all problematic policies that cause recursion
DROP POLICY IF EXISTS "users_admin_access" ON users;
DROP POLICY IF EXISTS "uqh_admin_access" ON user_question_history;
DROP POLICY IF EXISTS "exams_admin_access" ON exams;
DROP POLICY IF EXISTS "ea_admin_access" ON exam_attempts;
DROP POLICY IF EXISTS "questions_admin_write" ON questions;
DROP POLICY IF EXISTS "questions_admin_update" ON questions;

-- ============================================================================
-- Create helper function to check if current user is admin
-- SECURITY DEFINER allows it to bypass RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND user_role = 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- Recreate policies using the safe function
-- ============================================================================

-- Users table - Admin access
CREATE POLICY "users_admin_access" ON users
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User question history - Admin access
CREATE POLICY "uqh_admin_access" ON user_question_history
  FOR ALL
  USING (public.is_admin());

-- Exams - Admin access
CREATE POLICY "exams_admin_access" ON exams
  FOR ALL
  USING (public.is_admin());

-- Exam attempts - Admin access
CREATE POLICY "ea_admin_access" ON exam_attempts
  FOR ALL
  USING (public.is_admin());

-- Questions - Admin write
CREATE POLICY "questions_admin_write" ON questions
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "questions_admin_update" ON questions
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "questions_admin_delete" ON questions
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- Verify the fix
-- ============================================================================

-- Test the function (should not cause recursion)
-- SELECT public.is_admin();

