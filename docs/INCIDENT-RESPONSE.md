# Incident Response Playbook

**Last Updated:** 2026-02-02
**Stack:** Vercel + Supabase + Upstash Redis
**Response Time Target:** Alert → Investigation (5 min), Resolution (15 min)

---

## 🚨 Alert Escalation Matrix

| Alert | Severity | Responsible | Action | SLA |
|-------|----------|-------------|--------|-----|
| Error rate > 1% | 🔴 CRITICAL | On-call | Page immediately | 5 min |
| P95 latency > 500ms | 🟠 WARNING | Team lead | Investigate | 15 min |
| Database > 80% CPU | 🟠 WARNING | DBE | Optimize queries | 20 min |
| Redis down | 🔴 CRITICAL | DevOps | Restart/failover | 5 min |
| Auth endpoint 500s | 🔴 CRITICAL | Backend | Rollback | 3 min |
| Memory leak detected | 🟠 WARNING | Backend | Profile + fix | 30 min |
| Database full (>95%) | 🔴 CRITICAL | DevOps | Add capacity | 10 min |

---

## 🔍 Alert: Error Rate > 1%

### Immediate (0-2 minutes)

```bash
# 1. Confirm alert is real (not fluke)
# Vercel Dashboard → Analytics
# Check last 5 minutes of requests
# Look for spike in 500 errors

# 2. Check Vercel deployment status
vercel status
# Expected: Ready (not "Building" or "Failed")

# 3. Quick Supabase health check
# Dashboard → Monitor
# Check: CPU, Memory, Active Connections
# Expected: All green
```

### Investigation (2-5 minutes)

```bash
# 4. Review error logs
vercel logs --follow | head -100
# Look for: ERROR, exception, stack trace

# Example errors to watch for:
# - "SUPABASE_SERVICE_ROLE_KEY missing" → ENV var issue
# - "Redis connection refused" → Cache service down
# - "JWT verification failed" → Auth issue
# - "Rate limit exceeded" → Too much traffic
# - Database connection error → Supabase issue

# 5. Check Supabase logs
# Supabase Dashboard → Logs → Realtime
# Filter by time (last 10 minutes)
# Look for: RLS violations, connection errors, slow queries

# 6. Check Supabase status page
# https://status.supabase.com/
# Expected: All services operational

# 7. Check Upstash Redis status
# https://upstash.com/status
# Expected: All operational
```

### Root Cause Scenarios

#### Scenario A: Auth Service Down

**Indicators:**
- `/api/auth/login` returning 500
- All endpoints returning 401/403
- Supabase logs show connection errors

**Fix:**

```bash
# 1. Verify JWT_SECRET environment variable
vercel env list
# Check: JWT_SECRET is set and different from dev

# 2. Check Supabase auth service
# Supabase Dashboard → Authentication → Users
# If empty page, auth service may be down

# 3. If Supabase auth is down:
# Go to https://status.supabase.com/
# Wait for service restoration
# Monitor continues

# 4. If ENV variable issue:
vercel env set JWT_SECRET "new-secure-value"
vercel deploy --prod
# Monitor smoke tests

# 5. If still failing:
git push origin main  # Trigger redeployment
# or
vercel rollback --prod
```

#### Scenario B: Database Slow Queries

**Indicators:**
- High error rate but specific endpoints slow
- Supabase CPU > 80%
- Response times P95 > 1000ms

**Fix:**

```bash
# 1. Identify slow queries
# Supabase Dashboard → Logs → Slow Query
# Look for: queries taking > 1000ms

# 2. Check query plan
# For slow query, run:
EXPLAIN ANALYZE [slow-query-here];
# Look for: Sequential Scans, high costs

# 3. Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'exam_questions'
ORDER BY indexname;
# Expected: idx_exam_questions_exam_id, etc. (from migration 007)

# 4. If indexes missing, apply migration:
supabase db push --remote
# Then monitor

# 5. If still slow, increase Vercel function timeout
# OR optimize query directly
```

#### Scenario C: Redis Connection Refused

**Indicators:**
- `/api/questions/generate` returning 500
- Upstash dashboard shows connection errors
- Logs contain "Error: connect ECONNREFUSED"

**Fix:**

```bash
# 1. Check Redis status
# Upstash Dashboard → Database → Status
# Expected: Running

# 2. Verify Redis credentials
vercel env list
# Check: REDIS_URL and REDIS_TOKEN are set

# 3. If credentials wrong:
# Go to Upstash → Database → Settings
# Copy correct credentials
vercel env set REDIS_URL "https://new-url"
vercel env set REDIS_TOKEN "new-token"

# 4. Redeploy with new credentials:
vercel deploy --prod

# 5. If Redis completely down:
# Update question caching logic to skip Redis (graceful degradation)
# Contact Upstash support
# Temporary: disable caching via feature flag
```

#### Scenario D: Memory Leak / Process Crash

**Indicators:**
- Error rate spikes suddenly
- Vercel Dashboard shows "Function timed out"
- Logs show "out of memory"

**Fix:**

```bash
# 1. Immediate: Rollback
vercel rollback --prod
# Monitor for improvement

# 2. If only recent changes caused it:
git log --oneline -5
git revert HEAD~[N]  # Revert problematic commit
git push origin main

# 3. If still issue:
# Check for infinite loops or recursive functions
# Profile memory in staging environment
npm install -g clinicjs
clinic doctor -- npx next dev  # Profile locally

# 4. Common memory leak sources:
# - Event listeners not removed
# - Cache growing unbounded
# - Timers/intervals not cleared
```

### Resolution (5-15 minutes)

```bash
# 1. Apply fix based on root cause
# 2. Redeploy
# 3. Run smoke tests
bash docs/scripts/smoke-test.sh

# 4. Verify metrics improved
# Vercel Dashboard → Analytics
# Expected: Error rate < 0.1%, P95 < 500ms

# 5. Document incident
# Create post-mortem in team wiki
# Add to runbook for future prevention
```

---

## 🚦 Alert: P95 Latency > 500ms

### Investigation (0-5 minutes)

```bash
# 1. Identify slow endpoints
# Vercel Dashboard → Analytics → Filter by endpoint
# Look for: which endpoints have high latency

# 2. Check database load
# Supabase Dashboard → Monitor
# CPU, Memory, Active Connections
# Expected: CPU < 70%, Connections < 50

# 3. Identify N+1 query patterns
# Supabase Logs → Query Performance
# Look for: Multiple similar queries from same request

# 4. Check cache hit rate
# Upstash Dashboard → Monitor
# Expected: Cache hit rate > 70%

# 5. Check specific slow query
# Get query from logs
# Run EXPLAIN ANALYZE
EXPLAIN ANALYZE [query];
# Look for: Sequential scans, high costs
```

### Root Cause: Missing Index

**Fix:**

```bash
# 1. Check if migration 007 was applied
supabase migration list --remote
# Expected: migration_007... completed

# 2. If migration failed, reapply:
supabase db push --remote

# 3. If specific index is missing:
CREATE INDEX idx_exam_questions_exam_id
ON exam_questions(exam_id);

# 4. Verify index created
SELECT indexname FROM pg_indexes
WHERE tablename = 'exam_questions';

# 5. Monitor latency
# Vercel Dashboard → Analytics
# Expected: P95 drops to < 300ms within 2 minutes
```

### Root Cause: Too Much Traffic

**Fix:**

```bash
# 1. Check request count
# Vercel Dashboard → Analytics
# Expected range: 100-500 req/min (normal)
# If > 1000 req/min: traffic spike

# 2. If legitimate traffic spike:
# This is expected during exams
# Monitor for memory/CPU issues
# System should auto-scale

# 3. If unexpected spike (bot/attack):
# Contact Vercel support for DDoS protection
# Implement rate limiting in API middleware

# 4. If spike from one user:
# Review request pattern
# Consider rate limiting that user
```

---

## 🗄️ Alert: Database > 80% CPU

### Immediate (0-2 minutes)

```bash
# 1. Identify what's running
# Supabase Dashboard → Logs → SQL
# Look for: Long-running queries

# 2. Cancel problematic query
# Supabase Dashboard → Database → Monitoring
# Click slow query → Kill if necessary

# 3. Check connection count
# Should be < 50
# If > 100: connection leak
```

### Fix (2-10 minutes)

```bash
# Strategy 1: Optimize Query
# EXPLAIN ANALYZE [slow-query]
# Add missing index or rewrite query

# Strategy 2: Increase Timeout
# If query is legitimately slow (import, processing)
# Increase Vercel function timeout
# Vercel Settings → Functions → Execution Timeout

# Strategy 3: Scale Database
# If CPU consistently > 70%
# Supabase Dashboard → Project → Compute Size
# Upgrade to higher compute tier

# Strategy 4: Reduce Load
# Identify heavy workload endpoint
# Add caching
# Implement pagination
# Add worker queues for heavy tasks
```

---

## 🔴 Alert: Redis Down (CRITICAL)

### Immediate (0-1 minute)

```bash
# 1. Check Upstash status
# https://upstash.com/status
# Expected: All green

# 2. Verify credentials
vercel env list | grep REDIS

# 3. Try manual test
# From local:
redis-cli -u $REDIS_URL PING
# Expected: PONG

# 4. If connection refused:
# Update env variables with new credentials
vercel env set REDIS_URL "https://new-url"
```

### Fix (1-5 minutes)

```bash
# Option 1: Restart Redis (if supported)
# Upstash Dashboard → Database → Settings → Restart
# Wait 30 seconds

# Option 2: Create new database
# Upstash → Create new database
# Update env variables
vercel env set REDIS_URL "https://new-database-url"

# Option 3: Graceful degradation
# If Redis won't come back quickly
# Disable caching in code temporarily
# Add feature flag: CACHE_ENABLED=false
# Deploy

# Monitor for recovery:
# Upstash status page
# Your application should work without cache (slower but functional)
```

---

## 🔐 Alert: Auth Endpoint 500s (CRITICAL)

### Immediate (0-2 minutes)

```bash
# 1. Check auth service logs
vercel logs --follow | grep -i auth

# 2. Test login manually
curl -X POST https://question-creator.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# 3. Check Supabase status
# https://status.supabase.com/
# Expected: Auth service operational

# 4. Verify JWT_SECRET set
vercel env list | grep JWT_SECRET
# Should be set to a non-empty value
```

### Fix (2-5 minutes)

**Most likely cause: Missing or wrong JWT_SECRET**

```bash
# Generate new JWT secret
openssl rand -hex 32
# Output: abc123def456...

# Set in Vercel
vercel env set JWT_SECRET "abc123def456..."

# Redeploy
vercel deploy --prod

# Verify fix
curl -X POST https://question-creator.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
# Expected: 200 or 400, not 500
```

---

## 📋 General Troubleshooting

### "Can't connect to Supabase"

```bash
# 1. Check credentials
vercel env list
# Verify: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# 2. Check Supabase project is active
# https://app.supabase.com/
# Expected: Project status "Active"

# 3. Verify network connectivity
curl https://[SUPABASE_URL].supabase.co/health
# Expected: 200 OK

# 4. Check Firewall
# If behind corporate firewall
# Contact IT to whitelist Supabase IP ranges
```

### "Rate limit exceeded"

```bash
# 1. Check request rate
# Vercel Dashboard → Analytics
# Count requests per minute

# 2. If legitimate high traffic:
# This is expected
# Monitor for errors/timeouts
# System should handle it

# 3. If attack/bot:
# Implement CAPTCHA
# Add IP-based rate limiting
# Contact Vercel DDoS protection

# 4. If single user hitting limit:
# Review their usage
# Adjust rate limit or cache strategy
```

### "Database connection pool exhausted"

```bash
# 1. Check connection count
# Supabase Dashboard → Monitor
# Count active connections

# 2. Identify connection leak
# Check if connections are being closed properly
# In services, ensure:
# - Promises resolve/reject
# - No hanging connections

# 3. Restart connection pool
# Vercel: redeploy (new function instance)
vercel deploy --prod

# 4. Increase connection pool
# Supabase Dashboard → Project Settings → Database
# Increase max connections value
```

---

## 📝 Incident Log Template

**Create incident entry for each alert:**

```
⏰ Time: [YYYY-MM-DD HH:MM UTC]
🚨 Severity: [CRITICAL/WARNING]
📊 Alert: [Error rate > 1% / P95 latency > 500ms / etc]

Detection:
- Detected by: [Monitoring system / User report / Alert]
- Impact: [X users affected / Service degraded / etc]

Investigation:
- Root cause: [Brief description]
- Steps taken: [Numbered list]
- Time to identify: [X minutes]

Resolution:
- Fix applied: [What was done]
- Verifier: [Who confirmed fix]
- Time to resolve: [X minutes]

Prevention:
- Lesson learned: [What to change]
- Monitoring improvement: [What to add]
- Code change: [Link to commit]

Post-Mortem Follow-up:
- [ ] Update runbook
- [ ] Add monitoring alert
- [ ] Fix root cause in code
- [ ] Team discussion (date)
- [ ] Assign owner for follow-up
```

---

## 🎯 Success Criteria

| Alert Type | Success Criteria |
|-----------|-----------------|
| Error rate alert | Error rate drops to < 0.1% within 10 min |
| Latency alert | P95 drops to < 300ms within 10 min |
| Database alert | CPU drops to < 50%, queries respond < 500ms |
| Auth alert | Login endpoint returns 200/400 (not 500) within 5 min |
| Redis alert | Cache operations working within 5 min |

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com/
- **Upstash Console:** https://console.upstash.com/
- **Supabase Status:** https://status.supabase.com/
- **Upstash Status:** https://upstash.com/status
- **Team Slack:** #incidents

---

**Last Review:** 2026-02-02
**Next Review:** After first incident response
