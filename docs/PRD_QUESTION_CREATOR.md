# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Sistema de Questões Inéditas (Question Creator)

## MVP v1.0

**Document Status:** Ready for Development
**Version:** 1.0
**Last Updated:** January 31, 2026
**Prepared By:** Product Management
**Domain Focus:** Constitutional Law (Direito Constitucional)

---

## EXECUTIVE SUMMARY

The **Question Creator** is an intelligent, AI-augmented platform that generates and manages personalized study questions for legal education, primarily targeting Constitutional Law preparation. The system combines a battle-tested repository of 63,068+ real exam questions (CESPE/FCC) with AI generation for novel content, validated through a transparent community-driven reputation system.

**Key Value Propositions:**

- Infinite question availability via intelligent AI generation + real exam bank hybrid approach
- Transparent 0-10 reputation system showing question reliability
- Personalized learning paths based on student performance data
- Data-driven difficulty calibration from real student attempts
- Community-driven quality assurance with expert validation

**Target Launch:** 30-90 days from project start
**Initial User Base:** Law students (OAB/concurso prep), educators, prep course institutions

---

## 1. PRODUCT VISION & GOALS

### 1.1 Vision Statement

To democratize access to high-quality, personalized study materials by creating an intelligent ecosystem where AI-generated questions are validated through community collaboration, eliminating the friction of manual question sourcing while guaranteeing content reliability through transparent, data-driven quality metrics.

### 1.2 Mission Statement

Provide law students and educators with unlimited, trustworthy, personalized practice questions through an intelligent platform that intelligently combines real exam questions with AI-generated content, validated by community expertise and measurable quality indicators.

### 1.3 Strategic Goals (MVP)

| # | Goal | Target | Timeline |
| --- | --- | --- | --- |
| **G1** | Validate AI generation + community validation model | 50+ active users, >7/10 satisfaction | 30 days |
| **G2** | Establish transparent reputation system trust | 80%+ users trust quality ratings | 30 days |
| **G3** | Prove personalization-analytics feedback loop | 10+ feedback submissions, 0 critical errors | 45 days |
| **G4** | De-risk AI content accuracy | Expert validation 100% of AI questions | 30 days |
| **G5** | Prepare domain expansion infrastructure | Enable rapid onboarding of 6 additional domains | 60 days |

### 1.4 Success Definition

MVP is successful when:

- ✅ 50+ active users with 70%+ 1-week retention
- ✅ 500+ total questions attempted across user base
- ✅ 99%+ system uptime and zero critical bugs
- ✅ Zero factually incorrect Constitutional Law content in production
- ✅ 80%+ user satisfaction on content quality
- ✅ Clear evidence of personalization value (weak-area identification effective)

---

## 2. MARKET & USER ANALYSIS

### 2.1 Target User Personas

#### Persona 1: **Lucas** - Law Student (OAB Preparation)

- **Profile:** 25-year-old undergraduate preparing for Brazilian bar association exam
- **Pain Points:** Spends 2+ hours daily searching for quality practice questions across fragmented sources; worried about learning from incorrect material
- **Goals:** Pass OAB exam on first attempt; identify weak Constitutional topics before exam day
- **Needs:** Unlimited practice material, confidence in accuracy, performance tracking
- **Device:** Desktop (80%), Mobile (20%)
- **Engagement Model:** Daily 30-min study sessions, 5-6 days/week

#### Persona 2: **Professor Helena** - Law Educator

- **Profile:** 45-year-old Constitutional Law professor at private law school
- **Pain Points:** Manual question curation is time-consuming; difficult to identify student performance bottlenecks across cohort
- **Goals:** Provide students with unlimited practice material; monitor class comprehension; reduce grading workload
- **Needs:** Customizable question lists, class analytics dashboard, integration with existing curriculum
- **Device:** Desktop (90%), Mobile (10%)
- **Engagement Model:** Weekly question list generation, monthly performance reviews

#### Persona 3: **Bruno** - Prep Course Coordinator

- **Profile:** 50-year-old director of competitive exam preparation course (OAB + Concursos)
- **Pain Points:** High cost of licensing question banks; inconsistent quality across sources; no mechanism for content improvement
- **Goals:** Offer institutional licensing for students; demonstrate value through analytics; compete with larger prep courses
- **Needs:** Bulk question generation, institutional dashboard, customizable difficulty parameters, API integration
- **Device:** Desktop primary
- **Engagement Model:** Administrative access, monthly institutional reports

#### Persona 4: **Dr. Ricardo** - Constitutional Law Expert (Reviewer)

- **Profile:** 55-year-old retired federal judge + law school advisor
- **Pain Points:** Wants to contribute to educational excellence; current platforms don't offer transparent contribution mechanisms
- **Goals:** Validate AI-generated questions; build reputation as expert contributor; help students learn accurately
- **Needs:** Clear review workflow, contribution tracking, transparent recognition system
- **Device:** Desktop
- **Engagement Model:** Weekly review queue (5-10 questions), monthly contribution report

### 2.2 User Segments & Markets

| Segment | Size Estimate | Use Case | Priority |
| --- | --- | --- | --- |
| Individual Law Students | 100k+ | OAB + Concurso prep | PRIMARY |
| Law Educators/Professors | 8k+ | Classroom supplementation | SECONDARY |
| Prep Course Institutions | 200+ | Institutional licensing | SECONDARY |
| Community Reviewers | 500+ | Question validation | TERTIARY |

### 2.3 Market Opportunity

- **TAM:** 500k law students in Brazil annually
- **SAM:** 150k students actively seeking digital practice tools
- **SOM (V1):** 5k students in first 12 months

---

## 3. USER STORIES (DETAILED)

### 3.1 Epic: Question Generation & Discovery

#### US-1.1: Generate Questions by Parameters

**As a** student
**I want to** generate a custom list of questions with specific parameters (subject, difficulty)
**So that** I can practice targeted content relevant to my needs

**Acceptance Criteria:**

- [ ] User selects subject from dropdown (Constitutional Law sub-topics)
- [ ] User selects question count (5, 10, or 20 questions)
- [ ] User selects difficulty level (easy, medium, hard)
- [ ] System returns question list within 30 seconds (P95 latency)
- [ ] Questions are never repeated in same session
- [ ] System indicates source: "Real exam" vs "AI-generated"

**Technical Details:**

- Query database for real exam questions matching filters first
- If insufficient real questions, supplement with AI-generated questions
- Mark questions with source badge (CESPE/FCC logo vs "AI-Assisted")
- Prevent repetition via session-state tracking

**Priority:** P0 (MVP Critical)

---

#### US-1.2: View Individual Question with Metadata

**As a** student
**I want to** view a question with its correct answer, commentary, and reputation score
**So that** I can learn from the question and understand its reliability

**Acceptance Criteria:**

- [ ] Question text displays clearly
- [ ] All answer options (A-E) displayed
- [ ] Correct answer highlighted after selection
- [ ] Step-by-step commentary explaining reasoning
- [ ] Reputation score (0-10) displayed prominently
- [ ] Visual warning badge if reputation < 5 ("newly created—verify with professor")
- [ ] Metadata shows: question source (exam board), exam year, topic

**Technical Details:**

- Fetch question + related metadata from database
- Load pre-computed commentary (from expert review or LLM)
- Fetch current reputation score from reputation table
- Display badges conditionally based on reputation threshold

**Priority:** P0 (MVP Critical)

---

#### US-1.3: View Real Exam Source Information

**As a** student
**I want to** see details about where a real exam question came from
**So that** I have confidence in practicing with battle-tested material

**Acceptance Criteria:**

- [ ] For real exam questions, display: exam board (CESPE/FCC), exam year, position/role
- [ ] Display statement: "This question appeared on [Banca] [Year] [Exam Name]"
- [ ] Link to exam metadata if available (optional in V1)
- [ ] Reputation score locked at 10 for real exam questions (never below)

**Technical Details:**

- Store source metadata in questions table: exam_board, exam_year, exam_type
- Display metadata in UI component below question text
- Set default reputation = 10 for all imported real questions

**Priority:** P0 (MVP Critical)

---

#### US-1.4: Search Questions by Topic

**As a** student
**I want to** search for questions related to a specific Constitutional Law topic
**So that** I can focus on areas I need to strengthen

**Acceptance Criteria:**

- [ ] Search field accepts keyword (e.g., "direitos fundamentais", "separação de poderes")
- [ ] System returns questions matching topic via semantic search
- [ ] Results sorted by relevance + reputation score
- [ ] User can filter results by difficulty
- [ ] Search returns results in < 2 seconds

**Technical Details:**

- Implement semantic search using embeddings
- Questions indexed in vector database during ingestion
- Use RAG system for relevance ranking
- Fall back to keyword search if semantic search unavailable

**Priority:** P1 (Post-MVP, Week 2)

---

### 3.2 Epic: Question Reputation & Quality Feedback

#### US-2.1: Report Problem with Question

**As a** student
**I want to** report a problem with a question's accuracy or clarity
**So that** the system can improve content quality

**Acceptance Criteria:**

- [ ] User clicks "Report problem" link on question
- [ ] Modal opens with free-text field (500 char max)
- [ ] User selects problem category: incorrect answer, unclear wording, legal error, other
- [ ] User submits feedback
- [ ] System confirms: "Thank you—our team will review this"
- [ ] Feedback routed to admin review queue within 5 minutes

**Technical Details:**

- Create feedback record in database with: question_id, user_id, category, text, timestamp
- Trigger email notification to admin review queue
- Track feedback count per question (display internally)
- Flag questions with 3+ feedback reports for immediate expert review

**Priority:** P0 (MVP Critical)

---

#### US-2.2: View Question Reputation Score & History

**As a** student
**I want to** understand why a question has a specific reputation score
**So that** I know how validated/reliable the question is

**Acceptance Criteria:**

- [ ] Reputation score displayed as 0-10 number + visual bar
- [ ] Tooltip explains score: "This question has been reviewed X times with feedback"
- [ ] For real exam questions: "This question appeared on actual exam (10/10 reputation)"
- [ ] For AI-generated questions: "This AI-generated question has been validated Y times"
- [ ] No explanation needed for < 5 score ("Still being validated")

**Technical Details:**

- Display reputation score prominently on question card
- Include metadata: validation count, feedback summary (internal data)
- Show different copy based on source + reputation

**Priority:** P0 (MVP Critical)

---

#### US-2.3: Expert Review & Validate Questions

**As a** Constitutional Law expert reviewer
**I want to** review flagged AI-generated questions and validate accuracy
**So that** I ensure only accurate content reaches students

**Acceptance Criteria:**

- [ ] Reviewer sees admin queue of questions pending review
- [ ] For each question: original text, student feedback, AI reasoning (if available)
- [ ] Reviewer selects: approve, request revision, reject
- [ ] If approved: reputation jumps to 7/10; question available to all users
- [ ] If rejected: question disabled; template for correction provided
- [ ] Reviewer can add notes visible to AI system for future improvement
- [ ] Review workflow takes < 5 minutes per question

**Technical Details:**

- Create admin/reviewer role with access to review queue
- Build review interface showing: question, feedback summary, decision buttons
- Update reputation + status based on decision
- Log review decision for improvement feedback loop

**Priority:** P0 (MVP Critical)

---

### 3.3 Epic: Student History & Personalization

#### US-3.1: Track Questions Answered

**As a** student
**I want to** see my history of answered questions
**So that** I avoid repeating questions and track my progress

**Acceptance Criteria:**

- [ ] Dashboard shows "Total questions attempted: X"
- [ ] Breakdown by subject (Constitutional Law sub-topics)
- [ ] Breakdown by difficulty (easy/medium/hard attempts)
- [ ] "Accuracy by subject" showing percentage correct for each topic
- [ ] History persists across sessions (user account required)
- [ ] User can filter history by date range or subject

**Technical Details:**

- Create user_question_history table: user_id, question_id, selected_answer, correct, timestamp
- Build dashboard showing aggregated stats
- Calculate accuracy percentage per subject in real-time

**Priority:** P0 (MVP Critical)

---

#### US-3.2: Prevent Question Repetition

**As a** student
**I want to** ensure system doesn't show me questions I've already answered
**So that** I use study time efficiently practicing new content

**Acceptance Criteria:**

- [ ] When generating question list, system excludes user's previously answered questions
- [ ] User can override: "Show me all questions for this topic (including ones I've done)"
- [ ] System indicates in history: "You answered this on [date]—accuracy: [correct/incorrect]"

**Technical Details:**

- Query user_question_history before returning question list
- Filter out previously answered questions from results
- Store session context to enable override option

**Priority:** P0 (MVP Critical)

---

#### US-3.3: View Weak Areas Identification

**As a** student
**I want to** see which Constitutional Law topics I need to improve
**So that** I can focus my study time strategically

**Acceptance Criteria:**

- [ ] Dashboard shows "Weak areas" section
- [ ] Lists topics where accuracy < 60% (configurable threshold)
- [ ] Shows: topic name, your accuracy %, number of questions attempted
- [ ] Recommendation: "Practice [topic]—you're at 45% accuracy" with quick link to generate list
- [ ] Updates in real-time as user answers questions

**Technical Details:**

- Calculate accuracy per topic from user_question_history
- Identify topics with < 60% accuracy
- Rank by lowest accuracy first
- Include question count to show confidence level

**Priority:** P1 (Week 1 Post-MVP)

---

### 3.4 Epic: Analytics & Success Tracking

#### US-4.1: View Personal Dashboard

**As a** student
**I want to** see my overall study progress on one dashboard
**So that** I understand my performance trajectory

**Acceptance Criteria:**

- [ ] Dashboard displays:
  - Total questions attempted (all-time)
  - Overall accuracy percentage
  - Questions attempted this week
  - Topics by accuracy (bar chart or list)
  - Weak areas (< 60% accuracy)
- [ ] "Next actions" recommendations
- [ ] Data refreshes in real-time

**Technical Details:**

- Query user_question_history to compute stats
- Aggregate by time period (all-time, week, month)
- Render as dashboard with charts/cards

**Priority:** P0 (MVP Critical)

---

#### US-4.2: View Institution Dashboard (Admin)

**As a** prep course administrator
**I want to** see aggregated analytics for my student cohort
**So that** I can identify topics where my students struggle

**Acceptance Criteria:**

- [ ] Admin dashboard shows:
  - Total students in cohort
  - Average accuracy by topic (Constitutional Law sub-topics)
  - Total questions attempted by cohort
  - Trending topics (questions most commonly attempted)
  - Student list with individual accuracy percentages (clickable for detail)
- [ ] Data exportable to CSV
- [ ] Can filter by date range, topic, student group

**Technical Details:**

- Build admin view with authorization checks
- Aggregate question_history across multiple users
- Implement export-to-CSV functionality

**Priority:** P2 (Institutional feature, post-MVP)

---

### 3.5 Epic: CSV Data Import & Ingestion

#### US-5.1: Ingest Real Exam Question CSV Files

**As a** system administrator
**I want to** load 63,068 real exam questions from CSV files into the database
**So that** the system has a complete question bank ready for users

**Acceptance Criteria:**

- [ ] CSV files for all 7 domains processed (Constitutional Law primary; others for future)
- [ ] All 13,917 Constitutional Law questions successfully ingested
- [ ] All fields parsed correctly: question_text, answer_options (A-E), correct_answer, exam_board, exam_year
- [ ] Duplicate detection: identical questions merged with single database record
- [ ] Deduplication report generated (# duplicates found, merged records)
- [ ] Import process runs non-blocking (background job)
- [ ] Data quality validation: zero rows lost, all required fields populated
- [ ] Progress tracking: import status visible in admin interface

**Technical Details:**

- Create CSV parsing ETL pipeline
- Validate data: required fields present, answer options 2-5 count
- Normalize text: trim whitespace, standardize encoding
- Deduplication logic: fuzzy match on question_text (consider variations)
- Store with metadata: import_date, source_file, data_version
- Rollback capability if corruption detected

**Priority:** P0 (MVP Blocker—no questions without this)

---

#### US-5.2: Map Questions to Topic Taxonomy

**As a** a system
**I want to** automatically extract Constitutional Law topics from imported questions
**So that** users can filter/search by topic

**Acceptance Criteria:**

- [ ] Implement topic taxonomy: 20-30 Constitutional Law sub-topics (e.g., direitos fundamentais, separação de poderes, etc.)
- [ ] Use keyword matching or semantic analysis to assign questions to topics
- [ ] Manual validation: expert review top 100 questions to verify topic mapping accuracy
- [ ] Each question linked to 1-3 topics (multi-tagging supported)
- [ ] Topic-question mapping stored for search/filter capability

**Technical Details:**

- Create topics table with Constitutional Law taxonomy
- Implement keyword extraction from question text
- Build question_topic junction table for many-to-many mapping
- Use semantic embeddings for topic classification (optional enhancement)

**Priority:** P1 (Week 1 Post-MVP, required for search)

---

### 3.6 Epic: AI Question Generation & RAG

#### US-6.1: Generate Novel AI Question on Demand

**As a** student
**I want to** generate a new, never-before-seen question on a topic when the question bank doesn't have sufficient variety
**So that** I can practice unlimited content

**Acceptance Criteria:**

- [ ] System receives parameter request: subject, difficulty, topic (optional)
- [ ] If real exam questions available for parameters, return those first
- [ ] If insufficient real questions, trigger AI generation pipeline
- [ ] Generated question returns within 30 seconds (P95)
- [ ] Generated question includes: text, 5 answer options, correct answer, brief commentary
- [ ] Generated question marked as "AI-Assisted" with reputation 0/10 initially
- [ ] Question not shown to users until expert review (if policy requires)

**Technical Details:**

- Implement LLM API call with Constitutional Law prompt
- Use RAG system: ground generation in 63k+ existing questions as reference
- Prompt engineering: ensure legal accuracy, proper terminology, realistic difficulty
- Error handling: fallback to "Sorry, couldn't generate question. Try another topic"
- Queue AI-generated questions for expert review before user exposure

**Priority:** P1 (Week 2, non-blocking for MVP launch)

---

#### US-6.2: Build RAG System from Question Bank

**As a** an AI system
**I want to** use the real exam question bank as a knowledge base for generating new questions
**So that** AI-generated questions match real exam patterns without contaminating the corpus

**Acceptance Criteria:**

**MVP (Week 3 - Full-Text Search):**
- [ ] RAG retrieval using PostgreSQL full-text search (FTS)
- [ ] Semantic search retrieves 5-10 similar real exam questions (by keyword + difficulty)
- [ ] Retrieval latency < 100ms (local PostgreSQL)
- [ ] Filtered by topic + difficulty + exam_board
- [ ] LLM uses retrieved real questions to inform generation (ground in real patterns)
- [ ] Real exam questions are SOLE source for RAG (no AI-generated questions in corpus)

**Phase 2 (Week 4 - Semantic Search with pgvector):**
- [ ] All 13,917 Constitutional Law questions vectorized (embeddings computed)
- [ ] pgvector embeddings stored in Supabase PostgreSQL (no separate vector DB)
- [ ] Hybrid search: FTS + semantic similarity scoring
- [ ] RAG retrieval latency < 2 seconds (FTS + vector ranking)
- [ ] Increased RAG context: 10 similar questions retrieved
- [ ] Source filtering: ONLY real_exam type questions used for RAG

**Technical Details - MVP:**
- Use PostgreSQL `tsvector` (full-text search) on question text + topics
- Query: `SELECT * FROM questions WHERE source_type='real_exam' AND to_tsvector('portuguese', text) @@ plainto_tsquery(...)`
- Filter by: difficulty, topic_id, exam_board
- Redis caching: Cache generated lists for 24h to reduce repeated RAG calls
- **CRITICAL:** Implement source_type filter to prevent AI-generated questions from influencing new generations

**Technical Details - Phase 2:**
- Use OpenAI/Cohere embedding model to create vectors for all real exam questions
- Store embeddings in pgvector extension (PostgreSQL native, no extra infrastructure)
- Hybrid scoring: Combine BM25 (FTS relevance) + cosine similarity (vector relevance)
- Update RAG query to retrieve top-5 (FTS) + top-5 (vector) = top-10 merged results
- Monitor embedding quality: Ensure retrieved questions semantically similar to request

**Priority:** P1 Week 2 (MVP: FTS) → Week 4 Phase 2 (pgvector upgrade)

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 User Flows & Workflows

#### Flow 1: Student Question Generation Workflow

```text
1. Student logs in (or continues session)
2. Dashboard displays recent stats + weak areas
3. Student clicks "Generate Question List" button
4. Selection Modal opens:
   - Subject dropdown (Constitutional Law sub-topics)
   - Difficulty slider (easy → medium → hard)
   - Question count radio (5 / 10 / 20)
   - [Generate] button
5. System processes:
   - Query question database for real exam questions matching filters
   - If insufficient real questions, trigger AI generation for gaps
   - Deduplicate against user's history
6. Question List displayed:
   - Each question card shows: topic, difficulty, source badge (Real/AI)
   - Reputation score (0-10) with visual bar
7. Student selects a question
8. Question detail view displays:
   - Question text + answer options (A-E)
   - Student selects answer
   - [Submit] button
9. System displays:
   - Correct answer highlighted
   - Step-by-step commentary
   - Student's accuracy on this topic (e.g., "You've answered 8/15 on this topic—53% accuracy")
   - [Report Problem] link (if student thinks answer is wrong)
   - [Next Question] button
10. Student marks question as "helped" or "needs review"
11. System logs attempt to user history + updates dashboard stats
12. Loop back to step 7 until student exits
```

#### Flow 2: Expert Question Review Workflow

```text
1. Constitutional Law expert logs in (Reviewer role)
2. Dashboard shows review queue:
   - Questions flagged by students (problems reported)
   - New AI-generated questions awaiting validation
3. Expert clicks question to review
4. Review interface displays:
   - Question text + answer options + student feedback
   - Expert commentary field
5. Expert reviews & selects decision:
   - [Approve] → Reputation jumps to 7/10, question live to all users
   - [Request Revision] → Question stays at 0/10, notes sent to AI team
   - [Reject] → Question disabled, template provided for AI improvement
6. Expert adds notes (optional) explaining reasoning
7. System logs review decision + updates reputation
8. Queue refreshes, next question displayed
```

#### Flow 3: Student Analytics View Workflow

```text
1. Student navigates to "My Progress" dashboard
2. System displays:
   - Total questions attempted (all-time): "127 questions"
   - Overall accuracy: "62%"
   - Chart: Accuracy by topic (bar chart or list)
   - Weak areas highlighted (red): "Constitutional Control (45%), Separation of Powers (51%)"
3. Student clicks on weak area
4. Topic detail view shows:
   - All questions attempted on this topic (history)
   - Accuracy: 5/11 correct
   - [Practice this topic] button → triggers question generation for that topic
5. Student selects [Practice this topic]
6. System auto-populates parameters (subject = selected topic, difficulty = medium/hard)
7. Proceeds with Flow 1 (question generation)
```

### 4.2 Core Features Specification

#### Feature 1: On-Demand Question Generation

**Description:** System generates parameterized question lists combining real exam questions + AI-generated fallback

**Inputs:**

- Subject (Constitutional Law sub-topic)
- Difficulty (easy/medium/hard)
- Question count (5/10/20)
- Optional: specific topic focus

**Processing:**

1. Query database: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? LIMIT (count)`
2. If `results.count >= 0.9 * requested_count`: Return all real questions
3. Else: Supplement with AI-generated questions via LLM API
4. Deduplicate against user's history
5. Shuffle results
6. Return with source badges

**Outputs:**

- Question list (5-20 items)
- Each item includes: question_id, text, answer_options, source (real/ai), reputation_score, topic

**Success Criteria:**

- Zero duplicate questions
- 80%+ of lists fulfilled with real exam questions
- Generation completes in < 30 seconds (P95)

---

#### Feature 2: CSV Data Import Pipeline

**Description:** ETL process ingests 63,068 exam questions from CSV files into normalized database

**Inputs:**

- 13 CSV files (one per domain/exam board combination)
- Structure: [question_text | optionA | optionB | optionC | optionD | optionE | correct_answer | exam_board | exam_year]

**Processing:**

1. File validation: Check encoding (UTF-8), row count, required columns
2. Row parsing: Extract fields, handle special characters, normalize whitespace
3. Deduplication: Fuzzy match on question_text; merge duplicates
4. Data quality: Validate all required fields present, answer options 2-5 count
5. Topic mapping: Extract keywords → assign to Constitutional Law taxonomy
6. Database insert: Batch insert with transaction rollback on error
7. Indexing: Build search indexes (full-text, semantic embeddings)

**Outputs:**

- questions table populated (13,917 Constitutional Law rows)
- topic_mappings (question → topics junction table)
- Import report (rows inserted, duplicates found, errors encountered)

**Success Criteria:**

- 100% of Constitutional Law questions ingested (0 data loss)
- All required fields populated
- Duplicate detection working (report provided)
- Data searchable & filterable by topic
- Import process non-blocking to user queries

---

#### Feature 3: Question Reputation System

**Description:** 0-10 transparent quality score visible to users, updated via expert review + feedback

**Score Calculation:**

- **Real exam questions:** Default = 10 (battle-tested)
- **AI-generated questions:** Start = 0
  - After 20 student attempts with zero negative feedback: 4/10
  - After expert approval: 7-8/10
  - After 3-6 months active use with no issues: 9-10/10
  - Problem reports: Temporarily flag, pause distribution until reviewed

**Display:**

- Score shown as: numeric (0/10) + visual bar + color coding (red < 5, yellow 5-7, green 8-10)
- Visual warning badge for score < 5: "Newly created question—verify with professor"
- Tooltip explanation: "This question has been reviewed X times"

**Update Triggers:**

- Expert review decision (immediate update)
- Threshold of problem reports (flag for review)
- Time-based progression (after 3-6 months active use)

---

#### Feature 4: Student History & Personalization

**Description:** Track student question attempts, calculate accuracy by topic, enable personalization

**Data Collected:**

- user_id, question_id, selected_answer, correct_answer, timestamp, response_time
- Aggregate: total questions, accuracy %, accuracy by topic, weak areas

**Personalization Logic:**

1. Prevent repetition: Exclude previously answered questions from generated lists
2. Weak area identification: Calculate accuracy per topic; topics < 60% marked as weak
3. Recommendations: "Practice [topic]—you're at 45% accuracy"
4. Progress tracking: Dashboard shows accuracy trajectory over time

**Privacy & Transparency:**

- User can view all data collected about their learning
- User can export or delete history (GDPR compliance)
- Analytics used only for personalization, not shared with third parties without consent

---

#### Feature 5: Difficulty Calibration (Initial Version)

**Description:** Auto-adjust question difficulty ratings based on real student performance data

**Mechanism:**

1. Collect success rate data per question (% of students who answered correctly)
2. After N=20 student attempts: Calculate empirical difficulty
3. If empirical difficulty conflicts with intended difficulty: Flag for review
4. Update difficulty rating based on data

**Display:**

- Show to users: "X% of students answered this question correctly"
- Use as ranking factor: Weight reputation + difficulty in recommendation algorithm

**Success Criteria:**

- Difficulty ratings become increasingly accurate over time
- Questions reclassified when data contradicts initial assessment

---

#### Feature 6A: RAG System (Full-Text Search MVP → pgvector Phase 2)

**Description - MVP (Week 3):** PostgreSQL full-text search retrieves real exam questions as context for AI generation, preventing corpus contamination

**MVP Processing:**
1. Student requests: "Generate 5 medium difficulty Constitutional Law questions"
2. System checks database: `SELECT * FROM questions WHERE source_type='real_exam' AND difficulty='medium'`
3. Full-text search ranking filters by relevance
4. Retrieve top-5-10 real questions matching criteria
5. Claude API receives: [prompt + FTS-retrieved real questions as reference]
6. Claude generates new questions **grounded in real exam patterns**
7. Generated question marked: `source_type='ai_generated'` + reputation=0/10
8. **CRITICAL:** Generated question is **NOT** added back to RAG corpus

**MVP Success Criteria:**
- Real exam questions 100% of RAG corpus (no AI-generated questions in retrieval)
- FTS latency < 100ms
- Generated questions diversity improved (patterns matched from real exams)
- Zero corpus contamination (fiction doesn't influence future fiction)

---

**Phase 2 Upgrade (Week 4):** pgvector hybrid search (semantic + full-text)
- Add OpenAI embeddings for all 13.9k Constitutional Law questions
- Hybrid retrieval: FTS results + vector similarity top results
- Increased context: 10 questions (instead of 5)
- Latency: < 2 seconds (acceptable for 2-3s total generation time)
- Same corpus isolation: source_type filtering prevents AI contamination

---

#### Feature 6B: Feedback & Problem Reporting

**Description:** Students can report issues with questions; system routes to expert review

**Reporting Process:**

1. User clicks "Report problem" on question
2. Modal presents:
   - Category dropdown: Incorrect answer | Unclear wording | Legal error | Other
   - Free-text field (500 chars max): Describe the issue
3. User submits
4. System creates feedback record + sends to admin queue
5. Expert reviews within 7 days (SLA)
6. Expert decision updates question reputation + status

**Abuse Prevention:**

- Track feedback patterns: Flag users submitting multiple problems for same question
- V1 keeps feedback free-text, visible to admins but not used algorithmically until validated
- Future versions: Add reputation to feedback submitter (incentivize quality reporting)

**Critical for RAG System:**
- Feedback on AI-generated questions NEVER influences RAG corpus retrieval
- All reputation changes logged with source attribution
- Monthly audit: Verify no contamination of source_type='real_exam' data

---

### 4.3 Data Model (Core Tables)

```sql
-- Core Tables
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role ENUM('student', 'educator', 'reviewer', 'admin'),
  created_at TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE questions (
  question_id UUID PRIMARY KEY,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  exam_board VARCHAR(50), -- CESPE, FCC, AI-Generated
  exam_year INT,
  source_type ENUM('real_exam', 'ai_generated') DEFAULT 'ai_generated',
  difficulty ENUM('easy', 'medium', 'hard'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE topics (
  topic_id UUID PRIMARY KEY,
  topic_name VARCHAR(255) UNIQUE,
  domain VARCHAR(50), -- Constitutional Law, Administrative Law, etc.
  description TEXT
);

CREATE TABLE question_topics (
  question_id UUID REFERENCES questions(question_id),
  topic_id UUID REFERENCES topics(topic_id),
  PRIMARY KEY (question_id, topic_id)
);

CREATE TABLE question_reputation (
  question_id UUID REFERENCES questions(question_id) PRIMARY KEY,
  current_score INT DEFAULT 0,
  total_attempts INT DEFAULT 0,
  problem_reports INT DEFAULT 0,
  expert_validations INT DEFAULT 0,
  last_updated TIMESTAMP,
  status ENUM('active', 'under_review', 'disabled') DEFAULT 'active'
);

CREATE TABLE user_question_history (
  history_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  question_id UUID REFERENCES questions(question_id),
  selected_answer CHAR(1),
  is_correct BOOLEAN,
  response_time_ms INT,
  attempted_at TIMESTAMP
);

CREATE TABLE question_feedback (
  feedback_id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions(question_id),
  user_id UUID REFERENCES users(user_id),
  category ENUM('incorrect_answer', 'unclear_wording', 'legal_error', 'other'),
  feedback_text TEXT,
  submitted_at TIMESTAMP,
  status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
  reviewer_notes TEXT,
  resolved_at TIMESTAMP
);

CREATE TABLE question_reviews (
  review_id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions(question_id),
  reviewer_id UUID REFERENCES users(user_id),
  decision ENUM('approve', 'request_revision', 'reject'),
  notes TEXT,
  reviewed_at TIMESTAMP
);
```

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance Requirements

| Requirement | Target | Rationale |
| --- | --- | --- |
| Question Generation Latency | < 30 seconds (P95) | User should not wait > 30s for list |
| Question Detail Load | < 1 second (P99) | Smooth user experience |
| Search Latency | < 2 seconds (P95) | Acceptable search speed |
| Dashboard Load | < 3 seconds (P95) | Analytics view responsive |
| CSV Import Rate | 50,000 questions/hour | Ingest 63k in < 1.5 hours |
| Concurrent Users | 1,000 simultaneous | MVP scale: 50-100 active users |
| Question Generation Throughput | 10 questions/second | Handle multiple users generating simultaneously |

### 5.2 Reliability & Uptime

| Requirement | Target |
| --- | --- |
| System Uptime | 99%+ (30-day rolling) |
| Data Loss | Zero (transactional integrity) |
| Critical Bug Escape | Zero in MVP launch |
| Question Accuracy | 100% Constitutional Law correctness |
| Recovery Time (RTO) | < 1 hour after incident |
| Recovery Point (RPO) | < 5 minutes (hourly backups minimum) |

### 5.3 Scalability

- **User growth:** Handle 10x user growth (500 → 5,000) without performance degradation
- **Question base:** Expand from 13.9k (Constitutional Law) to 63.9k (all domains) with no code changes
- **Concurrent requests:** Support 1,000 simultaneous users with < 2 second latency
- **Data volume:** Handle 1M+ user question attempts without query performance issues

### 5.4 Security & Privacy

| Requirement | Implementation |
| --- | --- |
| Authentication | OAuth 2.0 (Google/GitHub) or email + password |
| Authorization | Role-based access control (student/educator/reviewer/admin) |
| Data encryption | TLS in transit; AES-256 at rest for sensitive data |
| GDPR compliance | User can export/delete personal data; transparent tracking |
| Injection prevention | Parameterized queries; input validation |
| Rate limiting | API rate limits (100 req/min per user) to prevent abuse |
| Session management | 24-hour session timeout; secure cookie flags |

### 5.5 Accessibility

- WCAG 2.1 Level AA compliance (contrast, keyboard navigation, screen reader support)
- Mobile-responsive design (desktop-first, mobile-friendly)
- Clear typography: readable font size (16px minimum), sufficient line spacing
- Color contrast: 4.5:1 ratio for text

### 5.6 Data Quality & Integrity

- **Duplicate detection:** Fuzzy matching on question text during CSV import
- **Validation:** All questions must have: text, 5 answer options, correct answer
- **Consistency:** Foreign key constraints prevent orphaned records
- **Audit trail:** All changes logged (user, timestamp, before/after values)

---

## 6. SUCCESS METRICS (KPIs)

### 6.1 Tier 1: Quality Jurídica (CRITICAL - MVP Gating)

| Metric | MVP Target | Phase 2 Target | Measurement | Cadence |
| --- | --- | --- | --- | --- |
| **Expert Approval Rate** | >80% first review | >85% first review | % questions approved in single validation | Semanal |
| **Error Rate** | <5% errors found | <3% errors | Erros encontrados / total geradas | Semanal |
| **Reputation Score (Generated)** | Média 7+/10 | Média 8+/10 | Sum(reputation) / count | Contínuo |
| **Zero Critical Legal Errors** | 100% compliance | 100% compliance | Factually incorrect content in prod | Pre-launch + ongoing |
| **Corpus Contamination Check** | Zero contamination | Zero contamination | AI-generated questions in RAG | Mensal audit |

**Threshold Alerts:**
- Expert approval < 75% → Escalate to Constitutional Law SME
- Error rate > 10% → Pause generation, investigate
- Reputation < 6.5/10 → Quality review session

---

### 6.2 Tier 2: User Experience (IMPORTANT)

| Metric | MVP Target (FTS) | Phase 2 Target (pgvector) | Measurement | Cadence |
| --- | --- | --- | --- | --- |
| **Generation Latency (P95)** | <2-3 seconds | <2 seconds | API response time end-to-end | Contínuo |
| **FTS Query Latency (P95)** | <100ms | <100ms (kept) | PostgreSQL FTS query time | Contínuo |
| **Cache Hit Rate** | >70% | >75% | Hits / total_requests (Redis 24h TTL) | Diário |
| **Search Latency (P95)** | <2 seconds (N/A MVP) | <2 seconds | Semantic search (pgvector Phase 2) | Semanal (Phase 2) |
| **Dashboard Load (P95)** | <3 seconds | <2.5 seconds | Analytics view response | Contínuo |

**Threshold Alerts:**
- Generation latency > 3s → Cache review or Ray instrumentation
- Cache hit < 60% → Analysis for optimization
- Dashboard > 3.5s → Database query optimization

---

### 6.3 Tier 3: Business & Adoption (IMPORTANT)

| Metric | MVP Target (Week 4) | Phase 2 Target (Week 8) | Measurement | Cadence |
| --- | --- | --- | --- | --- |
| **Active Users** | 50+ | 100+ | Users logging in at least once/week | Semanal |
| **1-Week Retention** | 70%+ | 75%+ | % of sign-ups who return within 7 days | Semanal |
| **DAU (Daily Active Users)** | 20+ | 40+ | Users accessing system daily | Diário |
| **Cost per Active User** | <$0.10/user/month | <$0.08/user/month | Infrastructure + API costs / active users | Mensal |
| **Generation Frequency** | 2-5 ger/prof/week | 3-7 ger/prof/week | Average generations per user per week | Semanal |
| **Real Exam Coverage** | 80%+ in lists | 85%+ in lists | % questions that are real exam (not AI) | Diário |

**Threshold Alerts:**
- Active users < 30 by week 4 → Escalate institutional partnership plan
- 1-week retention < 50% → Product analysis needed
- Cost > $0.15/user → Review LLM/vector DB pricing

---

### 6.4 Tier 4: Technical Health (SUPPORT)

| Metric | MVP Target | Phase 2 Target | Measurement | Cadence |
| --- | --- | --- | --- | --- |
| **System Uptime** | 99%+ | 99.5%+ | Availability (30-day rolling) | Contínuo |
| **API Error Rate** | <0.5% | <0.3% | Errors / total requests | Contínuo |
| **Database Performance (P95)** | <100ms FTS | <150ms hybrid | Query latency on all DB queries | Contínuo |
| **Critical Bugs** | Zero | Zero | Showstoppers in prod | Pre-launch + monitored |
| **Data Loss Incidents** | Zero | Zero | Unrecoverable data loss events | Ongoing |
| **Vector Quality (Phase 2)** | N/A | >0.8 similarity | Top-10 embeddings relevance score | Semanal |

**Threshold Alerts:**
- Uptime < 98.5% → Incident response
- Error rate > 2% → Automated rollback check
- Query latency > 300ms → Index review

---

### 6.5 User Satisfaction Metrics

| Metric | MVP Target | Measurement | Cadence |
| --- | --- | --- | --- |
| **Overall Satisfaction** | > 7/10 | Post-session survey | Semanal |
| **Content Quality Rating** | 80%+ good/excellent | "How would you rate question quality?" | Semanal |
| **AI Accuracy Confidence** | 85%+ trust AI | "Do you trust AI-generated questions?" | Mensal |
| **NPS (Recommendation)** | 40+ | "Would you recommend to peers?" | Mensal |
| **Ease of Use** | 75%+ easy/very easy | Interface usability feedback | Semanal |
| **Professor Satisfaction** | 80%+ endorsement | Educator interviews (2-3 deep dives) | Mensal |

---

### 6.6 Real Exam Question Coverage & RAG Efficiency

| Metric | MVP Target | Phase 2 Target | Measurement |
| --- | --- | --- | --- |
| **Real Exam in Generation** | 80%+ lists fulfilled | 85%+ lists fulfilled | % lists where ≥80% are real questions |
| **AI Fallback Usage** | <20% of lists | <15% of lists | % lists needing AI supplement |
| **RAG Retrieval Quality** | >5 relevant per 10 | >8 relevant per 10 | Expert assessment: relevant questions retrieved |
| **Corpus Isolation** | 100% source_type filtering | 100% source_type filtering | Zero AI-generated questions in RAG corpus |

---

### 6.6 Roadmap Decision Gates

**MVP → V2 Proceed-to-Expand Criteria:**

✅ Proceed if:

- 50+ active users with > 7/10 satisfaction
- Zero critical legal accuracy issues
- Clear user demand for 2+ V2 features
- Positive educator feedback on pedagogical value

🔄 Pivot if:

- Adoption stalling (< 30 users after 45 days)
- Churn > 50% (1-week retention < 40%)
- Repeated accuracy failures
- Negative feedback on core reputation system

📈 Expand aggressively if:

- Adoption exceeding targets (100+ users by week 6)
- Strong institutional interest (5+ prep courses interested)
- NPS > 60 (strong recommendation)
- Media validation / educational visibility

---

## 7. PRODUCT ROADMAP

### 7.1 MVP (v1.0) - Weeks 0-8

**Focus:** Validate AI generation + community validation hybrid model; de-risk AI accuracy; establish reputation system trust

#### Sprint 1-2 (Weeks 1-2): Foundation & Data Ingestion

- [ ] Architecture & infrastructure setup (cloud, databases, APIs)
- [ ] User authentication system (email/password)
- [ ] CSV data import pipeline (13,917 Constitutional Law questions)
- [ ] Topic taxonomy creation + question mapping
- [ ] Database schemas & indexes
- [ ] Basic question storage + retrieval

**Deliverable:** Database populated with 13.9k Constitutional Law questions

#### Sprint 3-4 (Weeks 3-4): Core Generation & Display

- [ ] Question generation UI (parameters: subject, difficulty, count)
- [ ] Real exam question selection algorithm
- [ ] Question detail view + answer submission
- [ ] Reputation system initial implementation (0-10 score display)
- [ ] Feedback/problem reporting mechanism
- [ ] Expert review queue & workflow

**Deliverable:** Students can generate question lists, answer questions, report problems

#### Sprint 5-6 (Weeks 5-6): Student History & Analytics

- [ ] User history tracking (questions attempted)
- [ ] Dashboard with progress stats (accuracy %, questions by topic)
- [ ] Weak area identification (accuracy < 60%)
- [ ] Prevention of question repetition
- [ ] Personal performance analytics

**Deliverable:** Dashboard showing student progress + weak areas

#### Sprint 7-8 (Weeks 7-8): AI Generation (FTS-Based RAG) & Polish

- [ ] LLM integration for question generation (Claude 3.5 Sonnet)
- [ ] **RAG system setup PHASE 1:** PostgreSQL full-text search (FTS)
  - FTS query for similar real questions by topic + difficulty
  - Redis cache (24h TTL) for generated lists
  - Source filtering: ONLY real_exam questions in RAG corpus
- [ ] AI question prompt engineering (Constitutional Law patterns grounded in real exams)
- [ ] **CRITICAL:** Dual-corpus architecture implementation
  - Table: `question_sources` with `source_type` enum (real_exam vs ai_generated)
  - Filtering: `WHERE source_type='real_exam'` in RAG queries
  - Policy: AI-generated questions NEVER return to RAG corpus
- [ ] Expert review queue for AI-generated questions (pre-user exposure)
- [ ] Testing: RAG retrieval quality, corpus isolation, prompt engineering
- [ ] User acceptance testing with 20-50 beta users
- [ ] **DEFER to Phase 2:** pgvector semantic search, embeddings

**Deliverable:** MVP v1.0 launch-ready; FTS-based RAG working; 50+ beta users testing

**Exit Criteria:**

- ✅ 13,917 Constitutional Law questions fully indexed
- ✅ RAG using PostgreSQL FTS (not pgvector yet)
- ✅ Dual-corpus strategy implemented + tested
- ✅ Real exam questions ONLY in RAG corpus
- ✅ 50+ active users in beta
- ✅ 500+ total questions attempted
- ✅ 99%+ system uptime
- ✅ Zero critical bugs
- ✅ > 7/10 user satisfaction
- ✅ 80%+ users trust question quality
- ✅ Expert approval rate >80% for AI-generated questions

---

### 7.2 Phase 2 (v1.1) - Week 4 (Immediate Post-MVP)

**Focus:** Upgrade RAG to semantic search + quick wins from early user feedback

#### Week 4: RAG Enhancement with pgvector (PRIORITY 1)

1. **pgvector Integration** (3-4 days)
   - Create pgvector extension in Supabase PostgreSQL
   - Compute OpenAI embeddings for all 13,917 Constitutional Law questions
   - Batch job: ~2-3 hours for full vectorization
   - Store embeddings in `question_embeddings` table
   - Create vector index (HNSW for fast similarity search)

2. **Hybrid RAG System** (2-3 days)
   - Upgrade RAG queries to combine FTS + vector similarity
   - Scoring: Merge top-5 (BM25 from FTS) + top-5 (cosine similarity from pgvector)
   - Increase context: 5 → 10 similar questions to Claude
   - Update Redis cache keys to reflect hybrid queries
   - **CRITICAL:** Maintain source_type='real_exam' filtering

3. **Testing & Validation** (1-2 days)
   - Compare FTS vs. hybrid search quality (qualitative expert review)
   - Measure latency: FTS (<100ms) + vector similarity (<150ms) = total <300ms
   - Verify no regression in generation quality
   - Validate corpus isolation still working

**Deliverable:** v1.1 with semantic search (pgvector) live
**Success Criteria:** Latency <2s total, Quality ≥ MVP baseline, Zero corpus contamination

---

#### Weeks 5-12: Community & Quick Wins (PRIORITY 2-3)

1. **Community Discussion System** (2 weeks)
   - Comments/thread on questions (high user request)
   - Peer explanation sharing
   - Flag helpful explanations
   - **Impact:** Faster error identification, peer learning

2. **Flashcard Generation** (1 week)
   - Auto-generate flashcards from question Q&A
   - Spaced repetition system
   - **Impact:** High demand from students (memorization focus)

3. **Reviewer Incentive System** (2 weeks)
   - Contribution leaderboard (questions reviewed)
   - Recognition badges ("Expert Reviewer", etc.)
   - Certificate of contribution
   - **Impact:** Scales human validation as platform grows

**Deliverable:** v1.1 release (Week 4 with pgvector + Weeks 5-12 with community features)

#### Secondary V2 (Weeks 13-24): Core Expansion

1. **Exam Simulation Mode** (6 weeks)
   - Real exam conditions: timed, distraction-free, score report
   - Progress tracking by exam type (OAB, Concursos, etc.)
   - **Impact:** Market differentiation, user retention

2. **Advanced Predictive Analytics** (6 weeks)
   - Exam-specific probability: "72% chance of passing OAB"
   - Gap analysis: "Study 20% more on Constitutional Control to reach 80%"
   - Peer comparison (anonymized): "You're ahead of 60% of students"
   - **Impact:** Directly supports user decision-making

3. **Intelligent Revision Alerts** (4 weeks)
   - Forgetting curve-based notifications
   - "Time to review [topic]" proactive prompts
   - **Impact:** Improves retention through spaced repetition

**Deliverable:** v2.0 release with exam simulation + advanced analytics

---

### 7.3 Phase 3 (v2.0+) - Months 4-6 & Beyond

**Focus:** Domain expansion + integrated learning ecosystem

#### Domain Expansion (Parallel with Phase 2)

1. **Administrative Law** (2 weeks setup, then live)
   - 15,847 questions ready (already in CSV data)
   - UI switch: domain selector in generation params
   - **Impact:** TAM expansion from ~150k to ~300k students

2. **Criminal Law** (2 weeks)
   - 4,834 questions ready
   - **Impact:** Continued TAM expansion

3. **Civil Law & Procedure** (2 weeks)
   - Combined ~10k questions
   - **Impact:** Covers 70%+ of competitive exam domains

**Deliverable:** 7-domain platform covering 63.9k questions

#### Integrated Study Materials (Months 5-6+)

1. **Theory + Questions Integration** (8 weeks)
   - Upload/integrate study guides with questions
   - Guided learning paths: concept → example questions → practice
   - **Impact:** Complete learning ecosystem, higher engagement

2. **External Question Import** (6 weeks)
   - OCR integration: students upload question images/PDFs
   - Crowdsourced question contribution
   - New questions start at 5/10 reputation (incentivize validation)
   - **Impact:** Content growth beyond 63k; community-driven expansion

3. **Educator Content Management** (6 weeks)
   - Teachers can create custom question lists for classes
   - Assignment creation + auto-grading
   - Class analytics dashboard
   - **Impact:** Institutional adoption (licensing revenue)

**Deliverable:** v2.1+ with content integration + educator tools

---

### 7.4 Post-MVP Metrics & Decision Framework

**Evaluation Schedule:** Monthly deep dives + quarterly strategic reviews

**Quantitative Metrics (Every 4 weeks):**

- Active user growth rate (target: 25% week-over-week first 12 weeks)
- Question attempt volume (target: 100+ new questions/week)
- Uptime (target: maintain 99%+)
- Reputation system effectiveness (95%+ flagged issues addressed < 7 days)

**Qualitative Feedback (Monthly):**

- User testimonials: Collect 5+ case studies on study outcome improvements
- Feature requests: Rank to identify V2 priorities
- Educator interviews: Pedagogical value + integration feasibility (3-5 deep dives)
- Error analysis: Categorize accuracy issues by topic

**Business Metrics:**

- Unit economics: Cost per active user trajectory
- Institutional pipeline: Track prep course interest
- Press/media presence: Educational coverage indicators

---

## 8. TECHNICAL CONSTRAINTS & DEPENDENCIES

### 8.1 Technology Stack (Recommended)

| Layer | MVP (Week 3) | Phase 2 (Week 4+) | Rationale |
| --- | --- | --- | --- |
| **Frontend** | React + TypeScript | React + TypeScript | Type safety, component reusability |
| **Backend** | Node.js/Python FastAPI | Node.js/Python FastAPI | Async support for LLM calls |
| **Database** | PostgreSQL | PostgreSQL + pgvector | Relational integrity, JSONB support |
| **Full-Text Search** | PostgreSQL tsvector | PostgreSQL tsvector (kept) | FTS for MVP RAG retrieval |
| **Vector DB** | NONE (defer) | pgvector (native PostgreSQL) | **Phase 2 only:** Semantic search via native pgvector, not external (Pinecone/Weaviate deferred) |
| **Cache** | Redis | Redis | Question lists (24h TTL), generated content caching |
| **LLM API** | Claude 3.5 Sonnet | Claude 3.5 Sonnet | Production-grade question generation with RAG |
| **Embeddings** | NONE (defer) | OpenAI API | **Phase 2 only:** Vector embeddings for semantic search |
| **Cloud** | AWS/GCP/Azure | AWS/GCP/Azure | Scalable infrastructure (Supabase managed PostgreSQL) |
| **Monitoring** | DataDog/New Relic | DataDog/New Relic | Performance + error tracking |

**Key Decision: pgvector on Supabase (not separate Pinecone/Weaviate)**
- Rationale: Reduces operational complexity for MVP; vectors in same DB as questions
- No additional infrastructure setup required
- Supabase PostgreSQL pricing includes pgvector (~$50-100/month at scale)
- Deferral: Consider Pinecone only if scale exceeds 1M+ questions OR latency > 2s becomes issue
- Timeline: pgvector integration begins Week 4 (Phase 2), not MVP

### 8.2 External Dependencies

| Dependency | Impact | Mitigation |
| --- | --- | --- |
| **LLM API (OpenAI/Claude)** | Question generation, RAG | Budget-conscious initially; fallback to real questions |
| **Vector Database Provider** | RAG semantic search | Implement fallback: keyword search if vector DB unavailable |
| **Cloud Infrastructure** | Hosting, uptime | Multi-region failover; 99%+ SLA contracts |
| **Email Service** | Admin notifications, alerts | SendGrid or similar SMTP provider |
| **OAuth Providers** | User authentication | Email fallback if OAuth down |

### 8.3 Resource Requirements

#### Development Team (MVP)

- **Full-stack Developer (1.0 FTE):** Backend API, database, RAG integration
- **Frontend Engineer (0.5 FTE):** React UI, dashboards
- **Product Manager (0.5 FTE):** Scope, roadmap, success metrics
- **Constitutional Law Expert (0.3 FTE):** AI prompt review, question validation
- **QA/Testing (0.3 FTE):** User testing, bug identification
- **DevOps/Infra (0.2 FTE):** Deployment, monitoring, scaling

**Total:** ~2.8 FTE for 8-week MVP

#### Infrastructure Costs (Monthly Estimate)

**MVP (Week 3 - Full-Text Search Only):**
- Cloud compute (AWS EC2/App Engine): $500-1,000
- Database (PostgreSQL managed): $200-500
- **Vector DB:** NONE (FTS only)
- LLM API calls (10k questions/month at ~$0.022/batch of 5): $44-88
- Redis cache: $20-50
- Monitoring/logging: $100-200
- Domain, SSL, misc: $50
- **MVP Total: $914-1,888/month**

**Phase 2 (Week 4+ - with pgvector):**
- Cloud compute (AWS EC2/App Engine): $500-1,000
- Database (PostgreSQL + pgvector, Supabase): $300-600
  - Includes pgvector extension + vector indexes
  - Scaling: ~$50-100/month increment for vector storage/queries
- **Vector DB:** Native pgvector (PostgreSQL) - NO external Pinecone/Weaviate
- LLM API calls (same rate): $44-88
- OpenAI Embeddings (creating vectors for 13.9k questions + ongoing): $20-40/month
- Redis cache: $20-50
- Monitoring/logging: $100-200
- Domain, SSL, misc: $50
- **Phase 2 Total: $1,034-2,028/month**

**Cost Comparison:**
- MVP: ~$1,450/month average
- Phase 2 with pgvector: ~$1,531/month average (only +$81/month for semantic search)
- Deferral savings: Avoid $100-300/month Pinecone/Weaviate licensing until scale justifies

**Scaling Economics (Projection):**
- 1,000 users: ~$1.5/user/month (MVP) → ~$1.53/user/month (Phase 2)
- 10,000 users: ~$0.15/user/month (MVP) → ~$0.15/user/month (Phase 2)
- Break-even on pgvector investment: Immediate (marginal cost)

### 8.3B RAG & Vector Strategy: Dual-Corpus Architecture

**CRITICAL POLICY: AI-Generated Questions NEVER Contaminate RAG Corpus**

**Problem Statement:**
If AI-generated questions are included in the RAG corpus for future generations, we risk:
- Quality degradation through iterative "fiction influencing fiction"
- Error amplification: A subtle legal error gets copied by 10+ future generations
- Loss of ground truth: Can no longer distinguish real exam patterns from learned artifacts

**Solution: Source-Type Filtering**

```sql
-- Table Structure for Corpus Isolation:

CREATE TABLE question_sources (
  id UUID PRIMARY KEY,
  question_id UUID UNIQUE REFERENCES questions(question_id),
  source_type ENUM('real_exam', 'ai_generated', 'expert_approved'),
  rag_eligible BOOLEAN DEFAULT true,  -- Can be used in RAG?
  created_at TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by UUID NULL
);

-- RAG Query (IMMUTABLE - ONLY Real Exams):
SELECT q.*
FROM questions q
JOIN question_sources qs ON q.id = qs.question_id
WHERE qs.source_type = 'real_exam'     -- ← ONLY REAL EXAMS
  AND qs.rag_eligible = TRUE            -- ← Safety flag
  AND q.difficulty = $1                 -- ← Filter by parameters
  AND q.topic_id = $2
LIMIT 10;

-- Questions Approved by Experts (SECONDARY USE):
SELECT q.*
FROM questions q
JOIN question_sources qs ON q.id = qs.question_id
WHERE qs.source_type = 'expert_approved'  -- ← SEPARATE
  AND qs.rag_eligible = FALSE              -- ← NOT IN RAG
  AND qs.approved_at IS NOT NULL           -- ← Validated
ORDER BY qs.approved_at DESC;
```

**Implementation Timeline:**

**MVP (Week 3):**
- [ ] Create `question_sources` table with source_type enum
- [ ] Migrate all 13,917 real exam questions: `source_type = 'real_exam'`
- [ ] Implement RAG filtering: `WHERE source_type = 'real_exam'` ALWAYS
- [ ] All new AI-generated questions: `source_type = 'ai_generated'`, `rag_eligible = false`
- [ ] Test: Verify no AI-generated questions appear in RAG retrieval

**Phase 2 (Week 4+):**
- [ ] When questions approved by experts: `source_type = 'expert_approved'`, `rag_eligible = false`
- [ ] Monthly audit: Verify zero contamination in source_type='real_exam' queries
- [ ] Dashboard metric: Track % of AI-generated questions (monitor contamination risk)

**Monitoring & Audit:**

1. **Daily:** Log all RAG queries with results; verify no source_type='ai_generated' in top-10
2. **Weekly:** Report on distribution of question sources by generation batch
3. **Monthly:** Expert audit—sample 50 random generated questions, verify quality not degrading

**Failure Mode (Detection & Response):**

If contamination detected (AI-generated in RAG corpus):
1. **Alert:** Immediately flag to @architect + @dev
2. **Investigation:** Trace which queries returned contaminated results
3. **Rollback:** Revert to last clean database snapshot
4. **Fix:** Review filtering logic; add stricter type checking
5. **Restart:** Resume generation with validated corpus

---

### 8.4 Key Technical Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **LLM Hallucination** | AI generates legally inaccurate content | Expert review 100% of AI questions before user exposure |
| **RAG Quality** | Retrieval system returns irrelevant reference questions | Semantic search validation; keyword fallback |
| **CSV Data Quality** | Duplicate/corrupt question data corrupts database | Deduplication logic; data quality validation; import testing |
| **Vector DB Latency** | RAG retrieval slow, impacts generation time | Implement Redis caching layer; pre-index common queries |
| **Concurrent Write Conflicts** | Multiple users simultaneously submitting history records | Database transaction management; connection pooling |

---

## 9. RISK ASSESSMENT & MITIGATION

### Risk 1: AI-Generated Question Accuracy & Legal Errors

**Severity:** HIGH | **Probability:** MEDIUM | **Priority:** CRITICAL

**Problem:**

LLM models can hallucinate facts or generate legally inaccurate questions. A student learning incorrect Constitutional Law from an AI-generated question could:

- Apply wrong legal principles on actual exams
- Develop misconceptions damaging long-term learning
- Damage platform credibility if errors discovered

**Mitigation Strategies:**

| Strategy | Timeline | Owner | Metric |
| --- | --- | --- | --- |
| **Expert Review Gate** | MVP | Product Manager + Constitutional Law SME | 100% of AI questions reviewed before user access |
| **Reputation Warnings** | MVP | Frontend | Visual warning for questions < 7/10: "Newly created—verify with professor" |
| **Feedback Fast-Track** | MVP | Backend | Problems on same question flagged for immediate review (SLA < 24h) |
| **Topic Disabling** | MVP | Admin | If 3+ problems reported on topic, disable generation for that topic until fixed |
| **Continuous Monitoring** | Ongoing | DevOps + PM | Weekly error report; categorize by topic to identify weak areas |
| **Expert Consultation** | MVP + Ongoing | Product Manager | Monthly reviews with Constitutional Law professors; quarterly SME audits |

**Success Criteria:**

- Zero critical legal errors in production
- 100% of reported accuracy issues addressed within 7 days
- No user complaints about incorrect content in user interviews

---

### Risk 2: Insufficient User Adoption & Engagement Plateau

**Severity:** HIGH | **Probability:** MEDIUM | **Priority:** HIGH

**Problem:**

Even with good product, initial traction is hard. If adoption stalls below 50 users:

- Insufficient data to validate core value propositions
- Cannot make informed V2 roadmap decisions
- Investors/stakeholders may lose confidence

**Mitigation Strategies:**

| Strategy | Timeline | Owner | Metric |
| --- | --- | --- | --- |
| **Institutional Outreach** | Week 1 | Product Manager | Target 5-10 law professors + 3 prep courses for early pilots |
| **Free MVP Access** | MVP launch | Product Manager | Zero pricing during launch phase removes barrier |
| **Power User Identification** | Week 2 | Product Manager | Weekly check-ins with engaged users (5+ questions/day) |
| **Community Loop** | Ongoing | Product Manager | Weekly feature request voting; monthly recognition for contributors |
| **Backup Institutional Plan** | Week 4 | Product Manager | If organic < 25 users by week 4, activate prep course pilot partnership |
| **Gamification (Light)** | Week 6 | Frontend | Simple progress badges; weekly leaderboard (optional) |
| **Content Expansion** | Week 8 | Backend | Quick Domain expansion demo (show Administrative Law option readiness) |

**Success Criteria:**

- 50+ active users by week 4 (50% retention)
- 10+ daily active users by week 6
- Positive feedback from 3+ institutional partners
- Clear demand for 2+ V2 features (feature voting)

---

### Risk 3: Reputation System Gaming & Feedback Abuse

**Severity:** MEDIUM | **Probability:** MEDIUM | **Priority:** HIGH

**Problem:**

Users could artificially inflate/deflate reputation scores or submit fake feedback:

- Gaming undermines trust in reputation as quality indicator
- Bad actors could sabotage high-performing questions
- System credibility damaged if gaming discovered

**Mitigation Strategies:**

| Strategy | Timeline | Owner | Metric |
| --- | --- | --- | --- |
| **V1 Simple Design** | MVP | Backend | Feedback free-text; visible to admins only; NO algorithmic impact until validated |
| **Expert-Only Scoring (V1)** | MVP | Backend | Reputation only updated via expert review; prevents immediate gaming |
| **Feedback Pattern Monitoring** | MVP | Backend | Flag users submitting 3+ problems for same question; manual review before action |
| **User Tracking** | MVP | Backend | Track all feedback by user_id; identify coordinated gaming patterns |
| **Reputation Audit Trail** | MVP | Backend | Log all reputation changes with source (expert review, time-based progression); full transparency |
| **V2 Consensus Model** | Week 16+ | Backend | Upgrade to peer-review consensus: 3+ expert validates to increase reputation |
| **Incentive Alignment** | Week 12+ | Product Manager | Recognition system rewards quality feedback; penalizes abuse |

**Success Criteria:**

- Zero evidence of reputation gaming in MVP launch
- 100% of feedback submissions traced + auditable
- Reputation changes explainable (expert review with notes)
- User trust in reputation system maintained (survey > 80%)

---

### Risk 4: Regulatory/Ethical Concerns Around AI-Generated Content

**Severity:** MEDIUM | **Probability:** LOW-MEDIUM | **Priority:** MEDIUM

**Problem:**

Brazilian bar association (OAB) or educational regulators could:

- Question legitimacy of AI-generated questions for high-stakes exam prep
- Damage credibility through "AI cheating" public perception
- Restrict platform access if positioned as replacement for official prep

**Mitigation Strategies:**

| Strategy | Timeline | Owner | Metric |
| --- | --- | --- | --- |
| **Transparent Positioning** | MVP | Product Manager + Marketing | Clear messaging: "AI-assisted, human-validated" NOT "AI autonomously generated" |
| **Expert Validation Messaging** | MVP | Product Manager | Every question marked with validation source: "Validated by Constitutional Law expert" |
| **Educational Framing** | MVP | Marketing | Position as study tool for practice/supplementation; NOT replacement for official materials |
| **Legal Review** | Week 1 | Product Manager | Consult with education law expert + OAB regulatory contact (1-2 hours) |
| **Transparency Reports** | Month 1 | Product Manager | Publish report: % real vs AI questions, validation methodology, accuracy rates |
| **Community Advisory Board** | Week 4+ | Product Manager | Engage 3-5 respected professors as advisors; quarterly consultation |
| **Gradual Rollout** | MVP | Product Manager | Beta phase allows approach validation before broad institutional marketing |

**Success Criteria:**

- No regulatory complaints in first 6 months
- Positive feedback from educator interviews (3+ professors endorse approach)
- Institutional partners willing to publicly associate (at least 1 by month 3)
- Media coverage framing as "educational innovation" not "cheating tool"

---

### Risk 5: CSV Data Import Failure & Data Corruption

**Severity:** HIGH | **Probability:** LOW | **Priority:** CRITICAL

**Problem:**

If CSV import fails or corrupts data:

- Database may become inconsistent (missing questions, duplicates)
- Loss of competitive advantage (63k question bank unusable)
- Data recovery complex; potential loss of user history if cascading failure

**Mitigation Strategies:**

| Strategy | Timeline | Owner | Metric |
| ---------- | ---------- | ------- | -------- |
| **Validation Framework** | Week 1 | Backend | Validate: encoding, required fields, answer option count (2-5), correct answer presence |
| **Dry-Run Process** | Week 2 | Backend + QA | Test import with sample CSVs; verify output before production run |
| **Transaction Management** | Week 2 | Backend | Wrap import in database transaction; rollback on ANY error |
| **Backup + Snapshot** | Week 2 | DevOps | Full database snapshot BEFORE import; enable point-in-time recovery |
| **Deduplication Testing** | Week 2 | QA | Verify fuzzy matching catches duplicates; generate dedup report |
| **Progressive Ingestion** | Week 3 | Backend | Ingest incrementally (1 domain at a time) with validation between batches |
| **Post-Import Verification** | Week 3 | QA | Spot-check 100 random questions; verify structure + metadata |

**Success Criteria:**

- 100% of Constitutional Law questions ingested (13,917 rows)
- Zero data loss (before/after row count matches)
- Zero corrupted records (all questions have required fields)
- Import process documented + reproducible
- Rollback capability tested + working

---

## 10. APPENDIX: DETAILED USER STORIES BY PRIORITY

(User stories already detailed in Section 3 above; ordering for implementation:)

### P0 (MVP Critical - Weeks 1-8)

- US-1.1: Generate questions by parameters
- US-1.2: View individual question with metadata
- US-1.3: View real exam source information
- US-2.1: Report problem with question
- US-2.2: View question reputation score
- US-2.3: Expert review & validate questions
- US-3.1: Track questions answered
- US-3.2: Prevent question repetition
- US-4.1: View personal dashboard
- US-5.1: Ingest CSV data
- US-5.2: Map questions to topics

### P1 (Weeks 2-4 Post-MVP)

- US-1.4: Search questions by topic
- US-3.3: View weak areas identification
- US-6.1: Generate novel AI question
- US-6.2: Build RAG system

### P2 (Month 2+)

- US-4.2: View institution dashboard

---

## 11. GLOSSARY & DEFINITIONS

| Term | Definition |
| --- | --- |
| **Real Exam Question** | Questions from actual CESPE or FCC competitive exams; battle-tested; reputation locked at 10/10 |
| **AI-Generated Question** | Questions created by LLM (OpenAI/Claude) based on Constitutional Law patterns; start at 0/10 reputation |
| **RAG (Retrieval-Augmented Generation)** | System that retrieves relevant real exam questions as reference before LLM generates new content |
| **Reputation Score** | 0-10 transparency rating showing how validated a question is; visible to all users |
| **Weak Area** | Topic where user's accuracy < 60% threshold |
| **Question Feedback** | User-submitted problem report on question accuracy/clarity; reviewed by expert within 7 days |
| **Expert Review** | Constitutional Law SME validation of AI-generated or flagged questions; updates reputation score |
| **Semantic Search** | Search using embeddings/vector similarity; finds questions by meaning, not just keywords |
| **ETL Pipeline** | Extract-Transform-Load; CSV ingestion process moving data from files to database |
| **Deduplication** | Fuzzy matching to identify & merge duplicate questions during CSV import |

---

## 12. DOCUMENT CONTROL

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.9 | Jan 29, 2026 | PM | Draft PRD from PROJECT_BRIEF |
| 1.0 | Jan 31, 2026 | PM | Final PRD ready for development |
| 1.1 | Feb 1, 2026 | PM (Morgan) + Atlas (Analyst) | **VALIDATED:** RAG Strategy update - pgvector Phase 2, FTS MVP, dual-corpus isolation, comprehensive KPIs |

**Major Changes in v1.1:**

✅ **RAG Strategy Finalized:**
- MVP (Week 3): PostgreSQL full-text search (FTS) for RAG retrieval
- Phase 2 (Week 4): pgvector hybrid search (semantic + FTS)
- Deferral: Pinecone/Weaviate only if scale >1M questions
- Cost: +$81/month for pgvector Phase 2 (vs separate vector DB)

✅ **Dual-Corpus Architecture:**
- `question_sources` table with source_type filtering
- RAG corpus: ONLY real_exam questions (never AI-generated)
- AI-generated questions: Isolated in separate stream, never influence future generations
- Monthly audit: Verify zero corpus contamination

✅ **Comprehensive KPIs (6 Tiers):**
- Tier 1 (Quality): Expert approval >80%, error rate <5%, reputation 7+/10
- Tier 2 (UX): Generation latency <2-3s, cache hit >70%
- Tier 3 (Business): 50+ active users, 70%+ retention, <$0.10/user/month cost
- Tier 4 (Technical): 99%+ uptime, error rate <0.5%, vector quality >0.8
- Tier 5 (Satisfaction): >7/10 overall satisfaction, 85%+ AI trust
- Tier 6 (RAG Efficiency): 80%+ real exam coverage, zero contamination

✅ **Timeline Clarity:**
- Sprint 7-8: Implement FTS-based RAG + dual-corpus (MVP)
- Phase 2 Week 4: Deploy pgvector hybrid search
- Phase 2 Weeks 5-12: Community features + quick wins

✅ **Risk Mitigation:**
- Expert review gate: 100% of AI questions before user exposure
- Corpus contamination: Source-type filtering + monthly audits
- Quality regression: KPI monitoring with automated alerts

**Status:** ✅ APPROVED by Product Management & Business Analysis
**Validation:** @pm (Morgan) & @analyst (Atlas)
**Next Step:** Architecture review by @architect + sprint planning kickoff

---

*This PRD is a living document. Revisions will be tracked as product strategy evolves based on user feedback and market validation.*
