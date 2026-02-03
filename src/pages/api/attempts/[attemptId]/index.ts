/**
 * GET /api/attempts/{attemptId} - Get attempt details with answers and review
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/services/database/supabase-client';
import { getAttemptDetails } from '@/services/exams';
import { GetAttemptResponse } from '@/schemas/exam-attempt.schema';

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetAttemptResponse | ErrorResponse>
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

    // GET: Get attempt details
    if (req.method === 'GET') {
      const result = await getAttemptDetails(user.id, attemptId);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({ error: result.error || 'Failed to retrieve attempt' });
      }

      return res.status(200).json(result.data!);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in get attempt endpoint:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
