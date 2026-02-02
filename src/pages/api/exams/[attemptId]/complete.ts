/**
 * PUT /api/exams/{attemptId}/complete - Complete an exam attempt
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/src/services/database/supabase-client';
import { completeExamAttempt } from '@/src/services/exams';
import { CompleteAttemptResponse } from '@/src/schemas/exam-attempt.schema';

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompleteAttemptResponse | ErrorResponse>
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

    // PUT: Complete attempt
    if (req.method === 'PUT') {
      const result = await completeExamAttempt(user.id, attemptId);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({ error: result.error || 'Failed to complete attempt' });
      }

      return res.status(200).json(result.data!);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in complete attempt endpoint:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
