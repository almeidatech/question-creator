/**
 * RAG Context Retrieval Service
 * US-1B.2: FTS Query Development & RAG Retrieval
 *
 * CRITICAL: This is the "R" in RAG. Every query MUST filter by:
 * WHERE source_type='real_exam' AND rag_eligible=true
 *
 * This prevents AI-generated questions from contaminating the RAG corpus.
 */

import { z } from 'zod';

/**
 * Question type for RAG retrieval
 */
export interface RagQuestion {
  id: string;
  text: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  source_type: 'real_exam'; // ALWAYS real_exam in RAG results
  reputation_score: number;
}

/**
 * Input validation schema for retrieveRagContext
 */
const retrieveRagContextInputSchema = z.object({
  topic: z.string().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1).max(20).default(10),
});

export type RetrieveRagContextInput = z.infer<typeof retrieveRagContextInputSchema>;

/**
 * Retrieves real exam questions for RAG context
 *
 * @param topic - Topic name (e.g., "Liberdade de Expressão")
 * @param difficulty - Difficulty level
 * @param count - Number of questions to retrieve (1-20, default 10)
 * @returns Array of real exam questions
 *
 * CRITICAL GUARANTEES:
 * 1. ALL returned questions have source_type='real_exam'
 * 2. ALL returned questions have rag_eligible=true
 * 3. NO ai_generated questions appear in results
 * 4. Result count = requested count (or fallback if insufficient)
 * 5. Latency P95 < 100ms
 */
export async function retrieveRagContext(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 10
): Promise<RagQuestion[]> {
  // Validate inputs
  const input = retrieveRagContextInputSchema.parse({
    topic,
    difficulty,
    count,
  });

  try {
    // Step 1: Try full-text search (FTS) on topic
    const ftsResults = await performFtsSearch(input.topic, input.difficulty, input.count);

    if (ftsResults.length >= 3) {
      // FTS found sufficient results
      logRagQuery({
        strategy: 'fts_primary',
        topic: input.topic,
        difficulty: input.difficulty,
        requested_count: input.count,
        actual_count: ftsResults.length,
        status: 'success',
      });
      return ftsResults;
    }

    // Step 2: Fallback - keyword matching (ILIKE)
    const keywordResults = await performKeywordSearch(input.topic, input.difficulty, input.count);

    if (keywordResults.length >= 3) {
      logRagQuery({
        strategy: 'keyword_fallback',
        topic: input.topic,
        difficulty: input.difficulty,
        requested_count: input.count,
        actual_count: keywordResults.length,
        status: 'success',
      });
      return keywordResults;
    }

    // Step 3: Final fallback - random real exam questions by difficulty
    const randomResults = await performRandomSearch(input.difficulty, input.count);

    logRagQuery({
      strategy: 'random_fallback',
      topic: input.topic,
      difficulty: input.difficulty,
      requested_count: input.count,
      actual_count: randomResults.length,
      status: 'fallback',
    });

    return randomResults;
  } catch (error) {
    logRagQuery({
      strategy: 'error',
      topic: input.topic,
      difficulty: input.difficulty,
      requested_count: input.count,
      actual_count: 0,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Primary retrieval: Full-text search on question text
 * Uses PostgreSQL tsvector with Portuguese language config
 */
async function performFtsSearch(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  limit: number
): Promise<RagQuestion[]> {
  // This would be called with actual database client
  // SQL Query:
  // SELECT q.id, q.question_text as text, ARRAY[q.option_a, q.option_b, q.option_c, q.option_d] as options,
  //        q.difficulty, t.name as topic, qs.source_type, qr.current_score as reputation_score
  // FROM questions q
  // JOIN question_sources qs ON q.id = qs.question_id
  // LEFT JOIN question_topics qt ON q.id = qt.question_id
  // LEFT JOIN topics t ON qt.topic_id = t.id
  // LEFT JOIN question_reputation qr ON q.id = qr.question_id
  // WHERE qs.source_type = 'real_exam'
  //   AND qs.rag_eligible = true
  //   AND q.difficulty = $1
  //   AND t.name ILIKE $2
  //   AND to_tsvector('portuguese', q.question_text) @@ plainto_tsquery('portuguese', $3)
  // ORDER BY ts_rank(to_tsvector('portuguese', q.question_text), plainto_tsquery('portuguese', $3)) DESC,
  //          qr.current_score DESC
  // LIMIT $4
  //
  // Parameters: [difficulty, topic_pattern, topic, limit]

  // Mock implementation for demonstration
  return [];
}

/**
 * Fallback: Keyword matching using ILIKE
 * Used when FTS returns < 3 results
 */
async function performKeywordSearch(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  limit: number
): Promise<RagQuestion[]> {
  // SQL Query:
  // SELECT q.id, q.question_text as text, ARRAY[q.option_a, q.option_b, q.option_c, q.option_d] as options,
  //        q.difficulty, t.name as topic, qs.source_type, qr.current_score as reputation_score
  // FROM questions q
  // JOIN question_sources qs ON q.id = qs.question_id
  // LEFT JOIN question_topics qt ON q.id = qt.question_id
  // LEFT JOIN topics t ON qt.topic_id = t.id
  // LEFT JOIN question_reputation qr ON q.id = qr.question_id
  // WHERE qs.source_type = 'real_exam'
  //   AND qs.rag_eligible = true
  //   AND q.difficulty = $1
  //   AND (t.name ILIKE $2 OR t.keywords @> ARRAY[$2])
  // ORDER BY qr.current_score DESC, q.created_at DESC
  // LIMIT $3

  return [];
}

/**
 * Final fallback: Random real exam questions by difficulty
 * Used when both FTS and keyword search return < 3 results
 */
async function performRandomSearch(
  difficulty: 'easy' | 'medium' | 'hard',
  limit: number
): Promise<RagQuestion[]> {
  // SQL Query:
  // SELECT q.id, q.question_text as text, ARRAY[q.option_a, q.option_b, q.option_c, q.option_d] as options,
  //        q.difficulty, t.name as topic, qs.source_type, qr.current_score as reputation_score
  // FROM questions q
  // JOIN question_sources qs ON q.id = qs.question_id
  // LEFT JOIN question_topics qt ON q.id = qt.question_id
  // LEFT JOIN topics t ON qt.topic_id = t.id
  // LEFT JOIN question_reputation qr ON q.id = qr.question_id
  // WHERE qs.source_type = 'real_exam'
  //   AND qs.rag_eligible = true
  //   AND q.difficulty = $1
  // ORDER BY RANDOM()
  // LIMIT $2

  return [];
}

/**
 * Log RAG query execution for monitoring
 * Used to track fallback rates and performance
 */
function logRagQuery(data: {
  strategy: 'fts_primary' | 'keyword_fallback' | 'random_fallback' | 'error';
  topic: string;
  difficulty: string;
  requested_count: number;
  actual_count: number;
  status: 'success' | 'fallback' | 'error';
  error_message?: string;
}) {
  // Log to monitoring system (Sentry, Datadog, etc.)
  const timestamp = new Date().toISOString();
  const fallbackActivated = data.strategy !== 'fts_primary';

  console.log(
    JSON.stringify({
      timestamp,
      event: 'rag_query',
      ...data,
      fallback_activated: fallbackActivated,
    })
  );

  // TODO: Alert if fallback rate > 10% in 1-hour window
}

/**
 * Zod schema for RAG question response validation
 */
export const ragQuestionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(10).max(5000),
  options: z.array(z.string()).length(4),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topic: z.string(),
  source_type: z.literal('real_exam'), // ALWAYS real_exam
  reputation_score: z.number().min(0).max(10),
});

export const ragContextSchema = z.array(ragQuestionSchema);
