# 🏛️ RAG System Architecture Summary

**Status:** ✅ APPROVED & DOCUMENTED | **Date:** Feb 1, 2026 | **Version:** 1.0

---

## Executive Summary

This document consolidates the RAG (Retrieval-Augmented Generation) system architecture approved by Product Management (@pm Morgan), Business Analysis (@analyst Atlas), and System Architecture (@architect Aria).

**Key Decisions:**
- ✅ FTS-based RAG for MVP (Week 3)
- ✅ pgvector upgrade for Phase 2 (Week 4)
- ✅ Dual-corpus architecture preventing quality degradation
- ✅ $1.45k MVP + $81/month Phase 2 incremental cost

---

## 1. RAG Strategy Overview

### MVP Implementation (Weeks 7-8)

**Technology:** PostgreSQL Full-Text Search (tsvector)

```
User Request (topic, difficulty, count)
    ↓
Check Redis Cache (24h TTL)
    ↓ Cache Miss
FTS Query (5-10 similar real exam questions)
    ↓
Claude 3.5 Sonnet Prompt (prompt + RAG context)
    ↓
Generate New Questions (source_type='ai_generated')
    ↓
Expert Review Queue (100% validation before user exposure)
    ↓
Store + Cache (Redis 24h TTL)
    ↓
Return to Student
```

**Performance Targets:**
- FTS query: <100ms
- Generation: <2-3s (P95)
- Cache hit rate: >70%
- Expert approval: >80%

### Phase 2 Upgrade (Week 4)

**Enhancement:** Add pgvector hybrid search (semantic + FTS)

```
Same flow as MVP, but:
- Hybrid retrieval: Merge FTS (BM25) + Vector (cosine) rankings
- Increase context: 5 → 10 similar questions
- Expected latency: <2s total (improvement over FTS-only)
```

**Additional Cost:** +$81/month (marginal)

---

## 2. Dual-Corpus Architecture

### Problem Statement

Risk: AI-generated questions could contaminate RAG corpus, causing:
- Quality degradation through iterative generations
- Error amplification (1 error → 10 copies → 100 copies)
- Loss of ground truth vs. learned patterns

### Solution: Source-Type Filtering

**Schema:**
```sql
CREATE TABLE question_sources (
  id UUID PRIMARY KEY,
  question_id UUID UNIQUE REFERENCES questions(question_id),
  source_type ENUM('real_exam', 'ai_generated', 'expert_approved'),
  rag_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by UUID NULL
);
```

**RAG Filtering (IMMUTABLE):**
```sql
WHERE source_type = 'real_exam' AND rag_eligible = TRUE
```

**Policy:**
- Real exam questions: `source_type='real_exam'`, `rag_eligible=true`
- AI-generated: `source_type='ai_generated'`, `rag_eligible=false`
- Expert-approved: `source_type='expert_approved'`, `rag_eligible=false`

**Audit Trail:**
- Trigger logs ALL source_type changes
- Daily contamination check: `SELECT COUNT(*) WHERE source_type='ai_generated' AND rag_eligible=true` (must = 0)
- Monthly expert audit: Sample 50 questions, verify no quality degradation

---

## 3. Implementation Timeline

### Sprint 7-8 (MVP - Weeks 7-8): FTS-Based RAG

| Story | Duration | Effort | Owner | Status |
|-------|----------|--------|-------|--------|
| US-1B.1: Dual-Corpus Schema | 1d | 4h | @data-architect + @dev | Ready |
| US-1B.2: FTS Query Development | 2d | 8h | @dev + @data-architect | Ready |
| US-1B.3: Claude Integration | 2d | 8h | @dev | Ready |
| US-1B.4: Cache Strategy | 1d | 4h | @dev | Ready |
| US-1B.5: Expert Review Queue | 1.5d | 6h | @dev | Ready |
| US-1B.6: Corpus Isolation Testing | 1.5d | 6h | @dev + @architect | Ready |
| **Total** | **~9 days** | **42h** | 1 Backend + 1 Architect | ✅ |

### Phase 2 (Week 4): pgvector Upgrade

| Story | Duration | Effort | Owner | Status |
|-------|----------|--------|-------|--------|
| US-1B.7: pgvector Setup | 3-4d | 6h | @dev + @data-architect | Ready |
| **Total** | **~3-4 days** | **6h** | Same team | ✅ |

**Dependency:** CSV import (US-5.1) must complete Week 2 with 13,917 questions

---

## 4. Cost Analysis

### MVP (Week 3 - FTS Only)

| Component | Cost | Notes |
|-----------|------|-------|
| Cloud compute | $500-1,000 | AWS/Vercel |
| PostgreSQL | $200-500 | Supabase Standard |
| Redis cache | $20-50 | Upstash |
| Claude API | $44-88 | ~$0.022 per batch of 5 |
| Monitoring | $100-200 | DataDog/New Relic |
| Misc | $50 | Domain, SSL |
| **Total** | **~$1,450/mo** | **Sustainable** |

### Phase 2 (Week 4+ - with pgvector)

| Component | Cost | Notes |
|-----------|------|-------|
| Cloud compute | $500-1,000 | Same |
| PostgreSQL + pgvector | $300-600 | +$50-100 for vectors |
| Redis cache | $20-50 | Same |
| Claude API | $44-88 | Same |
| OpenAI Embeddings | $20-40 | Vector generation |
| Monitoring | $100-200 | Same |
| Misc | $50 | Same |
| **Total** | **~$1,531/mo** | **+$81 vs MVP** |

**Unit Economics:**
- 1,000 users: $1.45/user/month (MVP) → $1.53/user/month (Phase 2)
- 10,000 users: $0.15/user/month (both phases)

---

## 5. Feasibility & Risk Assessment

### FTS RAG Feasibility: ✅ HIGH CONFIDENCE (7 Days)

**Timeline Breakdown:**
- Days 1-2: Database schema + indexes (4h)
- Day 3: FTS query development (6h)
- Day 4: Claude API integration (8h)
- Days 5-6: Testing + integration (12h)
- Day 7: Buffer + polish (8h)

**Critical Path:** CSV import must be ready (Week 2)

### pgvector Readiness: ⚠️ REALISTIC (4-5 Days Phase 2)

**Timeline:**
- Day 1: pgvector setup (4h)
- Days 2-3: Embeddings batch job + index (16h)
- Days 4-5: Hybrid query development + testing (8-10h)

**Batch Job Duration:** 30-60 minutes for 13.917 questions

### Top 3 Technical Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| LLM Hallucination | CRITICAL | Expert review 100% + RAG grounding |
| Corpus Contamination | HIGH | source_type filtering + daily audit |
| FTS Performance Degradation | MEDIUM | Index monitoring + pgvector fallback |

---

## 6. Architecture Decisions (ADRs)

### ADR-001: PostgreSQL FTS + pgvector (not Pinecone)

**Approved by:** @architect (Aria) | **Date:** Feb 1, 2026

- Use native PostgreSQL FTS for MVP
- Upgrade to pgvector Phase 2
- Defer Pinecone if scale >1M questions
- Expected to handle 10k questions easily

### ADR-002: Dual-Corpus Architecture (source_type filtering)

**Approved by:** @architect (Aria) + @analyst (Atlas) | **Date:** Feb 1, 2026

- Prevent AI-generated questions from contaminating RAG corpus
- Database-level enforcement via enum type
- Monthly compliance audit
- Policy: Never include AI-generated in RAG retrieval

---

## 7. Monitoring & Quality Gates

### KPI Tiers

**Tier 1: Quality (CRITICAL - MVP Gating)**
- Expert approval rate: >80%
- Error rate: <5%
- Reputation score avg: 7+/10
- Corpus contamination: 0 AI-generated in RAG

**Tier 2: UX (IMPORTANT)**
- Generation latency P95: <2-3s (FTS) → <2s (pgvector)
- Cache hit rate: >70%
- Search latency: <100ms (FTS)

**Tier 3: Business (IMPORTANT)**
- Active users: 50+ by Week 4
- 1-week retention: 70%+
- Cost per user: <$0.10/month

**Tier 4: Technical (SUPPORT)**
- System uptime: 99%+
- API error rate: <0.5%
- Database query latency: <100ms FTS

### Automated Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Corpus contamination | >0 | CRITICAL - Pause generation |
| Expert approval rate | <75% | HIGH - Escalate to SME |
| Generation latency | >3s | MEDIUM - Review cache/queries |
| Error rate | >10% | HIGH - Investigate quality |

---

## 8. Documentation & Deliverables

### Updated Documentation

✅ **docs/ARQUITETURA_TECNICA.md**
- Updated RAG architecture diagram
- Added ADR-001 & ADR-002 (full decision records)
- Dual-corpus explanation with SQL examples

✅ **docs/EPICS.md**
- Added Epic 1B: RAG System & Question Generation
- 7 detailed stories (US-1B.1 through US-1B.7)
- Risk mitigations + dependencies

✅ **docs/stories/02-question-generation-rag.md**
- Comprehensive story breakdown
- Acceptance criteria for each story
- Technical implementation details
- Phase 2 pgvector upgrade included

✅ **docs/PRD_QUESTION_CREATOR.md** (v1.1)
- RAG strategy finalized
- Dual-corpus architecture documented
- 6-tier KPI framework
- Timeline & costs updated

---

## 9. Developer Onboarding Checklist

### Prerequisites (Before Sprint 7 Starts)

- [ ] Read: PRD v1.1 (section on RAG strategy)
- [ ] Read: ARQUITETURA_TECNICA.md (ADR-001 & ADR-002)
- [ ] Read: EPICS.md (Epic 1B overview)
- [ ] Read: This summary document
- [ ] Setup: Local PostgreSQL with tsvector support
- [ ] Setup: Upstash Redis account configured
- [ ] Setup: Claude 3.5 Sonnet API key obtained
- [ ] Database: CSV import (US-5.1) completed Week 2

### Implementation Order (Sprint 7-8)

1. **Week 7, Day 1-2:** US-1B.1 (Dual-corpus schema)
   - @data-architect: Schema design review
   - @dev: Implementation + migration

2. **Week 7, Day 3-4:** US-1B.2 (FTS queries)
   - @dev: FTS index + query development
   - @data-architect: Query optimization

3. **Week 7, Day 5-6:** US-1B.3 (Claude integration)
   - @dev: API endpoint + prompt engineering
   - @architect: Validate architecture

4. **Week 8, Day 1:** US-1B.4 (Cache strategy)
   - @dev: Redis cache implementation

5. **Week 8, Day 2:** US-1B.5 (Expert review queue)
   - @dev: Admin interface + reputation updates

6. **Week 8, Day 3-4:** US-1B.6 (Testing)
   - @dev: Corpus isolation tests
   - @architect: Performance validation

7. **Week 4 Phase 2:** US-1B.7 (pgvector)
   - @dev: Embeddings batch job
   - @data-architect: Hybrid query optimization

### Quality Gate Checklist

Before MVP Launch (End of Week 8):
- [ ] Expert approval rate >80%
- [ ] Error rate <5%
- [ ] Corpus contamination = 0 (verified)
- [ ] Generation latency <2-3s P95
- [ ] Cache hit rate >50% after 48h of usage
- [ ] Load test: 100 concurrent requests, all <3s
- [ ] Monitoring setup: DataDog/New Relic configured
- [ ] Documentation: Complete + reviewed

---

## 10. Next Steps

### Week 2 (Next Week)
- [ ] @data-architect: Review this summary + provide schema refinements
- [ ] @dev: Setup local environment + PostgreSQL tsvector
- [ ] @architect: Review ADRs + monitoring strategy
- [ ] @pm: Confirm timeline + budget allocation

### Week 3 (Sprint Start)
- [ ] Begin Sprint 7-8 (FTS RAG implementation)
- [ ] Daily standup: Track progress against 42h effort estimate
- [ ] Weekly: Risk review + escalation if needed

### Week 4 Phase 2
- [ ] Evaluate FTS performance data
- [ ] Decide: pgvector upgrade or optimize FTS further
- [ ] Start US-1B.7 if approved

---

## Contact & Questions

- **Architecture Decisions:** @architect (Aria)
- **Database Schema:** @data-architect (Dara)
- **Product Strategy:** @pm (Morgan)
- **Implementation:** @dev (assigned developers)

---

**Last Updated:** Feb 1, 2026 | **Next Review:** Week 2 (Sprint Start)
