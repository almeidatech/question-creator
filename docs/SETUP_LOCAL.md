# 🖥️ Setup Local - Desenvolvimento

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação Inicial](#instalação-inicial)
3. [Supabase Local](#supabase-local)
4. [Configuração de Variáveis](#configuração-de-variáveis)
5. [Seed de Dados](#seed-de-dados)
6. [Rodar Aplicação](#rodar-aplicação)
7. [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
8. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### Software Necessário

```bash
# Node.js 20+ (LTS recomendado)
node --version  # v20.10.0 ou superior

# npm 10+
npm --version   # v10.0.0 ou superior

# Git 2.40+
git --version   # 2.40.0 ou superior

# Docker (para Supabase local)
docker --version  # 24.0.0 ou superior
```

### Instalação (Windows/macOS/Linux)

#### Windows

```powershell
# Instalar Node.js via chocolatey
choco install nodejs docker-desktop

# Ou baixe manualmente:
# https://nodejs.org/ → Download LTS
# https://www.docker.com/products/docker-desktop
```

#### macOS

```bash
# Via Homebrew
brew install node docker

# Ou use nvm (recomendado para múltiplas versões)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y nodejs npm docker.io git

# Adicione usuário ao grupo docker
sudo usermod -aG docker $USER
```

---

## Instalação Inicial

### 1. Clone o Repositório

```bash
# Via HTTPS
git clone https://github.com/seu-user/question-creator.git
cd question-creator

# Ou via SSH
git clone git@github.com:seu-user/question-creator.git
cd question-creator
```

### 2. Instale Dependências

```bash
# Instale npm packages
npm install

# Ou se usar pnpm (mais rápido)
npm install -g pnpm
pnpm install
```

**Tempo esperado:** 2-5 minutos (depende conexão)

### 3. Instale Supabase CLI

```bash
# Via npm
npm install -g supabase

# Verifique instalação
supabase --version  # supabase-cli/1.x.x
```

---

## Supabase Local

### 1. Inicialize Supabase Localmente

```bash
# No diretório do projeto
supabase init

# Ou se já inicializado
supabase start

# Aguarde ~30-60 segundos para iniciar
```

**Saída esperada:**

```text
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
     Studio URL: http://localhost:54322
  Inbucket URL: http://localhost:54324
     DB URL: postgresql://postgres:postgres@localhost:5432/postgres
   Vector URL: http://localhost:54322
     PgBouncer: postgresql://postgres:postgres@localhost:6543/postgres
      S3 Storage: http://localhost:54321/storage/v1/s3
        S3 Bucket: stub
    Log tail URL: ws://localhost:54321/realtime/v1/messages
```

**Guarde esses URLs!**

### 2. Acesse Studio Localmente

Abra no navegador:

```text
http://localhost:54322
```

Você verá o dashboard Supabase local onde pode:

- Executar SQL
- Gerenciar dados
- Testar auth
- Ver realtime

### 3. Aplique Migrations

```bash
# Faz push das migrations para banco local
supabase db push

# Verifique que tudo foi criado
supabase db list  # Lista todas tabelas
```

**Verificação rápida:**

```sql
-- No Supabase Studio, vá para SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve listar: users, questions, topics, exams, etc.
```

---

## Configuração de Variáveis

### Crie .env.local

```bash
# Copie do template
cp .env.local.example .env.local

# Ou crie manualmente
cat > .env.local << 'EOF'
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeGJmYnhkeGJzeHd4eHhzcXhzcXhzcXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMzAxMDAwMCwiZXhwIjoxODkwNzc2NDAwfQ.actualTokenFromSupabase

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeGJmYnhkeGJzeHd4eHhzcXhzcXhzcXgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzMzMDEwMDAwLCJleHAiOjE4OTA3NzY0MDB9.actualServiceRoleKey

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Seu key Anthropic

# Redis Local (deixe vazio se não usando)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
ENABLE_AI_GENERATION=true
ENABLE_CSV_IMPORT=true
ENABLE_EXPERT_REVIEW=true
EOF
```

### Obtenha Token Supabase

Tokens estão em `supabase/config.toml` após `supabase start`:

```bash
# Veja o arquivo de configuração
cat supabase/config.toml | grep jwt_secret
```

Ou use o token padrão de desenvolvimento (já fornecido acima).

---

## Seed de Dados

### 1. Seed de Taxonomia

```bash
# Cria domains, subjects, topics
npm run seed:taxonomy
```

**Verifica:**

```sql
-- No Supabase Studio
SELECT COUNT(*) FROM topics;  -- Deve ser ~50+
```

### 2. Importar Questões (Opcional)

Se quiser testar com questões reais:

```bash
# Importa CSV (primeiras 1000 questões para testes rápidos)
npm run import:csv:sample

# Importa todas (13,917 questões - leva mais tempo)
npm run import:csv:full
```

**Tempo estimado:**

- Sample: 1-2 minutos
- Full: 10-15 minutos

**Verifica:**

```sql
SELECT COUNT(*) FROM questions;
```

### 3. Criar Usuário de Teste

```bash
# Via Supabase Studio
# Auth → Users → Add user

# Ou via SQL
INSERT INTO auth.users (email, password)
VALUES ('test@example.com', 'password123');
```

---

## Rodar Aplicação

### 1. Inicie o Dev Server

```bash
# Terminal 1: Supabase (se não estiver rodando)
supabase start

# Terminal 2: Next.js
npm run dev

# Aplicação rodará em:
# http://localhost:3000
```

### 2. Teste a Aplicação

**Signup:**

1. Acesse <http://localhost:3000>
2. Clique em "Sign Up"
3. Preencha email/senha
4. Verifique email em <http://localhost:54324> (Inbucket)

**Login:**

1. Use as credenciais criadas
2. Deve redirecionar para `/dashboard`

**Testar Questões:**

1. Vá para `/dashboard/questions`
2. Clique em "Generate Questions"
3. Selecione: Domain, Subject, Difficulty
4. Responda questões

---

## Workflow de Desenvolvimento

### Estrutura Recomendada

```bash
# 3 abas de terminal:

# Terminal 1: Supabase
supabase start

# Terminal 2: Next.js Dev
npm run dev

# Terminal 3: Comandos úteis
# (migrations, scripts, etc)
```

### Criando Nova Feature

```bash
# 1. Crie branch
git checkout -b feature/new-feature

# 2. Faça mudanças no código
# código aqui...

# 3. Se precisar migração de banco
supabase migration new add_new_column
# Edite: supabase/migrations/xxxxx_add_new_column.sql
# Rode: supabase db push

# 4. Teste localmente (deve estar rodando!)

# 5. Commit
git add .
git commit -m "Add new feature"

# 6. Push e abra PR
git push origin feature/new-feature
```

### Comandos Úteis

```bash
# Development
npm run dev          # Inicia dev server
npm run build        # Build production
npm run start        # Roda production build

# Testing
npm run test         # Roda testes
npm run test:watch  # Watch mode

# Linting
npm run lint        # ESLint
npm run format      # Prettier

# Database
supabase db push    # Push migrations
supabase db pull    # Pull schema remoto
supabase db reset   # Reset banco local

# Data
npm run seed:taxonomy      # Seed taxonomia
npm run import:csv:sample  # Import questões (sample)
npm run import:csv:full    # Import questões (todas)
```

---

## Troubleshooting

### Problema: "Port 5432 already in use"

**Solução:**

```bash
# Mate containers Docker existentes
docker ps
docker kill <container_id>

# Ou use porta diferente
POSTGRES_PORT=5433 supabase start
```

### Problema: "Cannot connect to Supabase"

**Solução:**

```bash
# Verifique se Supabase está rodando
supabase status

# Se não estiver:
supabase start

# Verifique .env.local tem URL correta
grep SUPABASE_URL .env.local
```

### Problema: "Module not found: @supabase/supabase-js"

**Solução:**

```bash
# Reinstale dependências
rm -rf node_modules package-lock.json
npm install
```

### Problema: "RLS policy error no login"

**Solução:**

```bash
# Verifique que migrations rodaram
supabase migration list

# Se não rodou:
supabase db push

# Verifique RLS está habilitado
SELECT * FROM pg_tables WHERE tablename='users';
```

### Problema: "Next.js não carrega mudanças"

**Solução:**

```bash
# Limpe cache Next.js
rm -rf .next

# Reinicie dev server
npm run dev
```

### Problema: "TypeScript errors mesmo sem erro real"

**Solução:**

```bash
# Regenere tipos Supabase
npm run generate:types

# Ou manual:
supabase gen types typescript > types/database.ts
```

### Problema: "Variáveis .env não carregando"

**Solução:**

```bash
# Verifique arquivo existe
ls -la .env.local

# Reinicie terminal/IDE (às vezes precisa recarregar)

# Ou exporte manualmente
set -a
source .env.local
set +a
npm run dev
```

---

## Debug Mode

### Habilitar Logs Detalhados

```bash
# Supabase
DEBUG=* supabase start  # Mostra todos os logs

# Next.js
DEBUG=* npm run dev     # Debug flags

# Anthropic
DEBUG=anthropic npm run dev
```

### Usar DevTools

```bash
# Chrome DevTools
# F12 → Network → Veja requisições
# F12 → Console → Veja erros
# F12 → Application → Veja cookies/localStorage
```

### Debugar Banco de Dados

```sql
-- No Supabase Studio SQL Editor

-- Ver últimas queries
SELECT * FROM pg_stat_statements ORDER BY query_start DESC LIMIT 10;

-- Ver tamanho tabelas
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name)) as size
FROM pg_tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name) DESC;

-- Ver RLS policies
SELECT * FROM pg_policies WHERE tablename='questions';
```

---

## Performance Local

### Otimizações para Dev

```bash
# 1. Use SSD (não HDD)
# Mais rápido para Docker/banco

# 2. Limite recursos Docker
# Em Docker Desktop → Settings → Resources
# Cores: 4-8
# RAM: 8-16GB

# 3. Desabilite extensions desnecessárias
# Veja: supabase/config.toml
```

### Monitorar Performance

```bash
# Next.js build time
npm run build

# Bundle size
npm run build -- --analyze

# Database queries
# Supabase Studio → Query Performance
```

---

## Reset Completo (Nuclear Option)

Se tudo estiver quebrado:

```bash
# 1. Pare tudo
supabase stop
npm run dev  # Ctrl+C

# 2. Limpe state
rm -rf .next supabase/.branches
rm -rf node_modules package-lock.json
docker system prune -a

# 3. Reinstale
npm install
supabase start
npm run seed:taxonomy

# 4. Reinicie
npm run dev
```

---

## Documentação Adicional

- [Supabase Local Dev Guide](https://supabase.com/docs/guides/local-development)
- [Next.js Development Guide](https://nextjs.org/docs/getting-started)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

---

**Próximo:** Leia [API.md](./API.md) para especificação de endpoints.
