# 📚 User Stories Index

**Question Creator MVP - Sequência de 13 User Stories**

**Status:** ✅ Pronto para Desenvolvimento
**Total Effort:** 379h | **Duration:** 8 weeks | **Team Size:** 8 FTE

---

## 📋 Índice Navegável

### Epic 1: Core Features (Stories 1-4) - 154h

#### [01 - API Foundation & Authentication](./01-api-foundation-auth.md)

**Sprint:** 1.1 | **Effort:** 22h | **Week:** 2

- User signup/login with JWT authentication
- RLS policies for data isolation
- Rate limiting on auth endpoints
- **Dependencies:** None (start here)

#### [02 - Question Generation & Retrieval (RAG Integration)](./02-question-generation-rag.md)

**Sprint:** 1.1 & 1.2 | **Effort:** 28h | **Week:** 2-3

- Generate questions using Gemini API with RAG
- Full-text search in Portuguese
- Caching strategy (Redis)
- **Dependencies:** Story 1.1

#### [03 - Question Submission & Reputation System](./03-question-submission-reputation.md)

**Sprint:** 1.3, 1.4, 1.5 | **Effort:** 42h | **Week:** 3-4

- Answer submission and validation
- Database triggers for reputation calculation
- Question feedback and admin review queue
- **Dependencies:** Stories 1.1, 1.2

#### [04 - Dashboard & Navigation UI](./04-dashboard-navigation-ui.md)

**Sprint:** 1.2 | **Effort:** 24h | **Week:** 2

- User dashboard with study statistics
- Auth pages (login, signup, recovery)
- Question card component
- Accessibility (WCAG 2.1 AA)
- **Dependencies:** Stories 1.1, 1.2

---

### Epic 2: Exam Management (Stories 5-8) - 92h

#### [05 - Exam CRUD & Infrastructure](./05-exam-crud-infrastructure.md)

**Sprint:** 2.1 | **Effort:** 24h | **Week:** 5

- Create, read, update exams
- Question association and ordering
- Validation and RLS policies
- **Dependencies:** Epic 1

#### [06 - Exam Attempt & Answer Submission](./06-exam-attempt-answer-submission.md)

**Sprint:** 2.2 | **Effort:** 28h | **Week:** 5

- Start exam attempt
- Submit answers with timing
- Automatic scoring calculation
- **Dependencies:** Story 2.1

#### [07 - Exam UI & Interaction](./07-exam-ui-interaction.md)

**Sprint:** 2.3 | **Effort:** 28h | **Week:** 6

- Exam builder (drag-to-reorder)
- Countdown timer with 5-min warning
- Results page with topic breakdown
- Exam history
- **Dependencies:** Stories 2.1, 2.2

#### [08 - Scoring, Analytics & Weak Area Detection](./08-scoring-analytics-weak-areas.md)

**Sprint:** 2.4 | **Effort:** 12h | **Week:** 6

- Scoring calculation (accurate to 100%)
- Weak area detection (< 50% accuracy)
- Performance analytics and trends
- **Dependencies:** Story 2.2

---

### Epic 3: Admin & CSV Import (Stories 9-10) - 60h

#### [09 - CSV Import Pipeline](./09-csv-import-pipeline.md)

**Sprint:** 3.1 | **Effort:** 40h | **Week:** 7

- CSV parser with validation
- Deduplication (85% Levenshtein threshold)
- Semantic mapping with Gemini API
- Batch processing (100 rows per transaction)
- Version management and rollback
- **Dependencies:** Epics 1 & 2

#### [10 - Admin Dashboard & Review Queue](./10-admin-dashboard-review-queue.md)

**Sprint:** 3.2 | **Effort:** 20h | **Week:** 7

- System statistics dashboard
- Flagged questions review queue
- Question approval/rejection workflow
- Admin access control (RLS)
- **Dependencies:** Epics 1 & 2

---

### Epic 4: QA, Performance & Launch (Stories 11-13) - 73h

#### [11 - Regression Testing & QA](./11-regression-testing-qa.md)

**Sprint:** 4.1 | **Effort:** 34h | **Week:** 8

- Comprehensive regression test suite
- Load testing (1000 concurrent users)
- Security audit (OWASP top 10)
- E2E critical paths
- **Dependencies:** Epics 1, 2, 3

#### [12 - Performance Optimization & Tuning](./12-performance-optimization-tuning.md)

**Sprint:** 4.2 | **Effort:** 22h | **Week:** 8

- Database optimization (EXPLAIN ANALYZE)
- Frontend code splitting and lazy loading
- API caching and compression
- CDN optimization
- **Dependencies:** Epics 1, 2, 3

#### [13 - Monitoring, Alerting & Runbook](./13-monitoring-alerting-runbook.md)

**Sprint:** 4.3 | **Effort:** 17h | **Week:** 8

- Sentry error tracking
- CloudFlare metrics dashboard
- Alerting rules (Slack, email)
- Deployment runbook and incident response
- **Dependencies:** All stories

---

## 📊 Timeline & Effort Matrix

| Epic | Stories | Sprint | Duration | Effort | Status |
|------|---------|--------|----------|--------|--------|
| **Epic 1: Core Features** | 1-4 | 1.1-1.5 | Weeks 2-4 | 154h | 🔄 Ready |
| **Epic 2: Exam Management** | 5-8 | 2.1-2.4 | Weeks 5-6 | 92h | ⏳ Blocked by Epic 1 |
| **Epic 3: Admin & CSV** | 9-10 | 3.1-3.2 | Week 7 | 60h | ⏳ Blocked by Epics 1-2 |
| **Epic 4: QA & Launch** | 11-13 | 4.1-4.3 | Week 8 | 73h | ⏳ Blocked by Epics 1-3 |
| **TOTAL** | **13** | - | **8 weeks** | **379h** | ✅ Planned |

---

## 🔗 Dependency Graph

```
Week 1: Planning & Setup

Week 2:
├─ Story 01 (Auth) ──────────────────────────┐
├─ Story 02 (Questions) ─ depends on 01 ────┤
└─ Story 04 (Dashboard UI) ─ depends on 01,02┘
         ↓

Week 3:
└─ Story 03 (Reputation) ─ depends on 01,02
         ↓

Week 4: Epic 1 Complete
         ↓

Week 5:
├─ Story 05 (Exam CRUD) ──────────────────────┐
└─ Story 06 (Attempt & Answers) ─ depends on 05┘
         ↓

Week 6:
├─ Story 07 (Exam UI) ─ depends on 05,06
└─ Story 08 (Analytics) ─ depends on 06
         ↓

Week 7: Epic 2 Complete
         ↓
├─ Story 09 (CSV Import) ─ depends on Epics 1,2
└─ Story 10 (Admin Dashboard) ─ depends on Epics 1,2
         ↓

Week 8: Epic 3 Complete
         ↓
├─ Story 11 (Testing & QA) ─ depends on all
├─ Story 12 (Performance) ─ depends on all
└─ Story 13 (Monitoring) ─ depends on all
         ↓

✅ MVP LAUNCH READY
```

---

## 👥 Team Assignment Guide

### @dev (Developer/Coder)

- Lead implementer for all stories
- Works alongside specialists on complex features
- Responsible for code quality and testing
- Stories: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13

### @architect (Software Architect)

- Reviews technical design for Stories 01, 02, 03, 05
- Security and architecture decisions
- RLS design review
- API contract design

### @db-sage (Database Specialist)

- Reviews trigger design for Story 03
- Database optimization for Story 12
- FTS configuration for Story 02
- CSV import logic for Story 09
- Analytics queries for Story 08

### @ux-expert (UX/Accessibility Expert)

- Reviews Stories 04, 07 for accessibility (WCAG 2.1 AA)
- LightHouse optimization review
- Responsive design verification

### @qa (QA Engineer)

- Leads Story 11 (Regression Testing)
- Creates test matrices
- Performs security audits
- Load testing execution

### @devops (DevOps Engineer)

- Leads Story 13 (Monitoring & Runbook)
- Deployment infrastructure
- CI/CD pipeline setup
- Performance monitoring

---

## ✅ Pre-Development Checklist

- [ ] Repository cloned
- [ ] Branch naming convention established (feature/X.Y-story-name)
- [ ] Environment variables template created (.env.example)
- [ ] Database schema initialized
- [ ] Testing framework configured (Vitest, Playwright)
- [ ] Linting & formatting setup (ESLint, Prettier)
- [ ] Monitoring tools ready (Sentry DSN, CloudFlare)
- [ ] Team aligned on technical decisions
- [ ] First story (01) ready to start

---

## 🚀 Development Workflow

### For Each Story

1. **Assign & Plan**
   - Assign @dev as lead
   - Create feature branch: `feature/X.Y-story-name`
   - Review story AC and technical specs

2. **Develop**
   - Implement according to AC
   - Write tests (Vitest ≥ 80% coverage)
   - Follow quality gates (pre-commit, pre-PR, pre-deploy)

3. **Review & QA**
   - Code review by @architect or @db-sage
   - Quality gate checks pass
   - E2E tests pass

4. **Deploy**
   - Push to remote (via @github-devops)
   - Create PR
   - Merge to main
   - Deploy to staging

5. **Verify**
   - Smoke test
   - Monitor metrics
   - Mark story complete in backlog

---

## 📚 Quick Links

- **Original Documentation:** [USER_STORIES.md](../USER_STORIES.md)
- **Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Setup Guide:** [SETUP_LOCAL_ANALYSIS.md](../SETUP_LOCAL_ANALYSIS.md)
- **REST API:** [REST_API_ANALYSIS.md](../REST_API_ANALYSIS.md)
- **Database:** [DATABASE_ANALYSIS.md](../DATABASE_ANALYSIS.md)
- **Testing:** [TESTING.md](../TESTING.md) (if exists)
- **Deployment:** [DEPLOYMENT.md](../DEPLOYMENT.md) (if exists)

---

## 📝 Notes for Developers

### Story Selection Tips

- **Start with:** Story 01 (Auth Foundation)
  - No blockers
  - Enables other stories
  - Security-critical

- **Parallel Work Opportunity:** Story 04 can start Week 2 with Story 01
  - Different team members
  - Minimal blocking dependencies

- **Critical Path:** 01 → 02 → 03 (Epic 1) → 05 → 06 → (07, 08 parallel) → 09, 10 → 11, 12, 13
  - Roughly 8 weeks if executed perfectly
  - Build buffer for integration issues

### Quality Standards

- **Test Coverage:** Minimum 80% for all stories
- **API Documentation:** OpenAPI spec for each endpoint
- **Security:** OWASP checklist for auth/admin stories
- **Performance:** Load tests for high-volume features
- **Accessibility:** WCAG 2.1 AA for frontend stories

### Common Blockers

| Blocker | Prevention |
|---------|-----------|
| Story 1 auth issues | Review RLS design early, test with role impersonation |
| Database trigger race conditions | Load test (1000 req/min), use advisory locks |
| CSV import slowness | Batch processing (100 rows/txn), test with full dataset |
| Performance regressions | Establish baseline metrics, monitor continuously |

---

**Last Updated:** 2026-02-01
**Version:** 1.0
**Status:** ✅ Ready for Sprint Planning
