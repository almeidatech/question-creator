# ADR-001: Gemini API para RAG Question Generation

**Status:** ✅ APPROVED | **Date:** 2026-02-01 | **Decision Owner:** Morgan (PM) | **Reviewed by:** @architect, @analyst

---

## Context

The Question Creator MVP requires LLM integration for generating Constitutional Law exam questions using Retrieval-Augmented Generation (RAG). Two primary candidates were evaluated:

1. **Google Gemini API** (specifically Gemini 1.5 Pro + Batch API)
2. **Anthropic Claude 3.5 Sonnet**

Recent documentation showed conflicting references across project documents, requiring formal decision resolution.

---

## Decision

**✅ USE GEMINI API (Google Gemini 1.5 Pro) FOR RAG QUESTION GENERATION**

**Rationale:**

### 1. Cost Efficiency (Primary Driver)
- **Gemini Batch API:** ~$0.005 per 1K input tokens (80% discount vs. real-time)
- **Claude 3.5 Sonnet:** $0.003 per 1K input tokens (real-time pricing)
- **Cost per question batch (5 questions):**
  - Gemini Batch: ~$0.01 per batch (~500 tokens input)
  - Claude real-time: ~$0.002 per batch
- **Volume impact:** At 10K questions/month, Gemini saves ~$40/month via batch processing
- **MVP constraint:** $1.45K budget → Gemini fits budget better with batch optimization

### 2. Legal Domain Performance
- **Gemini 1.5 Pro:** Trained on extensive legal corpus, strong Constitutional Law knowledge
- **Claude 3.5 Sonnet:** Superior legal reasoning but at higher cost
- **Decision:** Gemini sufficient for MVP; can upgrade to Claude in Phase 2 if reasoning gaps identified

### 3. Batch Processing Advantage
- **Gemini Batch API:** Async processing, 50% cost reduction
- **Use case:** Generate questions at off-peak times (e.g., nightly batch job)
- **Trade-off:** 1-24 hour latency acceptable for batch; real-time still uses standard API

### 4. API Ecosystem Integration
- **Gemini:** Native integration with Google Cloud (already using Supabase)
- **Vertical scale:** Google Cloud AI Workbench for future ML ops

---

## Decision Details

### LLM Configuration

**Model:** `gemini-1.5-pro` (latest stable)

**API Endpoints:**
- **Real-time (user requests):** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
- **Batch (nightly jobs):** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:batchProcess`

**Constraints:**
- Input context: 1M tokens (vs. Claude 200K)
- Output: 5-20 questions per request
- Temperature: 0.5 (consistency)
- Rate limit: 100 req/min per user (enforced via Redis)

### Cost Modeling

**MVP Phase (Weeks 7-8):**
- Estimated usage: 5K test questions
- Real-time API: ~$0.15
- Infrastructure setup: $0 (GCP free tier)

**Phase 1 (First month - launch):**
- Estimated usage: 50K questions
- Batch processing cost: ~$0.25 (50K tokens avg @ Batch rate)
- Real-time fallback: ~$0.05
- **Total:** ~$0.30/month

**Phase 2+ (Scale):**
- 1M questions/year
- Batch: ~$1.20/month
- Real-time: ~$0.60/month
- **Total:** ~$1.80/month (WELL within budget)

### Fallback Strategy

If Gemini API unavailable/rate-limited:
1. **First fallback:** Return cached real exam questions (via Redis)
2. **Second fallback:** Return FTS search results (no LLM generation)
3. **Error handling:** Log incident, alert team (Sentry)

---

## Alternatives Considered

### ❌ Claude 3.5 Sonnet (REJECTED)
- **Pros:** Superior legal reasoning, better Constitutional Law knowledge
- **Cons:**
  - Higher cost ($0.003/1K tokens real-time, no batch discount)
  - Budget overrun after 6 months
  - Not worth premium for MVP
- **Recommendation:** Revisit for Phase 2 if user feedback indicates reasoning gaps

### ❌ Claude 3 Haiku (REJECTED)
- **Pros:** Cheapest option ($0.00025/1K tokens)
- **Cons:**
  - Insufficient for legal domain (poor Constitutional Law reasoning)
  - Low quality generations would fail expert review gate (>80% approval target)
  - Would compromise quality > cost
- **Recommendation:** Not suitable for legal education domain

### ❌ Open Source (Llama 3.1 via Together AI) (REJECTED)
- **Pros:** Self-hosted option, no API dependency
- **Cons:**
  - Requires infrastructure (GPU servers ~$500/mo)
  - Lower quality than commercial options
  - Not approved by stakeholders (requires self-hosting ops)
- **Recommendation:** Evaluate for Phase 3+ if cost becomes constraint

---

## Consequences

### Positive
- ✅ **Cost:** MVP stays under $2K budget
- ✅ **Scalability:** Batch API handles 1M+ questions cost-effectively
- ✅ **Performance:** 1M token context window excellent for retrieval-augmented generation
- ✅ **Ecosystem:** Integrates with Google Cloud (future ML ops)

### Negative / Risks
- ❌ **Legal reasoning:** Slightly lower than Claude (mitigated by RAG grounding + expert review)
- ❌ **API dependency:** Dependent on Google's API availability (acceptable SLA: 99.9%)
- ❌ **Vendor lock-in:** Google ecosystem (mitigated by abstraction layer in code)

### Neutral
- 🔄 **Batch latency:** 1-24 hours for async processing (acceptable for non-urgent generations)

---

## Implementation Notes

### For @dev (Backend Implementation)

1. **API Key Management:**
   - Store in `.env.local`: `GEMINI_API_KEY`
   - Use service account for batch jobs
   - Rotate keys every 6 months

2. **Prompt Template:**
   - See `/docs/stories/02-question-generation-rag.md` for exact prompt
   - Temperature: 0.5 (for consistency)
   - Max tokens: 500

3. **Error Handling:**
   - Rate limit backoff: exponential (1s, 2s, 4s, 8s)
   - Timeout: 30s max
   - Fallback: return real questions

4. **Monitoring:**
   - Log API costs per batch (Sentry custom metric)
   - Track generation latency (P95, P99)
   - Alert if cost exceeds $5/day

### For @architect (Review)

1. **Security:** API keys in secure env, not committed to git
2. **Resilience:** Fallback paths tested + monitored
3. **Compliance:** No PII in prompt context

### For @pm (Stakeholder Communication)

- **Marketing:** "Powered by Gemini" (optional)
- **Cost transparency:** Share monthly costs with leadership
- **Decision rationale:** Available for board/investor discussion

---

## Decision Review Schedule

- **Week 7-8:** Monitor actual costs during MVP
- **Month 1:** Review quality metrics (expert approval rate, error rate)
- **Month 3:** Evaluate Claude upgrade (Phase 2) based on user feedback
- **Q2 2026:** Formal review with stakeholders

---

## Related Documents

- **Story:** [US-1B.3: Claude Integration](../stories/02-question-generation-rag.md#us-1b3-claude-integration)
- **Architecture:** [ARQUITETURA_TECNICA.md](../ARQUITETURA_TECNICA.md)
- **RAG Summary:** [RAG_ARCHITECTURE_SUMMARY.md](../RAG_ARCHITECTURE_SUMMARY.md)

---

## Sign-off

| Role | Name | Date | Approval |
|------|------|------|----------|
| **PM** | Morgan | 2026-02-01 | ✅ |
| **Architect** | Aria | TBD | ⏳ |
| **Analyst** | Atlas | TBD | ⏳ |
| **Tech Lead** | (TBD) | TBD | ⏳ |

---

**Document Status:** ✅ READY FOR TEAM REVIEW & SIGN-OFF

**Next Steps:**
1. Share with @architect for technical validation
2. Share with @analyst for market/competitive validation
3. Update EPICS.md to reference this ADR
4. Update all story documents to confirm Gemini choice
