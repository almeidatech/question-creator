import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '@/middleware/auth.middleware';
import { getSupabaseServiceClient } from '@/services/database/supabase-client';

interface DashboardStats {
  total_questions_attempted: number;
  correct_count: number;
  accuracy_percentage: number;
  streak_days: number;
}

interface ActivityData {
  date: string;
  questions: number;
}

interface WeakArea {
  topic: string;
  accuracy: number;
  total: number;
  correct: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  activity: ActivityData[];
  weakAreas: WeakArea[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated
    const userId = verifyAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = getSupabaseServiceClient();

    // Get user's question history
    const { data: historyData, error: historyError } = await client
      .from('user_question_history')
      .select('is_correct, created_at')
      .eq('user_id', userId);

    if (historyError) {
      console.error('Error fetching user history:', historyError);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    // Calculate stats from history
    const totalAttempts = historyData?.length || 0;
    const correctCount = historyData?.filter(h => h.is_correct).length || 0;
    const accuracyPercentage = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

    const stats: DashboardStats = {
      total_questions_attempted: totalAttempts,
      correct_count: correctCount,
      accuracy_percentage: Math.round(accuracyPercentage * 100) / 100,
      streak_days: 0, // TODO: Calculate from created_at dates
    };

    // Calculate activity for last 7 days
    const today = new Date();
    const activity: ActivityData[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];

      const count = historyData?.filter(h => {
        const attemptDate = new Date(h.created_at).toISOString().split('T')[0];
        return attemptDate === dateStr;
      }).length || 0;

      activity.push({
        date: dateStr,
        questions: count,
      });
    }

    // Get weak areas (topics with low accuracy)
    // TODO: Enhance once question-topic relationships are properly implemented
    const weakAreas: WeakArea[] = [];

    res.status(200).json({
      stats,
      activity,
      weakAreas,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
