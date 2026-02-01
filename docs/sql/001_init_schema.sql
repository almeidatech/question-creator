-- ============================================================================
-- Question Creator MVP - Database Schema (Supabase Optimized)
-- ============================================================================
-- Based on: BANCO_DE_DADOS_DIAGRAMA.md
-- Database: PostgreSQL 13+ (Supabase)
-- Execution Order:
-- 1. 001_init_schema.sql (this file)
-- 2. 002_create_indexes.sql
-- 3. 003_create_triggers.sql
-- 4. 004_enable_rls.sql
-- 5. 005_create_views.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE 1: USERS (Authentication & Authorization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  user_role VARCHAR(20) DEFAULT 'student'
    CHECK (role IN ('student', 'educator', 'reviewer', 'admin')),
  subscription_tier VARCHAR(50) DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium', 'institutional')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: DOMAINS (Taxonomy Level 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: SUBJECTS (Taxonomy Level 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_id, slug)
);

-- ============================================================================
-- TABLE 4: TOPICS (Taxonomy Level 3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  keywords TEXT, -- Comma-separated for semantic matching
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, slug)
);

-- ============================================================================
-- TABLE 5: QUESTION_BANK_VERSIONS (Versioning & Rollback)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_bank_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INT NOT NULL UNIQUE,
  import_date TIMESTAMPTZ DEFAULT NOW(),
  source_files TEXT[], -- CSV filenames
  total_questions INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'deprecated', 'rollback')),
  metadata JSONB, -- Import stats, duplication counts, etc.
  imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 6: QUESTIONS (Core Content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bank_version_id UUID NOT NULL REFERENCES question_bank_versions(id) ON DELETE RESTRICT,

  -- Question Content
  question_text TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500) NOT NULL,
  option_d VARCHAR(500) NOT NULL,
  option_e VARCHAR(500), -- Optional 5th option
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'e')),
  commentary TEXT, -- Expert explanation

  -- Metadata
  source_type VARCHAR(50) CHECK (source_type IN ('real_exam', 'ai_generated', 'user_submitted')),
  exam_board VARCHAR(50), -- CESPE, FCC, FGV, VUNESP, etc.
  exam_year INT,
  exam_name VARCHAR(255),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- Relationships
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  primary_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,

  -- AI Generation Metadata
  ai_model VARCHAR(100), -- 'claude-3.5-sonnet', 'gpt-4', etc.
  ai_prompt_version VARCHAR(50), -- 'v1.0', 'v1.1', etc.
  generation_metadata JSONB, -- RAG context, temperature, tokens used

  -- Full-Text Search
  search_vector TSVECTOR,

  -- Extensible Fields
  metadata JSONB,

  -- Versioning
  original_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,

  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE 7: QUESTION_TOPICS (N:M Relationship with Relevance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_topics (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  relevance_score FLOAT DEFAULT 1.0 CHECK (relevance_score BETWEEN 0.0 AND 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (question_id, topic_id)
);

-- ============================================================================
-- TABLE 8: QUESTION_REPUTATION (Quality & Confidence)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_reputation (
  question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,

  -- Scoring
  current_score INT DEFAULT 5 CHECK (current_score BETWEEN 0 AND 10),
  total_attempts INT DEFAULT 0,
  correct_attempts INT DEFAULT 0,

  -- Feedback & Validation
  problem_reports INT DEFAULT 0,
  expert_validations INT DEFAULT 0,

  -- Derived Metrics
  empirical_difficulty FLOAT, -- Calculated from success rate
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'under_review', 'disabled')),

  -- Timestamps
  first_attempt_date TIMESTAMPTZ,
  last_attempt_date TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  -- Extensible
  metadata JSONB
);

-- ============================================================================
-- TABLE 9: USER_QUESTION_HISTORY (Attempt History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_question_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Response
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd', 'e')),
  is_correct BOOLEAN NOT NULL,

  -- Timing
  response_time_ms INT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Session & Context
  session_id UUID,
  context VARCHAR(50), -- 'practice', 'exam_simulation', 'study_session'

  -- Prevent duplicates per session
  UNIQUE(user_id, question_id, attempted_at)
);

-- ============================================================================
-- TABLE 10: QUESTION_FEEDBACK (User-Reported Problems)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Feedback Details
  category VARCHAR(100) NOT NULL, -- 'incorrect_answer', 'typo', 'unclear', 'offensive', etc.
  feedback_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),

  -- Review
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  is_priority BOOLEAN DEFAULT FALSE,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- TABLE 11: QUESTION_REVIEWS (Expert Validation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Review Decision
  decision VARCHAR(50) NOT NULL
    CHECK (decision IN ('approve', 'request_revision', 'reject')),
  notes TEXT,
  suggested_changes JSONB, -- For revision suggestions

  -- Timestamp
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit
  UNIQUE(question_id, reviewer_id, reviewed_at)
);

-- ============================================================================
-- TABLE 12: EXAMS (Custom Exams/Tests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Configuration
  time_limit_minutes INT, -- NULL = no limit
  passing_score_percentage INT DEFAULT 70,
  shuffle_questions BOOLEAN DEFAULT FALSE,
  shuffle_answers BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT TRUE,

  -- Status
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  -- Extensible
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================================================
-- TABLE 13: EXAM_QUESTIONS (N:M Ordered Relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Ordering & Scoring
  display_order INT NOT NULL,
  points INT DEFAULT 1 CHECK (points >= 0),

  -- Constraints
  UNIQUE(exam_id, question_id),
  UNIQUE(exam_id, display_order)
);

-- ============================================================================
-- TABLE 14: USER_EXAM_ATTEMPTS (Exam Sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_spent_seconds INT,

  -- Questions & Scoring
  total_questions INT, -- Cached from exam
  correct_answers INT,
  score_percentage FLOAT CHECK (score_percentage BETWEEN 0 AND 100),
  passed BOOLEAN,

  -- Status
  is_completed BOOLEAN DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 15: USER_EXAM_ANSWERS (Individual Exam Responses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES user_exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- Response
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd', 'e')),
  is_correct BOOLEAN,

  -- Timing
  response_time_ms INT,
  answered_at TIMESTAMPTZ DEFAULT NOW(),

  -- Uniqueness
  UNIQUE(attempt_id, question_id)
);

-- ============================================================================
-- TABLE 16: SUBSCRIPTIONS (Billing & Plans)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  plan VARCHAR(50) DEFAULT 'free'
    CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'cancelled')),

  started_at TIMESTAMPTZ DEFAULT NOW(),
  renewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INITIAL DATA: Taxonomy Seed
-- ============================================================================

-- Insert default question bank version
INSERT INTO question_bank_versions (version_number, import_date, total_questions, status)
VALUES (1, NOW(), 0, 'active')
ON CONFLICT DO NOTHING;

-- Insert domain: Direito Constitucional
INSERT INTO domains (name, slug, display_order, is_active)
VALUES ('Direito Constitucional', 'direito-constitucional', 1, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert subjects (examples - add more as needed)
INSERT INTO subjects (domain_id, name, slug, display_order, is_active)
SELECT
  d.id,
  s_name,
  s_slug,
  s_order,
  TRUE
FROM domains d
CROSS JOIN (VALUES
  ('Direitos Fundamentais', 'direitos-fundamentais', 1),
  ('Poder Constituinte', 'poder-constituinte', 2),
  ('Processo Legislativo', 'processo-legislativo', 3),
  ('Organização dos Poderes', 'organizacao-poderes', 4),
  ('Jurisdição Constitucional', 'jurisdicao-constitucional', 5)
) AS subjects(s_name, s_slug, s_order)
WHERE d.slug = 'direito-constitucional'
ON CONFLICT DO NOTHING;

-- Insert topics (examples)
INSERT INTO topics (subject_id, name, slug, keywords, display_order, is_active)
SELECT
  s.id,
  t_name,
  t_slug,
  t_keywords,
  t_order,
  TRUE
FROM subjects s
CROSS JOIN (VALUES
  ('Liberdade de Expressão', 'liberdade-expressao', 'expressão, liberdade, imprensa', 1),
  ('Direito à Vida', 'direito-vida', 'vida, morte, eutanásia', 2),
  ('Igualdade', 'igualdade', 'igualdade, discriminação, cotas', 3),
  ('Propriedade', 'propriedade', 'propriedade, herança, expropriação', 4),
  ('Educação', 'educacao', 'educação, ensino, universidade', 5)
) AS topics(t_name, t_slug, t_keywords, t_order)
WHERE s.slug = 'direitos-fundamentais'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUPABASE-SPECIFIC CONFIGURATION
-- ============================================================================

-- Enable RLS (Row Level Security) - Will be configured in 004_enable_rls.sql
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... (other tables)

-- ============================================================================
-- NOTES FOR SUPABASE
-- ============================================================================

/*
SUPABASE INTEGRATION NOTES:

1. AUTHENTICATION:
   - Use Supabase Auth for users table
   - Set up PostgreSQL policies for row-level access
   - Use JWT tokens from Supabase Auth

2. REAL-TIME SUBSCRIPTIONS:
   - Supabase provides real-time listening on tables
   - Configure in 004_enable_rls.sql for Supabase RLS

3. STORAGE:
   - Use Supabase Storage for avatar_url
   - Store references as URLs in avatar_url column

4. FUNCTIONS & TRIGGERS:
   - Use PostgreSQL triggers (this file)
   - Callable from Supabase API

5. MIGRATIONS:
   - Supabase migrations: supabase db push
   - Local development: supabase db reset

6. ENVIRONMENT:
   - SUPABASE_URL=https://xxxxx.supabase.co
   - SUPABASE_ANON_KEY=xxxxx
   - SUPABASE_SERVICE_KEY=xxxxx (backend only)

FIELD CHANGES FROM PREVIOUS VERSION:
- `password_hash` now required (Supabase Auth may handle separately)
- Added `avatar_url` instead of separate image table
- Changed `option_e` to optional (5th option may not be used)
- Renamed `option_X` fields from `option_a` format (was different)
- Added `session_id` to user_question_history for grouping
- Added `context` field to user_question_history
- Simplified subscription fields for initial version
- All timestamps use TIMESTAMPTZ for timezone safety
*/
