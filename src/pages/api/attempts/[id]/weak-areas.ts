import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/src/middleware/auth.middleware';
import { ScoringService } from '@/src/services/analytics/scoring.service';

/**
 * GET /api/attempts/[id]/weak-areas
 * Get weak areas detected in a specific exam attempt
 *
 * Response:
 * Array of:
 * {
 *   topic_id: string,
 *   topic_name: string,
 *   accuracy: number (percentage),
 *   total_questions?: number,
 *   correct_answers?: number
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

    // Get weak areas for the attempt
    const weakAreas = await ScoringService.getAttemptWeakAreas(attemptId);

    return res.status(200).json({
      attempt_id: attemptId,
      weak_areas: weakAreas,
    });
  } catch (error) {
    console.error('Weak areas API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch weak areas',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
