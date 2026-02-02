-- Rollback: Remove performance indexes
-- Reverts migration 007_add_performance_indexes.sql

DROP INDEX IF EXISTS idx_exam_questions_exam_id;
DROP INDEX IF EXISTS idx_exam_questions_exam_question;
DROP INDEX IF EXISTS idx_exam_answers_attempt_question;
DROP INDEX IF EXISTS idx_exam_answers_attempt_id;
DROP INDEX IF EXISTS idx_uqh_user_question;
DROP INDEX IF EXISTS idx_uqh_user_created_at;
DROP INDEX IF EXISTS idx_qfeedback_question_submitted;
DROP INDEX IF EXISTS idx_qfeedback_question_type;
DROP INDEX IF EXISTS idx_exam_attempts_user_id;
DROP INDEX IF EXISTS idx_exam_attempts_user_created;
DROP INDEX IF EXISTS idx_qimport_status_created;
DROP INDEX IF EXISTS idx_qimport_created_by;
