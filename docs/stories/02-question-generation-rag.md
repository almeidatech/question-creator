# US-1.2: Question Generation & Retrieval (RAG Integration)

**Epic:** Epic 1 - Core Features
**Sprint:** 1.1 & 1.2 / Weeks 2-3
**Effort:** 28h
**Assigned to:** @dev, @architect, @db-sage
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** student studying for exams
**I want** to generate 5-10 personalized study questions on demand
**So that** I can get relevant practice material quickly without waiting

---

## Acceptance Criteria

- [ ] `POST /api/questions/generate` - Generate questions via Gemini API
  - Input: topic, difficulty (easy/medium/hard), count (5-10)
  - Uses RAG (retrieval-augmented generation) with existing questions
  - Gemini prompt includes context from stored question bank
  - Returns 5-10 new questions in < 30 seconds
  - Cache hit for identical requests (Redis 24h TTL)
  - Fallback: Return real questions if Gemini timeout (> 30s)
  - Rate limited: 10 gen/min per user
  - Status: 200 with questions, 202 if queued, 408 if timeout → fallback

- [ ] `GET /api/questions` - List questions with search
  - Search by text (full-text search in Portuguese)
  - Filter by difficulty, topic, domain
  - Pagination (default 20 per page, max 100)
  - Return: question_id, text, options (4), difficulty, topic, reputation_score
  - FTS performance: < 100ms for typical query
  - Status: 200 with results + pagination metadata

- [ ] `GET /api/questions/{id}` - Fetch single question with reputation
  - Returns: question text, 4 options, correct_answer_index, reputation (0-10)
  - Join with reputation aggregate (avg user scores)
  - Response time P95 < 50ms
  - Status: 200 OK, 404 if not found

---

## Definition of Done

- [ ] Generate endpoint returns 5-10 questions in < 30 seconds
- [ ] Fallback mechanism tested (Gemini timeout → real questions returned)
- [ ] FTS working for Portuguese queries (test with common Constitutional Law terms)
- [ ] Cache hit rate > 50% (measured after 24h of usage)
- [ ] Vitest: 10+ test cases covering normal + error paths
- [ ] Load test: 100 concurrent generate requests, all < 30s
- [ ] Documentation: RAG prompt structure, caching strategy, FTS config
- [ ] No N+1 queries in retrieval endpoints
- [ ] Rate limiting verified (11th request returns 429)

---

## Technical Specifications

### Cache Key Strategy

```typescript
// Redis cache for generated questions
const cacheKey = `question:generated:${user_id}:${topic}:${difficulty}:${count}`;
// TTL: 24 hours
await redis.setex(cacheKey, 86400, JSON.stringify(questions));
```

### Gemini Prompt Template

```text
You are an expert Constitutional Law professor. Generate ${count} unique exam-style multiple-choice questions.

Context (similar existing questions):
${retrievedContext}

Requirements:
- Difficulty: ${difficulty}
- Topic: ${topic}
- 4 options per question
- Exactly 1 correct answer
- Options should be plausible but distinct
- Return as JSON array

Format:
[{
  "text": "Question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "explanation": "Why A is correct..."
}]
```

### FTS Configuration (PostgreSQL)

```sql
-- Enable full-text search for Portuguese
CREATE INDEX idx_questions_fts ON questions
  USING gin(to_tsvector('portuguese', text));

-- Query example
SELECT * FROM questions
  WHERE to_tsvector('portuguese', text) @@ plainto_tsquery('portuguese', 'direito constitucional')
  LIMIT 20;
```

### Endpoints

```typescript
POST /api/questions/generate
{
  topic: "direito-constitucional",
  difficulty: "medium",
  count: 5
}
// Response 200:
{
  questions: [{
    id: "uuid",
    text: "Qual é...",
    options: ["A", "B", "C", "D"],
    difficulty: "medium",
    topic: "direito-constitucional"
  }],
  cached: false,
  generatedAt: "2026-02-01T10:30:00Z"
}

GET /api/questions?search=direito&difficulty=medium&topic=constitucional&page=1&limit=20
// Response 200:
{
  questions: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 342,
    pages: 18
  }
}

GET /api/questions/{id}
// Response 200:
{
  id: "uuid",
  text: "Qual é...",
  options: ["A", "B", "C", "D"],
  difficulty: "medium",
  topic: "direito-constitucional",
  reputation: {
    score: 7.5,
    count: 24,
    status: "excellent"
  }
}
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Input validation (topic, difficulty, count ranges)
- [ ] Cache key collision check (no data mixing)
- [ ] FTS query performance test (< 100ms)
- [ ] SQL injection prevention (parameterized queries only)
- [ ] Prompt injection protection (sanitize topic input)

### Pre-PR

- [ ] Gemini API latency test (target < 30s, measure P95)
- [ ] Fallback mechanism verified (timeout → real questions)
- [ ] Cache hit rate verified (> 50% after 24h)
- [ ] @architect review of LLM prompt safety
- [ ] @db-sage review of FTS configuration

### Pre-Deployment

- [ ] Load test: 100 concurrent generate requests
- [ ] Monitor Gemini API quota usage + costs
- [ ] Cache memory usage check (set max size)
- [ ] FTS index health check

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Gemini API rate limit → degradation | 10 gen/min per user, Redis cache, fallback to real questions |
| FTS not working in Portuguese | Test locally week 1, use `portuguese` config, fallback to ILIKE |
| Cache poisoning | Validate Gemini response structure + content length limits |
| Slow FTS queries | Monitor execution time, optimize indexes, pre-compute popular searches |

---

## Dependencies

- [ ] Gemini API key configured (.env.local)
- [ ] Redis configured (Upstash or local)
- [ ] Database with 13.9k questions already imported
- [ ] Story 1.1 (Auth) completed first

---

## Implementation Checklist

- [ ] Setup Gemini API client
- [ ] Create cache service (Redis)
- [ ] Implement question generation endpoint
- [ ] Create RAG context retrieval function
- [ ] Implement fallback mechanism (timeout handling)
- [ ] Create FTS index on questions table
- [ ] Implement search endpoint with FTS
- [ ] Add rate limiting for generation
- [ ] Write performance tests
- [ ] Document RAG strategy and caching approach

---

**Created:** 2026-02-01
**Previous Story:** [01-api-foundation-auth.md](./01-api-foundation-auth.md)
**Next Story:** [03-question-submission-reputation.md](./03-question-submission-reputation.md)
