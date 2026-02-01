# US-4.2: Performance Optimization & Tuning

**Epic:** Epic 4 - QA & Launch
**Sprint:** 4.2 / Week 8
**Effort:** 22h
**Assigned to:** @dev, @db-sage, @devops
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** platform owner
**I want** to optimize performance to meet SLA targets
**So that** users have a fast, responsive experience

---

## Acceptance Criteria

- [ ] Database Optimization
  - Run EXPLAIN ANALYZE on slow queries
  - Create missing indexes (foreign keys, filters)
  - Eliminate N+1 patterns (use joins)
  - Target: slow queries < 100ms
  - Test with realistic data volume

- [ ] Frontend Optimization
  - Code splitting: route-based bundles
  - Lazy load components (React.lazy)
  - Image optimization (next/image)
  - Target: bundle < 300KB gzipped
  - LightHouse ≥ 90

- [ ] API Optimization
  - Cache frequent queries (Redis 5 min)
  - Enable gzip compression
  - Deduplicate parallel requests
  - Set Cache-Control headers
  - Target: P95 < 200ms

- [ ] CDN Optimization
  - Image optimization
  - Edge caching
  - Cache-Control headers (1 year for hashed assets)
  - Monitor edge hit rate

---

## Definition of Done

- [ ] Database: slow query EXPLAIN reviewed, indexes created
- [ ] Frontend: LightHouse ≥ 90, bundle < 300KB
- [ ] API: P95 confirmed < 200ms in load test
- [ ] CDN: images cached, load time < 1s
- [ ] No performance regressions vs. baseline
- [ ] Documentation: optimization summary

---

## Technical Specifications

### Database Optimization Query

```sql
-- Find slow queries
EXPLAIN ANALYZE
SELECT q.*, AVG(uqh.is_correct) as reputation
FROM questions q
LEFT JOIN user_question_history uqh ON q.id = uqh.question_id
WHERE q.topic = 'direito-constitucional'
  AND q.difficulty = 'medium'
GROUP BY q.id
LIMIT 20;

-- Create index
CREATE INDEX idx_questions_topic_difficulty ON questions(topic, difficulty);

-- Find missing indexes
SELECT schemaname, tablename, attname
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;
```

### Frontend Code Splitting (Next.js)

```typescript
// Route-based code splitting (automatic)
// Each route bundle: pages/questions/[id].tsx

// Component-level lazy loading
const QuestionDetailCommentSection = dynamic(
  () => import('@/components/QuestionDetailCommentSection'),
  { loading: () => <Skeleton /> }
);

// Image optimization
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority={true}
  sizes="(max-width: 640px) 100vw, 200px"
/>
```

### API Caching Strategy

```typescript
// Redis caching for frequently accessed data
const cacheKey = `dashboard:${user_id}`;
const cachedData = await redis.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
}

// Fetch fresh data
const data = await fetchDashboardStats(user_id);

// Cache for 5 minutes
await redis.setex(cacheKey, 300, JSON.stringify(data));

return data;
```

### Cache-Control Headers

```typescript
// API responses
res.setHeader('Cache-Control', 'private, max-age=300'); // 5 min for user data

// Static assets
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for versioned assets

// No cache for dynamic content
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
```

### Performance Metrics Baseline

```
Current State (Before Optimization):
- Database query time: ~250ms (P95)
- API response time: ~350ms (P95)
- Frontend bundle: 450KB gzipped
- LightHouse score: 65
- First Contentful Paint: 3.2s

Target State (After Optimization):
- Database query time: < 100ms (P95)
- API response time: < 200ms (P95)
- Frontend bundle: < 300KB gzipped
- LightHouse score: ≥ 90
- First Contentful Paint: < 2s
```

### Database Index Checklist

```sql
-- Questions table
CREATE INDEX idx_questions_topic_difficulty ON questions(topic, difficulty);
CREATE INDEX idx_questions_user_id ON questions(created_by_id);
CREATE INDEX idx_questions_reputation ON questions(reputation_score);

-- User question history
CREATE INDEX idx_uqh_user_id ON user_question_history(user_id);
CREATE INDEX idx_uqh_question_id ON user_question_history(question_id);
CREATE INDEX idx_uqh_is_correct ON user_question_history(is_correct);
CREATE INDEX idx_uqh_created_at ON user_question_history(created_at);

-- Exams
CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);

-- Check for missing indexes
SELECT *
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(relid) DESC;
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Database query plans reviewed
- [ ] N+1 query detection (no multiple queries for related data)

### Pre-PR

- [ ] LightHouse CI pass (≥ 90)
- [ ] Bundle size check

### Pre-Deployment

- [ ] Load test confirms improvement
- [ ] Performance metrics baseline met

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Database optimization breaks functionality | Test thoroughly, have rollback plan for indexes |
| Cache invalidation issues | Clear cache on data updates, set reasonable TTLs |
| Frontend optimization increases build time | Monitor build time, use incremental builds |
| Image optimization loses quality | Test image quality at different sizes, use appropriate formats |

---

## Dependencies

- [ ] Epic 1 + 2 + 3 completed

---

## Implementation Checklist

- [ ] Identify slow queries with EXPLAIN ANALYZE
- [ ] Create missing database indexes
- [ ] Eliminate N+1 query patterns
- [ ] Implement code splitting (route-based)
- [ ] Implement lazy loading for components
- [ ] Setup image optimization
- [ ] Implement Redis caching layer
- [ ] Add gzip compression
- [ ] Setup CDN for static assets
- [ ] Measure baseline performance
- [ ] Implement optimizations
- [ ] Re-measure and verify improvements
- [ ] Monitor performance in production

---

**Created:** 2026-02-01
**Previous Story:** [11-regression-testing-qa.md](./11-regression-testing-qa.md)
**Next Story:** [13-monitoring-alerting-runbook.md](./13-monitoring-alerting-runbook.md)
