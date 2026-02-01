# 🚀 Guia de Deployment - Question Creator

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Supabase Setup](#supabase-setup)
4. [Vercel Setup](#vercel-setup)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Database Migrations](#database-migrations)
7. [Deploy em Produção](#deploy-em-produção)
8. [Monitoring e Logs](#monitoring-e-logs)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

### Arquitetura de Deployment

```text
┌─────────────────────────────────────────────────────┐
│         GitHub Repository                           │
│  (git push → triggers deployment)                   │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐          ┌────▼──────┐
    │ Vercel │          │ Supabase   │
    │(Frontend)         │(Database)  │
    └────┬───┘          └─────┬──────┘
         │                    │
    ┌────▼────────────────────▼────┐
    │  PostgreSQL + Auth + RLS      │
    │  + Edge Functions (optional)  │
    └───────────────────────────────┘
```

### Stack de Deployment

| Componente | Serviço        | Razão                                   |
| :--------- | :------------- | :-------------------------------------- |
| Frontend   | Vercel         | Integração Next.js, Edge, auto-scaling  |
| Database   | Supabase Cloud | PostgreSQL gerenciado, backup, RLS      |
| Auth       | Supabase Auth  | OAuth integrado, JWT, sessões           |
| Cache      | Upstash Redis  | Serverless Redis, auto-scaling          |
| API IA     | Anthropic      | Claude API, pay-as-you-go               |

---

## Pré-requisitos

### Contas Necessárias

- [ ] **GitHub** (free) - Repositório
- [ ] **Vercel** (free tier) - Frontend hosting
- [ ] **Supabase** (free tier) - Database + Auth
- [ ] **Upstash** (free tier) - Redis cache
- [ ] **Anthropic** (paid) - API key $5+ crédito inicial

### Softwares Locais

```bash
# Node.js 18+ ou 20+ (recomendado 20 LTS)
node --version  # v20.10.0 ou superior

# npm ou pnpm
npm --version   # v10.0.0 ou superior

# Git
git --version   # 2.40.0 ou superior

# (Opcional) Supabase CLI para migrações locais
npm install -g supabase
```

---

## Supabase Setup

### Passo 1: Criar Projeto Supabase

1. Ir para <https://supabase.com>
2. Clique em **"New Project"**
3. Preencha:
   - **Project Name:** `question-creator-prod`
   - **Database Password:** Gere senha forte (guarde!)
   - **Region:** `São Paulo (South America)` ou US East se não há SA

4. Aguarde criação (~2 minutos)

### Passo 2: Obter Credenciais

Após criação, vá para **Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**

- `ANON_KEY` → publicamente seguro (pode expor)
- `SERVICE_ROLE_KEY` → SECRETO! Nunca commit

### Passo 3: Executar Migrations

```bash
# Terminal local
supabase login
supabase link --project-ref xxxxx  # Seu project ID

# Copie suas migrations SQL para:
# supabase/migrations/
# 00001_init_schema.sql
# 00002_rls_policies.sql
# 00003_triggers.sql

# Execute migrations
supabase db push
```

### Passo 4: Setup Auth (OAuth)

Na console Supabase:

1. Vá para **Authentication → Providers**
2. Configure **Google**:
   - Vá para <https://console.cloud.google.com>
   - Crie novo projeto
   - Enable Google+ API
   - Create OAuth 2.0 Credentials (Web Application)
   - Redirect URI: `https://xxxxx.supabase.co/auth/v1/callback?provider=google`
   - Copie Client ID e Secret
   - Cole em Supabase

3. Configure **GitHub** (similar)

---

## Vercel Setup

### Passo 1: Criar Projeto Vercel

```bash
# Terminal no seu projeto local
npm install -g vercel
vercel login  # Faça login com GitHub

cd question-creator
vercel  # Deploy initial
```

Vercel detectará automaticamente Next.js.

### Passo 2: Conectar GitHub

1. Vá para <https://vercel.com/dashboard>
2. Clique em novo projeto
3. Selecione repositório GitHub `question-creator`
4. Clique **Import**

### Passo 3: Configurar Build

Em **Project Settings → Build & Development**:

```properties
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm ci
```

### Passo 4: Variáveis de Ambiente

Em **Settings → Environment Variables**, adicione:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Secrets (Production only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-...
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

**Dica:** Marque como "Production" apenas os que precisam ser secretos.

---

## Variáveis de Ambiente

### .env.local (Desenvolvimento)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Redis (Upstash)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
ENABLE_AI_GENERATION=true
ENABLE_CSV_IMPORT=true
ENABLE_EXPERT_REVIEW=true
```

### Environment Variables Production

| Variável                        | Onde   | Sensível | Escopo                 |
| :------------------------------ | :----- | :------- | :--------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Vercel | Não      | Frontend               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Não      | Frontend (RLS protege) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Vercel | **SIM**  | Backend only           |
| `ANTHROPIC_API_KEY`             | Vercel | **SIM**  | Backend only           |
| `UPSTASH_REDIS_URL`             | Vercel | **SIM**  | Backend only           |
| `UPSTASH_REDIS_TOKEN`           | Vercel | **SIM**  | Backend only           |

---

## Database Migrations

### Estrutura de Migrations

```sql
-- supabase/migrations/00001_init_schema.sql
-- Executed: CREATE TABLE users, questions, etc.

-- supabase/migrations/00002_rls_policies.sql
-- Executed: CREATE POLICY "Users can view own profile"

-- supabase/migrations/00003_triggers.sql
-- Executed: CREATE TRIGGER update_reputation_on_attempt
```

### Executar Migrations

#### Local (Desenvolvimento)

```bash
# Inicia Supabase local
supabase start

# Faz push de migrações locais para banco local
supabase db push

# Verifica status
supabase status
```

#### Produção (Remoto)

```bash
# Link a projeto remoto
supabase link --project-ref xxxxx

# Faz push para produção
supabase db push --remote

# Verifica migrações aplicadas
supabase migration list --remote
```

### Criando Nova Migration

```bash
# Supabase CLI gera novo arquivo
supabase migration new add_new_table

# Edite: supabase/migrations/xxxxx_add_new_table.sql
# Com seu SQL (CREATE TABLE, etc)

# Faça push
supabase db push
```

### Rollback (Em Caso de Erro)

```bash
# Local
supabase db reset  # Reseta para estado inicial

# Remoto (NÃO reverter automaticamente)
# Opções:
# 1. Contatar Supabase support
# 2. Restaurar de backup diário
# 3. Criar migration que desfaz mudanças
```

---

## Deploy em Produção

### Checklist Pré-Deployment

```markdown
## Verificações de Segurança
- [ ] Todas secrets em variáveis (não hardcoded)
- [ ] RLS policies habilitadas em todas tabelas
- [ ] Rate limiting configurado em APIs
- [ ] HTTPS forçado em toda aplicação
- [ ] CORS configurado corretamente

## Verificações de Performance
- [ ] Bundle size otimizado (< 500KB main)
- [ ] Índices PostgreSQL criados
- [ ] Cache Redis testado
- [ ] Load testing realizado

## Verificações Funcionais
- [ ] Auth (signup/login) testado
- [ ] CSV import testado com dados reais
- [ ] AI generation funcionando (com rate limit)
- [ ] Dashboard mostrando stats
- [ ] Mobile responsivo
```

### Deploy Workflow

#### 1. Merge para Main

```bash
# Feature branch
git checkout -b feature/new-feature
# ... code changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# GitHub: Abra Pull Request
# Code review
# Merge para main
```

#### 2. Vercel Auto-Deploy

Quando você faz merge para `main`:

- Vercel detecta automáticamente
- Roda `npm run build`
- Testa build
- Deploy para `vercel.app` (preview)
- Após aprovação → deploy para domínio principal

#### 3. Monitorar Deploy

```bash
# Vercel CLI
vercel logs  # Vê logs em tempo real

# Supabase Console
# → Monitoring → Query Performance
# → Logs → Realtime
```

### Deployment Commands

```bash
# Vercel
vercel deploy            # Deploy preview
vercel deploy --prod     # Deploy produção
vercel rollback          # Reverter última deploy

# Supabase (se usar CLI)
supabase db push --remote  # Push migrations
supabase functions deploy  # Deploy edge functions
```

---

## Monitoring e Logs

### Logs em Tempo Real

#### Vercel Logs

```bash
vercel logs  # Vê últimas requisições
vercel logs --follow  # Acompanha em tempo real
```

#### Supabase Logs

Console → Logs → Realtime:

- SQL queries
- Auth events
- RLS violations
- Performance issues

### Alertas Recomendados

1. **Error Tracking** (Sentry)

   ```bash
   npm install @sentry/nextjs
   ```

   - Captura erros frontend/backend
   - Notifica por email

2. **Performance Monitoring** (Vercel Analytics)
   - Habilitado automaticamente
   - Mostra Core Web Vitals

3. **Database Monitoring** (Supabase)
   - CPU, conexões, queries lentas
   - Alertas automáticos

### Dashboards

**Vercel Dashboard:**

- <https://vercel.com/dashboard>
- Deploys, logs, analytics

**Supabase Dashboard:**

- <https://app.supabase.com/projects>
- Banco, auth, realtime

**GitHub Actions:**

- <https://github.com/yourname/question-creator/actions>
- CI/CD status

---

## Troubleshooting

### Problema: "NEXT_PUBLIC_SUPABASE_URL is not set"

**Solução:**

```bash
# Verifique .env.local existe
cat .env.local

# Se não, copie do example
cp .env.local.example .env.local
# Preencha com valores reais

# Vercel: Cheque Settings → Environment Variables
```

### Problema: "RLS policy violation"

**Erro típico:**

```text
Error: new row violates row level security policy
```

**Solução:**

1. Verifique policy está criada: `SELECT * FROM pg_policies WHERE tablename='questions'`
2. Cheque `auth.user_id()` está retornando UUID correto
3. Teste com role correto: `SECURITY DEFINER`

### Problema: "Rate limit exceeded on Anthropic API"

**Solução:**

```typescript
// lib/anthropic/client.ts
// Implemente retry com exponential backoff
async function generateWithRetry(params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateQuestion(params);
    } catch (e) {
      if (e.status === 429) {
        await sleep(Math.pow(2, i) * 1000);  // 1s, 2s, 4s
      } else throw;
    }
  }
}
```

### Problema: "Cold start lento na primeira requisição"

**Solução:**

```bash
# Vercel: Use Edge Functions para latência menor
# Ou configure Cron jobs para warm up
```

### Problema: "Supabase auth não funciona em produção"

**Checklist:**

- [ ] OAuth redirect URI correto em Google/GitHub
- [ ] `NEXT_PUBLIC_SUPABASE_URL` correto
- [ ] Cookies estão sendo enviados (verificar DevTools)
- [ ] Domínio está whitelistado em Supabase Auth settings

---

## Rollback

### Em Caso de Problema em Produção

```bash
# Option 1: Reverter código
vercel rollback

# Option 2: Reverter database (CUIDADO!)
# Restaurar de backup
# Supabase Dashboard → Backups → Restore

# Option 3: Feature flags (mitiga problema)
# Desabilita feature problemática via env var
ENABLE_AI_GENERATION=false  # Temporário
```

---

## Checklist de Deployment

```markdown
### Antes de Deploy
- [ ] Testes passando (`npm test`)
- [ ] Build local funciona (`npm run build`)
- [ ] Environment variables configuradas
- [ ] Database migrations revisadas
- [ ] Code review completo

### Após Deploy
- [ ] Vercel build bem-sucedido
- [ ] Supabase migrations aplicadas
- [ ] Auth testado em produção
- [ ] CSV import testado
- [ ] AI generation funcionando
- [ ] Dashboard acessível
- [ ] Mobile responsive
- [ ] Logs e monitoring ativos

### 24h Depois
- [ ] Nenhum erro crítico em Sentry
- [ ] Performance estável
- [ ] Usuários conseguem signup/login
- [ ] Questões gerando sem problemas
```

---

**Próximo:** Leia [SETUP_LOCAL.md](./SETUP_LOCAL.md) para desenvolver localmente.
