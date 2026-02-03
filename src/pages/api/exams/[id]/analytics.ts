import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/middleware/auth.middleware';
import { ScoringService } from '@/services/analytics/scoring.service';

/**
 * GET /api/exams/[id]/analytics
 * Get performance analytics for a specific exam
 *
 * Query parameters:
 * - includeWeakAreas (optional): boolean, include frequent weak areas
 *
 * Response:
 * {
 *   exam_id: string,
 *   exam_name: string,
 *   total_attempts: number,
 *   average_score: number,
 *   best_score: number,
 *   worst_score: number,
 *   passing_rate: number,
 *   average_time_minutes: number,
 *   weak_areas?: Array (if includeWeakAreas=true)
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

    const { id: examId } = req.query;
    const { includeWeakAreas } = req.query;

    if (!examId || typeof examId !== 'string') {
      return res.status(400).json({ error: 'Invalid exam ID' });
    }

    // Get exam analytics
    const analytics = await ScoringService.getExamAnalytics(examId, userId);

    const response: any = analytics;

    // Optionally include weak areas frequency
    if (includeWeakAreas === 'true') {
      try {
        const weakAreas = await ScoringService.getFrequentWeakAreas(
          examId,
          userId
        );
        response.weak_areas = weakAreas;
      } catch (error) {
        console.warn('Could not fetch weak areas:', error);
        // Continue without weak areas if query fails
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
