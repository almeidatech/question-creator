# 🏛️ Arquitetura Técnica Completa - Question Creator MVP

**Status:** ✅ Aprovada | **Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Dados](#arquitetura-de-dados)
3. [Pipeline de Ingestão CSV](#pipeline-de-ingestão-csv)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Integração Anthropic API](#integração-anthropic-api)
6. [Fluxos Técnicos](#fluxos-técnicos)
7. [Arquitetura Frontend](#arquitetura-frontend)
8. [Requisitos Não-Funcionais](#requisitos-não-funcionais)
9. [Plano de Implementação](#plano-de-implementação)
10. [FAQ Técnico](#faq-técnico)

---

## Visão Geral

### Stack Tecnológico

| Camada | Tecnologia | Propósito |
| --- | --- | --- |
| **Frontend** | Next.js 14+, React, TypeScript, TailwindCSS, shadcn/ui | Interface do usuário, geração dinâmica |
| **Backend** | Next.js API Routes, Node.js | APIs RESTful, processamento |
| **Database** | Supabase (PostgreSQL) | Persistência, RLS, full-text search |
| **Auth** | Supabase Auth | Autenticação, autorização, JWT |
| **IA** | Anthropic Claude 3.5 Sonnet | Geração de questões com RAG |
| **Cache** | Upstash Redis | Caching de questões, RAG |
| **Infra** | Vercel + Supabase Cloud | Deploy, escalabilidade, backup |

### Diagrama de Arquitetura

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard │ Questions │ Exams │ Admin │ Auth Pages             │
│  (React Components + TailwindCSS + shadcn/ui)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
         ┌──────────▼──────┐  ┌───────▼──────────┐
         │  API Routes     │  │  Server Actions  │
         │ (Next.js)       │  │ (Form handling)  │
         └──────────┬──────┘  └───────┬──────────┘
                    │                 │
         ┌──────────┴─────────────────┴──────────┐
         │      BACKEND LOGIC & SERVICES         │
         ├────────────────────────────────────────┤
         │ • Question Generation                 │
         │ • CSV Import Pipeline                 │
         │ • Analytics & Stats                   │
         │ • Reputation System                   │
         └──────────┬──────────────┬──────────────┘
                    │              │
       ┌────────────▼──┐  ┌────────▼──────────┐
       │  Anthropic    │  │  Supabase         │
       │  API (Claude) │  │  PostgreSQL + RLS │
       │  + RAG        │  │  + Auth + Storage │
       └───────────────┘  └───────┬───────────┘
                                  │
                    ┌─────────────┴──────────┐
                    │                        │
              ┌─────▼────┐         ┌────────▼────┐
              │  Upstash │         │  Question   │
              │  Redis   │         │  Bank CSV   │
              │ (Cache)  │         │  Files      │
              └──────────┘         └─────────────┘
```

---

## Arquitetura de Dados

### 1. Estrutura de Tabelas

A base de dados é organizada em 4 domínios principais:

#### A. Gerenciamento de Usuários

- **users**: Perfis dos usuários (student, educator, reviewer, admin)
- **subscriptions**: Planos de pagamento e limites

#### B. Taxonomia e Questões

- **domains**: Direito Constitucional, Administrativo, etc.
- **subjects**: Tópicos primários (Direitos Fundamentais, etc.)
- **topics**: Sub-tópicos específicos
- **questions**: Banco de questões (13,917 iniciais)
- **question_topics**: Mapeamento many-to-many

#### C. Qualidade e Reputação

- **question_reputation**: Pontuação 0-10 de confiabilidade
- **question_feedback**: Problemas relatados pelos usuários
- **question_reviews**: Validações de especialistas

#### D. Histórico e Análise

- **user_question_history**: Respostas dos usuários
- **exams**: Provas customizadas
- **user_exam_attempts**: Tentativas de prova
- **user_exam_answers**: Respostas individuais

### 2. Row Level Security (RLS)

Todas as tabelas críticas têm RLS habilitado:

```sql
-- Exemplo: Usuários só veem suas próprias respostas
CREATE POLICY "Users view own history"
  ON user_question_history FOR SELECT
  USING (user_id = auth.user_id());
```

**Benefícios:**

- ✅ Segurança em nível de banco de dados
- ✅ Escalabilidade (isolamento de dados)
- ✅ Conformidade GDPR/LGPD

### 3. Índices para Performance

```sql
-- Full-text search em português
CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);

-- Filtros rápidos
CREATE INDEX idx_questions_domain_difficulty ON questions(domain_id, difficulty);

-- Analytics otimizada
CREATE INDEX idx_history_user_date ON user_question_history(user_id, attempted_at DESC);
```

### 4. Triggers Automatizados

| Trigger | Ação | Impacto |
| --- | --- | --- |
| `create_reputation_on_question_insert` | Cria entrada de reputação | Automático ao inserir questão |
| `update_reputation_on_attempt` | Atualiza stats de tentativas | Calcula dificuldade empírica |
| `flag_question_on_feedback` | Marca questão se 3+ problemas | Prioriza revisão |
| `update_reputation_on_review` | Atualiza score após review | Sobe score ao 7/10 se aprovada |

---

## Pipeline de Ingestão CSV

### Fluxo de Importação

```text
CSV File (13,917 questões)
    ↓
[1] PARSE & VALIDATE
    • Detecta formato (CESPE vs FCC)
    • Valida campos obrigatórios
    • Normaliza texto (encoding, whitespace)
    ↓
[2] DEDUPLICATION
    • Fuzzy matching com Fuse.js
    • Threshold: 85% similarity
    • Relata duplicatas encontradas
    ↓
[3] TRANSFORM
    • Estrutura questionário_text, option_a...e
    • Mapeia exam_board (CESPE/FCC)
    • Define difficulty inicial = "medium"
    ↓
[4] TOPIC MAPPING
    • Keyword matching (rápido)
    • Semantic matching com embeddings (preciso)
    • Mapeia a 1-3 tópicos
    ↓
[5] BATCH IMPORT
    • Insere em lotes de 100
    • Transactional (rollback se erro)
    • Cria version_id para rastreamento
    ↓
[6] VERIFICATION
    • Spot-check de 100 questões
    • Relata stats (inserted, duplicates, failed)
```

### Configuração da Taxonomia

Exemplo para Direito Constitucional:

```text
Direito Constitucional (domain)
├── Direitos Fundamentais (subject)
│   ├── Direitos Individuais e Coletivos (topic)
│   ├── Direitos Sociais (topic)
│   └── Nacionalidade (topic)
├── Organização do Estado (subject)
│   ├── Federação e Divisão Territorial (topic)
│   └── Administração Pública (topic)
└── Poderes (subject)
    ├── Poder Legislativo (topic)
    ├── Poder Executivo (topic)
    └── Poder Judiciário (topic)
```

---

## Estrutura do Projeto

### Organização de Pastas

```text
question-creator/
├── app/                     # Next.js 14 App Router
│   ├── (auth)/             # Rutas públicas
│   ├── (dashboard)/        # Rotas protegidas
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
│
├── components/             # React components reutilizáveis
│   ├── ui/                 # shadcn/ui primitives
│   ├── questions/          # Componentes de questões
│   ├── dashboard/          # Widgets de dashboard
│   └── layout/             # Header, sidebar, etc
│
├── lib/                    # Lógica e utilities
│   ├── supabase/          # Cliente Supabase + auth
│   ├── anthropic/         # Integração Claude
│   ├── csv-import/        # Pipeline de import
│   └── analytics/         # Cálculos de stats
│
├── types/                 # TypeScript types
├── public/                # Assets estáticos
├── docs/                  # Documentação (este arquivo!)
├── supabase/              # Migrations e edge functions
└── scripts/               # Utilitários de setup
```

### Padrões de Organização

**Components:**

```text
components/questions/
├── question-card.tsx          # Cartão de questão
├── question-detail.tsx        # Detalhe + responda
├── question-list.tsx          # Lista com filtros
├── question-generator-form.tsx # Formulário de geração
└── reputation-badge.tsx       # Badge 0-10
```

**API Routes:**

```text
app/api/
├── questions/
│   ├── generate/route.ts      # POST /api/questions/generate
│   └── [id]/submit/route.ts   # POST /api/questions/{id}/submit
├── import/csv/route.ts        # POST /api/import/csv
└── exams/route.ts             # CRUD de provas
```

---

## Integração Anthropic API

### Geração com RAG (Retrieval-Augmented Generation)

**Por que RAG?**

- Aumenta precisão jurídica (baseia em 13k questões reais)
- Garante consistência de estilo (CESPE/FCC)
- Reduz alucinações do modelo

**Fluxo:**

```typescript
// 1. Recupera questões similares do banco
const ragContext = await retrieveSimilarQuestions({
  subject: "Direitos Fundamentais",
  difficulty: "medium",
  limit: 5
});

// 2. Construi prompt com contexto
const prompt = `
Gere uma questão NOVA sobre Direitos Fundamentais...

EXEMPLOS DE QUESTÕES REAIS:
${ragContext.map(q => q.text).join('\n')}
`;

// 3. Chama Claude 3.5 Sonnet
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,  // Balanceado: criativo mas consistente
  messages: [{ role: 'user', content: prompt }]
});

// 4. Parseia JSON
const parsed = parseGeneratedQuestion(response.content[0].text);
```

### Prompt System

```text
Você é um especialista em Direito Constitucional Brasileiro.

TAREFAS:
✓ Gerar questões de múltipla escolha
✓ Seguir estilo CESPE ou FCC
✓ Garantir precisão jurídica 100%
✓ Prover explicação detalhada

FORMATO DE SAÍDA:
{
  "questionText": "...",
  "options": { "a": "...", "b": "...", ... },
  "correctAnswer": "a",
  "commentary": "Explicação detalhada...",
  "topics": ["Direitos Fundamentais"],
  "difficulty": "medium"
}
```

### Custos e Rate Limiting

**Preços Claude 3.5 Sonnet:**

- Input: $3 por 1M tokens
- Output: $15 por 1M tokens
- **Custo médio por questão: ~$0.02**

**Rate Limiting:**

- 50 gerações/minuto por usuário
- 100k tokens/minuto por projeto
- Fallback: retornar questões reais se quota excedida

### Caching

Questões geradas são cacheadas 24h no Redis:

```typescript
// Evita regeneração desnecessária
const cached = await getCachedQuestion({
  domain: 'constitucional',
  subject: 'direitos-fundamentais',
  difficulty: 'medium'
});

if (cached) return cached;  // Hit! 🚀
```

---

## Fluxos Técnicos

### 1. Fluxo de Autenticação

```text
Usuário → [Login Page]
              ↓
           OAuth (Google/GitHub) OU Email/Senha
              ↓
        [Supabase Auth]
              ↓
        JWT Token (Session)
              ↓
        [Middleware] ← Valida em cada request
              ↓
        Protected Routes (Dashboard, Admin)
```

**Segurança:**

- ✅ JWT armazenado em HTTP-only cookie
- ✅ CSRF token validado
- ✅ Session timeout: 24h

### 2. Fluxo de Geração de Questões

```text
[Question Generator Form]
  • Domain: "Constitucional"
  • Subject: "Direitos Fundamentais"
  • Difficulty: "medium"
  • Count: 10
              ↓
      [POST /api/questions/generate]
              ↓
    [1] Busca 10 questões REAIS
        → Se encontradas: retorna
        → Se < 7 encontradas: gera com IA
              ↓
    [2] RAG + Claude API
        → Recupera 5 similares
        → Gera questão nova
        → Parseia JSON
              ↓
    [3] Salva no banco
        → source_type = "ai_generated"
        → reputation = 0/10
        → metadata = contexto RAG
              ↓
    [4] Retorna lista (real + AI)
        → Embaralha
        → Estatísticas
```

### 3. Fluxo de Submissão de Resposta

```text
[Question Detail View]
  Usuário seleciona resposta
              ↓
      [POST /api/questions/{id}/submit]
        • selectedAnswer: "a"
        • responseTimeMs: 5230
        • sessionId: UUID
        • context: "practice"
              ↓
      [1] Valida questão existe
      [2] Compara com resposta correta
      [3] Registra tentativa no histórico
              ↓
        INSERT user_question_history
        → Trigger atualiza reputation stats
        → Calcula dificuldade empírica
              ↓
      [4] Retorna resultado
        • isCorrect: true/false
        • correctAnswer: "a"
        • commentary: "Explicação..."
        • stats: { accuracy: 62%, ... }
              ↓
      [Frontend] Mostra resultado + explicação
```

### 4. Fluxo de Importação CSV

```text
[Admin CSV Import]
  Seleciona arquivo
  questoesConstitucionalCespe.csv
              ↓
    [FileUpload → Server Action]
              ↓
    [1] Parse CSV
        Valida formato
        Normaliza texto
              ↓
    [2] Deduplicação
        Fuzzy match com existentes
        Relata duplicatas
              ↓
    [3] Topic Mapping
        Keyword matching
        Semantic embedding (opcional)
              ↓
    [4] Batch Import
        Insere em lotes
        Cria version_number
              ↓
    [5] Relatório
        ✓ 7,146 inseridas
        • 23 duplicatas encontradas
        ✗ 0 erros
```

---

## Arquitetura Frontend

### State Management (Zustand)

```typescript
// Persistente: filters e session atual
const useQuestionStore = create(
  persist(
    (set) => ({
      filters: { domain, subject, difficulty },
      session: { questionId, startedAt, ... },
      isGenerating: false
    }),
    { name: 'question-store' }
  )
);
```

**Por que Zustand?**

- ✅ Leve (apenas 2KB)
- ✅ Não requer providers
- ✅ Suporta persistência
- ✅ DevTools integration

### Form Validation (Zod)

```typescript
const QuestionGenerateSchema = z.object({
  domain: z.string().min(1),
  subject: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(20)
});

// Validação automática + type-safe
```

### Componentes Reutilizáveis

```typescript
// shadcn/ui + custom hooks
<QuestionDetail
  question={question}
  onSubmit={handleSubmit}
/>

// Inclui:
// ✓ Rendering de opções
// ✓ Validação de resposta
// ✓ Feedback visual (certo/errado)
// ✓ Explicação detalhada
// ✓ Botão de reportar problema
```

### Performance

**Otimizações:**

- 🚀 Image optimization (Next.js)
- 🚀 Code splitting automático
- 🚀 Lazy loading de componentes
- 🚀 React Query para caching de dados

---

## Requisitos Não-Funcionais

### Performance Metrics

| Métrica | Target | Método |
| --- | --- | --- |
| **Page Load** | < 3s | Next.js + Vercel Edge |
| **Question Generation** | < 30s | Parallelização + cache |
| **Search/Filter** | < 2s | Índices PostgreSQL |
| **API Response** | < 200ms | Redis cache layer |

### Segurança

```text
┌─────────────────────────────────────┐
│ CAMADAS DE SEGURANÇA               │
├─────────────────────────────────────┤
│ 1. HTTPS/TLS (Vercel)              │
│ 2. Rate Limiting (10 req/min gen)  │
│ 3. Input Sanitization (Zod)        │
│ 4. SQL Injection Prevention (RLS)  │
│ 5. CSRF Protection (Next.js)       │
│ 6. XSS Prevention (React escaping) │
│ 7. Authentication (Supabase JWT)   │
│ 8. Authorization (RLS + Middleware)│
└─────────────────────────────────────┘
```

### Backup e Disaster Recovery

- **Backup automático:** 24h via Supabase
- **Point-in-time recovery:** Últimos 30 dias
- **RTO:** < 1 hora
- **RPO:** < 5 minutos

### Monitoramento

```typescript
// Logging centralizado
logger.info('Question generated', {
  model: 'claude-3.5-sonnet',
  tokens: 1203,
  cost: 0.018
});

// Métricas em Datadog/Sentry
```

---

## Plano de Implementação

### Fase 1: Setup (Semana 1) ⚡

**Duração:** 3-4 dias

```bash
# 1. Inicializar projeto Next.js
npx create-next-app@latest question-creator --typescript

# 2. Configurar Supabase
npm install @supabase/supabase-js
# → Criar projeto, obter credenciais

# 3. Setup database
# → Executar migrations SQL (schema, RLS, triggers)

# 4. Adicionar dependencies
npm install zustand zod anthropic fuse.js

# 5. Configurar environment
cp .env.local.example .env.local
```

**Checklist:**

- [ ] Next.js rodando localmente
- [ ] Supabase conectado
- [ ] Schema criado (tabelas vazias)
- [ ] Auth testado (signup/login)
- [ ] TailwindCSS funcionando

### Fase 2: Data Ingestion (Semana 2) 📊

**Duração:** 2-3 dias

```bash
# 1. Seed da taxonomia
npm run seed:taxonomy
# → Insere domains, subjects, topics

# 2. Importar questões
npm run import:csv docs/question-data/*.csv
# → Parse → Deduplica → Insere 13,917 questões

# 3. Validação
npm run validate:questions
# → Spot-check de 100 questões aleatórias
```

**Saída esperada:**

```text
✓ 13,917 questões importadas
✓ 23 duplicatas detectadas
✓ 100% topic mapping (1-3 topics por questão)
```

### Fase 3: Core Features (Semanas 3-6) 🎯

**Semana 3:** Question Generation

- [ ] API /questions/generate
- [ ] RAG implementation
- [ ] Claude integration
- [ ] Caching com Redis

**Semana 4:** UI & History

- [ ] Question detail component
- [ ] Answer submission flow
- [ ] User history tracking
- [ ] Dashboard básico

**Semana 5:** Reputation & Feedback

- [ ] Reputation system
- [ ] Feedback/problem reporting
- [ ] Admin review queue
- [ ] Expert validation workflow

**Semana 6:** Exams & Polish

- [ ] Exam builder
- [ ] Exam simulator
- [ ] Performance optimization
- [ ] Security audit

### Fase 4: Launch (Semanas 7-8) 🚀

- [ ] Beta testing com 20-50 usuários
- [ ] Bug fixes
- [ ] Production deploy
- [ ] Monitoring setup

---

## FAQ Técnico

### P: Como lidar com a alucinação de IA?

**R:** Três camadas:

1. RAG (usa questões reais como contexto)
2. Expert review obrigatório (100% de questões IA)
3. Feedback dos usuários (auto-flag se 3+ problemas)

### P: Quanto custará rodar isso em produção?

**R:** Estimativa mensal:

- Vercel (frontend): $20-100
- Supabase (database): $25-200
- Anthropic API: $100-500 (depende uso)
- Redis cache: $10-20
- **Total: $150-800/mês**

### P: Como escalar para 1M de usuários?

**R:**

- Supabase escalona automaticamente
- Redis com Upstash (auto-scaling)
- CDN via Vercel Edge
- Mais read replicas PostgreSQL

### P: Posso usar outro modelo de IA?

**R:** Sim! Basta:

1. Trocar importação em `lib/anthropic/client.ts`
2. Adaptar prompt (formatos podem variar)
3. Ajustar preços/tokens

Suporta OpenAI GPT-4, Cohere, Hugging Face, etc.

### P: E se a API de IA cair?

**R:** Fallback automático:

1. Retorna questões reais do banco
2. Mostra aviso: "Usando banco de questões"
3. Usuário não é impactado

### P: Como manter dados jurídicos atualizados?

**R:**

- Importação semestral de novas CSVs
- Versionamento (question_bank_versions)
- Rollback simples se necessário
- Expert review em mudanças críticas

---

## Próximos Passos

1. **Agora:** Leia este documento integralmente
2. **Depois:** Veja [plano-detalhado.md](./plano-detalhado.md) para código específico
3. **Setup:** Execute `npm run setup` (criar após Fase 1)
4. **Deploy:** Siga [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Contato & Suporte

- 📧 **Issues técnicas:** Abra issue no GitHub
- 💬 **Perguntas:** Discussões do projeto
- 📚 **Docs:** [Supabase Docs](https://supabase.com/docs), [Anthropic Docs](https://docs.anthropic.com)

---

**Documento Vivo:** Esta arquitetura será atualizada conforme aprendizados em produção.

Última atualização: 31 de Janeiro de 2026
