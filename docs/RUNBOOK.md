# Production Deployment Runbook

**Last Updated:** 2026-02-02
**Stack:** Vercel + Supabase + Upstash Redis
**Audience:** DevOps, Backend Engineering Team

---

## 📋 Pre-Deployment Checklist

**MUST complete before running deployment:**

```bash
# 1. Verify all tests passing
npm test
# Expected: All tests passing, coverage ≥ 80%

# 2. Check git status
git status
# Expected: (clean) - no uncommitted changes

# 3. Verify current branch
git branch
# Expected: main (or your deployment branch)

# 4. Pull latest
git pull origin main
# Expected: Already up to date

# 5. Check environment variables configured
# Vercel Dashboard → Settings → Environment Variables
# Verify these exist:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_URL
# - REDIS_URL (Upstash)
# - REDIS_TOKEN (Upstash)
# - ANTHROPIC_API_KEY (if using Claude)
# - GEMINI_API_KEY
# - JWT_SECRET (different from dev!)

# 6. List pending migrations
supabase migration list --remote
# Expected: All migrations listed as completed

# 7. Check for breaking API changes
# Review recent commits that modified /src/pages/api/
# Ensure backward compatibility

# 8. Verify database is healthy
# Supabase Dashboard → Database → Monitor
# Expected: CPU < 50%, Connections < 100

# 9. Check Redis connection
# Upstash Dashboard → Data Browser
# Expected: Connected, recent data access

# 10. Verify build locally
npm run build
# Expected: Build successful, .next/ directory created
```

---

## 🚀 Deployment Steps

### Step 1: Database Migration (if needed)

```bash
# Only if you have pending migrations!
supabase link --project-ref YOUR_PROJECT_ID
supabase db push --remote

# Verify migration was applied
supabase migration list --remote

# WAIT: Verify no errors in Supabase logs
# Dashboard → Logs → Realtime
# Expected: Migration completed successfully
```

### Step 2: Deploy to Vercel

```bash
# Method 1: GitHub Push (Recommended)
git add .
git commit -m "Deploy: [description]"
git push origin main
# Vercel automatically deploys on push to main

# Method 2: Vercel CLI (if needed)
npm i -g vercel          # Install Vercel CLI globally
vercel login             # Authenticate with GitHub
vercel deploy --prod     # Deploy to production

# WAIT: Watch deployment in progress
# Vercel Dashboard → Deployments
# Expected: "Ready" status in 2-3 minutes
```

### Step 3: Health Check

```bash
# Wait 30 seconds for deployment to fully propagate
sleep 30

# Check Vercel status
vercel status

# Expected output:
# ✓ Deployment ready
# ✓ 0 errors, 0 warnings
```

### Step 4: Run Smoke Tests

```bash
# Run smoke test suite (see SMOKE_TEST.sh)
bash docs/scripts/smoke-test.sh

# Expected: All 8 tests PASS
# If any fail, go to Rollback → Step 4 immediately
```

### Step 5: Monitor First 5 Minutes

**During these 5 minutes:**

```bash
# Terminal 1: Watch logs
vercel logs --follow

# Terminal 2: Monitor metrics
# Open Vercel Dashboard → your-project → Deployments → current
# Check: Response time, error rate, request count

# Expected:
# - Error rate: 0% or < 0.1%
# - Response time P95: < 500ms
# - No 500 errors in logs
```

### Step 6: Verify Critical Endpoints

```bash
# Test login (no auth needed)
curl -X POST https://question-creator.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
# Expected: 200 or 400 (invalid creds), NOT 500

# Test admin dashboard (requires valid JWT)
# Use a test admin JWT token
curl -X GET https://question-creator.vercel.app/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
# Expected: 200 with dashboard stats

# Check Redis connectivity (via cache)
# Make any API call that uses cache
# Check Upstash dashboard for recent activity
# Expected: New cache operations visible
```

### Step 7: Team Notification

```bash
# Announce deployment in team channels
# Slack/Discord message template:
"""
✅ **Deployment Successful**
- Time: [deployment-time]
- Commit: [commit-hash]
- Changes: [brief description]
- Status: All smoke tests passed
- ETA for full verification: 10 minutes
"""
```

---

## 🔄 Rollback Procedure

**Use ONLY if smoke tests fail or critical errors occur**

### Option 1: Vercel Automatic Rollback (Recommended)

```bash
# Go to Vercel Dashboard
# Deployments → [current deployment] → Options ⋮
# Click "Rollback"
# Select previous successful deployment
# Confirm

# Alternative: CLI
vercel rollback --prod

# WAIT: Rollback completes (1-2 minutes)
# Re-run smoke tests
bash docs/scripts/smoke-test.sh

# Expected: All tests PASS on previous version
```

### Option 2: Git Revert (if code issue)

```bash
# Find last good commit
git log --oneline -10

# Revert to previous commit
git revert HEAD
git push origin main

# Vercel auto-deploys new revert commit
# WAIT: New deployment completes

# Re-run smoke tests
bash docs/scripts/smoke-test.sh
```

### Option 3: Database Rollback (if migration issue)

```bash
# Only if migration caused issues!

# Check rollback file exists
ls src/database/migrations/007_add_performance_indexes.rollback.sql

# Rollback last migration
supabase db push --remote --dry-run  # See what will happen

# If confirmed, run actual rollback:
psql -U postgres -d question_creator \
  -f src/database/migrations/007_add_performance_indexes.rollback.sql

# Verify rollback
supabase migration list --remote
# Expected: Last migration marked as rolled back
```

### Step 4: Post-Rollback Verification

```bash
# Re-run smoke tests
bash docs/scripts/smoke-test.sh

# Monitor logs
vercel logs --follow

# Expected: System healthy on previous version
```

---

## 📊 Post-Deployment Verification (First Hour)

### Metrics to Monitor

| Metric | Target | Check Every |
|--------|--------|-------------|
| Error Rate | < 0.1% | 5 min |
| P95 Latency | < 500ms | 5 min |
| Success Rate | 100% | 5 min |
| Redis Errors | 0 | 10 min |
| DB Connections | < 100 | 10 min |
| Failed Builds | 0 | Continuous |

### Verification Checklist (30 min post-deploy)

```bash
# 1. Check deployment status
vercel status
# Expected: Ready ✓

# 2. Review error logs
vercel logs | grep -i error
# Expected: No ERROR logs, only normal operations

# 3. Check database health
# Supabase Dashboard → Monitor → CPU/Memory
# Expected: CPU < 50%, Memory < 80%

# 4. Verify Redis
# Upstash Dashboard → Monitor
# Expected: Connected, latency < 100ms

# 5. Test critical paths
bash docs/scripts/smoke-test.sh
# Expected: All tests PASS

# 6. Monitor Vercel Analytics
# Dashboard → Analytics tab
# Expected: Error rate stable, latency normal

# 7. Check for Supabase RLS violations
# Supabase Dashboard → Logs → Realtime
# Filter: policy_violation
# Expected: No violations

# 8. Final team notification
# Post message: "✅ Deployment verified, monitoring continues"
```

---

## 🚨 Emergency Contacts

- **On-Call Engineer:** [Name + phone]
- **Slack Channel:** #incidents
- **Escalation:** PM → Tech Lead → CTO

---

## 📝 Deployment Log Template

**Create a new incident in your tracking system for each deployment:**

```
Deployment Date: [YYYY-MM-DD HH:MM]
Deployed By: [Name]
Commit Hash: [hash]
Branch: [branch]

Changes:
- [Bullet 1]
- [Bullet 2]

Migrations Applied:
- [Migration 1]
- [Migration 2]

Pre-Deploy Status:
✓ Tests passing
✓ Code reviewed
✓ Environment verified

Deployment Time: [duration]
Smoke Tests: [PASS/FAIL]
Issues: [None/List any]

First Hour Monitoring:
- Error rate: [%]
- P95 latency: [ms]
- Status: [Stable/Degraded]

Signed off by: [Name]
Date: [Date]
```

---

## 🔗 Related Documentation

- **Incident Response Playbook:** [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md)
- **Team Training:** [TEAM-TRAINING.md](./TEAM-TRAINING.md)
- **Smoke Test Script:** [scripts/smoke-test.sh](./scripts/smoke-test.sh)
- **Environment Setup:** [docs/DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Last Review:** 2026-02-02
**Next Review:** After first production deployment
