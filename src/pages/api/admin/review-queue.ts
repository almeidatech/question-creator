/**
 * API Route: GET /api/admin/review-queue
 * US-1B.5: Expert Review Queue
 *
 * Returns pending AI-generated questions awaiting expert review
 * 100% of AI-generated questions MUST be approved before user exposure
 */

import { z } from 'zod';

/**
 * Query parameters schema
 */
const reviewQueueQuerySchema = z.object({
  page: z.string().default('1').transform((v) => parseInt(v, 10)),
  limit: z.string().default('20').transform((v) => parseInt(v, 10)),
});

/**
 * Review queue item
 */
export interface ReviewQueueItem {
  id: string; // question_id
  text: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  created_at: Date;
  generated_by: string; // user_id of generator
  generation_time_ms: number;
  reputation_score: number;
}

/**
 * Review queue response
 */
export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * GET /api/admin/review-queue
 *
 * Returns pending AI-generated questions sorted by newest first
 */
export async function reviewQueueHandler(req: any, res: any) {
  // Authorization: only admin/expert_reviewer roles
  // TODO: Verify user role
  const userRole = req.user?.role; // From auth middleware
  if (!['admin', 'expert_reviewer'].includes(userRole)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Validate query parameters
  const query = reviewQueueQuerySchema.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: 'Invalid query parameters', details: query.error });
  }

  const { page, limit } = query.data;

  try {
    // SQL Query to fetch pending questions
    // SELECT q.id, q.question_text as text,
    //        ARRAY[q.option_a, q.option_b, q.option_c, q.option_d] as options,
    //        q.difficulty, t.name as topic,
    //        qs.created_at, qs.created_by as generated_by,
    //        qr.current_score as reputation_score
    // FROM questions q
    // JOIN question_sources qs ON q.id = qs.question_id
    // LEFT JOIN question_reputation qr ON q.id = qr.question_id
    // LEFT JOIN question_topics qt ON q.id = qt.question_id
    // LEFT JOIN topics t ON qt.topic_id = t.id
    // WHERE qs.source_type = 'ai_generated'
    //   AND qs.approved_at IS NULL  -- Pending review
    // ORDER BY qs.created_at DESC
    // LIMIT $1 OFFSET $2

    const offset = (page - 1) * limit;

    // TODO: Execute query with actual database client
    const items: ReviewQueueItem[] = [];
    const totalCount = 0;

    const response: ReviewQueueResponse = {
      items,
      pagination: {
        page,
        limit,
        total: totalCount,
        has_next: offset + limit < totalCount,
        has_prev: page > 1,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching review queue:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default reviewQueueHandler;
