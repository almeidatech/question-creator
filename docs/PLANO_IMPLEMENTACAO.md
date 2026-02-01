# 🏗️ Plano de Implementação - Question Creator MVP

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026 | **Status:** Pronto para Execução

---

## 📑 Índice

1. [Sumário Executivo](#sumário-executivo)
2. [Visão Geral do Projeto](#visão-geral-do-projeto)
3. [Fases de Implementação](#fases-de-implementação)
4. [Sprint Breakdown](#sprint-breakdown)
5. [Dependências Críticas](#dependências-críticas)
6. [Avaliação de Riscos](#avaliação-de-riscos)
7. [Critérios de Sucesso](#critérios-de-sucesso)
8. [Arquitetura de Scaffolding](#arquitetura-de-scaffolding)

---

## Sumário Executivo

**Question Creator** é uma plataforma EdTech de IA para gerar e gerenciar questões personalizadas de estudo, focada inicialmente em **Direito Constitucional Brasileiro**.

### Timeline

- **Duração Total:** 8 semanas
- **MVP Release:** 30-90 dias
- **Public Beta:** Semana 9-10
- **Production:** Semana 11+

### Investimento de Recursos

- **Frontend:** 3 engineers
- **Backend:** 2 engineers
- **DevOps/Infrastructure:** 1 engineer
- **QA:** 1 engineer
- **Product:** 1 PM
- **Total:** ~8 FTE

### Escopo MVP

- ✅ Banco de 13.9k questões reais
- ✅ Geração de questões via IA (Claude)
- ✅ Sistema de reputação (0-10)
- ✅ Histórico de tentativas do usuário
- ✅ Criação de provas customizadas
- ✅ Fila de revisão por especialistas
- ❌ Webhooks (V2)
- ❌ Operações em bulk (V2)
- ❌ Expansão de domínios (V2)

---

## Visão Geral do Projeto

### Stack Tecnológico

| Camada | Tecnologia | Versão | Propósito |
| -------- | ----------- | -------- | ---------- |
| **Frontend** | Next.js | 14+ | Web app com Server Components |
| **Framework UI** | React | 19+ | Componentes interativos |
| **Linguagem** | TypeScript | 5+ | Type safety |
| **Styling** | TailwindCSS | 3+ | Estilo responsivo |
| **Componentes** | shadcn/ui | latest | UI primitivas |
| **State** | Zustand | 4+ | Estado cliente leve |
| **Backend** | Next.js API Routes | 14+ | Endpoints REST |
| **Banco** | Supabase PostgreSQL | cloud | Dados persistentes |
| **Auth** | Supabase Auth | JWT | Autenticação usuários |
| **Cache** | Upstash Redis | serverless | Cache distribuído |
| **IA** | Anthropic Claude | 3.5 Sonnet | Geração de questões |
| **Deploy** | Vercel | Edge | Frontend + Backend |

### Estrutura de Pastas (A Criar)

```text
question-creator/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Grupo layout: auth pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── (dashboard)/               # Grupo layout: usuário logado
│   │   ├── dashboard/
│   │   ├── questions/
│   │   ├── exams/
│   │   ├── history/
│   │   └── settings/
│   ├── admin/                     # Admin-only routes
│   │   ├── review-queue/
│   │   ├── import/
│   │   └── dashboard/
│   ├── api/                       # API routes
│   │   ├── questions/
│   │   ├── exams/
│   │   ├── admin/
│   │   └── middleware/
│   ├── layout.tsx                 # Root layout + providers
│   └── page.tsx                   # Home/landing
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   ├── questions/                 # Question-specific
│   ├── exams/                     # Exam-specific
│   ├── dashboard/                 # Dashboard widgets
│   ├── layout/                    # Header, sidebar, footer
│   └── forms/                     # Form components
├── lib/                           # Utilities & config
│   ├── supabase/                  # Supabase client
│   ├── anthropic/                 # Claude API integration
│   ├── csv-import/                # CSV parsing
│   ├── analytics/                 # Stats calculation
│   ├── validation.ts              # Zod schemas
│   ├── utils.ts                   # General helpers
│   └── stores/                    # Zustand stores
├── types/                         # TypeScript types
│   ├── database.ts                # Auto-generated from Supabase
│   ├── api.ts                     # API response types
│   └── domain.ts                  # Business domain types
├── test/                          # Test files (mirror lib/components)
│   ├── unit/
│   ├── components/
│   └── e2e/
├── public/                        # Static assets
│   ├── images/
│   └── fonts/
├── supabase/                      # Database infrastructure
│   ├── migrations/                # SQL migration files
│   ├── functions/                 # PostgreSQL functions/triggers
│   ├── policies/                  # RLS policies
│   └── seed.sql                   # Initial data
├── .env.local                     # Local env (git-ignored)
├── .env.example                   # Template
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── prettier.config.json
├── .eslintrc.json
└── vitest.config.ts
```

---

## Fases de Implementação

### Fase 0: Preparação & Setup (Semana 1)

**Objetivos:**

- ✅ Scaffolding do projeto
- ✅ Infraestrutura local pronta
- ✅ Equipe alinhada

**Tarefas:**

| Tarefa | Owner | Esforço | Dependency |
| -------- | ------- | --------- | ----------- |
| Criar structure do Next.js | Frontend Lead | 4h | Nenhuma |
| Setup Supabase project | DevOps | 2h | Nenhuma |
| Criar database schema migrations | Data Eng | 6h | Supabase |
| Setup environment variables | DevOps | 2h | Supabase |
| Configurar CI/CD (GitHub Actions) | DevOps | 4h | Repo access |
| Setup local dev (Docker, Supabase) | All | 2h | Installation |
| Importar questões iniciais (13.9k) | Data Eng | 8h | Schema ready |
| Criar seed taxonomia | Data Eng | 4h | Schema ready |
| Configurar linting & formatting | Frontend | 2h | Repo |
| **Total** | | **34h** | |

**Deliverables:**

- ✅ Projeto scaffolding pronto
- ✅ Supabase local + production configurado
- ✅ 13.9k questões importadas
- ✅ Ambiente de dev documentado
- ✅ CI/CD pipeline rodando

---

### Fase 1: Core Features (Semanas 2-4)

**Objetivos:**

- ✅ Geração de questões
- ✅ Sistema de reputação
- ✅ Histórico de usuário
- ✅ API REST completa

**Sprint 1.1: Scaffolding da API & Autenticação (Semana 2):**

| Endpoint | Método | Tarefas | Esforço | Owner |
| ---------- | -------- | --------- | --------- | ------- |
| **Auth** | | | | |
| /auth/login | POST | Middleware auth, JWT validation, RLS | 8h | Backend |
| /auth/signup | POST | User creation, email verification | 6h | Backend |
| **Questions** | | | | |
| /questions/generate | POST | RAG retrieval, Claude integration | 16h | Backend |
| /questions/{id} | GET | Single question fetch, reputation join | 4h | Backend |
| /questions | GET | List, search (FTS), filtering | 8h | Backend |
| /questions/{id}/submit | POST | Answer recording, trigger flow | 8h | Backend |
| **Subtotal** | | | **50h** | |

**Sprint 1.2: UI Base & Componentes (Semana 2):**

| Componente | Tarefas | Esforço | Owner |
| ----------- | --------- | --------- | ------- |
| Layout Base | Header, Sidebar, Footer | 6h | Frontend |
| Auth Pages | Login, Signup, Recovery | 8h | Frontend |
| Question Card | Display, options, answer submit | 6h | Frontend |
| Dashboard | Welcome, stats widget | 4h | Frontend |
| **Subtotal** | | **24h** | |

**Sprint 1.3: Testes & Integração (Semana 2):**

| Tipo | Tarefas | Esforço | Owner |
| ------ | --------- | --------- | ------- |
| API Tests | Unit tests (Vitest) | 8h | Backend |
| Component Tests | React Testing Library | 6h | Frontend |
| E2E Tests | Playwright workflows | 8h | QA |
| **Subtotal** | | **22h** | |

**Sprint 1.4: Sistema de Reputação (Semana 3):**

| Componente | Tarefas | Esforço | Owner |
| ----------- | --------- | --------- | ------- |
| Database Triggers | 5 triggers (triggers.sql) | 10h | Data Eng |
| Reputation Badge UI | Display score + status | 4h | Frontend |
| Admin Review Queue | GET /admin/review-queue | 6h | Backend |
| Review Decision | POST /admin/reviews | 8h | Backend |
| **Subtotal** | | **28h** | |

**Sprint 1.5: Feedback & Quality (Semana 3):**

| Componente | Tarefas | Esforço | Owner |
| ----------- | --------- | --------- | ------- |
| Feedback Form | Category selector, text input | 4h | Frontend |
| Submit Feedback | POST /questions/{id}/feedback | 6h | Backend |
| Feedback Queue | Filter by priority/status | 4h | Frontend |
| Auto-flagging | Trigger on 3+ reports | 2h | Data Eng |
| **Subtotal** | | **16h** | |

**Sprint 1.6: Integração & Publicação (Semana 4):**

| Tarefa | Esforço | Owner |
| -------- | --------- | ------- |
| Validação end-to-end | 4h | QA |
| Performance tuning | 4h | Backend |
| Deploy staging | 2h | DevOps |
| Documentation | 4h | Tech Writer |
| **Subtotal** | **14h** | |

**Fase 1 Total: ~154h (~4 semanas):**

---

### Fase 2: Exames (Semanas 5-6)

**Objetivos:**

- ✅ Criação de provas customizadas
- ✅ Simulações de exames
- ✅ Scoring e resultados

**Sprint 2.1: Exam Infrastructure (Semana 5):**

| Endpoint | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| POST /exams | Create exam | 8h | Backend |
| GET /exams | List exams | 4h | Backend |
| GET /exams/{id} | Fetch exam + questions | 6h | Backend |
| PUT /exams/{id} | Update exam | 6h | Backend |
| **Subtotal** | | **24h** | |

**Sprint 2.2: Attempt Management (Semana 5):**

| Endpoint | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| POST /exams/{id}/attempts | Start attempt | 8h | Backend |
| POST /exams/{attemptId}/answers | Submit answer | 8h | Backend |
| PUT /exams/{attemptId}/complete | Finish exam + trigger scoring | 8h | Backend |
| GET /exams/{attemptId} | Fetch attempt + results | 4h | Backend |
| **Subtotal** | | **28h** | |

**Sprint 2.3: Exam UI (Semana 6):**

| Componente | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| Exam Builder | Question selector, ordering | 8h | Frontend |
| Exam Taker | Timer, question nav, answer UI | 10h | Frontend |
| Results Page | Score, breakdown, weak areas | 6h | Frontend |
| Exam History | Past attempts, review | 4h | Frontend |
| **Subtotal** | | **28h** | |

**Sprint 2.4: Trigger & Scoring (Semana 6):**

| Componente | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| Scoring Trigger | Calculate results on complete | 6h | Data Eng |
| Pass/Fail Logic | Passing score threshold | 2h | Data Eng |
| Performance Analytics | Time per question, accuracy | 4h | Backend |
| **Subtotal** | | **12h** | |

**Fase 2 Total: ~92h (~2 semanas):**

---

### Fase 3: Admin & Import (Semana 7)

**Objetivos:**

- ✅ CSV import pipeline
- ✅ Admin dashboard
- ✅ Versioning & rollback

**Sprint 3.1: CSV Import (Semana 7):**

| Componente | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| CSV Parser | Validate, encode, parse | 8h | Backend |
| Deduplication | Fuzzy matching (85% threshold) | 8h | Backend |
| Semantic Mapping | Map questions → topics | 10h | Backend |
| Import Endpoint | POST /admin/import/csv | 8h | Backend |
| Version Management | Track imports, enable rollback | 6h | Data Eng |
| **Subtotal** | | **40h** | |

**Sprint 3.2: Admin Dashboard (Semana 7):**

| Componente | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| Stats Dashboard | Users, questions, uptime | 6h | Frontend |
| Import Manager | Upload, progress, history | 6h | Frontend |
| Review Queue | Manage feedback items | 4h | Frontend |
| Analytics | Activity feed, trends | 4h | Frontend |
| **Subtotal** | | **20h** | |

**Fase 3 Total: ~60h (~1 semana):**

---

### Fase 4: QA, Otimização & Launch (Semana 8)

**Objetivos:**

- ✅ Todos os testes passando
- ✅ Performance SLA atingidos
- ✅ Pronto para produção

**Sprint 4.1: QA & Testing (Semana 8):**

| Tipo | Tarefas | Esforço | Owner |
| ------ | --------- | --------- | ------- |
| Regression Testing | Todos endpoints | 12h | QA |
| Load Testing | Simular 100 concurrent users | 8h | QA |
| Security Audit | OWASP top 10 | 8h | Security |
| E2E Critical Paths | Login → Generate → Submit → Exam | 6h | QA |
| **Subtotal** | | **34h** | |

**Sprint 4.2: Otimização & Performance (Semana 8):**

| Componente | Tarefas | Esforço | Owner |
| ---------- | --------- | --------- | ------- |
| Database | Index optimization, query analysis | 6h | Data Eng |
| Frontend | Code splitting, lazy loading, bundle | 8h | Frontend |
| API | Caching strategy, compression | 4h | Backend |
| CDN | Image optimization, edge caching | 4h | DevOps |
| **Subtotal** | | **22h** | |

**Sprint 4.3: Documentação & Launch (Semana 8):**

| Tarefa | Esforço | Owner |
| -------- | --------- | ------- |
| Update all docs | 6h | Tech Writer |
| Create runbook | 4h | DevOps |
| Train team | 3h | PM |
| Final staging test | 4h | QA |
| **Subtotal** | **17h** | |

**Fase 4 Total: ~73h (~1 semana):**

---

## Sprint Breakdown

### Semana 1: Preparação

```text
Segunda: Scaffolding + Supabase setup
Terça: Database migrations + seeds
Quarta: Importar 13.9k questões
Quinta: Environment setup + CI/CD
Sexta: Alinhamento + documentação
```

### Semanas 2-4: MVP Core

```text
Semana 2: API scaffolding + UI base
Semana 3: Reputação + Feedback
Semana 4: Testes + Integração
```

### Semanas 5-6: Exams

```text
Semana 5: Exam CRUD + Attempts
Semana 6: Exam UI + Scoring
```

### Semana 7: Admin

```text
Segunda-Quarta: CSV import pipeline
Quinta-Sexta: Admin dashboard
```

### Semana 8: Launch

```text
Segunda-Terça: QA completa
Quarta-Quinta: Performance tuning
Sexta: Deploy + monitoring
```

---

## Dependências Críticas

### Bloqueadores de Fase

```mermaid
Fase 0: Setup
  ↓
├── Database Schema Ready → Fase 1 (Questions)
├── Supabase Auth Configured → Fase 1
├── 13.9k Questions Imported → Fase 1
│
└→ Fase 1: Core Questions (Semanas 2-4)
  ├── API Endpoints Ready → Fase 2
  ├── UI Components Ready → Fase 2
  ├── Reputation System Ready → Fase 2
  │
  └→ Fase 2: Exams (Semanas 5-6)
    ├── Question Retrieval Working → Fase 3
    │
    └→ Fase 3: Admin (Semana 7)
      ├── CSV Import Ready → Fase 4
      │
      └→ Fase 4: QA & Launch (Semana 8)
        └── All SLAs Met → Production
```

### Dependências de Recursos

| Tarefa | Depende De | Aguarda |
| -------- | ----------- | --------- |
| API Endpoints | Database schema | Fase 0 |
| UI Components | API documentation | API ready |
| Tests | Code complete | Features ready |
| Admin Dashboard | API endpoints | API complete |
| CSV Import | Database ready | Schema + indexes |
| QA Testing | All features | Fase 3 complete |
| Performance Tune | Load test results | QA feedback |
| Launch | Monitoring setup | DevOps ready |

### Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| ------- | -------------- | ------- | ----------- |
| Claude API Rate Limits | Medium | High | Implement cache (Redis) |
| CSV Import Performance | Medium | Medium | Batch processing + async |
| Full-text Search FTS (Portuguese) | Low | Medium | Pre-test FTS config |
| RLS Policy Complexity | Medium | High | Security audit semana 4 |
| Database Query Performance | Medium | Medium | Index tuning + EXPLAIN |
| Team Onboarding Delay | Low | Medium | Early documentation |

---

## Avaliação de Riscos

### Risco 1: Latência de Geração de Questões (Alta Prioridade)

**Problema:** POST /questions/generate deve completar em < 30 segundos
**Risco:** Claude API pode demorar > 30s

**Mitigação:**

- Usar cache Redis: 24h TTL para questões geradas
- Implementar fallback: apenas questões reais se AI timeout
- Async generation: retorna questões reais imediatamente, AI generation em background
- Rate limit aggressivo: 10 gen/min (evita spike de custos)

### Risco 2: Escalabilidade do CSV Import (Média Prioridade)

**Problema:** Importar 13.9k questões + mapping semântico
**Risco:** Import > 15 minutos, bloqueia database

**Mitigação:**

- Batch processing: 100-row transactions
- Async job: não bloqueia API
- Pre-calculated embeddings: usar Claude batch API (mais barato)
- Monitor: log progress, retry failures

### Risco 3: Complexidade de Full-Text Search em Português (Baixa Prioridade)

**Problema:** PostgreSQL FTS precisa estar configurado para português
**Risco:** FTS não funciona corretamente, search quebrada

**Mitigação:**

- Testar localmente na semana 1
- Usar `portuguese` configuration em migrations
- Fallback: ILIKE search se FTS falhar
- Índices compostos: (domain, difficulty, topic)

### Risco 4: Sobrecarga de Triggers (Média Prioridade)

**Problema:** 5 triggers atualizando reputation simultaneamente
**Risco:** Race conditions, deadlocks no banco

**Mitigação:**

- Usar SERIALIZABLE isolation level para critical sections
- Implementar advisory locks para question updates
- Monitor pg_locks, tuning se necessário
- Teste de carga: 1000 submissions/min

### Risco 5: RLS Policy Misconfiguration (Alta Prioridade)

**Problema:** Usuários conseguem ver questões que não deveriam
**Risco:** Data leak, violação de privacidade

**Mitigação:**

- Security audit semana 8 (antes de launch)
- Test RLS policies com impersonation
- Código review de todas as policies
- Document RLS model com exemplos

---

## Critérios de Sucesso

### Métricas de Qualidade

| Métrica | Meta | Medição |
| --------- | ------ | --------- |
| **Cobertura de Testes** | ≥ 80% | Vitest coverage report |
| **API Response Time (P95)** | < 200ms | CloudFlare metrics |
| **Question Generation** | < 30s | API response time logs |
| **Uptime** | ≥ 99% | Vercel + Sentry |
| **LightHouse Score** | ≥ 90 | Frontend metrics |
| **Bundle Size** | < 300KB | Next.js build analysis |

### Funcionalidades Obrigatórias

- ✅ Usuários podem fazer signup/login
- ✅ Gerar 5-10 questões em < 30s
- ✅ Submeter respostas e ver se acertou
- ✅ Ver histórico de tentativas
- ✅ Criar provas customizadas
- ✅ Tomar provas e receber score
- ✅ Reportar problemas em questões
- ✅ Admin pode revisar e aprovar questões
- ✅ Admin pode importar CSV
- ✅ Sistema de reputação funciona

### Funcionalidades Opcionais (V2)

- ❌ Webhooks para notificações
- ❌ Operações em bulk
- ❌ Expansão para outros domínios
- ❌ Integração com chat (tuto videos)
- ❌ Mobile app

---

## Arquitetura de Scaffolding

### Estrutura de Pastas (Detalhada)

#### app/

```text
app/
├── (auth)/                      # Auth routes (sem sidebar)
│   ├── login/
│   │   ├── page.tsx
│   │   └── form.tsx
│   ├── signup/
│   │   ├── page.tsx
│   │   └── form.tsx
│   ├── callback/                # Supabase auth callback
│   │   └── route.ts
│   └── layout.tsx               # Auth layout
│
├── (dashboard)/                 # User dashboard routes (com sidebar)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── stats.tsx
│   ├── questions/
│   │   ├── page.tsx             # Generate & list
│   │   ├── [id]/                # Detail view
│   │   │   └── page.tsx
│   │   └── history/
│   │       └── page.tsx
│   ├── exams/
│   │   ├── page.tsx             # List exams
│   │   ├── create/
│   │   │   └── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx         # Exam detail
│   │   └── [id]/attempt/
│   │       └── page.tsx         # Take exam
│   ├── settings/
│   │   └── page.tsx
│   └── layout.tsx               # Dashboard layout (Header + Sidebar)
│
├── admin/                       # Admin routes (admin-only)
│   ├── page.tsx                 # Admin dashboard
│   ├── import/
│   │   └── page.tsx
│   ├── review-queue/
│   │   └── page.tsx
│   └── middleware.ts            # Admin auth check
│
├── api/                         # API routes
│   ├── questions/
│   │   ├── route.ts             # GET /api/questions
│   │   ├── generate/
│   │   │   └── route.ts         # POST /api/questions/generate
│   │   ├── search/
│   │   │   └── route.ts         # GET /api/questions/search
│   │   └── [id]/
│   │       ├── route.ts         # GET /api/questions/[id]
│   │       ├── submit/
│   │       │   └── route.ts     # POST /api/questions/[id]/submit
│   │       └── feedback/
│   │           └── route.ts     # POST /api/questions/[id]/feedback
│   ├── exams/
│   │   ├── route.ts             # POST /api/exams (create)
│   │   ├── [id]/
│   │   │   ├── route.ts         # GET /api/exams/[id]
│   │   │   ├── attempts/
│   │   │   │   └── route.ts     # POST /api/exams/[id]/attempts
│   │   │   └── [attemptId]/
│   │   │       ├── answers/
│   │   │       │   └── route.ts # POST /api/exams/[attemptId]/answers
│   │   │       └── complete/
│   │   │           └── route.ts # PUT /api/exams/[attemptId]/complete
│   │   └── attempts/
│   │       └── [attemptId]/
│   │           └── route.ts     # GET attempt details
│   ├── admin/
│   │   ├── import/
│   │   │   └── csv/
│   │   │       └── route.ts     # POST /api/admin/import/csv
│   │   ├── review-queue/
│   │   │   └── route.ts         # GET /api/admin/review-queue
│   │   ├── reviews/
│   │   │   └── route.ts         # POST /api/admin/reviews
│   │   └── dashboard/
│   │       └── route.ts         # GET /api/admin/dashboard
│   └── middleware.ts            # Auth + rate limiting
│
├── layout.tsx                   # Root layout (Providers)
├── page.tsx                     # Home/landing
└── not-found.tsx                # 404 page
```

#### components/

```text
components/
├── ui/                          # shadcn/ui componentes
│   ├── button.tsx
│   ├── card.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── modal.tsx
│   ├── badge.tsx
│   ├── alert.tsx
│   ├── dropdown-menu.tsx
│   └── ...
├── questions/
│   ├── question-card.tsx        # Display question + options
│   ├── question-detail.tsx      # Full question with commentary
│   ├── question-list.tsx        # Paginated list
│   ├── reputation-badge.tsx     # 0-10 score display
│   ├── question-generator-form.tsx # Generate form
│   ├── feedback-form.tsx        # Report problem
│   └── feedback-list.tsx        # Show reported problems
├── exams/
│   ├── exam-card.tsx            # Exam preview
│   ├── exam-builder.tsx         # Create/edit exam
│   ├── exam-taker.tsx           # Take exam (timer, nav)
│   ├── exam-results.tsx         # Score + analysis
│   ├── exam-history.tsx         # Past attempts
│   └── exam-progress.tsx        # Progress bar during exam
├── dashboard/
│   ├── stats-widget.tsx
│   ├── activity-feed.tsx
│   ├── weak-areas.tsx
│   └── quick-actions.tsx
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── footer.tsx
│   ├── nav-menu.tsx
│   └── breadcrumb.tsx
├── forms/
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   ├── forgot-password-form.tsx
│   ├── csv-upload-form.tsx
│   └── review-form.tsx
├── auth/
│   ├── auth-provider.tsx        # Auth context
│   ├── protected-route.tsx      # Route guard
│   └── session-guard.tsx        # Session check
└── providers.tsx                # All context providers
```

#### lib/

```text
lib/
├── supabase/
│   ├── client.ts                # Supabase client (browser)
│   ├── server.ts                # Supabase client (server)
│   └── hooks.ts                 # useAuth(), useSupabase()
├── anthropic/
│   ├── client.ts                # Claude API client
│   ├── prompts.ts               # System prompts (RAG)
│   └── rag.ts                   # Retrieval-augmented generation
├── csv-import/
│   ├── parser.ts                # Parse CSV
│   ├── validator.ts             # Validate rows
│   ├── dedup.ts                 # Fuzzy match deduplication
│   ├── semantic-map.ts          # Map questions → topics
│   └── import.ts                # Main import logic
├── analytics/
│   ├── stats.ts                 # Calculate user stats
│   ├── weak-areas.ts            # Identify weak topics
│   └── performance.ts           # Performance metrics
├── validation.ts                # Zod schemas
├── utils.ts                     # Helper functions
├── constants.ts                 # App constants
├── types.ts                     # Shared types
└── stores/
    ├── auth.ts                  # Zustand auth store
    ├── questions.ts             # Questions state
    ├── exams.ts                 # Exams state
    └── ui.ts                    # UI state (modals, etc)
```

#### types/

```text
types/
├── database.ts                  # Auto-generated from Supabase CLI
│   # Generated by: supabase gen types typescript > types/database.ts
│   # Contains all table/view types
├── api.ts                       # API request/response types
│   ├── IGenerateQuestionsRequest
│   ├── IGenerateQuestionsResponse
│   ├── ISubmitAnswerRequest
│   ├── ISubmitAnswerResponse
│   └── ... (all API types)
├── domain.ts                    # Business domain types
│   ├── IQuestion
│   ├── IReputation
│   ├── IExam
│   ├── IUserAttempt
│   └── ... (domain models)
├── auth.ts                      # Auth types
│   ├── IUser
│   ├── ISession
│   └── UserRole
└── errors.ts                    # Error types
    ├── ApiError
    ├── ValidationError
    └── AuthError
```

#### test/

```text
test/
├── setup.ts                     # Vitest setup
├── mocks/
│   ├── supabase-mock.ts
│   ├── anthropic-mock.ts
│   └── data-fixtures.ts
├── unit/
│   ├── lib/
│   │   ├── csv-import.test.ts
│   │   ├── analytics.test.ts
│   │   └── validation.test.ts
│   └── utils.test.ts
├── components/
│   ├── questions/
│   │   ├── QuestionCard.test.tsx
│   │   └── QuestionForm.test.tsx
│   └── exams/
│       ├── ExamTaker.test.tsx
│       └── ExamResults.test.tsx
└── e2e/
    ├── question-flow.spec.ts    # Generate → Submit → Review
    ├── exam-flow.spec.ts        # Create → Take → Score
    └── auth-flow.spec.ts        # Login → Protected route
```

#### supabase/

```text
supabase/
├── config.toml                  # Supabase local config
├── migrations/
│   ├── 20260201000000_init_schema.sql
│   ├── 20260201000001_create_indexes.sql
│   ├── 20260201000002_create_triggers.sql
│   ├── 20260201000003_enable_rls.sql
│   └── 20260201000004_seed_taxonomy.sql
├── functions/
│   ├── update_reputation.sql    # Function called by triggers
│   ├── calculate_exam_score.sql
│   └── flag_question.sql
├── policies/
│   ├── questions_rls.sql        # RLS for questions table
│   ├── history_rls.sql          # RLS for user_question_history
│   ├── exams_rls.sql            # RLS for exams
│   └── reviews_rls.sql          # RLS for question_reviews
└── seed.sql                     # Initial taxonomy data
```

#### Configuração de Root

```text
.
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── prettier.config.json
├── .eslintrc.json
├── vitest.config.ts
├── playwright.config.ts
├── .gitignore
├── .env.example
├── .env.local (git-ignored)
└── README.md
```

---

## Dependências NPM (Inicial)

```json
{
  "dependencies": {
    "next": "14.0.0+",
    "react": "19.0.0+",
    "react-dom": "19.0.0+",
    "typescript": "5.3.0+",
    "@supabase/supabase-js": "latest",
    "@supabase/auth-helpers-nextjs": "latest",
    "zustand": "4.4.0+",
    "zod": "3.22.0+",
    "@hookform/resolvers": "3.3.0+",
    "react-hook-form": "7.47.0+",
    "anthropic": "latest",
    "tailwindcss": "3.3.0+",
    "@radix-ui/react-*": "latest",
    "clsx": "2.0.0+",
    "tailwind-merge": "2.2.0+"
  },
  "devDependencies": {
    "vitest": "latest",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "playwright": "latest",
    "eslint": "latest",
    "eslint-config-next": "14.0.0+",
    "prettier": "latest",
    "typescript-eslint": "latest"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write .",
    "seed:taxonomy": "node scripts/seed-taxonomy.js",
    "import:csv:sample": "node scripts/import-csv.js --sample",
    "import:csv:full": "node scripts/import-csv.js --full",
    "generate:types": "supabase gen types typescript > types/database.ts"
  }
}
```

---

## Checklist de Implementação

### Fase 0 (Semana 1)

- [ ] Criar structure do Next.js 14
- [ ] Setup Supabase (local + cloud)
- [ ] Criar migrations database (tabelas 15)
- [ ] Criar indexes (11 índices críticos)
- [ ] Criar triggers (5 triggers)
- [ ] Importar 13.9k questões
- [ ] Seed taxonomia (1 domain, 15 subjects, 50 topics)
- [ ] Configurar auth local
- [ ] Setup GitHub CI/CD
- [ ] Documentar setup local

### Fase 1 (Semanas 2-4)

- [ ] Auth middleware + RLS
- [ ] POST /questions/generate
- [ ] GET /questions/{id}
- [ ] GET /questions (search)
- [ ] POST /questions/{id}/submit
- [ ] UI: Auth pages
- [ ] UI: Questions page
- [ ] UI: Dashboard
- [ ] Reputation badges
- [ ] POST /questions/{id}/feedback
- [ ] GET /admin/review-queue
- [ ] POST /admin/reviews
- [ ] Unit tests (80%+)
- [ ] E2E tests (happy path)

### Fase 2 (Semanas 5-6)

- [ ] POST /exams
- [ ] GET /exams + exams/{id}
- [ ] POST /exams/{id}/attempts
- [ ] POST /exams/{attemptId}/answers
- [ ] PUT /exams/{attemptId}/complete
- [ ] UI: Exam builder
- [ ] UI: Exam taker (timer)
- [ ] UI: Exam results
- [ ] Trigger scoring
- [ ] Exam history

### Fase 3 (Semana 7)

- [ ] CSV parser
- [ ] Deduplication logic
- [ ] Semantic mapping
- [ ] POST /admin/import/csv
- [ ] Version management
- [ ] GET /admin/dashboard
- [ ] UI: Admin import page
- [ ] UI: Admin dashboard

### Fase 4 (Semana 8)

- [ ] Regression tests
- [ ] Load testing (1000 req/min)
- [ ] Security audit (OWASP)
- [ ] Performance tuning
- [ ] Bundle optimization
- [ ] CDN setup
- [ ] Monitoring + alerting
- [ ] Documentation update
- [ ] Deploy staging
- [ ] Final smoke tests

---

## Próximas Ações

1. **Revisar Plano:** Aprovação PM + Tech Lead
2. **Priorizar Riscos:** Avaliar mitigações críticas
3. **Alocar Recursos:** Confirmar 8 FTE
4. **Executar Fase 0:** Começar scaffolding semana que vem
5. **Documentar Decideres:** Architecture Decision Records (ADRs)

---

**Plano Preparado por:** Aria, Architect
**Data:** 31 de Janeiro de 2026
**Status:** ✅ Pronto para Aprovação
**Próximo:** Aguardando aprovação PM + CTO para execução

---

## Referências

- [API.md](./API.md) - Especificação REST API
- [BANCO_DE_DADOS_DIAGRAMA.md](./BANCO_DE_DADOS_DIAGRAMA.md) - Schema database
- [SETUP_LOCAL.md](./SETUP_LOCAL.md) - Development environment
- [ARQUITETURA_TECNICA.md](./ARQUITETURA_TECNICA.md) - Technical architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Code conventions
