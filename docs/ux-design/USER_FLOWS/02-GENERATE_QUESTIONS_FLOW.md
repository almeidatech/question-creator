# ❓ Flow 2: Generate Questions (RAG-Powered)

**Timeline:** Week 3-5 | **Priority:** 🔴 CRITICAL | **Screens:** 3 | **LLM:** Gemini 1.5 Pro

---

## 📊 Flow Overview

```
┌──────────────────────────────────┐
│  SCREEN 2.1: Dashboard Home      │
│  (Generate Form + History)       │
└────────────┬─────────────────────┘
             │ Fill form & submit
             ▼
┌──────────────────────────────────┐
│  SCREEN 2.2: Generation Loading  │
│  (Spinner + RAG Context + Timer) │
└────────────┬─────────────────────┘
             │ Success
             ▼
┌──────────────────────────────────┐
│  SCREEN 2.3: Preview Questions   │
│  (Generated question cards)      │
└────────────┬─────────────────────┘
             │ Start Practice
             ▼
     Flow 3: Answer Question
```

---

## 🎨 Screen 2.1: Dashboard Home

### Visual Structure

```
┌─────────────────────────────────────────────────────┐
│ Header                                              │
│ ┌──────────────────────────────────────────────────┐│
│ │ Welcome back, João!                              ││
│ │ [Avatar] Profile button                          ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Quick Stats (3 columns)                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Questions    │ │ Accuracy     │ │ Current      │ │
│ │ Answered     │ │ Rate         │ │ Streak       │ │
│ │ 42           │ │ 78%          │ │ 7 days       │ │
│ │ +5% this week│ │ +2% trend ↑  │ │ Keep going! 🔥│
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                     │
│ Generate New Questions                              │
│ ┌─────────────────────────────────────────────────┐│
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ Domain: [v Direito Constitucional]         │││
│ │ │ > Direito Penal                            │││
│ │ │ > Direito Civil                            │││
│ │ └─────────────────────────────────────────────┘││
│ │                                                ││
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ Subject: [v Direitos Fundamentais]         │││
│ │ │ > Poder Judiciário                         │││
│ │ │ > Separação de Poderes                     │││
│ │ └─────────────────────────────────────────────┘││
│ │                                                ││
│ │ Difficulty:                                  ││
│ │ ○ Easy (1 star)                              ││
│ │ ◉ Medium (2 stars)                           ││
│ │ ○ Hard (3 stars)                             ││
│ │                                                ││
│ │ Number of Questions:                         ││
│ │ [5   ] (min: 1, max: 20)                     ││
│ │                                                ││
│ │ ☐ Prefer real exam questions                 ││
│ │   (prioritize from question bank)             ││
│ │                                                ││
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ [Generate Questions - PRIMARY BUTTON]      │││
│ │ └─────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Recent Questions (from history tab)                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │ Question #1  │ │ Question #2  │ │ Question #3  ││
│ │ Direitos...  │ │ Poderes...   │ │ Supremo...   ││
│ │ 8/10 rating  │ │ 9/10 rating  │ │ 7/10 rating  ││
│ │ [Preview]    │ │ [Preview]    │ │ [Preview]    ││
│ └──────────────┘ └──────────────┘ └──────────────┘│
└─────────────────────────────────────────────────────┘
```

### Components Used

| Component | Type | Count |
|-----------|------|-------|
| **DashboardHeader** | Organism | 1 |
| **StatsCard** | Organism | 3 |
| **QuestionGenerationPanel** | Organism | 1 |
| **DomainSelector** | Molecule | 1 |
| **SubjectSelector** | Molecule | 1 |
| **DifficultySelector** | Molecule | 1 |
| **Input** | Atom | 1 (count) |
| **Checkbox** | Atom | 1 |
| **Button** | Atom | 1 (generate) |
| **QuestionCard** | Organism | 3-5 |
| **ReputationBadge** | Molecule | 3-5 |

### State Management

```typescript
interface QuestionGeneratorState {
  // Form
  domain: string | null;
  subject: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;  // 1-20
  preferReal: boolean;

  // Submission
  loading: boolean;
  error?: string;

  // Results
  generatedQuestions: Question[];
  generationMetadata: {
    ragContextRetrieved: number;  // How many real questions used as context
    tokensUsed: number;
    generationTime: number;  // milliseconds
    temperature: 0.5;  // Legal domain consistency
    model: 'gemini-1.5-pro';
  };
}
```

### Form Validation

1. **Domain** - Required
2. **Subject** - Required (filtered by domain)
3. **Difficulty** - Default to medium
4. **Count** - 1-20 (default: 5)
5. **Prefer Real** - Optional (default: false)

---

## 🎨 Screen 2.2: Generation Loading

### Visual Structure

```
┌──────────────────────────────────────┐
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ⟳ Generating Questions...      │  │
│  │                                │  │
│  │ [████████████░░░░░░░░░░░░░░░░] │  │
│  │ 45%                            │  │
│  │                                │  │
│  │ Retrieving best exam context...│  │
│  │ (5-10 real questions loaded)   │  │
│  │                                │  │
│  │ Using Gemini 1.5 Pro           │  │
│  │ Temperature: 0.5 (consistent)  │  │
│  │                                │  │
│  │ Estimated time: 15 seconds     │  │
│  │                                │  │
│  │ [Cancel]                       │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### Components Used

| Component | Type | Count |
|-----------|------|-------|
| **Card** | Atom | 1 |
| **Spinner** | Atom | 1 |
| **ProgressBar** | Atom | 1 |
| **Text** | Atom | 5+ |
| **Button** | Atom | 1 (cancel) |

### State Management

```typescript
interface GenerationLoadingState {
  progress: number;  // 0-100%
  status: string;  // "retrieving context", "generating", "validating"
  ragContextCount: number;  // Real questions loaded
  cancelled: boolean;
  elapsedTime: number;  // milliseconds
}
```

### Backend Process (RAG Generation)

```
1. [RAG Query] User parameters → Database query
   WHERE source_type='real_exam' AND rag_eligible=true
   AND domain=X AND difficulty=Y
   → Retrieve 5-10 most similar questions

2. [Context Building] Real exam questions + prompt template
   → Create RAG context for Gemini

3. [Generation] Send to Gemini 1.5 Pro
   - Input tokens: ~500-800
   - Temperature: 0.5 (legal domain consistency)
   - Max output: 500 tokens per question
   - Cost: ~$0.005/1K tokens (batch pricing)

4. [Validation] Check AI-generated questions
   - Semantic mapping to topics
   - Reputation scoring (initial: 0)
   - Mark as source_type='ai_generated', rag_eligible=false

5. [Expert Review] Queue for 100% validation
   - Humans review before user exposure
   - Gate: Cannot be used until approved

6. [Success] Return questions to user
```

### API Interaction

```typescript
// POST /api/questions/generate
{
  domain_id: "uuid",
  subject_id: "uuid",
  difficulty: "medium",
  count: 5,
  prefer_real_exam: false,
  user_id: "uuid"
}

// Response 200 OK (streaming)
{
  success: true,
  questions: [
    {
      id: "uuid",
      questionText: "...",
      optionA: "...",
      optionB: "...",
      optionC: "...",
      optionD: "...",
      optionE: "...",
      correctAnswer: "c",
      sourceType: "ai_generated",
      ragEligible: false,
      reputation: {
        currentScore: 0,
        needsReview: true
      },
      generationMetadata: {
        ragContextUsed: 8,
        model: "gemini-1.5-pro",
        temperature: 0.5
      }
    },
    // ... more questions
  ],
  metadata: {
    totalTokensUsed: 3500,
    generationTimeMs: 12500,
    ragContextRetrieved: 8
  }
}

// Response 429 (Rate Limited)
{
  error: "Rate limit exceeded",
  retryAfter: 60
}
```

### User Actions

- ✅ Watch spinner and progress bar
- ✅ Read status updates
- ✅ Click "Cancel" to stop generation

---

## 🎨 Screen 2.3: Preview Generated Questions

### Visual Structure

```
┌────────────────────────────────────────┐
│ 5 Questions Generated                  │
│ Review before starting practice mode   │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Question #1                      │  │
│ │ Qual dos seguintes...            │  │
│ │                                  │  │
│ │ [NEW] [MEDIUM ⭐⭐]              │  │
│ │ Reputation: Pending Review       │  │
│ │                                  │  │
│ │ Generated with RAG grounding     │  │
│ │ (5 real exam questions used)     │  │
│ │ [Preview] [Remove]               │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Question #2                      │  │
│ │ ... (repeat)                     │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ ┌────────────────────────────────┐│  │
│ │ │ [Start Practice - PRIMARY]     ││  │
│ │ │ (Go to Flow 3: Answer Q)       ││  │
│ │ └────────────────────────────────┘│  │
│ │                                  │  │
│ │ [Generate More Questions]        │  │
│ │ [Back to Dashboard]              │  │
│ └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Components Used

| Component | Type | Count |
|-----------|------|-------|
| **CardGridLayout** | Template | 1 |
| **QuestionCard** | Organism | N |
| **ReputationBadge** | Molecule | N |
| **DifficultyBadge** | Molecule | N |
| **SourceBadge** | Molecule | N |
| **Button** | Atom | 3 |
| **Text** | Atom | 5+ |

### State Management

```typescript
interface PreviewQuestionsState {
  questions: Question[];
  selectedQuestion: string | null;
  saveToFavorites: Record<string, boolean>;
  showDetailedView: boolean;
}
```

---

## ⏱️ Generation Timing

| Step | Time | Notes |
|------|------|-------|
| RAG Query | 100-200ms | Database query for context |
| Gemini API | 8-15s | LLM generation |
| Validation | 500-1000ms | Check & score |
| Total | ~10-15s | User sees "15s estimated" |

---

## 🧪 Testing Checklist

- [ ] Domain selector filters correctly
- [ ] Subject selector updates based on domain
- [ ] Difficulty selector changes preview
- [ ] Count input accepts 1-20 only
- [ ] Prefer real checkbox toggles
- [ ] Generate button disabled until domain + subject selected
- [ ] Loading screen shows progress
- [ ] Progress updates during generation
- [ ] Cancel button stops generation
- [ ] Successfully generated questions display
- [ ] Preview questions show correct badges
- [ ] "Start Practice" goes to Flow 3
- [ ] "Generate More" stays on same form
- [ ] Error handling for rate limits
- [ ] Error handling for API failures

---

## 📊 Success Metrics

- ✅ Generation completes in <20 seconds
- ✅ Questions pass expert review (100% validation)
- ✅ RAG context improves quality (verified by human review)
- ✅ User completion rate: >70% proceed to practice
- ✅ Error rate: <1% (failures, timeouts)

---

**Last Updated:** 2026-02-01 | **Status:** ✅ Ready for Development

