# 📊 Diagrama e Relacionamentos - Banco de Dados

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Entity-Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
3. [Tabelas Principais](#tabelas-principais)
4. [Relacionamentos](#relacionamentos)
5. [Fluxos de Dados](#fluxos-de-dados)
6. [Índices e Performance](#índices-e-performance)

---

## Visão Geral

O banco de dados está organizado em **5 domínios** com **16 tabelas** principais (v2.1 com RAG support):

```text
┌─────────────────────────────────────────────────────────────────┐
│                    QUESTION CREATOR DATABASE                     │
│                      (PostgreSQL + Supabase)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    USERS     │  │   TAXONOMY   │  │  QUESTIONS   │           │
│  │ (Auth, Role) │  │ (Domain/Sub) │  │   (Content)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐          │
│  │  HISTORY    │  │   REPUTATION    │  │  FEEDBACK  │          │
│  │(Attempts)   │  │  (Quality)      │  │(Problems)  │          │
│  └─────────────┘  └─────────────────┘  └────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                     │
│         ┌──────────────────┴──────────────────┐                 │
│         │                                     │                 │
│  ┌──────▼─────┐                     ┌─────────▼─────┐           │
│  │   EXAMS    │                     │  ADMIN/REVIEW │           │
│  │ (Tests)    │                     │   (Approval)  │           │
│  └────────────┘                     └───────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entity-Relationship Diagram (ERD)

### Diagrama Textual Completo

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. USERS (Autenticação)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│     email (VARCHAR, UNIQUE)                                                  │
│     name (VARCHAR)                                                           │
│     role (ENUM: student, educator, reviewer, admin)                         │
│     subscription_tier (ENUM: free, premium, institutional)                  │
│     created_at (TIMESTAMPTZ)                                                │
│     last_login (TIMESTAMPTZ)                                                │
│     avatar_url (TEXT)                                                        │
│     is_active (BOOLEAN)                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─ creates ──→ (1:N) EXAMS
        ├─ reviews ──→ (1:N) QUESTION_REVIEWS
        ├─ attempts ─→ (1:N) USER_QUESTION_HISTORY
        ├─ attempts ─→ (1:N) USER_EXAM_ATTEMPTS
        └─ has ─────→ (1:1) SUBSCRIPTIONS

┌─────────────────────────────────────────────────────────────────────────────┐
│                         2. DOMAINS (Taxonomia Nível 1)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│     name (VARCHAR, UNIQUE)           ← "Direito Constitucional"             │
│     slug (VARCHAR, UNIQUE)           ← "constitucional"                     │
│     description (TEXT)                                                       │
│     display_order (INT)                                                      │
│     is_active (BOOLEAN)                                                      │
│     created_at (TIMESTAMPTZ)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ has ─────→ (1:N) SUBJECTS

┌─────────────────────────────────────────────────────────────────────────────┐
│                         3. SUBJECTS (Taxonomia Nível 2)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  domain_id (UUID) → DOMAINS.id                                           │
│     name (VARCHAR)              ← "Direitos Fundamentais"                   │
│     slug (VARCHAR)              ← "direitos-fundamentais"                   │
│     description (TEXT)                                                       │
│     display_order (INT)                                                      │
│     is_active (BOOLEAN)                                                      │
│     created_at (TIMESTAMPTZ)                                                │
│     UNIQUE(domain_id, slug)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ has ─────→ (1:N) TOPICS

┌─────────────────────────────────────────────────────────────────────────────┐
│                         4. TOPICS (Taxonomia Nível 3)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  subject_id (UUID) → SUBJECTS.id                                         │
│     name (VARCHAR)              ← "Liberdade de Expressão"                  │
│     slug (VARCHAR)              ← "liberdade-expressao"                     │
│     description (TEXT)                                                       │
│     keywords (TEXT[])           ← for semantic matching                     │
│     display_order (INT)                                                      │
│     is_active (BOOLEAN)                                                      │
│     created_at (TIMESTAMPTZ)                                                │
│     UNIQUE(subject_id, slug)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ referenced by ─→ (N:M) QUESTION_TOPICS

┌─────────────────────────────────────────────────────────────────────────────┐
│                    5. QUESTION_BANK_VERSIONS (Versionamento)                │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│     version_number (INT, UNIQUE)    ← 1, 2, 3...                           │
│     import_date (TIMESTAMPTZ)                                               │
│     source_files (TEXT[])           ← CSV filenames                        │
│     total_questions (INT)                                                    │
│     status (VARCHAR)                ← 'active', 'deprecated', 'rollback'    │
│     metadata (JSONB)                ← import stats                          │
│ FK  imported_by (UUID) → USERS.id                                           │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ has ─────→ (1:N) QUESTIONS

┌─────────────────────────────────────────────────────────────────────────────┐
│                         6. QUESTIONS (Core Content)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│     question_text (TEXT)                                                     │
│     option_a (TEXT)                                                          │
│     option_b (TEXT)                                                          │
│     option_c (TEXT)                                                          │
│     option_d (TEXT)                                                          │
│     option_e (TEXT)                                                          │
│     correct_answer (CHAR)          ← 'a', 'b', 'c', 'd', 'e'               │
│     commentary (TEXT)               ← expert explanation                    │
│     source_type (ENUM)              ← 'real_exam', 'ai_generated'           │
│     exam_board (ENUM)               ← 'CESPE', 'FCC', 'FGV', 'VUNESP'      │
│     exam_year (INT)                                                          │
│     exam_name (VARCHAR)                                                      │
│     difficulty (ENUM)               ← 'easy', 'medium', 'hard'              │
│ FK  question_bank_version_id (UUID) → QUESTION_BANK_VERSIONS.id            │
│     ai_model (VARCHAR)              ← 'claude-3.5-sonnet'                  │
│     ai_prompt_version (VARCHAR)     ← 'v1.0'                               │
│     generation_metadata (JSONB)     ← RAG context, temperature             │
│     search_vector (tsvector)        ← generated for full-text search       │
│     created_at (TIMESTAMPTZ)                                               │
│     updated_at (TIMESTAMPTZ)                                               │
│     INDEX: full-text search, domain/difficulty, source type               │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─ has ─────→ (1:1) QUESTION_REPUTATION
        ├─ has ─────→ (1:1) QUESTION_SOURCES (NEW - RAG support)
        ├─ has ─────→ (N:M) QUESTION_TOPICS
        ├─ has ─────→ (1:N) USER_QUESTION_HISTORY
        ├─ has ─────→ (1:N) QUESTION_FEEDBACK
        ├─ has ─────→ (1:N) QUESTION_REVIEWS
        └─ has ─────→ (N:M) EXAM_QUESTIONS

┌─────────────────────────────────────────────────────────────────────────────┐
│         6A. QUESTION_SOURCES (Dual-Corpus RAG Control) [NEW v2.1]           │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  question_id (UUID) UNIQUE REFERENCES questions(id)                      │
│     source_type (VARCHAR)      ← 'real_exam', 'ai_generated', 'expert_appr' │
│     rag_eligible (BOOLEAN)     ← true for real_exam only                    │
│     created_at (TIMESTAMPTZ)                                               │
│     approved_at (TIMESTAMPTZ)  ← null until expert review complete         │
│     approved_by (UUID) → USERS.id (nullable)                               │
│     INDEX: (source_type, rag_eligible) - CRITICAL FOR RAG QUERIES          │
│                                                                              │
│ **CRITICAL:** RAG queries MUST filter: WHERE source_type='real_exam'        │
│              AND rag_eligible=true (enforced at database level)            │
│                                                                              │
│ **Audit Trigger:** Logs ALL source_type changes to audit_log table         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              7. QUESTION_TOPICS (Relacionamento N:M)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  question_id (UUID) → QUESTIONS.id                                       │
│ PK  topic_id (UUID) → TOPICS.id                                             │
│     relevance_score (FLOAT)        ← 0.0-1.0 (similarity confidence)       │
│     created_at (TIMESTAMPTZ)                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              8. QUESTION_REPUTATION (Qualidade & Confiabilidade)             │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  question_id (UUID) → QUESTIONS.id                                       │
│     current_score (INT)            ← 0-10 (confidence level)                │
│     total_attempts (INT)           ← total user attempts                    │
│     correct_attempts (INT)         ← successful answers                     │
│     problem_reports (INT)          ← feedback count                         │
│     expert_validations (INT)       ← reviews done                           │
│     status (ENUM)                  ← 'active', 'under_review', 'disabled'   │
│     empirical_difficulty (FLOAT)   ← calculated from success rate           │
│     last_updated (TIMESTAMPTZ)                                              │
│     first_attempt_date (TIMESTAMPTZ)                                        │
│     last_attempt_date (TIMESTAMPTZ)                                         │
│     metadata (JSONB)               ← additional stats                       │
│     INDEX: current_score DESC, status                                       │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ updated by ─→ (triggers) REPUTATION_UPDATES

┌─────────────────────────────────────────────────────────────────────────────┐
│           9. USER_QUESTION_HISTORY (Histórico de Tentativas)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  user_id (UUID) → USERS.id                                               │
│ FK  question_id (UUID) → QUESTIONS.id                                       │
│     selected_answer (CHAR)         ← 'a', 'b', 'c', 'd', 'e'               │
│     is_correct (BOOLEAN)                                                     │
│     response_time_ms (INT)         ← time to answer                         │
│     session_id (UUID)              ← groups questions                       │
│     context (VARCHAR)              ← 'practice', 'exam_simulation'          │
│     attempted_at (TIMESTAMPTZ)                                              │
│     INDEX: user_id + attempted_at, question_id + is_correct                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              10. QUESTION_FEEDBACK (Problemas Reportados)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  question_id (UUID) → QUESTIONS.id                                       │
│ FK  user_id (UUID) → USERS.id (nullable)                                    │
│     category (ENUM)                ← 'incorrect_answer', 'typo', etc.      │
│     feedback_text (TEXT)           ← 20-500 chars                           │
│     status (ENUM)                  ← 'pending', 'under_review', 'resolved' │
│ FK  reviewer_id (UUID) → USERS.id (nullable)                                │
│     reviewer_notes (TEXT)                                                    │
│     submitted_at (TIMESTAMPTZ)                                              │
│     reviewed_at (TIMESTAMPTZ)                                               │
│     resolved_at (TIMESTAMPTZ)                                               │
│     is_priority (BOOLEAN)          ← auto-flagged if 3+ reports            │
│     INDEX: status + submitted_at                                            │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ triggers ─→ AUTO_FLAG (if problem_count >= 3)

┌─────────────────────────────────────────────────────────────────────────────┐
│              11. QUESTION_REVIEWS (Validação de Especialistas)               │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  question_id (UUID) → QUESTIONS.id                                       │
│ FK  reviewer_id (UUID) → USERS.id (nullable)                                │
│     decision (ENUM)                ← 'approve', 'request_revision', 'reject'│
│     notes (TEXT)                   ← expert feedback                        │
│     suggested_changes (JSONB)      ← if request_revision                    │
│     reviewed_at (TIMESTAMPTZ)                                               │
│     INDEX: reviewer_id + reviewed_at                                        │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ triggers ─→ UPDATE_REPUTATION (score changes)

┌─────────────────────────────────────────────────────────────────────────────┐
│                    12. EXAMS (Provas Customizadas)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  creator_id (UUID) → USERS.id                                            │
│     title (VARCHAR)                                                          │
│     description (TEXT)                                                       │
│     instructions (TEXT)                                                      │
│     time_limit_minutes (INT)       ← null = no limit                        │
│     passing_score_percentage (INT) ← default 70                             │
│     shuffle_questions (BOOLEAN)                                              │
│     shuffle_answers (BOOLEAN)                                                │
│     show_correct_answers (BOOLEAN)                                           │
│     status (ENUM)                  ← 'draft', 'published', 'archived'       │
│     created_at (TIMESTAMPTZ)                                                │
│     updated_at (TIMESTAMPTZ)                                                │
│     published_at (TIMESTAMPTZ)                                              │
│     metadata (JSONB)               ← custom fields                          │
│     INDEX: creator_id + created_at                                          │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─ has ─────→ (1:N) EXAM_QUESTIONS
        └─ has ─────→ (1:N) USER_EXAM_ATTEMPTS

┌─────────────────────────────────────────────────────────────────────────────┐
│              13. EXAM_QUESTIONS (Relacionamento N:M Ordenado)                │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  exam_id (UUID) → EXAMS.id                                               │
│ FK  question_id (UUID) → QUESTIONS.id                                       │
│     display_order (INT)            ← ordering in exam                       │
│     points (INT)                   ← weight/points                          │
│     UNIQUE(exam_id, question_id)                                             │
│     UNIQUE(exam_id, display_order)                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              14. USER_EXAM_ATTEMPTS (Tentativas de Prova)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  user_id (UUID) → USERS.id                                               │
│ FK  exam_id (UUID) → EXAMS.id                                               │
│     started_at (TIMESTAMPTZ)                                                │
│     completed_at (TIMESTAMPTZ)                                              │
│     time_spent_seconds (INT)                                                │
│     total_questions (INT)          ← cached from EXAMS                      │
│     correct_answers (INT)          ← calculated on completion               │
│     score_percentage (FLOAT)       ← 0-100                                  │
│     passed (BOOLEAN)               ← score >= passing_threshold             │
│     is_completed (BOOLEAN)                                                   │
│     INDEX: user_id + started_at, exam_id + completed_at                     │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        └─ has ─────→ (1:N) USER_EXAM_ANSWERS

┌─────────────────────────────────────────────────────────────────────────────┐
│              15. USER_EXAM_ANSWERS (Respostas Individuais Prova)             │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                                │
│ FK  attempt_id (UUID) → USER_EXAM_ATTEMPTS.id                               │
│ FK  question_id (UUID) → QUESTIONS.id                                       │
│     selected_answer (CHAR)         ← 'a', 'b', 'c', 'd', 'e'               │
│     is_correct (BOOLEAN)                                                     │
│     response_time_ms (INT)                                                   │
│     answered_at (TIMESTAMPTZ)                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tabelas Principais

### Grupo 1: Autenticação (1 tabela)

- **users** - Usuários do sistema com roles e permissões

### Grupo 2: Taxonomia (4 tabelas)

- **domains** - Áreas do conhecimento (Direito Constitucional, etc.)
- **subjects** - Assuntos dentro de domínios
- **topics** - Sub-tópicos específicos
- **question_bank_versions** - Versões de importação para versionamento/rollback

### Grupo 3: Questões & RAG (4 tabelas)

- **questions** - Banco de 13,917 questões + geradas
- **question_sources** - Dual-corpus RAG control (source_type + rag_eligible) [NEW v2.1]
- **question_topics** - Mapeamento N:M (questão → múltiplos tópicos)
- **question_reputation** - Pontuação 0-10 e estatísticas

### Grupo 4: Feedback & Qualidade (2 tabelas)

- **question_feedback** - Problemas relatados pelos usuários
- **question_reviews** - Validação por especialistas

### Grupo 5: Histórico do Usuário (2 tabelas)

- **user_question_history** - Tentativas e respostas
- **subscriptions** - Planos de pagamento (futuro)

### Grupo 6: Provas (3 tabelas)

- **exams** - Provas customizadas
- **exam_questions** - Questões em cada prova (ordenadas)
- **user_exam_attempts** - Tentativas de prova
- **user_exam_answers** - Respostas individuais

---

## Relacionamentos

### Relacionamentos Principais

```text
USERS (1) ──────────────► (N) QUESTION_REVIEWS
           (reviewer_id)

USERS (1) ──────────────► (N) USER_QUESTION_HISTORY
           (user_id)

USERS (1) ──────────────► (N) EXAMS
           (creator_id)

USERS (1) ──────────────► (N) USER_EXAM_ATTEMPTS
           (user_id)

USERS (1) ──────────────► (1) SUBSCRIPTIONS
           (user_id)

DOMAINS (1) ──────────────► (N) SUBJECTS
             (domain_id)

SUBJECTS (1) ──────────────► (N) TOPICS
              (subject_id)

TOPICS (1) ──────────────► (N) QUESTION_TOPICS
           (topic_id)           (N:M bridge)

QUESTIONS (1) ──────────────► (N) QUESTION_TOPICS
              (question_id)         (N:M bridge)

QUESTIONS (1) ──────────────► (1) QUESTION_REPUTATION
              (question_id)

QUESTIONS (1) ──────────────► (N) USER_QUESTION_HISTORY
              (question_id)

QUESTIONS (1) ──────────────► (N) QUESTION_FEEDBACK
              (question_id)

QUESTIONS (1) ──────────────► (N) QUESTION_REVIEWS
              (question_id)

QUESTIONS (1) ──────────────► (N) EXAM_QUESTIONS
              (question_id)         (N:M bridge)

QUESTION_BANK_VERSIONS (1) ──────────────► (N) QUESTIONS
                          (question_bank_version_id)

EXAMS (1) ──────────────► (N) EXAM_QUESTIONS
         (exam_id)

EXAMS (1) ──────────────► (N) USER_EXAM_ATTEMPTS
         (exam_id)

USER_EXAM_ATTEMPTS (1) ──────────────► (N) USER_EXAM_ANSWERS
                      (attempt_id)
```

### Cardinalidade Resumida

| Origem             | Destino               | Tipo | Exemplo                      |
| :----------------- | :-------------------- | :--- | :--------------------------- |
| DOMAINS            | SUBJECTS              | 1:N  | 1 Direito → N Assuntos       |
| SUBJECTS           | TOPICS                | 1:N  | 1 Assunto → N Tópicos        |
| TOPICS             | QUESTION_TOPICS       | 1:N  | 1 Tópico → N Questões        |
| QUESTIONS          | QUESTION_TOPICS       | 1:N  | 1 Questão → N Tópicos        |
| QUESTIONS          | QUESTION_REPUTATION   | 1:1  | Cada questão tem 1 reputação |
| USERS              | QUESTION_REVIEWS      | 1:N  | 1 Reviewer → N Reviews       |
| USERS              | USER_QUESTION_HISTORY | 1:N  | 1 User → N Tentativas        |
| EXAMS              | EXAM_QUESTIONS        | 1:N  | 1 Prova → N Questões         |
| EXAMS              | USER_EXAM_ATTEMPTS    | 1:N  | 1 Prova → N Tentativas       |
| USER_EXAM_ATTEMPTS | USER_EXAM_ANSWERS     | 1:N  | 1 Tentativa → N Respostas    |

---

## Fluxos de Dados

### Fluxo 1: Importação CSV

```text
[CSV File]
    ↓
[PARSER]
    ↓
[VALIDATE]
    ↓
[DEDUPLICATION]
    ↓
INSERT INTO questions
    ↓
INSERT INTO question_topics (semantic mapping)
    ↓
CREATE question_reputation (trigger automático)
    ↓
[QUESTION_BANK_VERSIONS] atualiza stats
```

**Tabelas Envolvidas:**

- question_bank_versions (cria nova versão)
- questions (insere 13,917 registros)
- question_topics (N:M mapping)
- question_reputation (auto-create via trigger)

---

### Fluxo 2: Geração de Questão com IA (com RAG)

```text
[User Request: domain, subject, difficulty]
    ↓
[RAG Query: SELECT from questions WHERE source_type='real_exam' AND rag_eligible=true]
    ↓
[Retrieve 5-10 similar real exam questions as context]
    ↓
[Gemini API] (generate new question with RAG grounding)
    ↓
INSERT INTO questions (ai_generated, generation_metadata)
    ↓
INSERT INTO question_sources (source_type='ai_generated', rag_eligible=false)
    ↓
[Semantic Mapping]
    ↓
INSERT INTO question_topics
    ↓
CREATE question_reputation (trigger, initial_score=0)
    ↓
[Expert Review Queue - 100% validation required]
    ↓
IF approved: UPDATE question_sources (rag_eligible=true) [NEVER for AI-generated]
```

**Tabelas Envolvidas:**

- question_sources (READ for RAG filtering, WRITE for new AI question)
- questions (read para RAG, write para nova questão)
- question_topics (insert mappings)
- question_reputation (auto-create)

**CRITICAL:** RAG filtering enforced at query level (source_type='real_exam' AND rag_eligible=true)

---

### Fluxo 3: Respondendo Questão

```text
[User selects answer]
    ↓
POST /api/questions/{id}/submit
    ↓
[Validate answer]
    ↓
INSERT INTO user_question_history
    ↓
[Trigger: update_reputation_on_attempt]
    ↓
UPDATE question_reputation
    ↓
[Return result + commentary]
```

**Tabelas Envolvidas:**

- questions (read)
- user_question_history (write)
- question_reputation (update via trigger)

---

### Fluxo 4: Reportar Problema

```text
[User: category + text]
    ↓
POST /api/questions/{id}/feedback
    ↓
INSERT INTO question_feedback
    ↓
[Trigger: flag_question_on_feedback]
    ↓
IF problem_count >= 3:
  UPDATE question_reputation (status = 'flagged')
```

**Tabelas Envolvidas:**

- question_feedback (write)
- question_reputation (conditional update via trigger)

---

### Fluxo 5: Review por Especialista

```text
[Reviewer: decision + notes]
    ↓
POST /api/admin/reviews
    ↓
INSERT INTO question_reviews
    ↓
[Trigger: update_reputation_on_review]
    ↓
UPDATE question_reputation
  - Aprove: score +2 (até 10)
  - Reject: score 0
  - Request revision: status = 'under_review'
```

**Tabelas Envolvidas:**

- question_reviews (write)
- question_reputation (update via trigger)

---

### Fluxo 6: Criar e Responder Prova

```text
[Educator: title, questions]
    ↓
INSERT INTO exams
    ↓
INSERT INTO exam_questions (ordered)
    ↓
[User: starts attempt]
    ↓
INSERT INTO user_exam_attempts
    ↓
[For each answer]
    ├─ INSERT INTO user_exam_answers
    └─ UPDATE user_exam_attempts (progress)
    ↓
[Complete exam]
    ↓
[Trigger: calculate_exam_results]
    ↓
UPDATE user_exam_attempts
  - total_questions
  - correct_answers
  - score_percentage
  - passed
```

**Tabelas Envolvidas:**

- exams (read/write)
- exam_questions (write)
- user_exam_attempts (write, update via trigger)
- user_exam_answers (write)

---

## Índices e Performance

### Índices Críticos

```sql
-- Full-text search em português
CREATE INDEX idx_questions_search ON questions
  USING GIN(search_vector);

-- Filtros frequentes
CREATE INDEX idx_questions_domain_difficulty ON questions(domain_id, difficulty)
  WHERE is_active = true;

-- Por tipo de fonte
CREATE INDEX idx_questions_source ON questions(source_type, exam_board);

-- Histórico do usuário
CREATE INDEX idx_history_user_date ON user_question_history(user_id, attempted_at DESC);

-- Stats de questões
CREATE INDEX idx_history_question_stats ON user_question_history(question_id, is_correct);

-- Reputação
CREATE INDEX idx_reputation_score ON question_reputation(current_score DESC, last_updated DESC);

-- Status
CREATE INDEX idx_reputation_status ON question_reputation(status)
  WHERE status != 'active';

-- Topics
CREATE INDEX idx_subjects_domain ON subjects(domain_id, display_order);
CREATE INDEX idx_topics_subject ON topics(subject_id, display_order);

-- Feedback pendente
CREATE INDEX idx_feedback_pending ON question_feedback(status, submitted_at)
  WHERE status IN ('pending', 'under_review');

-- Exam attempts
CREATE INDEX idx_exam_attempts_user ON user_exam_attempts(user_id, started_at DESC);
CREATE INDEX idx_exam_attempts_exam ON user_exam_attempts(exam_id, completed_at DESC);
```

### Estratégia de Indexação

| Índice                  | Tipo      | Uso                         | Benefício                |
| :---------------------- | :-------- | :-------------------------- | :----------------------- |
| search_vector (GIN)     | Full-text | Busca de questões por texto | <200ms para 13k questões |
| (user_id, attempted_at) | BTREE     | Dashboard stats             | <100ms analytics         |
| (current_score DESC)    | BTREE     | Reputation ranking          | <50ms quality filter     |
| (status, submitted_at)  | BTREE     | Feedback queue              | <100ms pending reviews   |
| (domain_id, difficulty) | BTREE     | Generation filtering        | <50ms question lookup    |

---

## Triggers Automáticos

### Trigger 1: create_reputation_for_question

**Quando:** Após INSERT em questions
**O que faz:** Cria entrada automática em question_reputation
**Score inicial:**

- Real exam: 10
- AI generated: 0
- User submitted: 5

### Trigger 2: update_reputation_on_attempt

**Quando:** Após INSERT em user_question_history
**O que faz:**

- Incrementa total_attempts
- Incrementa correct_attempts se is_correct = true
- Recalcula empirical_difficulty
- Atualiza timestamps

### Trigger 3: flag_question_on_feedback

**Quando:** Antes de INSERT em question_feedback
**O que faz:**

- Incrementa problem_reports
- Se >= 3 reports: status = 'flagged'
- Marca feedback como is_priority = true

### Trigger 4: update_reputation_on_review

**Quando:** Após INSERT em question_reviews
**O que faz:**

- Incrementa expert_validations
- Aprove: current_score = MIN(current_score + 2, 10)
- Reject: current_score = 0, status = 'disabled'
- Request revision: status = 'under_review'

### Trigger 5: calculate_exam_results

**Quando:** Antes de UPDATE em user_exam_attempts (is_completed = true)
**O que faz:**

- Conta total_questions e correct_answers
- Calcula score_percentage
- Define passed = (percentage >= passing_threshold)
- Define completed_at = NOW()
- Define time_spent_seconds

---

**Próximo:** Leia [COMPONENTES_SHOWCASE.md](./COMPONENTES_SHOWCASE.md) para ver exemplos de componentes.
