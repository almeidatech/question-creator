# 🗄️ Database Migrations & Setup (Supabase Optimized)

Bem-vindo ao guia de SQL para **Question Creator MVP** com **Supabase**!

Este diretório contém 5 arquivos de migração SQL que você deve executar em ordem para configurar o banco de dados PostgreSQL (Supabase).

---

## ⚡ Mudanças Implementadas (v2.0)

✅ **Alinhamento com BANCO_DE_DADOS_DIAGRAMA.md**
- 16 tabelas (não 15) incluindo subscriptions
- Campos corrigidos conforme especificação
- Nomes de campos padronizados (selected_answer, option_a/b/c/d/e)
- Suporte a opção E (5ª resposta opcional)

✅ **Otimização para Supabase**
- TIMESTAMPTZ em todos os timestamps (timezone safety)
- UUIDs com gen_random_uuid() (Supabase nativo)
- RLS policies prontas para Supabase Auth
- Storage para avatars (avatar_url como URL)

✅ **Novos Campos Adicionados**
- `session_id` em user_question_history (agrupar sessões)
- `context` em user_question_history (practice/exam_simulation)
- `is_priority` em question_feedback (auto-flag)
- `reviewer_notes` em question_feedback
- Campos opcionais para 5ª resposta (option_e)

---

## 📋 Ordem de Execução

Execute os arquivos **nesta ordem exata**:

```bash
1️⃣  001_init_schema.sql     # 16 tabelas + dados iniciais
2️⃣  002_create_indexes.sql  # 40+ índices para performance
3️⃣  003_create_triggers.sql # 7 triggers automáticos
4️⃣  004_enable_rls.sql      # RLS policies (Supabase Auth)
5️⃣  005_create_views.sql    # 11 views para queries complexas
```

**⚠️ ORDEM CRÍTICA - NÃO PULE!**

---

## 📊 Estrutura das Tabelas (v2.0)

### 1. Authentication (1 tabela)
- **users** - Integrado com Supabase Auth

### 2. Taxonomy (4 tabelas)
- **domains** - Direito Constitucional, etc.
- **subjects** - Direitos Fundamentais, etc.
- **topics** - Liberdade de Expressão, etc.
- **question_bank_versions** - Versionamento CSV (rollback support)

### 3. Questions (3 tabelas)
- **questions** - 13.9k questões + geradas (16 campos)
- **question_topics** - N:M com relevance_score
- **question_reputation** - Score 0-10 + stats

### 4. Quality & Feedback (3 tabelas)
- **question_feedback** - Problemas reportados + status
- **question_reviews** - Validação de especialistas
- (Nota: adicionada coluna is_priority)

### 5. History & Subscriptions (2 tabelas)
- **user_question_history** - Tentativas com session_id + context
- **subscriptions** - Planos (free/basic/premium/enterprise)

### 6. Exams (4 tabelas)
- **exams** - Provas customizadas
- **exam_questions** - N:M ordenado
- **user_exam_attempts** - Sessões de prova
- **user_exam_answers** - Respostas individuais

---

## 🚀 Setup Rápido

### Opção 1: Supabase (Recomendado)

```bash
# Install Supabase CLI
npm install -g supabase

# Link ao projeto Supabase
supabase link --project-ref xxxxx

# Push migrations
supabase db push

# Verificar status
supabase status
```

### Opção 2: PostgreSQL Local

```bash
# Conectar ao banco
psql -h localhost -U postgres -d question_creator_dev

# Executar scripts
\i 001_init_schema.sql
\i 002_create_indexes.sql
\i 003_create_triggers.sql
\i 004_enable_rls.sql
\i 005_create_views.sql

# Verificar
\dt
\di
\dv
```

### Opção 3: DBeaver

1. Database → New Connection → PostgreSQL
2. Conectar ao banco
3. File → Open SQL Script
4. Execute cada arquivo em ordem

---

## ✅ Checklist Pós-Setup

- [ ] 001_init_schema.sql executado (16 tabelas criadas)
- [ ] 002_create_indexes.sql executado (40+ índices)
- [ ] 003_create_triggers.sql executado (7 funções)
- [ ] 004_enable_rls.sql executado (RLS policies)
- [ ] 005_create_views.sql executado (11 views)
- [ ] Verificar tabelas: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
- [ ] Verificar dados iniciais: `SELECT * FROM domains;`
- [ ] Teste de trigger: INSERT question, verificar reputation

---

## 🧪 Testes Rápidos

### Teste 1: Criar usuário

```sql
-- Criar usuário
INSERT INTO users (email, name, role, password_hash)
VALUES ('test@example.com', 'Test User', 'student', 'hash_placeholder');

SELECT * FROM users WHERE email = 'test@example.com';
```

### Teste 2: Criar questão e verificar trigger

```sql
-- Inserir questão
INSERT INTO questions (
  question_bank_version_id,
  question_text,
  option_a, option_b, option_c, option_d,
  correct_answer,
  difficulty,
  source_type
) VALUES (
  (SELECT id FROM question_bank_versions LIMIT 1),
  'O que é Direito Constitucional?',
  'Direito da constituição',
  'Direito de votar',
  'Direito de trabalhar',
  'Nenhuma opção',
  'a',
  'easy',
  'user_submitted'
);

-- Verificar se reputation foi criada (trigger)
SELECT * FROM question_reputation
WHERE question_id = (SELECT id FROM questions ORDER BY created_at DESC LIMIT 1);
-- Deve mostrar current_score = 5 (user_submitted)
```

### Teste 3: Registrar tentativa

```sql
-- Simular resposta
INSERT INTO user_question_history (
  user_id,
  question_id,
  selected_answer,
  is_correct,
  response_time_ms,
  context
) SELECT
  u.id,
  q.id,
  'a',
  true,
  3500,
  'practice'
FROM users u, questions q
WHERE u.email = 'test@example.com'
LIMIT 1;

-- Verificar reputation atualizada
SELECT * FROM question_reputation
WHERE question_id = (SELECT id FROM questions ORDER BY created_at DESC LIMIT 1);
-- total_attempts deve ser 1, correct_attempts = 1
```

### Teste 4: Feedback e auto-flagging

```sql
-- Reportar problema 3x para auto-flag
INSERT INTO question_feedback (
  question_id,
  user_id,
  category,
  feedback_text,
  status
) SELECT
  q.id,
  u.id,
  'incorrect_answer',
  'Resposta A está errada',
  'pending'
FROM users u, questions q
WHERE u.email = 'test@example.com'
LIMIT 1;

-- Repetir 3x (em 3 transações diferentes)
-- Após 3a inserção, reputation.status deve ser 'flagged'
SELECT status FROM question_reputation
WHERE question_id = (SELECT id FROM questions ORDER BY created_at DESC LIMIT 1);
-- Deve mostrar 'flagged' após 3 reports
```

---

## 🔍 Monitoramento

### Índices não usados

```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(relid) DESC;
```

### Triggers ativos

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

### RLS policies ativas

```sql
SELECT schemaname, tablename, policyname, QUAL, WITH_CHECK
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Tamanho total do banco

```sql
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Por tabela
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📈 Performance Targets

| Operação | Target | Status |
|----------|--------|--------|
| Full-text search (13.9k) | < 200ms | 🟡 Test |
| Dashboard stats | < 100ms | 🟡 Test |
| Reputation ranking | < 50ms | 🟡 Test |
| Feedback queue | < 100ms | 🟡 Test |
| Question insert + trigger | < 50ms | 🟡 Test |

Execute após setup e reporte valores reais!

---

## 🆘 Troubleshooting

### Erro: "relation already exists"

```sql
-- Script já foi executado
-- Para limpar (CUIDADO - deleta TUDO):
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
```

### Erro: "UUID type does not exist"

```sql
-- Extension não carregada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: "permission denied"

```bash
# No Supabase, use service role key
# No local, grant permissions:
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### RLS bloqueando queries

```sql
-- Verificar RLS status
SELECT tablename, rls_enabled FROM pg_tables WHERE schemaname = 'public';

-- Desabilitar temporariamente (TESTE ONLY):
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- Re-habilitar:
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
```

---

## 🔗 Supabase Integration

### Environment Variables

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx (backend only!)
```

### Supabase Auth com Usuários

```typescript
// No backend (com SERVICE_KEY)
const { data } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'SecurePass123!',
  email_confirm: true,
});

// Sincronizar com tabela users
await supabase
  .from('users')
  .insert({ id: data.user.id, email: data.user.email });
```

### Real-time Subscriptions

```typescript
// Listen to changes
const subscription = supabase
  .from('questions')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe();
```

---

## 📚 Arquivos Relacionados

- **[DATABASE_ANALYSIS.md](../DATABASE_ANALYSIS.md)** - Análise arquitetural
- **[BANCO_DE_DADOS_DIAGRAMA.md](../BANCO_DE_DADOS_DIAGRAMA.md)** - Diagrama ER (referência)
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Design geral
- **[USER_STORIES.md](../USER_STORIES.md)** - Features a implementar

---

## 📝 Changelog v2.0

### Schema Changes
- Adicionado campo `option_e` (5ª opção opcional)
- Adicionado `session_id` em user_question_history
- Adicionado `context` em user_question_history
- Adicionado `is_priority` em question_feedback
- Adicionado `reviewer_notes` em question_feedback
- Mudado `selected_answer` para CHAR(1) em todas as tabelas
- Mudado `correct_answer` em questions para CHAR(1)

### Supabase Optimization
- TIMESTAMPTZ em todos os timestamps
- RLS policies prontas para Supabase Auth
- Removido password_hash complexity (Supabase Auth handles)
- Adicionado avatar_url (Supabase Storage)

### New Features
- Question bank versionamento (rollback support)
- Session grouping em user_question_history
- Auto-flagging em question_feedback
- Subscription management
- Full expert validation workflow

---

**Status:** ✅ Supabase Ready (v2.0)
**Última atualização:** 2026-02-01
**Schema Version:** 2.0
