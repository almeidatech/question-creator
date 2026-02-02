import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/src/middleware/auth.middleware';
import { ScoringService } from '@/src/services/analytics/scoring.service';

/**
 * GET /api/students/analytics
 * Get overall performance analytics for the current student
 *
 * Response:
 * {
 *   total_exams_taken: number,
 *   average_score: number,
 *   improvement_trend: number,
 *   total_study_time_minutes: number
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

    // Get student analytics
    const analytics = await ScoringService.getStudentAnalytics(userId);

    return res.status(200).json(analytics);
  } catch (error) {
    console.error('Student analytics API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch student analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
