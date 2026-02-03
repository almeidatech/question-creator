/**
 * POST /api/exams/{id}/attempts - Start a new exam attempt
 * GET /api/exams/{id}/attempts - List exam attempts (future feature)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/services/database/supabase-client';
import { startExamAttempt } from '@/services/exams';
import { StartAttemptResponse } from '@/schemas/exam-attempt.schema';

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StartAttemptResponse | ErrorResponse>
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    // Get authenticated user
    const client = getSupabaseClient();
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // POST: Start attempt
    if (req.method === 'POST') {
      const result = await startExamAttempt(user.id, id);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({ error: result.error || 'Failed to start attempt' });
      }

      return res.status(201).json(result.data!);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in exam attempts endpoint:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
