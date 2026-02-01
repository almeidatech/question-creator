# US-3.1: CSV Import Pipeline

**Epic:** Epic 3 - Admin
**Sprint:** 3.1 / Week 7
**Effort:** 40h
**Assigned to:** @dev, @db-sage
**Status:** Pronto para Desenvolvimento

---

## User Story

**As an** admin
**I want** to import new questions from a CSV file with deduplication
**So that** I can add large batches of questions to the question bank efficiently

---

## Acceptance Criteria

- [ ] CSV Parser - Validate and parse CSV
  - Accepts CSV with columns: text, options (4), correct_index, topic, difficulty, explanation
  - Detects encoding: UTF-8, ISO-8859-1
  - Validates each row: no missing fields, correct_index 0-3
  - Handles edge cases: empty rows, BOM characters
  - Returns: parsed_rows, validation_errors

- [ ] Deduplication - Fuzzy match with 85% threshold
  - For each CSV row: find similar questions in DB (Levenshtein similarity > 85%)
  - If match found: skip (mark as duplicate)
  - If no match: prepare for insert
  - Returns: new_questions, duplicates_found, duplicates_list

- [ ] Semantic Mapping - Map questions to topics
  - Uses Gemini batch API (cheaper than real-time)
  - Maps CSV question → existing topic in database
  - Falls back to predefined rules if API fails
  - Caches embeddings for future use
  - Returns: mapped_topics

- [ ] Batch Processing - Async import with error handling
  - Processes 100 rows per database transaction
  - Async job (doesn't block API)
  - Logs progress: X of Y completed
  - Retries failed rows (3 attempts)
  - Rollback on critical error
  - Returns: import_id, status, progress

- [ ] Version Management - Track imports and enable rollback
  - Stores: import_id, csv_file, questions_added, questions_count, timestamp, user_id
  - Tracks which questions added in each import
  - Enables rollback: DELETE questions WHERE import_id = X
  - Returns: import_history, import_metadata

---

## Definition of Done

- [ ] CSV parser handles various encodings + edge cases
- [ ] Dedup accuracy tested (unit test examples)
- [ ] Semantic mapping working (verified with sample)
- [ ] Batch processing < 15 min for 13.9k questions
- [ ] Version management tracking imports
- [ ] Error logging comprehensive
- [ ] Vitest coverage ≥ 80%

---

## Technical Specifications

### Endpoints

```typescript
POST /api/admin/import/csv
{
  file: FormData (multipart/form-data)
}
// Response 202 (Accepted):
{
  import_id: "uuid",
  status: "queued",
  estimated_time_minutes: 8,
  webhook_url: "optional" // for progress updates
}

GET /api/admin/import/{import_id}/progress
// Response 200:
{
  import_id: "uuid",
  status: "in_progress",
  processed: 256,
  total: 1000,
  progress_percent: 25.6,
  estimated_remaining_minutes: 6
}
```

### CSV Format

```
text,option_a,option_b,option_c,option_d,correct_index,topic,difficulty,explanation
"Question text?","Option A","Option B","Option C","Option D",0,"direito-constitucional","medium","Explanation..."
```

### Deduplication Algorithm

```typescript
function calculateSimilarity(str1: string, str2: string): number {
  // Levenshtein distance
  const maxLen = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return ((maxLen - distance) / maxLen) * 100;
}

function deduplicateCSVRows(csvRows: Row[], existingQuestions: Question[]): {
  newQuestions: Row[];
  duplicates: { csvIndex: number; matchedQuestion: Question; similarity: number }[];
} {
  const newQuestions = [];
  const duplicates = [];

  for (let i = 0; i < csvRows.length; i++) {
    let foundDuplicate = false;

    for (const existing of existingQuestions) {
      const similarity = calculateSimilarity(csvRows[i].text, existing.text);
      if (similarity >= 85) {
        duplicates.push({
          csvIndex: i,
          matchedQuestion: existing,
          similarity
        });
        foundDuplicate = true;
        break;
      }
    }

    if (!foundDuplicate) {
      newQuestions.push(csvRows[i]);
    }
  }

  return { newQuestions, duplicates };
}
```

### Database Schema (Additional)

```sql
CREATE TABLE question_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  csv_filename VARCHAR(255),
  total_rows INT,
  successful_imports INT,
  duplicate_count INT,
  error_count INT,
  status VARCHAR(20) CHECK (status IN ('queued', 'in_progress', 'completed', 'failed')),
  error_details JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE import_question_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES question_imports(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_question_imports_admin_id ON question_imports(admin_id);
CREATE INDEX idx_import_question_mapping_import_id ON import_question_mapping(import_id);
```

---

## Quality Gates & Agents

### Pre-Commit

- [ ] CSV validation (columns, encoding)
- [ ] Dedup accuracy test

### Pre-PR

- [ ] Performance test (1000 rows < 10s)
- [ ] Batch transaction safety

### Pre-Deployment

- [ ] Load test full 13.9k import

---

## Key Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Large file upload timeout | Implement chunked upload, set timeout to 5 minutes |
| Deduplication too strict (missing real duplicates) | Test with real data, adjust threshold from 85% |
| Batch processing fails halfway | Implement transaction rollback, allow retry per batch |
| Semantic mapping too slow | Use batch API (Gemini), cache results, fall back to rules |
| Import data corruption | Verify checksums, create backups before import |

---

## Dependencies

- [ ] Epic 1 + 2 completed
- [ ] CSV import endpoint created
- [ ] Async job queue configured (Redis)

---

## Implementation Checklist

- [ ] Create CSV parser
- [ ] Implement CSV validation
- [ ] Create deduplication function
- [ ] Implement Levenshtein distance algorithm
- [ ] Create semantic mapping with Gemini API
- [ ] Implement batch processing (100 rows per transaction)
- [ ] Create import progress tracking
- [ ] Implement version management/rollback
- [ ] Create import endpoints
- [ ] Write CSV parsing tests
- [ ] Write deduplication tests
- [ ] Load test with 13.9k questions
- [ ] Document CSV format

---

**Created:** 2026-02-01
**Previous Story:** [08-scoring-analytics-weak-areas.md](./08-scoring-analytics-weak-areas.md)
**Next Story:** [10-admin-dashboard-review-queue.md](./10-admin-dashboard-review-queue.md)
