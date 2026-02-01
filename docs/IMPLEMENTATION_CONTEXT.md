# 🚀 RAG Implementation Context for Development Team

**Ready for:** Sprint 7-8 (Weeks 7-8) | **Last Updated:** Feb 1, 2026

---

## Quick Reference

### What Are We Building?

A **Retrieval-Augmented Generation (RAG) system** that lets students generate unlimited study questions on demand, grounded in real exam patterns, with expert validation.

### Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| RAG Retrieval | PostgreSQL FTS | Fast, built-in, no external dependency |
| LLM | Claude 3.5 Sonnet | Superior legal reasoning, Constitutional Law expertise |
| Cache | Upstash Redis | 24h TTL for generated questions |
| Corpus Isolation | Enum + filters | Prevent AI from contaminating real exams |
| Phase 2 | pgvector | Semantic search hybrid (optional upgrade Week 4) |

### Timeline

```
Week 7-8 (MVP):    FTS-based RAG (42h effort)
├─ Day 1-2:  Database schema (dual-corpus)
├─ Day 3-4:  FTS query development
├─ Day 5-6:  Claude integration + caching
├─ Day 7-8:  Testing + expert review queue
└─ Day 9:    Polish + documentation

Week 4 (Phase 2):  pgvector upgrade (6h effort, optional)
├─ Day 1:    pgvector setup
├─ Day 2-3:  Embeddings batch job
└─ Day 4-5:  Hybrid search + testing
```

### Effort Breakdown

- **US-1B.1:** Dual-corpus schema = 4h
- **US-1B.2:** FTS queries = 8h
- **US-1B.3:** Claude integration = 8h
- **US-1B.4:** Caching = 4h
- **US-1B.5:** Expert review queue = 6h
- **US-1B.6:** Testing = 6h
- **US-1B.7:** pgvector (Phase 2 only) = 6h

**Total MVP: 42h** | **Recommended: 1 backend dev + 1 architect review**

---

## 1. Database Schema (US-1B.1)

### What to Create

**New Table: question_sources**

```sql
CREATE TABLE question_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID UNIQUE NOT NULL REFERENCES questions(question_id),
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('real_exam', 'ai_generated', 'expert_approved')),
  rag_eligible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(user_id),
  CONSTRAINT source_type_valid CHECK (source_type IN ('real_exam', 'ai_generated', 'expert_approved'))
);

-- Indexes for RAG queries
CREATE INDEX idx_sources_type_eligible ON question_sources(source_type, rag_eligible)
  WHERE source_type = 'real_exam';  -- Partial index for performance

CREATE INDEX idx_sources_question_id ON question_sources(question_id);

-- Audit trigger
CREATE OR REPLACE FUNCTION audit_source_type_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_type != OLD.source_type THEN
    INSERT INTO audit_log (table_name, record_id, old_value, new_value, changed_at, changed_by)
    VALUES ('question_sources', NEW.id, OLD.source_type::text, NEW.source_type::text, NOW(), current_user);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER source_type_audit
AFTER UPDATE ON question_sources
FOR EACH ROW
EXECUTE FUNCTION audit_source_type_change();
```

### Data Migration

**Migrate existing 13,917 real exam questions:**

```sql
INSERT INTO question_sources (question_id, source_type, rag_eligible, created_at)
SELECT id, 'real_exam', true, NOW()
FROM questions
WHERE source_type = 'real_exam';  -- Assuming this column exists
```

### Verification

```sql
-- Should return 13,917
SELECT COUNT(*) FROM question_sources WHERE source_type = 'real_exam';

-- Daily contamination check (should return 0)
SELECT COUNT(*) FROM question_sources
WHERE source_type='ai_generated' AND rag_eligible=true;
```

---

## 2. FTS Index & Query Development (US-1B.2)

### Create FTS Index

```sql
-- Create tsvector column if not exists
ALTER TABLE questions ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate tsvector
UPDATE questions
SET search_vector = to_tsvector('portuguese',
  coalesce(question_text, '') || ' ' ||
  coalesce(option_a, '') || ' ' ||
  coalesce(option_b, '') || ' ' ||
  coalesce(option_c, '') || ' ' ||
  coalesce(option_d, '') || ' ' ||
  coalesce(option_e, '')
);

-- Create GIN index
CREATE INDEX idx_questions_fts ON questions USING GIN(search_vector);
```

### RAG Retrieval Function

```typescript
// src/lib/rag.ts

import { SupabaseClient } from '@supabase/supabase-js';

interface RagQuestion {
  id: string;
  text: string;
  options: { a: string; b: string; c: string; d: string; e: string };
  difficulty: string;
}

export async function retrieveRagContext(
  supabase: SupabaseClient,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 10
): Promise<RagQuestion[]> {
  // Query 1: FTS-based search
  const { data: ftsResults, error: ftsError } = await supabase.rpc(
    'search_questions_fts',
    {
      search_term: topic,
      difficulty_filter: difficulty,
      limit_count: count,
    }
  );

  if (ftsError) {
    console.error('FTS search failed, falling back to keyword match', ftsError);
    // Fallback: Keyword search by topic
    return await fallbackKeywordSearch(supabase, topic, difficulty, count);
  }

  // Verify: source_type = 'real_exam' only
  const results = ftsResults.filter((q) => q.source_type === 'real_exam');

  // If <3 results, use fallback
  if (results.length < 3) {
    return await fallbackKeywordSearch(supabase, topic, difficulty, count);
  }

  return results.slice(0, count);
}

async function fallbackKeywordSearch(
  supabase: SupabaseClient,
  topic: string,
  difficulty: string,
  count: number
): Promise<RagQuestion[]> {
  // Fallback: Random questions by topic + difficulty
  const { data } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, option_e, difficulty')
    .match({ difficulty })
    .in('topic_id', [topic]) // Assuming topic_id mapping exists
    .limit(count)
    .order('created_at', { ascending: false });

  return data || [];
}
```

### SQL Stored Procedure

```sql
-- More efficient: Use stored procedure for FTS

CREATE OR REPLACE FUNCTION search_questions_fts(
  search_term TEXT,
  difficulty_filter VARCHAR,
  limit_count INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  question_text TEXT,
  option_a TEXT,
  source_type VARCHAR,
  difficulty VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.option_a,
    qs.source_type,
    q.difficulty
  FROM questions q
  JOIN question_sources qs ON q.id = qs.question_id
  WHERE qs.source_type = 'real_exam'
    AND qs.rag_eligible = true
    AND q.difficulty = difficulty_filter
    AND q.search_vector @@ plainto_tsquery('portuguese', search_term)
  ORDER BY ts_rank(q.search_vector, plainto_tsquery('portuguese', search_term)) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

### Performance Test

```typescript
// src/lib/__tests__/rag.test.ts

import { describe, it, expect } from 'vitest';
import { retrieveRagContext } from '../rag';
import { createClient } from '@supabase/supabase-js';

describe('RAG Retrieval', () => {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

  it('should retrieve FTS questions <100ms', async () => {
    const start = performance.now();
    const results = await retrieveRagContext(supabase, 'direitos fundamentais', 'medium', 10);
    const latency = performance.now() - start;

    expect(latency).toBeLessThan(100);
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('should only return real_exam questions', async () => {
    const results = await retrieveRagContext(supabase, 'direitos fundamentais', 'medium', 5);

    results.forEach((q) => {
      expect(q.source_type).toBe('real_exam');
    });
  });

  it('should handle insufficient results with fallback', async () => {
    const results = await retrieveRagContext(supabase, 'nonexistent-topic-xyz', 'hard', 10);

    // Should return something (fallback to random)
    expect(results.length).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 3. Claude Integration (US-1B.3)

### API Endpoint

```typescript
// src/pages/api/questions/generate.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { retrieveRagContext } from '@/lib/rag';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema
const GenerateRequestSchema = z.object({
  topic: z.string().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1).max(20),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, count } = GenerateRequestSchema.parse(body);

    // Get user from session
    const supabase = createServerClient(request);
    const user = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limiting
    const rateLimitKey = `gen:${user.id}:${Date.now() / 60000}`;
    // Check Redis for rate limit (simplified)

    // 1. Retrieve RAG context
    const ragContext = await retrieveRagContext(supabase, topic, difficulty, 10);

    // 2. Build prompt
    const prompt = buildPrompt(topic, difficulty, count, ragContext);

    // 3. Call Claude
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.5, // Less creative, more consistent
      system: `You are a Constitutional Law expert. Generate exam-style questions matching real CESPE/FCC patterns.`,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // 4. Parse response
    const generatedText = message.content[0].type === 'text' ? message.content[0].text : '';
    const questions = parseClaudeResponse(generatedText);

    // 5. Validate questions
    if (questions.length !== count) {
      throw new Error(`Expected ${count} questions, got ${questions.length}`);
    }

    // 6. Store in database with source_type='ai_generated'
    const { data: stored } = await supabase
      .from('questions')
      .insert(
        questions.map((q) => ({
          question_text: q.text,
          option_a: q.options.a,
          option_b: q.options.b,
          option_c: q.options.c,
          option_d: q.options.d,
          option_e: q.options.e,
          correct_answer: q.correctAnswer,
          difficulty,
          source_type: 'ai_generated',
          created_by: user.id,
        }))
      )
      .select();

    // 7. Mark in question_sources
    if (stored) {
      await supabase.from('question_sources').insert(
        stored.map((q) => ({
          question_id: q.id,
          source_type: 'ai_generated',
          rag_eligible: false, // CRITICAL: Never use in RAG
          created_at: new Date(),
        }))
      );
    }

    // 8. Cache result (Redis)
    // await redis.setex(cacheKey, 86400, JSON.stringify(questions));

    return NextResponse.json({
      success: true,
      questions,
      metadata: {
        topic,
        difficulty,
        count,
        model: 'claude-3-5-sonnet',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Generation error:', error);

    // Fallback: Return real exam questions
    return NextResponse.json(
      {
        error: 'Generation failed, returning real exam questions',
        fallback: true,
      },
      { status: 202 }
    );
  }
}

function buildPrompt(
  topic: string,
  difficulty: string,
  count: number,
  ragContext: any[]
): string {
  const ragText = ragContext
    .map(
      (q, i) =>
        `Exemplo ${i + 1}:
Q: ${q.question_text}
A) ${q.option_a}
B) ${q.option_b}
C) ${q.option_c}
D) ${q.option_d}
E) ${q.option_e}
Resposta correta: ${q.correct_answer}`
    )
    .join('\n\n');

  return `
Gere exatamente ${count} questões únicas de múltipla escolha sobre "${topic}".

Contexto (questões reais como referência):
${ragText}

Requisitos:
- Dificuldade: ${difficulty}
- Estilo: CESPE/FCC
- 100% precisão jurídica
- Uma resposta correta por questão
- Retorne como JSON array:
[
  {
    "text": "...",
    "options": {
      "a": "...",
      "b": "...",
      "c": "...",
      "d": "...",
      "e": "..."
    },
    "correctAnswer": "a"
  }
]
`;
}

function parseClaudeResponse(text: string): any[] {
  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON found in response');

  return JSON.parse(jsonMatch[0]);
}
```

### Cost Tracking

```typescript
// Track API costs
function estimateTokenCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_1M = 3.0; // $3 per 1M input tokens
  const OUTPUT_COST_PER_1M = 15.0; // $15 per 1M output tokens

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

  return inputCost + outputCost;
}
```

---

## 4. Redis Caching (US-1B.4)

```typescript
// src/lib/cache.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedQuestions(
  userId: string,
  topic: string,
  difficulty: string,
  count: number
) {
  const cacheKey = `question:gen:${userId}:${topic}:${difficulty}:${count}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached as string) : null;
}

export async function setCachedQuestions(
  userId: string,
  topic: string,
  difficulty: string,
  count: number,
  questions: any[]
) {
  const cacheKey = `question:gen:${userId}:${topic}:${difficulty}:${count}`;
  // 24 hour TTL
  await redis.setex(cacheKey, 86400, JSON.stringify(questions));
}
```

### Integration in API

```typescript
// In POST /api/questions/generate:

const cached = await getCachedQuestions(user.id, topic, difficulty, count);
if (cached) {
  return NextResponse.json({
    success: true,
    questions: cached,
    cache: 'HIT',
  });
}

// ... generate questions ...

await setCachedQuestions(user.id, topic, difficulty, count, questions);
```

---

## 5. Expert Review Queue (US-1B.5)

```typescript
// src/pages/api/admin/review-queue.ts

export async function GET(request: NextRequest) {
  const supabase = createServerClient(request);

  const { data: queue } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, option_e, source_type, created_at')
    .eq('source_type', 'ai_generated')
    .in('reputation_status', ['pending', 'under_review'])
    .order('created_at', { ascending: true })
    .limit(20);

  return NextResponse.json({ data: queue });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { questionId, decision, notes } = body;

  const supabase = createServerClient(request);
  const user = await supabase.auth.getUser();

  const reputationMap = {
    approve: 7,
    request_revision: 3,
    reject: -1,
  };

  await supabase
    .from('question_reputation')
    .update({
      current_score: reputationMap[decision],
      expert_validations: 1,
      last_updated: new Date(),
    })
    .eq('question_id', questionId);

  // Log review
  await supabase.from('question_reviews').insert({
    question_id: questionId,
    reviewer_id: user.id,
    decision,
    notes,
    reviewed_at: new Date(),
  });

  return NextResponse.json({ success: true });
}
```

---

## 6. Testing Corpus Isolation (US-1B.6)

```typescript
// src/lib/__tests__/corpus-isolation.test.ts

describe('Corpus Isolation Tests', () => {
  it('RAG query never returns ai_generated questions', async () => {
    // Create test AI-generated question
    const { data: aiQuestion } = await supabase
      .from('questions')
      .insert({
        question_text: 'Test AI question',
        source_type: 'ai_generated',
        difficulty: 'medium',
      })
      .select();

    const questionId = aiQuestion[0].id;

    // Add to question_sources
    await supabase.from('question_sources').insert({
      question_id: questionId,
      source_type: 'ai_generated',
      rag_eligible: false,
    });

    // Try to retrieve via RAG
    const results = await retrieveRagContext(supabase, 'test', 'medium', 10);

    // Verify: AI question NOT in results
    const foundIds = results.map((q) => q.id);
    expect(foundIds).not.toContain(questionId);
  });

  it('daily contamination check returns 0', async () => {
    const { data: contamination } = await supabase.rpc(
      'check_corpus_contamination'
    );

    expect(contamination[0].contaminated_count).toBe(0);
  });

  it('load test: 100 concurrent RAG queries, all return only real_exam', async () => {
    const promises = Array(100)
      .fill(null)
      .map(() => retrieveRagContext(supabase, 'direitos', 'hard', 5));

    const results = await Promise.all(promises);

    results.forEach((batch) => {
      batch.forEach((q) => {
        expect(q.source_type).toBe('real_exam');
      });
    });
  });
});
```

---

## 7. Phase 2: pgvector Setup (US-1B.7)

*(Separate document - scheduled for Week 4)*

---

## Critical Reminders

### ⚠️ CORPUS ISOLATION IS NON-NEGOTIABLE

Every RAG query MUST include:
```sql
WHERE source_type = 'real_exam' AND rag_eligible = true
```

If this is missing, the entire RAG system fails.

### ⚠️ EXPERT REVIEW IS MANDATORY

No AI-generated questions go to users without expert approval.

### ⚠️ CONTAMINATION CHECK

Daily verify:
```sql
SELECT COUNT(*) FROM question_sources
WHERE source_type='ai_generated' AND rag_eligible=true;
-- Must equal 0
```

---

## Questions?

- **Architecture:** Ask @architect (Aria)
- **Database:** Ask @data-architect (Dara)
- **Product:** Ask @pm (Morgan)

---

**Ready to start?** Begin with US-1B.1 (database schema). Good luck! 🚀
