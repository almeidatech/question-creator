import type { NextApiRequest, NextApiResponse } from 'next';

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
    // Get auth header to verify user is logged in
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock data - In production, this would query the database
    // using the authenticated user's ID
    const stats: DashboardStats = {
      total_questions_attempted: 47,
      correct_count: 38,
      accuracy_percentage: 80.85,
      streak_days: 7,
    };

    // Last 7 days of activity
    const today = new Date();
    const activity: ActivityData[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        questions: Math.floor(Math.random() * 12) + 1,
      };
    });

    // Topics with below 70% accuracy
    const weakAreas: WeakArea[] = [
      {
        topic: 'React Hooks',
        accuracy: 65,
        total: 10,
        correct: 6,
      },
      {
        topic: 'TypeScript Generics',
        accuracy: 55,
        total: 9,
        correct: 5,
      },
      {
        topic: 'Database Design',
        accuracy: 70,
        total: 12,
        correct: 8,
      },
    ];

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
