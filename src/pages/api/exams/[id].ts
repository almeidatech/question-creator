/**
 * GET /api/exams/{id} - Get exam details
 * PUT /api/exams/{id} - Update exam
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/services/database/supabase-client';
import { UpdateExamSchema } from '@/schemas/exam.schema';
import {
  getExamDetails,
  updateExam,
} from '@/services/exams';

interface ExamResponse {
  exam_id?: string;
  name?: string;
  description?: string;
  duration_minutes?: number;
  passing_score?: number;
  status?: string;
  questions?: any[];
  attempts?: any[];
  created_at?: string;
  updated_at?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExamResponse>
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

    // GET: Fetch exam details
    if (req.method === 'GET') {
      const result = await getExamDetails(user.id, id);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({ error: result.error });
      }

      return res.status(200).json(result.data!);
    }

    // PUT: Update exam
    if (req.method === 'PUT') {
      // Validate input
      const validationResult = UpdateExamSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: `Validation error: ${validationResult.error.message}`,
        });
      }

      const result = await updateExam(user.id, id, validationResult.data);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({ error: result.error });
      }

      return res.status(200).json(result.data!);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in exam detail endpoint:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
