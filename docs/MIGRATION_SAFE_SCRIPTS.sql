-- ============================================================================
-- SAFE MIGRATION SCRIPTS - Fase 1
-- Para aplicar em: Supabase Dashboard > SQL Editor
-- ============================================================================
-- ANTES DE EXECUTAR:
-- 1. Faça backup do banco de dados
-- 2. Execute UM script por vez
-- 3. Aguarde a conclusão antes de executar o próximo
-- ============================================================================

-- ============================================================================
-- SCRIPT 1: 005_create_import_tables.sql
-- Objetivo: Criar tabelas para rastreamento de importações CSV
-- Segurança: ✅ SEGURO - Novas tabelas, sem conflitos
-- ============================================================================

CREATE TYPE import_status_enum AS ENUM ('queued', 'in_progress', 'completed', 'failed', 'rollback');

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

CREATE TABLE IF NOT EXISTS import_question_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES question_imports(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (import_id, question_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_question_imports_admin_id ON question_imports(admin_id);
CREATE INDEX IF NOT EXISTS idx_question_imports_status ON question_imports(status);
CREATE INDEX IF NOT EXISTS idx_question_imports_created_at ON question_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_question_mapping_import_id ON import_question_mapping(import_id);
CREATE INDEX IF NOT EXISTS idx_import_question_mapping_question_id ON import_question_mapping(question_id);

-- RLS Policies
ALTER TABLE question_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_question_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_imports_admin_access ON question_imports
  FOR ALL
  USING (admin_id = public.app_uid())
  WITH CHECK (admin_id = public.app_uid());

CREATE POLICY import_question_mapping_isolation ON import_question_mapping
  FOR ALL
  USING (
    import_id IN (
      SELECT id FROM question_imports WHERE admin_id = public.app_uid()
    )
  );

-- Helper Function: Get import progress
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

-- Helper Function: Rollback an import
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
  SELECT admin_id INTO v_admin_id
  FROM question_imports
  WHERE id = p_import_id;

  IF v_admin_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Import not found'::TEXT;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM import_question_mapping
  WHERE import_id = p_import_id;

  DELETE FROM questions
  WHERE id IN (
    SELECT question_id FROM import_question_mapping WHERE import_id = p_import_id
  );

  UPDATE question_imports
  SET status = 'rollback', completed_at = NOW()
  WHERE id = p_import_id;

  RETURN QUERY SELECT true, v_count, format('Rolled back %s questions', v_count)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Helper Function: Get import history
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

-- Verification
SELECT 'SUCCESS: Import tables created' AS result;

-- ============================================================================
-- FIM SCRIPT 1
-- ============================================================================


-- ============================================================================
-- SCRIPT 2: 006_create_admin_views.sql
-- Objetivo: Criar materialized view para dashboard admin
-- Segurança: ✅ SEGURO - Apenas view, sem conflitos
-- ============================================================================

CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE is_active = true AND user_role != 'admin') as total_users,
  (SELECT COUNT(DISTINCT user_id) FROM user_question_history WHERE created_at >= NOW() - INTERVAL '30 days') as active_users_30d,
  (SELECT COUNT(DISTINCT user_id) FROM user_question_history WHERE created_at >= NOW() - INTERVAL '7 days') as active_users_7d,
  (SELECT COUNT(DISTINCT user_id) FROM user_question_history WHERE created_at >= NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM questions) as total_questions,
  (SELECT COUNT(*) FROM questions WHERE source_type = 'real_exam') as real_exam_questions,
  (SELECT COUNT(*) FROM questions WHERE source_type = 'ai_generated') as ai_generated_questions,
  (SELECT COUNT(*) FROM question_imports WHERE status = 'completed') as total_completed_imports,
  (SELECT COUNT(*) FROM question_imports WHERE status = 'failed') as total_failed_imports,
  (SELECT MAX(created_at) FROM question_imports WHERE status = 'completed') as last_import_date,
  (SELECT AVG(current_score) FROM question_reputation) as avg_question_reputation,
  (SELECT COUNT(*) FROM question_feedback WHERE status = 'pending') as pending_feedback_count,
  NOW() as last_updated;

CREATE UNIQUE INDEX idx_admin_dashboard_stats_updated ON admin_dashboard_stats (last_updated);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_admin_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refresh_admin_dashboard_stats TO authenticated;

-- Additional indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_question_reputation_score ON question_reputation(current_score);
CREATE INDEX IF NOT EXISTS idx_user_question_history_created_at ON user_question_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_imports_status_created ON question_imports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_feedback_status ON question_feedback(status);

-- Verification
SELECT 'SUCCESS: Admin dashboard view created' AS result;

-- ============================================================================
-- FIM SCRIPT 2
-- ============================================================================


-- ============================================================================
-- SCRIPT 3: VERIFICAÇÃO - Executar ANTES de aplicar incrementais de exam
-- Objetivo: Verificar estrutura de user_exam_attempts e user_exam_answers
-- ============================================================================

-- Verificar colunas existentes em user_exam_attempts
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_exam_attempts'
ORDER BY ordinal_position;

-- Verificar colunas existentes em user_exam_answers
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_exam_answers'
ORDER BY ordinal_position;

-- Se houver colunas faltantes em 003_create_exam_attempts.sql:
-- Execute ALTERs abaixo (SOMENTE SE NECESSÁRIO):

-- Exemplo (descomente se necessário):
-- ALTER TABLE user_exam_attempts ADD COLUMN IF NOT EXISTS weak_areas JSONB;
-- ALTER TABLE user_exam_answers ADD COLUMN IF NOT EXISTS time_spent_seconds INT;

-- ============================================================================
-- FIM SCRIPT 3
-- ============================================================================


-- ============================================================================
-- SCRIPT 4: VERIFICAÇÃO - Índices duplicados (007_add_performance_indexes)
-- ============================================================================

-- Ver todos os índices existentes
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Índices que PODEM estar faltando de 007_add_performance_indexes.sql:
-- Se NÃO aparecer na lista acima, execute:

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_question ON exam_questions(exam_id, question_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt_question ON user_exam_answers(attempt_id, question_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt_id ON user_exam_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_uqh_user_question ON user_question_history(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_uqh_user_created_at ON user_question_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qfeedback_question_submitted ON question_feedback(question_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_qfeedback_question_type ON question_feedback(question_id, feedback_type);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON user_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_created ON user_exam_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qimport_status_created ON question_imports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qimport_created_by ON question_imports(admin_id, created_at DESC);

-- ============================================================================
-- FIM SCRIPT 4
-- ============================================================================


-- ============================================================================
-- FINAL: Verificação da aplicação
-- ============================================================================

SELECT
  'question_imports' AS table_name,
  COUNT(*) AS row_count
FROM question_imports
UNION ALL
SELECT
  'import_question_mapping',
  COUNT(*)
FROM import_question_mapping
UNION ALL
SELECT
  'admin_dashboard_stats',
  COUNT(*)
FROM admin_dashboard_stats;

-- Se todos retornam 0 ou 1 (para view), está correto ✅
