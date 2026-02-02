# Team Training: Production Operations Guide

**Last Updated:** 2026-02-02
**Target Audience:** Full Engineering Team
**Prerequisites:** Git knowledge, familiarity with REST APIs, access to Vercel/Supabase dashboards

---

## 🎯 Learning Objectives

By the end of this training, you will be able to:

1. ✅ Understand our deployment architecture (Vercel + Supabase + Redis)
2. ✅ Navigate production dashboards to check system health
3. ✅ Run and interpret smoke test results
4. ✅ Identify common production issues
5. ✅ Execute emergency rollback if needed
6. ✅ Report incidents to on-call engineer
7. ✅ Review post-mortems and prevent future issues

---

## 📚 Module 1: Architecture Overview (15 minutes)

### Our Stack

```
                 ┌─────────────────┐
                 │   GitHub (Repo) │
                 └────────┬────────┘
                          │ (on push to main)
                          ▼
                 ┌─────────────────┐
                 │    Vercel       │
                 │  (App + API)    │
                 └────────┬────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    ┌────────┐     ┌──────────────┐   ┌──────────┐
    │Supabase│     │ Upstash Redis│   │ Gemini   │
    │(Database)    │   (Cache)    │   │(AI/LLM)  │
    └────────┘     └──────────────┘   └──────────┘
```

### Key Facts

| Component | Purpose | Who Owns | SLA |
|-----------|---------|----------|-----|
| **Vercel** | Run our web app + API | DevOps | 99.9% uptime |
| **Supabase** | Store all data | Database team | 99.95% uptime |
| **Upstash Redis** | Cache expensive queries | DevOps | 99.9% uptime |
| **Gemini API** | Generate questions | ML team | Depends on Google |

### Data Flow Example: User Takes Exam

```
1. User opens exam
   Request → Vercel API → Gets exam questions

2. Vercel checks Redis cache first
   Cache HIT → Return cached questions (fast!)
   Cache MISS → Query Supabase → Cache result

3. User submits answer
   Request → Vercel API → Supabase (stores answer)
             → Triggers PostgreSQL scoring trigger
             → Returns score

4. Admin sees dashboard
   Request → Vercel API → Aggregates stats from Supabase
             → Returns cached dashboard (5-min cache)
```

---

## 📊 Module 2: Monitoring Dashboards (20 minutes)

### 2.1 Vercel Dashboard

**Navigate to:** https://vercel.com/dashboard

**Key Pages:**

#### Page 1: Project Overview
```
┌─ Deployments ────────────────────────────┐
│ [Latest] Deployment Status: Ready ✓      │
│ Commit: abc123                           │
│ Deployed: 2 hours ago                    │
│ Duration: 1m 23s                         │
│                                          │
│ [Previous] Deployment Status: Ready ✓    │
│ Commit: def456                           │
│ Deployed: 5 hours ago                    │
└──────────────────────────────────────────┘
```

**What to check:**
- Latest deployment shows "Ready" ✓
- Previous deployment is green (for rollback if needed)
- No "Building" or "Failed" status

#### Page 2: Analytics
```
Go to: Deployments → [Current] → Analytics

Graphs you'll see:
┌─ Request Volume ──────────────┐
│ 400 requests/min              │
│ (Green = normal, Red = spike) │
└───────────────────────────────┘

┌─ Status Codes ────────────────┐
│ 200: 98%                      │
│ 400: 1.5%                     │
│ 500: 0.5% ← WATCH THIS        │
└───────────────────────────────┘

┌─ Response Time (P95) ─────────┐
│ 200ms (Green)                 │
│ 300ms (Yellow)                │
│ 500ms+ (Red)                  │
└───────────────────────────────┘
```

**How to interpret:**
- **Error rate (500s) > 0.1%?** → Critical, check incident playbook
- **P95 latency > 500ms?** → Warning, check database CPU
- **Request volume spike?** → Expected during exams, monitor for errors

**Daily check-in (1 minute):**
```
1. Open Vercel Dashboard
2. Look for red status → none? Good!
3. Check Analytics → 500 errors < 0.1%? Good!
4. Done! Continue with other tasks
```

### 2.2 Supabase Dashboard

**Navigate to:** https://app.supabase.com/

**Key Pages:**

#### Page 1: Monitor (Most Important)

```
Go to: Your project → Monitor → Realtime

View metrics:
┌─ Database CPU ─────────────┐
│ 35% (Green: < 50%)         │
│ (Yellow: 50-70%)           │
│ (Red: > 70%)               │
└────────────────────────────┘

┌─ Active Connections ────────┐
│ 23 connections             │
│ (Normal range: 10-50)      │
└────────────────────────────┘

┌─ Database Size ────────────┐
│ 450 MB (Green: < 4GB)      │
│ Warning: > 4GB             │
└────────────────────────────┘
```

**What to check:**
- CPU < 50%? (If > 70%, check Incident Playbook)
- Connections < 50? (If > 100, connection leak)
- Database size < 4GB? (If > 95%, approaching limit)

#### Page 2: Logs (Debugging)

```
Go to: Your project → Logs → Realtime

Examples of logs you'll see:
┌─ Normal log ───────────────────┐
│ Duration: 45ms                 │
│ SQL: SELECT * FROM users...    │
│ Status: Success                │
└────────────────────────────────┘

┌─ Slow query log ──────────────┐
│ Duration: 2500ms ← SLOW!       │
│ SQL: SELECT * FROM exams...    │
│ Status: Success (but slow)     │
│                                │
│ Action: Check indexes, optimize│
└────────────────────────────────┘

┌─ Error log ────────────────────┐
│ Error: connection timeout      │
│ Status: Failed                 │
│                                │
│ Action: Check if Supabase down │
└────────────────────────────────┘
```

**How to use:**
1. See error in production?
2. Come here to find the SQL query that failed
3. Check if it's a known slow query
4. If new slow query, report to database team

#### Page 3: SQL Editor

```
Go to: Your project → SQL Editor

Use pre-written queries:
┌─ Health Check Query ────────────┐
│ SELECT                          │
│   COUNT(*) as user_count,       │
│   COUNT(*) FILTER              │
│     (WHERE last_login >        │
│     NOW() - '7 days'::interval)│
│   as active_users               │
│ FROM users;                     │
│                                │
│ Click "Run" to see results      │
└─────────────────────────────────┘
```

**Daily check-in (2 minutes):**
```
1. Open Supabase Dashboard
2. Click Monitor tab
3. Check: CPU < 50%? ✓
4. Check: Connections < 50? ✓
5. Check: Size < 4GB? ✓
6. Done!
```

### 2.3 Upstash Redis Dashboard

**Navigate to:** https://console.upstash.com/

**Key Pages:**

#### Page 1: Database Overview

```
Database name: question-creator-prod
Status: Connected ✓

┌─ Key Metrics ──────────────┐
│ Total commands/min: 150    │
│ Ping latency: 45ms         │
│ Connection status: Active  │
└────────────────────────────┘

┌─ Key Memory ───────────────┐
│ Used: 250 MB (Green)       │
│ Limit: 5 GB                │
└────────────────────────────┘
```

**What to check:**
- Connection status is "Active"
- Latency < 100ms (normal)
- Memory usage < 50% of limit

**Daily check-in (1 minute):**
```
1. Upstash Console
2. Database status = Active? ✓
3. Latency < 100ms? ✓
4. Done!
```

---

## 🚀 Module 3: Smoke Testing (15 minutes)

### What is Smoke Testing?

**Definition:** A quick test suite that verifies the most critical functionality works after deployment.

**When to run:**
- ✅ After every deployment
- ✅ When investigating a suspected outage
- ✅ When any team member reports "the app is broken"

### Running Smoke Tests

**Step 1: Get the test script**

```bash
# Already exists at:
cat docs/scripts/smoke-test.sh

# Or download from repo:
git pull origin main
```

**Step 2: Run tests**

```bash
# From project root:
bash docs/scripts/smoke-test.sh

# Expected output:
# ✓ Test 1: User signup ... PASS
# ✓ Test 2: User login ... PASS
# ✓ Test 3: Create exam ... PASS
# ✓ Test 4: List exams ... PASS
# ✓ Test 5: Start exam attempt ... PASS
# ✓ Test 6: Submit answer ... PASS
# ✓ Test 7: Complete exam ... PASS
# ✓ Test 8: Admin dashboard ... PASS
#
# ✅ All 8 tests PASSED
```

### Interpreting Results

| Result | Meaning | Action |
|--------|---------|--------|
| **All PASS** ✅ | System is healthy | Continue monitoring |
| **1 test FAIL** ⚠️ | One feature broken | Check that service |
| **2+ tests FAIL** 🔴 | Critical issue | See Incident Playbook |

### Example 1: Test Fails (FAIL)

```bash
$ bash docs/scripts/smoke-test.sh

✓ Test 1: User signup ... PASS
✓ Test 2: User login ... PASS
✗ Test 3: Create exam ... FAIL

Error: HTTP 500 - Internal Server Error

Next steps:
1. Check Vercel logs
2. Check that endpoint in code
3. Report to backend team
```

### Example 2: All Tests Pass (PASS)

```bash
$ bash docs/scripts/smoke-test.sh

✓ Test 1: User signup ... PASS
✓ Test 2: User login ... PASS
✓ Test 3: Create exam ... PASS
✓ Test 4: List exams ... PASS
✓ Test 5: Start exam attempt ... PASS
✓ Test 6: Submit answer ... PASS
✓ Test 7: Complete exam ... PASS
✓ Test 8: Admin dashboard ... PASS

✅ All 8 tests PASSED in 12.5 seconds

Conclusion: All critical paths working!
Next: Monitor for 10 minutes for edge cases
```

---

## 🔄 Module 4: Deployment Walktthrough (20 minutes)

### Scenario: You're Deploying New Feature

**Step-by-step:**

```
1. Code Review + Approval
   └─ Team reviews PR on GitHub
   └─ All tests pass
   └─ Approved

2. Merge to Main
   └─ Click "Merge pull request" on GitHub
   └─ Vercel automatically starts building

3. Watch Deployment
   Go to Vercel Dashboard → Deployments
   └─ Status shows "Building..."
   └─ Wait for "Ready ✓" (2-3 minutes)

4. Quick Health Check
   curl https://question-creator.vercel.app/api/auth/login
   └─ Expected: 200/400, NOT 500

5. Run Smoke Tests
   bash docs/scripts/smoke-test.sh
   └─ Expected: All PASS

6. Monitor Logs
   vercel logs --follow
   └─ Watch for 5 minutes
   └─ No errors? Deployment successful!

7. Announce to Team
   Slack: "✅ Deployment complete, all systems healthy"
```

### What If Something Goes Wrong?

**Scenario: Smoke test fails after deploy**

```
1. Stay calm - we have rollback!

2. Run Incident Playbook
   Open: docs/INCIDENT-RESPONSE.md
   Follow: "Alert: Error rate > 1%"

3. Check recent code changes
   git log --oneline -5
   └─ What was deployed?

4. If obvious bug:
   git revert HEAD
   git push origin main
   └─ Vercel auto-deploys revert

5. If not obvious:
   Vercel Dashboard → Deployments
   Click: [Previous successful deployment] → ... → Rollback
   └─ System goes back to previous version

6. Re-run smoke tests
   bash docs/scripts/smoke-test.sh
   └─ Should now PASS

7. Post-mortem
   Create ticket: "Post-mortem: [Issue name]"
   └─ How did this slip through?
   └─ How do we prevent it next time?
```

---

## 🚨 Module 5: Incident Response (25 minutes)

### Escalation Path

```
Level 1: You spot an issue
│
├─→ Check dashboards (Vercel/Supabase/Upstash)
├─→ Run smoke tests
├─→ Check Incident Playbook
│
Level 2: Still broken after 5 minutes?
│
├─→ Slack: Tag @on-call-engineer
├─→ Say: "Production issue: [brief description]"
├─→ Provide: Smoke test results
│
Level 3: Severe (auth/database down)
│
└─→ Phone call to on-call engineer
    (Number in runbook)
```

### Common Issues & Quick Fixes

| Issue | Quick Fix | Time |
|-------|-----------|------|
| "Can't login" | Check Supabase auth in dashboard | 2 min |
| "Dashboard slow" | Check database CPU in Supabase | 3 min |
| "Cache errors" | Check Upstash connection status | 2 min |
| "Creating exam 500s" | Check recent code changes, revert if obvious bug | 5 min |

### Reporting an Issue

**Template for Slack message:**

```
🚨 Production Issue Report

Symptom: [User can't login / Dashboard is slow / etc]
Affected Users: [One user / All users / Admin only]
Severity: [Low / Medium / High / Critical]

Evidence:
- Smoke test results: [PASS/FAIL - what failed?]
- Vercel error rate: [X%]
- Last deployment: [X minutes ago]
- Recent code changes: [What was deployed?]

Logs:
[Copy relevant error logs from Vercel/Supabase]

Steps to reproduce:
1. [Step 1]
2. [Step 2]
3. [Error occurs]

On-call engineer: @[name]
```

---

## 🎓 Module 6: Hands-On Practice (30 minutes)

### Practice 1: Check System Health

**Task:** Verify production system is healthy right now

**Steps:**

```bash
# 1. Open Vercel Dashboard
# https://vercel.com/dashboard

# 2. Check latest deployment
# Status should be "Ready ✓"
# If not, report to team

# 3. Open Supabase Dashboard
# https://app.supabase.com/

# 4. Go to Monitor → Realtime
# CPU < 50%? ✓
# Connections < 50? ✓

# 5. Open Upstash Console
# https://console.upstash.com/

# 6. Check database status
# Connected? ✓
# Latency < 100ms? ✓

# 7. Conclusion
# System is healthy or needs attention?
```

**Success:** You can complete this in < 3 minutes

### Practice 2: Run Smoke Tests

**Task:** Execute smoke tests and interpret results

**Steps:**

```bash
# 1. Clone repo (if not already)
git clone https://github.com/yourorg/question-creator.git
cd question-creator

# 2. Run smoke tests
bash docs/scripts/smoke-test.sh

# 3. Check output
# All PASS? ✅ System is working
# 1 FAIL? ⚠️ One feature broken
# Multiple FAIL? 🔴 Critical issue

# 4. Report to team if any failures
```

**Success:** You can run and interpret results in < 2 minutes

### Practice 3: Find an Issue in Logs

**Task:** Use dashboard logs to investigate an error

**Scenario:** User reports "dashboard loads very slowly"

**Steps:**

```bash
# 1. Open Vercel Dashboard
# https://vercel.com/dashboard

# 2. Go to Deployments → Logs
vercel logs --follow

# 3. Look for slow requests
# Search for: "GET /api/admin/dashboard"
# Note the duration (should be < 500ms)

# 4. If slow, note the timing
# When did it start? After deployment?

# 5. Open Supabase Dashboard
# https://app.supabase.com/

# 6. Go to Logs → Slow Query
# Look for queries from /api/admin/dashboard
# Note duration (should be < 100ms)

# 7. Conclusion
# Is the API slow or the database slow?
# Report to appropriate team
```

**Success:** You can identify if issue is API or database

### Practice 4: Understand a Deployment

**Task:** Find a recent deployment and understand what changed

**Steps:**

```bash
# 1. Open GitHub
# https://github.com/yourorg/question-creator

# 2. Click "Commits" tab
# Find a recent commit

# 3. Click the commit to see changes
# What files were modified?

# 4. Go to Vercel Dashboard
# Find that deployment
# Verify it was successful

# 5. Check when it deployed
# How long after commit? (should be < 5 min)

# 6. Success!
# You understand the deployment pipeline
```

**Success:** You can trace code → commit → deployment

---

## 📞 Module 7: Getting Help (10 minutes)

### Who to Contact

| Issue | Contact | When |
|-------|---------|------|
| Code bug | Backend team | < 15 min |
| Database slow | Database engineer | < 15 min |
| Auth broken | Auth specialist | < 5 min (CRITICAL) |
| Deployment fails | DevOps | < 10 min |
| Unknown | On-call engineer | < 5 min |

### Support Channels

**Slack channels:**
- `#incidents` - Report critical issues
- `#engineering` - General questions
- `#deployments` - Deployment discussion

**Documents:**
- `/docs/RUNBOOK.md` - Deployment procedures
- `/docs/INCIDENT-RESPONSE.md` - Troubleshooting
- `/docs/DEPLOYMENT.md` - Setup guide

### On-Call Engineer

**Who:** Rotating weekly
**Contact:** Phone/Slack (see on-call spreadsheet)
**Use for:** CRITICAL issues only (auth down, all users affected)

---

## ✅ Training Checklist

**Before you're certified to support production:**

- [ ] Read all modules (1-7)
- [ ] Complete hands-on practices (Module 6)
- [ ] Do 1 supervised deployment with team member
- [ ] Successfully respond to 1 simulated incident
- [ ] Team lead sign-off

**After certification, you can:**
- ✅ Check system health daily
- ✅ Run smoke tests after deployment
- ✅ Use incident playbook for troubleshooting
- ✅ Report issues to team
- ✅ Participate in post-mortems

---

## 📚 Quick Reference Card

**Keep this on your desk:**

```
DAILY CHECKLIST (1 minute)
✓ Vercel Dashboard: Latest deployment = Ready ✓
✓ Supabase Monitor: CPU < 50%, Connections < 50
✓ Upstash: Database = Connected, Latency < 100ms

AFTER DEPLOYMENT (5 minutes)
✓ Run smoke tests: bash docs/scripts/smoke-test.sh
✓ Watch logs: vercel logs --follow
✓ Check analytics: Vercel Dashboard → Analytics
✓ Announce to team: "✅ Deployment successful"

WHEN ISSUE REPORTED (5 minutes)
✓ Check dashboards (Vercel/Supabase/Upstash)
✓ Run smoke tests
✓ Check Incident Playbook: docs/INCIDENT-RESPONSE.md
✓ Report to on-call engineer if not resolved

PHONE NUMBERS / SLACK HANDLES
On-Call Engineer: @[name] or [phone]
Manager: @[name]
```

---

## 🎯 Next Steps

1. **This Week:**
   - Read all modules (1-2 hours)
   - Complete hands-on practices

2. **Next Week:**
   - Do supervised deployment with team lead
   - Respond to simulated incident

3. **Final Sign-off:**
   - Team lead certification
   - You're now "certified" for production support!

---

**Questions? Ask in #engineering or contact your tech lead**

**Last Updated:** 2026-02-02
**Next Review:** After first quarter of deployments
