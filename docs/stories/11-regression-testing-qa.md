# US-4.1: Regression Testing & QA

**Epic:** Epic 4 - QA & Launch
**Sprint:** 4.1 / Week 8
**Effort:** 34h
**Assigned to:** @qa, @dev
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** QA engineer
**I want** to verify all features work correctly end-to-end
**So that** we can confidently deploy to production

---

## Acceptance Criteria

- [ ] Regression Test Suite - All endpoints tested
  - Auth flows: signup → login → logout → token refresh
  - Question flows: generate → list → search → submit
  - Exam flows: create → attempt → answer → complete → score
  - Admin flows: import CSV → review queue → approve/reject
  - All tests passing

- [ ] Load Test - 1000 concurrent users
  - Ramp: 0→100 (1min) → 500 (5min) → 1000 (10min)
  - Measure: P95/P99 latency, error rate, throughput
  - Success criteria: P95 < 200ms, error rate < 0.1%, throughput ≥ 500 req/s
  - Identify bottlenecks

- [ ] Security Audit - OWASP top 10
  - SQL injection: parameterized queries ✅
  - XSS: input sanitization, CSP headers ✅
  - CSRF: tokens or SameSite cookies ✅
  - Broken auth: JWT validation, RLS ✅
  - Sensitive data: no secrets in logs, HTTPS ✅
  - Broken access control: RLS policies ✅
  - Security misconfiguration: env vars, headers ✅
  - Insecure deserialization: none used ✅
  - Vulnerable dependencies: npm audit ✅
  - Insufficient logging: audit trail present ✅

- [ ] E2E Critical Paths
  - Signup → Dashboard → Generate Questions → Submit Answer → See Score
  - Create Exam → Take Exam → View Results → See Weak Areas
  - Admin Import CSV → Approve Questions → See in Question Bank
  - All paths passing

---

## Definition of Done

- [ ] All regression tests passing
- [ ] Load test results meet SLA (P95 < 200ms)
- [ ] Security audit OWASP checklist complete
- [ ] E2E critical paths passing
- [ ] No new bugs found during testing
- [ ] Test report generated

---

## Technical Specifications

### Test Matrix

```text
Auth:
  ✅ signup with valid email/password
  ✅ signup with invalid email (error)
  ✅ signup with weak password (error)
  ✅ login with correct credentials
  ✅ login with wrong password (error)
  ✅ token refresh works
  ✅ access protected route with valid token
  ✅ access protected route without token (401)

Questions:
  ✅ generate 5 questions in < 30s
  ✅ generate with invalid topic (error)
  ✅ list questions with pagination
  ✅ search questions (FTS)
  ✅ submit answer and see result
  ✅ reputation updates after submit

Exams:
  ✅ create exam with 5-50 questions
  ✅ create with invalid question count (error)
  ✅ start attempt
  ✅ submit answers
  ✅ complete and see score
  ✅ view weak areas

Admin:
  ✅ upload CSV file
  ✅ monitor import progress
  ✅ view review queue
  ✅ approve question
  ✅ reject question
```

### Load Test Profile (k6)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '10m', target: 1000 },
    { duration: '1m', target: 0 }
  ]
};

export default function () {
  // Simulate user signup
  let response = http.post(`${BASE_URL}/api/auth/signup`, {
    email: `user${__VU}-${__ITER}@example.com`,
    password: 'SecurePass123!'
  });
  check(response, {
    'signup status is 201': r => r.status === 201
  });

  // Simulate question generation
  response = http.post(`${BASE_URL}/api/questions/generate`, {
    topic: 'direito-constitucional',
    difficulty: 'medium',
    count: 5
  });
  check(response, {
    'generate status is 200': r => r.status === 200,
    'response time < 30s': r => r.timings.duration < 30000
  });

  sleep(1);
}
```

### E2E Test Scenarios

```typescript
describe('Critical Paths', () => {
  test('Student learns: signup → generate → submit → score', async () => {
    // 1. Signup
    const signupRes = await signup(validUser);
    expect(signupRes.status).toBe(201);
    const { access_token } = signupRes.data;

    // 2. Dashboard (verify stats)
    const dashboardRes = await getDashboard(access_token);
    expect(dashboardRes.status).toBe(200);

    // 3. Generate questions
    const generateRes = await generateQuestions({
      topic: 'direito-constitucional',
      difficulty: 'medium',
      count: 5
    }, access_token);
    expect(generateRes.status).toBe(200);
    const { questions } = generateRes.data;

    // 4. Submit answer
    const submitRes = await submitAnswer({
      question_id: questions[0].id,
      selected_option_index: 0
    }, access_token);
    expect(submitRes.status).toBe(200);
    expect(submitRes.data.correct).toBeDefined();
  });

  test('Student exams: create → attempt → complete → weak areas', async () => {
    // 1. Create exam
    const createRes = await createExam({
      name: 'Test Exam',
      question_ids: [...50 question IDs],
      duration_minutes: 120,
      passing_score: 70
    }, access_token);
    expect(createRes.status).toBe(201);
    const { exam_id } = createRes.data;

    // 2. Start attempt
    const attemptRes = await startAttempt(exam_id, access_token);
    expect(attemptRes.status).toBe(201);
    const { attempt_id } = attemptRes.data;

    // 3. Answer questions
    for (let i = 0; i < 50; i++) {
      const answerRes = await submitAnswer({
        attempt_id,
        question_id: questions[i].id,
        selected_option_index: i % 4
      }, access_token);
      expect(answerRes.status).toBe(200);
    }

    // 4. Complete exam
    const completeRes = await completeExam(attempt_id, access_token);
    expect(completeRes.status).toBe(200);
    expect(completeRes.data.score).toBeDefined();
    expect(completeRes.data.weak_areas).toBeDefined();
  });

  test('Admin workflow: import → review → approve', async () => {
    // 1. Import CSV
    const importRes = await importCSV(csvFile, adminToken);
    expect(importRes.status).toBe(202);
    const { import_id } = importRes.data;

    // 2. Poll import progress
    let completed = false;
    for (let i = 0; i < 30; i++) {
      const progressRes = await getImportProgress(import_id, adminToken);
      if (progressRes.data.status === 'completed') {
        completed = true;
        break;
      }
      await sleep(1000);
    }
    expect(completed).toBe(true);

    // 3. View review queue
    const queueRes = await getReviewQueue(adminToken);
    expect(queueRes.status).toBe(200);

    // 4. Approve question
    if (queueRes.data.items.length > 0) {
      const reviewRes = await approveQuestion({
        question_id: queueRes.data.items[0].question_id,
        decision: 'approve',
        notes: 'Looks good'
      }, adminToken);
      expect(reviewRes.status).toBe(200);
    }
  });
});
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] All test cases written + passing

### Pre-PR

- [ ] Load test results reviewed
- [ ] SLA targets met

### Pre-Deployment

- [ ] Full regression + E2E success

---

## Dependencies

- [ ] Epic 1 + 2 + 3 completed
- [ ] All features implemented

---

## Implementation Checklist

- [ ] Write regression test suite (Vitest)
- [ ] Write E2E test scenarios (Playwright)
- [ ] Configure k6 load testing
- [ ] Run load tests and analyze results
- [ ] Perform OWASP security audit
- [ ] Create security checklist
- [ ] Write test report
- [ ] Identify and document any issues
- [ ] Create bug tickets for found issues
- [ ] Verify all fixes applied

---

**Created:** 2026-02-01
**Previous Story:** [10-admin-dashboard-review-queue.md](./10-admin-dashboard-review-queue.md)
**Next Story:** [12-performance-optimization-tuning.md](./12-performance-optimization-tuning.md)
