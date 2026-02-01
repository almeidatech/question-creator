# 🏛️ RAG System - Complete Documentation Index

**Last Updated:** Feb 1, 2026 | **Status:** ✅ READY FOR DEVELOPMENT

---

## 📚 Documentation Structure

### For Product Team (@pm)
→ Start here: **[PRD_QUESTION_CREATOR.md](PRD_QUESTION_CREATOR.md)** (v1.1)
- Section: "Epic: AI Question Generation & RAG"
- Section: "Phase 2 (v1.1) - Week 4"
- Section: "6. SUCCESS METRICS (KPIs)"

Quick Summary: **[CONTEXT_SUMMARY.md](../CONTEXT_SUMMARY.md)** (at root level)

---

### For Architecture Team (@architect)
→ Start here: **[ARQUITETURA_TECNICA.md](ARQUITETURA_TECNICA.md)**
- RAG pipeline diagram
- ADR-001: FTS + pgvector decision
- ADR-002: Dual-corpus architecture
- Technical requirements

Approval Matrix: **[RAG_ARCHITECTURE_SUMMARY.md](RAG_ARCHITECTURE_SUMMARY.md)**
- Risk assessment
- Feasibility analysis
- Architecture decision rationale

---

### For Database Team (@data-architect)
→ Start here: **[IMPLEMENTATION_CONTEXT.md](IMPLEMENTATION_CONTEXT.md)**
- Section 1: Database Schema (US-1B.1)
- SQL indexes + audit trigger
- Stored procedures for FTS

Schema Review: **[ARQUITETURA_TECNICA.md](ARQUITETURA_TECNICA.md)**
- Database design rationale
- Dual-corpus table structure

---

### For Development Team (@dev)
→ Start here: **[IMPLEMENTATION_CONTEXT.md](IMPLEMENTATION_CONTEXT.md)**
- **Section 1:** Database schema (copy-paste SQL)
- **Section 2:** FTS query implementation (TypeScript)
- **Section 3:** Claude API integration (endpoint code)
- **Section 4:** Redis caching (implementation)
- **Section 5:** Expert review queue (API endpoint)
- **Section 6:** Testing patterns (corpus isolation)
- **Section 7:** Phase 2 pgvector (deferred)

Detailed Stories: **[stories/02-question-generation-rag.md](stories/02-question-generation-rag.md)**
- Breakdown of 7 stories (US-1B.1 through US-1B.7)
- Acceptance criteria for each story
- Technical specifications

---

### For QA/Testing Team
→ Start here: **[IMPLEMENTATION_CONTEXT.md](IMPLEMENTATION_CONTEXT.md)**
- Section 6: Testing corpus isolation
- Test cases for each story

Test Strategy: **[stories/02-question-generation-rag.md](stories/02-question-generation-rag.md)**
- Success criteria per story
- Load testing scenarios

---

## 🎯 Quick Navigation

### Understanding RAG Strategy
1. **What is RAG?** → IMPLEMENTATION_CONTEXT.md section 0 (Quick Reference)
2. **Why FTS MVP?** → ARQUITETURA_TECNICA.md (ADR-001)
3. **Why dual-corpus?** → ARQUITETURA_TECNICA.md (ADR-002)

### Implementation Planning
1. **Timeline & Effort** → CONTEXT_SUMMARY.md (Timeline section)
2. **Stories breakdown** → EPICS.md (Epic 1B)
3. **Developer setup** → IMPLEMENTATION_CONTEXT.md (all sections)

### Cost & Business
1. **Cost analysis** → CONTEXT_SUMMARY.md (Cost Analysis)
2. **KPI framework** → PRD_QUESTION_CREATOR.md (Section 6: SUCCESS METRICS)
3. **ROI projection** → RAG_ARCHITECTURE_SUMMARY.md (Section 4: Cost Analysis)

### Risk Management
1. **Technical risks** → ARQUITETURA_TECNICA.md (Risk section)
2. **Mitigation strategies** → RAG_ARCHITECTURE_SUMMARY.md (Risk Assessment)
3. **Monitoring & alerts** → RAG_ARCHITECTURE_SUMMARY.md (Section 7)

---

## 📋 Story Overview

### MVP (Sprint 7-8, Weeks 7-8) - FTS-Based RAG

```
├─ US-1B.1: Dual-Corpus Schema (4h)
│  └─ Create question_sources table + audit trigger
│
├─ US-1B.2: FTS Query Development (8h)
│  └─ PostgreSQL FTS indexes + retrieval function
│
├─ US-1B.3: Claude Integration (8h)
│  └─ POST /api/questions/generate endpoint
│
├─ US-1B.4: Cache Strategy (4h)
│  └─ Redis 24h TTL caching
│
├─ US-1B.5: Expert Review Queue (6h)
│  └─ Admin interface for 100% question validation
│
├─ US-1B.6: Corpus Isolation Testing (6h)
│  └─ Unit + integration tests for source_type filtering
│
└─ TOTAL: 42h effort, ~9 days, 1 backend + 1 architect

Phase 2 (Week 4) - Optional pgvector Upgrade

├─ US-1B.7: pgvector Setup (6h)
│  └─ Semantic search + hybrid retrieval
│
└─ Additional cost: +$81/month
```

---

## 🔑 Critical Reminders

### ⚠️ CORPUS ISOLATION IS NON-NEGOTIABLE

Every RAG query must include:
```sql
WHERE source_type = 'real_exam' AND rag_eligible = true
```

Violation = **System failure**

### ⚠️ EXPERT REVIEW IS MANDATORY

- 0 AI-generated questions go to users without expert approval
- Expert approval rate target: >80% on first review
- SLA: 24 hours max

### ⚠️ CONTAMINATION CHECK (DAILY)

```sql
SELECT COUNT(*) FROM question_sources
WHERE source_type='ai_generated' AND rag_eligible=true;
-- Must equal 0, always
```

If > 0: **CRITICAL ALERT**

---

## 📊 Key Metrics

### Success Criteria (MVP End)
| Metric | Target | Status |
|--------|--------|--------|
| Expert approval rate | >80% | ✅ KPI |
| Error rate | <5% | ✅ KPI |
| Generation latency P95 | <2-3s | ✅ Performance |
| Cache hit rate | >70% | ✅ Performance |
| System uptime | 99%+ | ✅ Reliability |
| Corpus contamination | 0 | ✅ Safety |

---

## 🚀 Getting Started

### Week 2 (Next Week) - Preparation
- [ ] Read all team-specific documentation above
- [ ] Setup local environments (PostgreSQL, Redis, Claude API)
- [ ] Review & approve schema design
- [ ] Plan expert reviewer recruitment

### Week 7 (Sprint Start)
- [ ] Kick off Sprint 7-8
- [ ] Begin US-1B.1 (database schema)
- [ ] Follow IMPLEMENTATION_CONTEXT.md step-by-step

### Week 8 (Mid-Sprint)
- [ ] Merge first 3 stories (schema, FTS, Claude)
- [ ] Begin testing (US-1B.6)
- [ ] Setup monitoring

### End of Week 8 (MVP Ready)
- [ ] All 6 stories merged
- [ ] QA validation passed
- [ ] Monitoring live
- [ ] Ready for Phase 2 decision

---

## 🤝 Team Communication

### Questions About...

**Strategy + Timeline?**
→ Ask @pm (Morgan)

**Architecture + ADRs?**
→ Ask @architect (Aria)

**Database schema + optimization?**
→ Ask @data-architect (Dara)

**Implementation + coding?**
→ Ask @dev (assigned)

**Market validation + feasibility?**
→ Ask @analyst (Atlas)

---

## 📖 Full Document Map

```
docs/
├─ PRD_QUESTION_CREATOR.md (v1.1)
│  └─ Product requirements + roadmap
│
├─ ARQUITETURA_TECNICA.md
│  ├─ RAG architecture diagram
│  ├─ ADR-001: FTS + pgvector
│  ├─ ADR-002: Dual-corpus
│  └─ Technical specifications
│
├─ EPICS.md
│  └─ Epic 1B: RAG System (7 stories)
│
├─ stories/02-question-generation-rag.md
│  └─ Detailed story breakdown (US-1B.1-7)
│
├─ RAG_ARCHITECTURE_SUMMARY.md
│  ├─ Executive summary
│  ├─ Risk assessment
│  ├─ Cost analysis
│  └─ Developer onboarding
│
├─ IMPLEMENTATION_CONTEXT.md
│  ├─ Developer quick reference
│  ├─ Code examples
│  ├─ SQL schema
│  ├─ API endpoints
│  └─ Testing patterns
│
├─ README_RAG.md (this file)
│  └─ Documentation index + quick navigation
│
└─ CONTEXT_SUMMARY.md (at root)
   └─ Consolidated overview
```

---

## ✅ Approval Status

| Stakeholder | Review | Status |
|-------------|--------|--------|
| @pm (Morgan) | Strategy | ✅ APPROVED |
| @architect (Aria) | Architecture | ✅ APPROVED |
| @analyst (Atlas) | Feasibility | ✅ APPROVED |
| @data-architect (Dara) | Schema | ⏳ Pending |
| @dev (team) | Implementation | ⏳ Pending |

---

## 🎬 Next Action

**👉 Your role determines where to start:**

- **Product Manager?** → Read [PRD_QUESTION_CREATOR.md](PRD_QUESTION_CREATOR.md) Section 3.6
- **Architect?** → Review [ARQUITETURA_TECNICA.md](ARQUITETURA_TECNICA.md) ADRs
- **Database Engineer?** → Check [IMPLEMENTATION_CONTEXT.md](IMPLEMENTATION_CONTEXT.md) Section 1
- **Developer?** → Start with [IMPLEMENTATION_CONTEXT.md](IMPLEMENTATION_CONTEXT.md) Section 0
- **QA Engineer?** → Review [IMPLEMENTATION_CONTEXT.md](IMPLEMENTATION_CONTEXT.md) Section 6

---

**Ready to build? Let's go! 🚀**

Questions? Reach out to the team contacts above.

---

*Generated: Feb 1, 2026 | Next Review: Week 2 (Sprint Start)*
