# 📊 Plano de Migrações Incrementais - src/database/migrations

## ✅ Status Atual

### Base Aplicada
- `/docs/sql/001_init_schema.sql` ✅
- `/docs/sql/002_create_indexes.sql` ✅
- `/docs/sql/003_create_triggers.sql` ✅
- `/docs/sql/004_enable_rls.sql` ✅
- `/docs/sql/005_create_views.sql` ✅
- `/docs/sql/006_auth_rls_policies.sql` ✅
- `/docs/sql/006_enable_rls_submission_reputation.sql` ✅

### Incrementais Já Aplicados
- `src/database/migrations/001_create_question_sources.sql` ✅

### Schema Atual (18 tabelas)
```
audit_log
domains
exam_questions
exams
question_bank_versions
question_feedback
question_reputation
question_reviews
question_sources ✅ (novo)
question_topics
questions
subjects
subscriptions
topics
user_exam_answers
user_exam_attempts
user_question_history
users
```

---

## 🚨 CONFLITO CRÍTICO DETECTADO

### Problema: Nomes de Tabelas Diferentes

Os incrementais usam **nomes diferentes** das tabelas da base:

| Tabela Base | Incremental (003) | Status |
| --- | --- | --- |
| `user_exam_attempts` | `exam_attempts` | 🔴 CONFLITO |
| `user_exam_answers` | `exam_answers` | 🔴 CONFLITO |

Aplicar `003_create_exam_attempts.sql` criaria **tabelas duplicadas com nomes diferentes**.

---

## 📋 Análise Final dos Incrementais

### 1️⃣ **001_create_question_sources.sql**

**Status**: ✅ **JÁ APLICADO**
- `question_sources` ✅ EXISTS
- `audit_log` ✅ EXISTS
- **Ação**: PULAR

---

### 2️⃣ **002_create_exams.sql**

**Status**: ⏭️ **PULAR**
- Tabelas `exams` e `exam_questions` **já existem na base**
- Nenhum novo campo a adicionar (parece ser duplicação)
- **Ação**: NÃO APLICAR

---

### 3️⃣ **003_create_exam_attempts.sql**

**Status**: 🔴 **CONFLITO - NÃO APLICAR**

**Problema**:
```sql
CREATE TABLE exam_attempts (...)  -- ❌ Conflita
CREATE TABLE exam_answers (...)   -- ❌ Conflita
CREATE TABLE exam_results (...)   -- ⚠️ Novo?
```

**Base já tem**:
- `user_exam_attempts` ✅
- `user_exam_answers` ✅

**Colunas diferentes?** Precisa verificar se estrutura é compatível.

**Ação**:
- ✅ Se colunas são iguais: PULAR
- ⚠️ Se tem colunas novas: Fazer ALTER TABLE ao invés

**Verificação necessária**:
```sql
-- Comparar estruturas
\d user_exam_attempts
\d user_exam_answers

-- Se faltam colunas (ex: weak_areas em exam_results):
-- Fazer ALTER TABLE user_exam_attempts ADD COLUMN weak_areas JSONB;
```

---

### 4️⃣ **004_create_scoring_trigger.sql**

**Status**: 🔴 **BLOQUEADO - NÃO APLICAR**

**Problemas**:
1. Chama `calculate_exam_score()` que **não existe**
   - Precisa ser definida em `/docs/sql/003_create_triggers.sql`
   - Se não está lá, essa função precisa ser criada

2. Referencia `exam_attempts` que conflita (ver #3)

3. Referencia `exam_results` que pode não existir

**Ação**: BLOQUEADO até resolver conflito #3

---

### 5️⃣ **005_create_import_tables.sql**

**Status**: ✅ **SEGURO - APLICAR**

**Tabelas novas**:
- `question_imports` (nova)
- `import_question_mapping` (nova)

**Compatibilidade**: ✅ SIM
- Sem conflitos
- Adiciona funcionalidade de rollback de import
- Referencia tabelas existentes

**Ação**: ✅ **APLICAR AGORA**

---

### 6️⃣ **006_create_admin_views.sql**

**Status**: ✅ **SEGURO - APLICAR**

**Recursos**:
- `admin_dashboard_stats` (materialized view, nova)
- `refresh_admin_dashboard_stats()` (função, nova)
- Índices adicionais

**Compatibilidade**: ✅ SIM
- Referencia tabelas existentes
- Adiciona apenas performance optimization
- Sem conflitos

**Ação**: ✅ **APLICAR DEPOIS** (após dados serem inseridos)

---

### 7️⃣ **007_add_performance_indexes.sql**

**Status**: ⚠️ **POSSÍVEL DUPLICAÇÃO**

**Índices a adicionar**:
```sql
idx_exam_questions_exam_id
idx_exam_questions_exam_question
idx_exam_answers_attempt_question
idx_exam_answers_attempt_id
idx_uqh_user_question
idx_uqh_user_created_at
idx_qfeedback_question_submitted
idx_qfeedback_question_type
idx_exam_attempts_user_id
idx_exam_attempts_user_created
idx_qimport_status_created
idx_qimport_created_by
```

**Problema**: `/docs/sql/002_create_indexes.sql` já cria muitos índices.

**Verificação necessária**:
```sql
-- Ver índices existentes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;

-- Se índice já existe, Supabase dirá "duplicate key"
-- Solução: Usar IF NOT EXISTS
```

**Ação**: ⚠️ **VERIFICAR ANTES DE APLICAR**
- Se índice não existe: adicionar
- Se existe: pular

---

## 🎯 Plano de Ação Recomendado

### **Fase 1: Aplicar Incrementais Seguros**

Executar NO Supabase Dashboard SQL Editor:

#### Passo 1: Aplicar 005_create_import_tables.sql
```sql
-- Import tracking system
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_question_imports_admin_id ON question_imports(admin_id);
CREATE INDEX IF NOT EXISTS idx_question_imports_status ON question_imports(status);
CREATE INDEX IF NOT EXISTS idx_question_imports_created_at ON question_imports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_question_mapping_import_id ON import_question_mapping(import_id);
CREATE INDEX IF NOT EXISTS idx_import_question_mapping_question_id ON import_question_mapping(question_id);

-- RLS
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

-- Funções (copiar de 005_create_import_tables.sql)
-- ... get_import_progress, rollback_import, get_import_history
```

#### Passo 2: Aplicar 006_create_admin_views.sql
```sql
-- Admin Dashboard Materialized View
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

CREATE OR REPLACE FUNCTION refresh_admin_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refresh_admin_dashboard_stats TO authenticated;
```

---

### **Fase 2: Resolver Conflitos**

**Conflito #1: exam_attempts vs user_exam_attempts**

Executar verificação:
```sql
-- Ver estrutura existente
\d user_exam_attempts
\d user_exam_answers

-- Se 003_create_exam_attempts.sql tem colunas que faltam:
-- ALTER TABLE user_exam_attempts ADD COLUMN ... ;
-- ALTER TABLE user_exam_answers ADD COLUMN ... ;
```

**Conflito #2: calculate_exam_score() falta**

Procurar em `/docs/sql/003_create_triggers.sql`:
```bash
grep -n "calculate_exam_score" docs/sql/003_create_triggers.sql
```

Se não encontrar, essa função precisa ser criada.

**Conflito #3: Índices duplicados**

Verificar quais índices faltam:
```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_exam%' OR indexname LIKE 'idx_uqh%'
ORDER BY indexname;
```

Aplicar apenas os que faltam de `007_add_performance_indexes.sql`.

---

### **Fase 3: Rejeitar/Pular**

- ❌ NÃO aplicar: `002_create_exams.sql` (duplicação)
- ❌ NÃO aplicar: `003_create_exam_attempts.sql` (conflito de nomes)
- ❌ NÃO aplicar: `004_create_scoring_trigger.sql` (bloqueado)

---

## ✅ Resumo Executivo

| # | Arquivo | Ação | Razão |
| --- | --- | --- | --- |
| 1️⃣ | 001_create_question_sources.sql | ⏭️ PULAR | Já aplicado |
| 2️⃣ | 002_create_exams.sql | ❌ NÃO | Duplicação |
| 3️⃣ | 003_create_exam_attempts.sql | ❌ NÃO | Conflito de nomes |
| 4️⃣ | 004_create_scoring_trigger.sql | ❌ NÃO | Bloqueado |
| 5️⃣ | 005_create_import_tables.sql | ✅ SIM | Novo, seguro |
| 6️⃣ | 006_create_admin_views.sql | ✅ SIM | Novo, seguro |
| 7️⃣ | 007_add_performance_indexes.sql | ⚠️ VERIFICAR | Possível duplicação |

---

## 🔗 Próximos Passos

1. **Você executar** Fase 1 (005 + 006) no Supabase
2. **Resolver** Conflitos em Fase 2
3. **Confirmar** que schema está correto

Quer que eu prepare os scripts SQL prontos para copiar-colar?
