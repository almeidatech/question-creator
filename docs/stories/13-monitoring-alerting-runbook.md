# US-4.3: Monitoring, Alerting & Runbook

**Epic:** Epic 4 - QA & Launch
**Sprint:** 4.3 / Week 8
**Effort:** 17h
**Assigned to:** @devops, @dev
**Status:** Pronto para Desenvolvimento

---

## User Story

**As a** DevOps engineer
**I want** to monitor system health and have a deployment runbook
**So that** we can quickly respond to issues and deploy confidently

---

## Acceptance Criteria

- [ ] Error Tracking (Sentry)
  - Capture unhandled errors + exceptions
  - Source maps enabled for stack traces
  - Alert on error spike (> 10/min)
  - Error dashboard accessible

- [ ] Metrics & Monitoring (CloudFlare)
  - P95/P99 latency dashboard
  - Error rate tracking
  - Uptime monitoring (% last 30d)
  - Track active users, requests/min

- [ ] Alerting Rules
  - Error rate > 1% → critical alert
  - P95 latency > 500ms → warning alert
  - Downtime detected → critical alert
  - Database growth > threshold → warning alert
  - Send to Slack/email

- [ ] Runbook Documentation
  - Deployment steps + checklist
  - Rollback procedure + command
  - Incident response flowchart
  - Common issues + solutions
  - Team trained + confident

- [ ] Pre-Deploy Checklist
  - Env vars configured
  - Database migrations ready
  - Tests passing
  - Smoke test plan
  - Monitoring verified

---

## Definition of Done

- [ ] Sentry capturing errors + alerting
- [ ] Metrics dashboard accessible + accurate
- [ ] Alerts firing correctly (test each)
- [ ] Runbook documented + reviewed
- [ ] Team trained + confident
- [ ] Dry run deployment successful

---

## Technical Specifications

### Sentry Setup

```typescript
// app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false
});
```

### Monitoring Dashboards

```text
Dashboard 1: Error Tracking (Sentry)
- Real-time errors (5 min window)
- Error rate over time
- Top errors by frequency
- Alerts: > 10 errors/min

Dashboard 2: Performance (CloudFlare)
- P95/P99 latency over 24h
- Request count
- Error rate
- Top slow endpoints

Dashboard 3: Infrastructure
- Database query time
- Cache hit rate
- API response time distribution
```

### Alerting Rules Configuration

```yaml
# Alert Rules
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 1%"
    severity: "critical"
    notification:
      - slack_channel: "#incidents"
      - email: "ops@example.com"

  - name: "High Latency Warning"
    condition: "p95_latency_ms > 500"
    severity: "warning"
    notification:
      - slack_channel: "#alerts"

  - name: "Service Downtime"
    condition: "uptime < 99%"
    severity: "critical"
    notification:
      - pagerduty: true
      - slack_channel: "#incidents"

  - name: "Database Growth"
    condition: "db_size_gb > threshold"
    severity: "warning"
    notification:
      - slack_channel: "#infrastructure"
```

### Runbook Structure

```markdown
# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing (npm run test)
- [ ] Environment variables set (.env.production)
- [ ] Database migrations ready (supabase migrations list)
- [ ] No breaking changes to API
- [ ] Marketing team notified
- [ ] Rollback plan tested

## Deployment Steps

1. git pull origin main
2. npm run build
3. npm run test
4. vercel deploy --prod
5. Run smoke test (login → generate → score)
6. Monitor error rate + latency (5 min)
7. Verify all systems healthy

## Smoke Test

```bash
#!/bin/bash

# Test signup
curl -X POST https://api.example.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Test question generation
curl -X POST https://api.example.com/api/questions/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "direito-constitucional",
    "difficulty": "medium",
    "count": 5
  }'

# Test exam creation
curl -X POST https://api.example.com/api/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exam",
    "question_ids": ["uuid1", "uuid2"],
    "duration_minutes": 60,
    "passing_score": 70
  }'
```

## Rollback

1. Check CloudFlare/Sentry dashboard for errors
2. If critical error: vercel rollback
3. Verify service restored
4. Post-mortem on incident channel

```bash
# Vercel rollback command
vercel rollback --prod
```

## Incident Response

### Alert: High Error Rate (> 1%)

1. Check Sentry dashboard for error type
2. If auth error: check auth service logs
3. If database error: check database connection
4. If API error: check deployment status
5. If unable to resolve (5 min): trigger rollback
6. Create incident post-mortem

### Alert: High Latency (P95 > 500ms)

1. Check CloudFlare analytics for slow endpoints
2. Check database performance
3. Check cache hit rate
4. Run EXPLAIN ANALYZE on slow queries
5. Optimize or adjust caching
6. Monitor 10 min for improvement

### Alert: Service Downtime

1. Check Vercel deployment status
2. Check database connectivity
3. Check external API dependencies (Gemini, Redis)
4. If unable to restore: trigger rollback
5. Escalate to on-call engineer

## Common Issues & Solutions

| Issue | Solution |
| --- | --- |
| Auth endpoint 500 error | Check JWT secret in env vars, verify Supabase connectivity |
| Questions generation timeout | Check Gemini API quota, increase timeout, use fallback |
| Database slow queries | Check active connections, run VACUUM, optimize indexes |
| Memory leak in production | Check Node.js process memory, review recent code changes |
| Redis connection refused | Check Redis instance, verify network connectivity |

## Team Training

- [ ] Deploy runbook reviewed with team
- [ ] Rollback procedure practiced
- [ ] Incident response workflow understood
- [ ] On-call schedule established
- [ ] Escalation path clear

## Post-Deployment Checklist

- [ ] All metrics healthy (error rate < 0.1%, P95 < 200ms)
- [ ] No new errors in Sentry
- [ ] All critical paths tested
- [ ] Users experiencing normal performance
- [ ] Deployment documented
```

### Infrastructure as Code

```yaml
# monitoring-stack.yaml
version: "3.8"

services:
  sentry:
    image: sentry:latest
    environment:
      SENTRY_SECRET_KEY: ${SENTRY_SECRET_KEY}
      SENTRY_POSTGRES_HOST: postgres
    ports:
      - "9000:9000"

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    ports:
      - "3000:3000"
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] Monitoring configured + tested
- [ ] Alerts firing correctly

### Pre-Deployment

- [ ] Runbook reviewed
- [ ] Dry run successful

---

## Dependencies

- [ ] Sentry project created
- [ ] CloudFlare metrics enabled
- [ ] Slack integration configured

---

## Implementation Checklist

- [ ] Setup Sentry project
  - [ ] Create project
  - [ ] Install SDKs (Node.js, React)
  - [ ] Configure source maps
  - [ ] Setup alert rules
- [ ] Configure CloudFlare metrics
  - [ ] Enable analytics
  - [ ] Create dashboards
  - [ ] Setup webhooks
- [ ] Configure Slack integration
  - [ ] Create webhook
  - [ ] Setup alert channels
  - [ ] Test messages
- [ ] Create deployment runbook (this file)
- [ ] Create incident response playbook
- [ ] Setup monitoring dashboards
- [ ] Train team on runbook
- [ ] Perform dry run deployment
- [ ] Document common issues

---

**Created:** 2026-02-01
**Previous Story:** [12-performance-optimization-tuning.md](./12-performance-optimization-tuning.md)
**Final Story in Sequence**
