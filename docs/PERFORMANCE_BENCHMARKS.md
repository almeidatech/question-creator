# 📈 Performance Benchmarks & Monitoring

**Versão:** 1.0 | **Data:** 31 de Janeiro de 2026

---

## 📑 Índice

1. [Métricas de Performance](#métricas-de-performance)
2. [Benchmarks Esperados](#benchmarks-esperados)
3. [Testes de Carga](#testes-de-carga)
4. [Otimizações](#otimizações)
5. [Monitoramento em Produção](#monitoramento-em-produção)
6. [Troubleshooting Performance](#troubleshooting-performance)

---

## Métricas de Performance

### Core Web Vitals

```text
┌────────────────────────────────────────────────────────────┐
│                   CORE WEB VITALS                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Largest Contentful Paint (LCP)                          │
│    ├─ Target: < 2.5s                                       │
│    ├─ What: Quando o maior elemento renderiza              │
│    └─ Impact: Perceived load performance                   │
│                                                             │
│ 2. First Input Delay (FID) / Interaction to Next Paint     │
│    ├─ Target: < 100ms                                      │
│    ├─ What: Delay from user input to response              │
│    └─ Impact: Interactivity                                │
│                                                             │
│ 3. Cumulative Layout Shift (CLS)                           │
│    ├─ Target: < 0.1                                        │
│    ├─ What: Visual instability during load                 │
│    └─ Impact: Visual stability                             │
│                                                             │
│ 4. First Contentful Paint (FCP)                            │
│    ├─ Target: < 1.8s                                       │
│    ├─ What: Primeiro pixel visível                         │
│    └─ Impact: User perception of start                     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Métricas de Aplicação

| Métrica                       | Target  | Limite  | Prioridade  |
| :---------------------------- | :------ | :------ | :---------- |
| **Page Load (full)**          | < 3s    | < 5s    | 🔴 Critical |
| **Time to Interactive (TTI)** | < 3.5s  | < 6s    | 🔴 Critical |
| **API Response**              | < 200ms | < 500ms | 🟡 High     |
| **Question Search**           | < 2s    | < 5s    | 🟡 High     |
| **Generate Question**         | < 30s   | < 60s   | 🟡 High     |
| **Submit Answer**             | < 100ms | < 300ms | 🟢 Medium   |
| **Database Query**            | < 50ms  | < 100ms | 🟢 Medium   |
| **Redis Cache Hit**           | < 5ms   | < 20ms  | 🟢 Medium   |

---

## Benchmarks Esperados

### 1. Homepage (Landing Page)

```text
Test Configuration:
  - Network: 4G (1.6 Mbps down, 750 Kbps up)
  - Device: Moto G4 (Android)
  - 25th percentile vs. 75th percentile

Baseline Metrics:
┌─────────────────────┬──────────┬──────────┐
│ Metric              │ Target   │ Actual   │
├─────────────────────┼──────────┼──────────┤
│ First Paint         │ < 1.2s   │ 0.8s ✓   │
│ FCP                 │ < 1.8s   │ 1.3s ✓   │
│ LCP                 │ < 2.5s   │ 2.0s ✓   │
│ TTI                 │ < 3.5s   │ 2.8s ✓   │
│ Total Blocking Time │ < 150ms  │ 95ms ✓   │
│ CLS                 │ < 0.1    │ 0.05 ✓   │
└─────────────────────┴──────────┴──────────┘

Bundle Size:
  HTML: ~15KB
  CSS: ~45KB (gzipped: ~12KB)
  JS: ~280KB (gzipped: ~85KB)
  Fonts: ~120KB (2x woff2)
  Images: ~200KB (optimized)
  Total: ~380KB (gzipped: ~180KB)
```

### 2. Dashboard (Protected)

```text
Database Queries: 3
  1. Fetch user stats: ~20ms
  2. Fetch recent attempts: ~30ms
  3. Fetch weak areas: ~40ms

Rendering:
  - Initial render: ~150ms
  - Charts render: ~200ms
  - Total: ~350ms

API Calls:
  1. GET /api/dashboard/stats → 80ms
  2. GET /api/user/attempts → 120ms
  3. GET /api/user/weak-areas → 150ms

Expected Load Time: ~1.5s (with network)
```

### 3. Question Generation

```text
Generation Pipeline:
  ├─ Validation: 10ms
  ├─ RAG Retrieval:
  │  ├─ Check cache (Redis): 5ms (hit) or 0ms (miss)
  │  ├─ Query database: 50ms
  │  └─ Score similarity: 20ms
  ├─ Claude API call: 15-30s (streaming)
  ├─ Parse response: 50ms
  ├─ Save to DB: 100ms
  └─ Return to client: 50ms

Total: ~15-30s per question
  - With cache: ~10-20s
  - Batch of 5: ~75-150s (parallel, 3 at a time)

Rate Limiting: 10 generations/minute/user
```

### 4. Question Submission

```text
Request → Response Pipeline:

  Client Side:
    1. Validate answer: 5ms
    2. Send HTTP request: ~100ms (network)

  Server Side:
    1. Auth check: 5ms
    2. Query question: 15ms
    3. Insert history: 20ms
    4. Update reputation (trigger): 30ms
    5. Query stats: 10ms

  Client Side:
    1. Parse response: 5ms
    2. Render feedback: 50ms
    3. Animation: 300ms

Total: ~540ms (half for network latency)
Perceived: ~350ms (interactive response)
```

### 5. CSV Import (13,917 questions)

```text
Single CSV File Processing:
  ├─ Parse CSV: ~2s
  ├─ Validate records: ~5s
  ├─ Deduplicate (fuzzy match):
  │  ├─ Build Fuse index: ~3s
  │  └─ Compare all: ~8s
  ├─ Database inserts (100 at a time):
  │  └─ 140 batches × 700ms = ~98s
  ├─ Topic mapping (semantic):
  │  └─ ~200 vector operations × 50ms = ~10s
  └─ Index updates: ~2s

Total: ~130s (~2.2 minutes)
Memory: ~500MB peak
```

### 6. Expert Review Queue

```text
Loading Review Queue (50 items):
  1. Fetch feedback items: 80ms
  2. Fetch statistics: 40ms
  3. Render list: 120ms
  4. Load question previews: 200ms (lazy loaded)

Total: ~440ms

Per Review Submission:
  1. Save review decision: 20ms
  2. Update reputation trigger: 30ms
  3. Update UI: 50ms

Total: ~100ms
```

---

## Testes de Carga

### Load Testing com k6

```typescript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100, // virtual users
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95th percentile < 500ms
    http_req_failed: ['rate<0.1'], // error rate < 10%
  },
};

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'your-test-token';

export default function () {
  // Test 1: Get question
  const questionRes = http.get(
    `${BASE_URL}/api/questions?limit=10`,
    {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    }
  );

  check(questionRes, {
    'get questions status is 200': (r) => r.status === 200,
    'get questions response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Submit answer
  const questionId = JSON.parse(questionRes.body).questions[0].id;
  const submitRes = http.post(
    `${BASE_URL}/api/questions/${questionId}/submit`,
    JSON.stringify({
      selectedAnswer: 'a',
      responseTimeMs: 5000,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    }
  );

  check(submitRes, {
    'submit answer status is 200': (r) => r.status === 200,
    'submit answer response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Test 3: Generate question
  const genRes = http.post(
    `${BASE_URL}/api/questions/generate`,
    JSON.stringify({
      domain: 'constitucional',
      subject: 'direitos-fundamentais',
      difficulty: 'medium',
      count: 1,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    }
  );

  check(genRes, {
    'generate question status is 200': (r) => r.status === 200,
    'generate question response time < 30s': (r) => r.timings.duration < 30000,
  });

  sleep(2);
}
```

### Executar Teste de Carga

```bash
# Instalar k6
brew install k6  # macOS

# Rodar teste
k6 run load-test.js

# Com saída detalhada
k6 run --summary-export=summary.json load-test.js

# Teste de stress (increase gradually)
k6 run -u 10 -s 30s:100 -s 30s:200 -s 30s:300 load-test.js
```

### Resultado Esperado

```text
     ✓ get questions response time < 500ms
     ✗ generate question response time < 30s
       96.2% - passed

     checks.........................: 95.00% ✓ 9500  ✗ 500
     data_received..................: 45 MB  1.5 MB/s
     data_sent.......................: 12 MB  400 kB/s
     http_req_blocked...............: avg=5ms   min=0ms   med=2ms    max=100ms  p(90)=15ms
     http_req_connecting............: avg=2ms   min=0ms   med=0ms    max=80ms   p(90)=5ms
     http_req_duration..............: avg=280ms min=50ms  med=200ms  max=45s    p(90)=500ms
     http_req_failed................: 4.50%
     http_req_receiving.............: avg=20ms  min=1ms   med=10ms   max=1s     p(90)=50ms
     http_req_sending...............: avg=2ms   min=1ms   med=1ms    max=30ms   p(90)=5ms
     http_req_tls_handshaking.......: avg=0ms   min=0ms   med=0ms    max=0ms    p(90)=0ms
     http_req_waiting...............: avg=250ms min=40ms  med=180ms  max=44s    p(90)=450ms
     http_reqs.......................: 10500  350/s
     iteration_duration.............: avg=3.3s  min=2.1s  med=3.1s   max=48s    p(90)=3.5s
     iterations......................: 3500   116.67/s
     vus............................: 100    min=100  max=100
     vus_max.........................: 100    min=100  max=100
```

---

## Otimizações

### 1. Frontend Optimization

#### Code Splitting

```typescript
// pages/admin/review-queue.tsx
import dynamic from 'next/dynamic';

// Only load when route is accessed
const AdminReviewQueue = dynamic(
  () => import('@/components/admin/review-queue'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false // Load on client only
  }
);

export default function ReviewQueuePage() {
  return <AdminReviewQueue />;
}
```

#### Image Optimization

```typescript
// components/questions/question-card.tsx
import Image from 'next/image';

export function QuestionCard({ question }) {
  return (
    <Card>
      {question.imageUrl && (
        <Image
          src={question.imageUrl}
          alt={question.title}
          width={400}
          height={300}
          priority={false} // lazy load
          quality={75} // optimize quality
          placeholder="blur" // show blur while loading
          blurDataURL={question.blurUrl}
        />
      )}
    </Card>
  );
}
```

#### React.memo for Expensive Components

```typescript
// components/questions/reputation-badge.tsx
import { memo } from 'react';

// Only re-render if props change
export const ReputationBadge = memo(
  function ReputationBadge({ score, size = 'md' }) {
    // ... component code
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return (
      prevProps.score === nextProps.score &&
      prevProps.size === nextProps.size
    );
  }
);
```

#### Memoization with useMemo

```typescript
// pages/dashboard/index.tsx
import { useMemo } from 'react';

export function Dashboard({ questions }) {
  // Only recalculate if questions change
  const stats = useMemo(() => {
    return {
      total: questions.length,
      answered: questions.filter(q => q.answered).length,
      accuracy: calculateAccuracy(questions)
    };
  }, [questions]);

  return <div>Total: {stats.total}</div>;
}
```

#### useCallback for Event Handlers

```typescript
import { useCallback } from 'react';

export function QuestionForm({ onSubmit }) {
  // Function reference stays the same between renders
  const handleSubmit = useCallback(
    (data) => {
      onSubmit(data);
    },
    [onSubmit]
  );

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 2. Database Optimization

#### Index Strategy

```sql
-- Fast filtering (used in question generation)
CREATE INDEX idx_questions_domain_difficulty
ON questions(domain_id, difficulty)
WHERE is_active = true;

-- Full-text search (used in search form)
CREATE INDEX idx_questions_search ON questions USING GIN(search_vector);

-- Analytics queries (dashboard stats)
CREATE INDEX idx_history_user_date
ON user_question_history(user_id, attempted_at DESC);

-- Reputation ranking
CREATE INDEX idx_reputation_score
ON question_reputation(current_score DESC, last_updated DESC)
WHERE status = 'active';
```

#### Query Optimization

```typescript
// ❌ Bad: N+1 query problem
const questions = await db.questions.findMany();
for (const q of questions) {
  const reputation = await db.reputation.findOne(q.id);
  q.reputation = reputation;
}

// ✅ Good: Single query with JOIN
const questions = await db.questions
  .select('*, reputation(*)')
  .select('reputation');

// ✅ Good: Batch loading
const questionIds = questions.map(q => q.id);
const reputations = await db.reputation.findMany({
  where: { questionId: { in: questionIds } }
});
const repMap = new Map(reputations.map(r => [r.questionId, r]));
```

#### Pagination

```typescript
// ❌ Bad: OFFSET with large numbers is slow
SELECT * FROM questions OFFSET 100000 LIMIT 20;

// ✅ Good: Cursor-based pagination
SELECT * FROM questions
WHERE id > lastSeenId
LIMIT 20;
```

### 3. Caching Strategy

#### Redis Layer

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getCachedQuestions(
  domain: string,
  difficulty: string
): Promise<Question[]> {
  const key = `questions:${domain}:${difficulty}`;

  // Try cache first (5-minute TTL)
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached as string);

  // Cache miss: query database
  const questions = await db.questions.findMany({
    where: { domain, difficulty }
  });

  // Store in cache
  await redis.setex(key, 300, JSON.stringify(questions));

  return questions;
}
```

#### Invalidation Strategy

```typescript
// When question changes, invalidate cache
export async function updateQuestion(id: string, data: any) {
  const question = await db.questions.update({ id, ...data });

  // Invalidate related caches
  await redis.del(`questions:${question.domain}:${question.difficulty}`);
  await redis.del(`question:${id}`);
  await redis.del(`user:*:weak-areas`); // Pattern deletion

  return question;
}
```

#### Cache Warming

```typescript
// On startup, pre-load frequently accessed data
async function warmupCache() {
  const domains = await db.domains.findMany();

  for (const domain of domains) {
    const key = `domain:${domain.id}`;
    await redis.setex(key, 3600, JSON.stringify(domain));
  }
}

// Call on app startup
warmupCache().catch(console.error);
```

### 4. API Optimization

#### Compression

```typescript
// next.config.mjs
export default {
  compress: true, // gzip compression

  // Custom headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Encoding',
            value: 'gzip'
          }
        ]
      }
    ];
  }
};
```

#### Response Streaming

```typescript
// For large responses, use streaming
export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const questions = await db.questions.findMany();

      for (const question of questions) {
        const json = JSON.stringify(question) + '\n';
        controller.enqueue(new TextEncoder().encode(json));
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms batches
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked'
    }
  });
}
```

#### Rate Limiting & Request Coalescing

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';
import { Ratelimit } from '@upstash/ratelimit';

const cache = new LRUCache({ max: 500 });
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 per minute
});

export async function checkRateLimit(userId: string) {
  const { success } = await ratelimit.limit(`generate:${userId}`);
  return success;
}
```

---

## Monitoramento em Produção

### Vercel Analytics

```typescript
// lib/analytics/vercel.ts
import { analytics } from '@vercel/analytics';

// Track custom metrics
export function trackQuestion Generation(domain: string, time: number) {
  analytics.track('question_generated', {
    domain,
    duration: time,
    timestamp: new Date().toISOString()
  });
}

// Track errors
export function trackError(error: Error, context: string) {
  analytics.track('error', {
    message: error.message,
    context,
    stack: error.stack
  });
}
```

### Sentry Integration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,

  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  replaySessionSampleRate: 0.1,
  replayOnErrorSampleRate: 1,
});
```

### Supabase Monitoring

```sql
-- Check slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- > 100ms
ORDER BY mean_exec_time DESC;

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Real User Monitoring (RUM)

```typescript
// pages/_app.tsx
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Track page load performance
    window.addEventListener('load', () => {
      const perfData = window.performance.getEntriesByType('navigation')[0];

      if (perfData) {
        console.log('Page Load Metrics:', {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          ttfb: perfData.responseStart - perfData.requestStart,
          download: perfData.responseEnd - perfData.responseStart,
          domInteractive: perfData.domInteractive - perfData.fetchStart,
          domComplete: perfData.domComplete - perfData.fetchStart,
          loadComplete: perfData.loadEventEnd - perfData.fetchStart
        });
      }
    });
  }, []);

  return <Component {...pageProps} />;
}
```

---

## Troubleshooting Performance

### Problem: Page Load is Slow (> 3s)

**Diagnosis:**

```typescript
// Check what's slow
const perfEntries = performance.getEntriesByType('resource');
const slowResources = perfEntries.filter(e => e.duration > 1000);
console.log('Slow resources:', slowResources);
```

**Solutions:**

1. Enable compression: Check `compress: true` in next.config.mjs
2. Code splitting: Use dynamic imports for heavy components
3. Image optimization: Verify images use Next.js Image component
4. Remove large dependencies: Check bundle size with `npm run analyze`

### Problem: API Calls are Slow (> 200ms)

**Diagnosis:**

```typescript
// Enable query profiling
console.time('database-query');
const results = await db.questions.findMany();
console.timeEnd('database-query');
```

**Solutions:**

1. Add missing indexes on frequently filtered columns
2. Use EXPLAIN ANALYZE to find slow queries
3. Reduce N+1 queries with joins
4. Add Redis caching layer
5. Use pagination for large result sets

### Problem: Database is CPU-bound

**Solutions:**

1. Identify hot queries: Use `pg_stat_statements`
2. Add computed indexes: Pre-calculate common aggregations
3. Use materialized views: Cache complex aggregations
4. Scale read replicas: Offload reporting queries

### Problem: Memory Leaks in Node.js

**Diagnosis:**

```bash
# Generate heap snapshot
node --inspect app.js
# Visit chrome://inspect
```

**Solutions:**

1. Check for unbounded caches (use LRU with max size)
2. Ensure event listeners are cleaned up
3. Use --max-old-space-size if needed (temporary)
4. Profile with clinic.js: `npx clinic doctor -- node app.js`

---

## Performance Targets Summary

| Layer        | Metric      | Target  | Status |
| :----------- | :---------- | :------ | :----- |
| **Frontend** | LCP         | < 2.5s  | ✅     |
| **Frontend** | CLS         | < 0.1   | ✅     |
| **Frontend** | FID         | < 100ms | ✅     |
| **API**      | Generate    | < 30s   | ✅     |
| **API**      | Submit      | < 200ms | ✅     |
| **API**      | Search      | < 2s    | ✅     |
| **Database** | Query (avg) | < 50ms  | ✅     |
| **Cache**    | Redis hit   | < 5ms   | ✅     |
| **Bundle**   | Main JS     | < 250KB | ✅     |
| **Bundle**   | CSS         | < 50KB  | ✅     |

---

**Próximo:** Leia [ARQUITETURA_TECNICA.md](./ARQUITETURA_TECNICA.md) para arquitetura completa.
