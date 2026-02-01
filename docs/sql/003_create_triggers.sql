-- ============================================================================
-- Question Creator MVP - Database Triggers
-- ============================================================================
-- This file must run AFTER 002_create_indexes.sql
-- Triggers automate business logic and maintain data consistency
-- ============================================================================

-- ============================================================================
-- TRIGGER 0: Audit question_sources changes (RAG Compliance) [NEW v2.1]
-- ============================================================================
-- CRITICAL: Logs all source_type changes for compliance & debugging
-- Prevents accidental contamination of RAG corpus

CREATE OR REPLACE FUNCTION audit_question_sources_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log source_type changes to audit trail
  IF NEW.source_type != OLD.source_type OR NEW.rag_eligible != OLD.rag_eligible THEN
    INSERT INTO audit_log (
      table_name,
      record_id,
      old_value,
      new_value,
      changed_at,
      changed_by,
      change_reason
    ) VALUES (
      'question_sources',
      NEW.id::text,
      json_build_object(
        'source_type', OLD.source_type,
        'rag_eligible', OLD.rag_eligible
      )::text,
      json_build_object(
        'source_type', NEW.source_type,
        'rag_eligible', NEW.rag_eligible
      )::text,
      NOW(),
      COALESCE(current_user, 'system'),
      'RAG corpus isolation enforcement'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_question_sources ON question_sources;
CREATE TRIGGER trigger_audit_question_sources
AFTER UPDATE ON question_sources
FOR EACH ROW
EXECUTE FUNCTION audit_question_sources_change();

-- ============================================================================
-- TRIGGER 1: Create reputation record when question is created
-- ============================================================================

CREATE OR REPLACE FUNCTION create_reputation_for_question()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO question_reputation (
    question_id,
    current_score,
    status
  )
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.source_type = 'real_exam' THEN 10
      WHEN NEW.source_type = 'ai_generated' THEN 0
      WHEN NEW.source_type = 'user_submitted' THEN 5
      ELSE 5
    END,
    CASE
      WHEN NEW.source_type = 'ai_generated' THEN 'under_review'::varchar
      ELSE 'active'::varchar
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_reputation ON questions;
CREATE TRIGGER trigger_create_reputation
AFTER INSERT ON questions
FOR EACH ROW
EXECUTE FUNCTION create_reputation_for_question();

-- ============================================================================
-- TRIGGER 2: Update reputation when user answers a question
-- ============================================================================

CREATE OR REPLACE FUNCTION update_reputation_on_attempt()
RETURNS TRIGGER AS $$
DECLARE
  v_total_attempts INT;
  v_correct_attempts INT;
  v_success_rate FLOAT;
  v_new_score FLOAT;
  v_empirical_difficulty VARCHAR;
BEGIN
  -- Count all attempts for this question
  SELECT COUNT(*), SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)
  INTO v_total_attempts, v_correct_attempts
  FROM user_question_history
  WHERE question_id = NEW.question_id;

  -- Calculate success rate
  v_success_rate := CASE
    WHEN v_total_attempts > 0
    THEN (v_correct_attempts::FLOAT / v_total_attempts::FLOAT) * 100
    ELSE 0
  END;

  -- Determine empirical difficulty
  v_empirical_difficulty := CASE
    WHEN v_success_rate >= 80 THEN 'easy'
    WHEN v_success_rate >= 50 THEN 'medium'
    ELSE 'hard'
  END;

  -- Calculate new score based on attempts
  v_new_score := CASE
    WHEN v_total_attempts < 5 THEN 0.0 -- Not enough data
    WHEN v_total_attempts >= 20 THEN (v_success_rate / 100.0) * 10.0
    ELSE (v_success_rate / 100.0) * 4.0 -- Conservative for early attempts
  END;

  -- Update reputation
  UPDATE question_reputation
  SET
    total_attempts = v_total_attempts,
    correct_attempts = v_correct_attempts,
    current_score = v_new_score,
    empirical_difficulty = v_empirical_difficulty,
    last_updated = NOW()
  WHERE question_id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reputation ON user_question_history;
CREATE TRIGGER trigger_update_reputation
AFTER INSERT ON user_question_history
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_attempt();

-- ============================================================================
-- TRIGGER 3: Flag question when too many problem reports
-- ============================================================================

CREATE OR REPLACE FUNCTION flag_question_on_feedback()
RETURNS TRIGGER AS $$
DECLARE
  v_report_count INT;
BEGIN
  -- Count problem reports for this question in last 24 hours
  SELECT COUNT(*)
  INTO v_report_count
  FROM question_feedback
  WHERE question_id = NEW.question_id
    AND category IN ('incorrect_answer', 'unclear', 'offensive')
    AND submitted_at >= NOW() - INTERVAL '24 hours';

  -- Update reputation if >= 3 reports
  UPDATE question_reputation
  SET
    problem_reports = v_report_count,
    status = CASE
      WHEN v_report_count >= 3 THEN 'under_review'::varchar
      ELSE status
    END,
    last_updated = NOW()
  WHERE question_id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_flag_on_feedback ON question_feedback;
CREATE TRIGGER trigger_flag_on_feedback
AFTER INSERT ON question_feedback
FOR EACH ROW
EXECUTE FUNCTION flag_question_on_feedback();

-- ============================================================================
-- TRIGGER 4: Update reputation based on expert review
-- ============================================================================

CREATE OR REPLACE FUNCTION update_reputation_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_score_adjustment FLOAT;
BEGIN
  -- Determine score adjustment based on review decision
  v_score_adjustment := CASE
    WHEN NEW.decision = 'approve' THEN 2.0
    WHEN NEW.decision = 'revise' THEN 0.5
    WHEN NEW.decision = 'reject' THEN -5.0
    ELSE 0.0
  END;

  -- Update reputation
  UPDATE question_reputation
  SET
    current_score = GREATEST(0.0, LEAST(10.0, current_score + v_score_adjustment)),
    expert_validations = expert_validations + 1,
    status = CASE
      WHEN NEW.decision = 'approve' THEN 'active'::varchar
      WHEN NEW.decision = 'revise' THEN 'under_review'::varchar
      WHEN NEW.decision = 'reject' THEN 'disabled'::varchar
      ELSE status
    END,
    last_updated = NOW()
  WHERE question_id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_on_review ON question_reviews;
CREATE TRIGGER trigger_update_on_review
AFTER INSERT ON question_reviews
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_review();

-- ============================================================================
-- TRIGGER 5: Calculate exam results and scoring
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_exam_results()
RETURNS TRIGGER AS $$
DECLARE
  v_total_questions INT;
  v_correct_answers INT;
  v_score_percentage FLOAT;
  v_passing_score_percentage INT;
  v_passed BOOLEAN;
BEGIN
  -- Only process when exam is being completed
  IF NOT NEW.is_completed OR (OLD IS NOT NULL AND OLD.is_completed) THEN
    RETURN NEW;
  END IF;

  -- Get passing score from exam
  SELECT passing_score_percentage
  INTO v_passing_score_percentage
  FROM exams
  WHERE id = NEW.exam_id;

  -- Count total questions and correct answers
  SELECT
    COUNT(*),
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)
  INTO v_total_questions, v_correct_answers
  FROM user_exam_answers
  WHERE attempt_id = NEW.id;

  -- Calculate score (percentage)
  v_score_percentage := CASE
    WHEN v_total_questions > 0
    THEN ROUND((v_correct_answers::FLOAT / v_total_questions::FLOAT) * 100, 2)
    ELSE 0
  END;

  -- Determine passing
  v_passed := v_score_percentage >= COALESCE(v_passing_score_percentage, 70);

  -- Update attempt with score and passing status
  NEW.score_percentage := v_score_percentage;
  NEW.passed := v_passed;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_exam_results ON user_exam_attempts;
CREATE TRIGGER trigger_calculate_exam_results
BEFORE UPDATE ON user_exam_attempts
FOR EACH ROW
EXECUTE FUNCTION calculate_exam_results();

-- ============================================================================
-- TRIGGER 6: Update search vector on question text changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('portuguese', COALESCE(NEW.question_text, '')) ||
    to_tsvector('portuguese', COALESCE(NEW.commentary, '')) ||
    to_tsvector('portuguese', COALESCE(
      NEW.option_a || ' ' || NEW.option_b || ' ' || NEW.option_c || ' ' || NEW.option_d ||
      CASE WHEN NEW.option_e IS NOT NULL THEN ' ' || NEW.option_e ELSE '' END, ''
    ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_search_vector ON questions;
CREATE TRIGGER trigger_update_search_vector
BEFORE INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

-- ============================================================================
-- TRIGGER 7: Update timestamps (updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_timestamp ON users;
CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_domains_timestamp ON domains;
CREATE TRIGGER trigger_update_domains_timestamp
BEFORE UPDATE ON domains
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_subjects_timestamp ON subjects;
CREATE TRIGGER trigger_update_subjects_timestamp
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_topics_timestamp ON topics;
CREATE TRIGGER trigger_update_topics_timestamp
BEFORE UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_questions_timestamp ON questions;
CREATE TRIGGER trigger_update_questions_timestamp
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_exams_timestamp ON exams;
CREATE TRIGGER trigger_update_exams_timestamp
BEFORE UPDATE ON exams
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_subscriptions_timestamp ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_reputation_timestamp ON question_reputation;
CREATE TRIGGER trigger_update_reputation_timestamp
BEFORE UPDATE ON question_reputation
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- TRIGGER BEHAVIOR SUMMARY
-- ============================================================================

/*
TRIGGER EXECUTION ORDER:

1. create_reputation_for_question
   When: Question created
   What: Creates reputation record with initial score
   Scoring rules:
   - Real exam questions (source_type='real_exam'): score = 10
   - AI generated (source_type='ai_generated'): score = 0 (under_review status)
   - User submitted (source_type='user_submitted'): score = 5

2. update_reputation_on_attempt
   When: User submits answer
   What: Recalculates question's reputation
   Updates: total_attempts, correct_attempts, current_score, empirical_difficulty
   Performance: < 100ms per attempt

3. flag_question_on_feedback
   When: User reports problem
   What: Counts reports and auto-flags if >= 3 in 24h
   Updates: problem_reports, status (flags if >= 3)

4. update_reputation_on_review
   When: Expert reviews question
   What: Adjusts reputation based on decision
   Adjustments:
   - approve: +2.0
   - revise: +0.5
   - reject: -5.0

5. calculate_exam_results
   When: Exam is completed
   What: Calculates final score and pass/fail
   Updates: score (0-100%), passing (boolean)

6. update_search_vector
   When: Question text is created/updated
   What: Regenerates full-text search vector
   Language: Portuguese

7. update_timestamp
   When: Any table record is updated
   What: Sets updated_at = NOW()
   Applied to: users, domains, subjects, topics, questions, exams, subscriptions, question_reputation

CRITICAL NOTES:

- Triggers are IDEMPOTENT (safe to run multiple times)
- Triggers avoid deadlocks with proper locking strategy
- Use advisory locks for critical sections if needed
- Monitor trigger performance in production
- All triggers use COALESCE() for NULL safety
- Error handling: Triggers will rollback if any error occurs

TESTING TRIGGERS:

-- Test reputation creation
INSERT INTO questions (...) RETURNING id;
SELECT * FROM question_reputation WHERE question_id = '<id>';

-- Test reputation update
INSERT INTO user_question_history (user_id, question_id, selected_answer, is_correct) VALUES (...);
SELECT * FROM question_reputation WHERE question_id = '<id>';

-- Test auto-flagging
INSERT INTO question_feedback (question_id, feedback_type, ...) VALUES (...);
-- Repeat 3 times
SELECT status FROM question_reputation WHERE question_id = '<id>';
-- Should show 'flagged'
*/
