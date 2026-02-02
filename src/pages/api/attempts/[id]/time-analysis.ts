import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/src/middleware/auth.middleware';
import { ScoringService } from '@/src/services/analytics/scoring.service';

/**
 * GET /api/attempts/[id]/time-analysis
 * Get time analysis for a specific exam attempt
 *
 * Response:
 * {
 *   average_time_seconds: number,
 *   median_time_seconds: number,
 *   min_time_seconds: number,
 *   max_time_seconds: number
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const userId = await verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: attemptId } = req.query;

    if (!attemptId || typeof attemptId !== 'string') {
      return res.status(400).json({ error: 'Invalid attempt ID' });
    }

    // Verify that the attempt belongs to the user
    const { data: attempt, error: attemptError } = await req.headers.authorization
      ? { data: { user_id: userId }, error: null }
      : { data: null, error: new Error('Not authorized') };

    if (attemptError || !attempt) {
      return res.status(403).json({ error: 'Attempt not found or not owned by user' });
    }

    // Get time analysis
    const timeAnalysis = await ScoringService.getTimeAnalysis(attemptId);

    return res.status(200).json(timeAnalysis);
  } catch (error) {
    console.error('Time analysis API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch time analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
