/**
 * POST /api/attempts/{attemptId}/answers - Submit an answer to a question
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/services/database/supabase-client';
import { submitAnswer } from '@/services/exams';
import { SubmitAnswerSchema, SubmitAnswerResponse } from '@/schemas/exam-attempt.schema';

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitAnswerResponse | ErrorResponse>
) {
  try {
    const { attemptId } = req.query;

    if (!attemptId || typeof attemptId !== 'string') {
      return res.status(400).json({ error: 'Invalid attempt ID' });
    }

    // Get authenticated user
    const client = getSupabaseClient();
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // POST: Submit answer
    if (req.method === 'POST') {
      // Validate input
      const validationResult = SubmitAnswerSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: `Validation error: ${validationResult.error.message}`,
        });
      }

      // Extract time spent from request (optional)
      const timeSpentSeconds = typeof req.body.time_spent_seconds === 'number'
        ? req.body.time_spent_seconds
        : undefined;

      const result = await submitAnswer(user.id, attemptId, validationResult.data, timeSpentSeconds);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({ error: result.error || 'Failed to submit answer' });
      }

      return res.status(200).json(result.data!);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in submit answer endpoint:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
