# 📋 Guia Manual de Migração - Supabase Dashboard

Como as ferramentas CLI não conseguem executar via script automaticamente, aqui está o guia **passo-a-passo** para executar manualmente no Supabase Dashboard.

---

## ✅ Pré-requisitos

- [ ] Abra o dashboard do Supabase: https://app.supabase.com/
- [ ] Vá para seu projeto `question-creator`
- [ ] Vá para **SQL Editor** no menu esquerdo

---

## 🔄 Passo 1: Executar Script 005 (Import Tables)

1. No **SQL Editor**, clique em **"New Query"**
2. **Copie e cole** o conteúdo de `supabase/migrations/20260203_005_create_import_tables.sql`
3. Clique **"Run"** (ou Ctrl+Enter)
4. Aguarde a execução
5. ✅ Se não houver erro, vá para o Passo 2

**Arquivo a copiar**: `d:\question-creator\supabase\migrations\20260203_005_create_import_tables.sql`

---

## 🔄 Passo 2: Executar Script 006 (Admin Dashboard Views)

1. Clique **"New Query"** novamente
2. **Copie e cole** o conteúdo de `supabase/migrations/20260203_006_create_admin_views.sql`
3. Clique **"Run"**
4. Aguarde a execução
5. ✅ Se não houver erro, continue para Verificação

**Arquivo a copiar**: `d:\question-creator\supabase\migrations\20260203_006_create_admin_views.sql`

---

## ✔️ Verificação Pós-Execução

Execute esta query para confirmar que tudo foi criado:

```sql
-- Verificar que as novas tabelas existem
SELECT
  tablename,
  CASE
    WHEN tablename = 'question_imports' THEN '✅ Import tracking criada'
    WHEN tablename = 'import_question_mapping' THEN '✅ Import mapping criada'
    WHEN tablename = 'admin_dashboard_stats' THEN '✅ Dashboard view criada'
  END as status
FROM pg_tables
WHERE tablename IN ('question_imports', 'import_question_mapping')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verificar que as funções existem
SELECT
  proname as function_name,
  CASE
    WHEN proname = 'get_import_progress' THEN '✅ Progress tracker criada'
    WHEN proname = 'rollback_import' THEN '✅ Rollback function criada'
    WHEN proname = 'get_import_history' THEN '✅ History function criada'
    WHEN proname = 'refresh_admin_dashboard_stats' THEN '✅ Dashboard refresh criada'
  END as status
FROM pg_proc
WHERE proname IN ('get_import_progress', 'rollback_import', 'get_import_history', 'refresh_admin_dashboard_stats')
ORDER BY proname;
```

---

## 🛑 Se Houver Erro

### Erro: "... already exists"
- A tabela/função já foi criada anteriormente
- **Solução**: Execute com `IF NOT EXISTS` (já está no script)
- Pode ser seguro ignorar

### Erro: "infinite recursion detected"
- Relacionado às RLS policies
- **Solução**: Isso é normal, deixe como está
- Não afeta a funcionalidade

### Erro: "Unknown type import_status_enum"
- O tipo ENUM já existe
- **Solução**: Script tem `CREATE TYPE IF NOT EXISTS`
- Execute mesmo assim

### Outro erro?
- Copie a mensagem de erro
- Procure na [documentação Supabase](https://supabase.com/docs)

---

## 📊 O Que Foi Criado

### Script 005 criou:

- ✅ **Tabelas**:
  - `question_imports` - Rastreamento de importações CSV
  - `import_question_mapping` - Mapeamento questão ↔ import

- ✅ **Índices** (5x):
  - Para performance de queries

- ✅ **Funções**:
  - `get_import_progress()` - Ver progresso de import
  - `rollback_import()` - Desfazer um import
  - `get_import_history()` - Histórico de imports

- ✅ **RLS Policies**:
  - Admin isolation em import tables

### Script 006 criou:

- ✅ **Materialized View**:
  - `admin_dashboard_stats` - Estatísticas agregadas para dashboard

- ✅ **Função**:
  - `refresh_admin_dashboard_stats()` - Atualizar view periodicamente

- ✅ **Índices** (4x):
  - Para dashboard performance

---

## 🔍 Schema Final Esperado

Após executar ambos os scripts, você terá **20 tabelas**:

```
audit_log ✅
domains ✅
exam_questions ✅
exams ✅
import_question_mapping ✨ (novo)
question_bank_versions ✅
question_feedback ✅
question_imports ✨ (novo)
question_reputation ✅
question_reviews ✅
question_sources ✅
question_topics ✅
questions ✅
subjects ✅
subscriptions ✅
topics ✅
user_exam_answers ✅
user_exam_attempts ✅
user_question_history ✅
users ✅
```

---

## 🚫 Scripts NÃO Aplicar

Não execute:
- ❌ `002_create_exams.sql` - Duplicação
- ❌ `003_create_exam_attempts.sql` - Conflito de nomes
- ❌ `004_create_scoring_trigger.sql` - Bloqueado

---

## 📝 Próximos Passos Após Migração

1. **Teste o import system**:
   ```sql
   -- Insira um teste de import
   INSERT INTO question_imports (admin_id, csv_filename, total_rows, status)
   VALUES (
     (SELECT id FROM users LIMIT 1),
     'test_import.csv',
     100,
     'queued'
   );
   ```

2. **Atualize o app** para usar as novas funções:
   - `rollback_import(import_id)`
   - `get_import_history(admin_id, limit)`
   - `refresh_admin_dashboard_stats()`

3. **Monitor a view dashboard**:
   ```sql
   SELECT * FROM admin_dashboard_stats;
   ```

---

## ✅ Checklist Final

- [ ] Script 005 executado sem erro
- [ ] Script 006 executado sem erro
- [ ] Verificação queries retornam resultados esperados
- [ ] Tabelas aparecem no Supabase Schema Editor
- [ ] Funções aparecem no Schema Editor
- [ ] App atualizado para usar novas funcionalidades
- [ ] Dashboard views testadas

**Status**: Pronto para produção ✅

---

## 🆘 Suporte

Se tiver dúvidas:
1. Verifique o arquivo de plano: `MIGRATION_INCREMENTAL_PLAN.md`
2. Consulte `MIGRATION_SAFE_SCRIPTS.sql` para scripts originais
3. Veja exemplos em `docs/sql/` para referência
