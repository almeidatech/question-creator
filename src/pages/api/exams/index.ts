/**
 * POST /api/exams - Create exam
 * GET /api/exams - List user's exams
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/src/services/database/supabase-client';
import { CreateExamSchema, UpdateExamSchema, ExamListItemSchema, ExamResponseSchema } from '@/src/schemas/exam.schema';
import {
  createExam,
  listExams,
} from '@/src/services/exams';

interface CreateExamResponse {
  exam_id?: string;
  name?: string;
  question_count?: number;
  created_at?: string;
  error?: string;
}

interface ListExamsResponse {
  exams?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateExamResponse | ListExamsResponse>
) {
  try {
    // Get authenticated user
    const client = getSupabaseClient();
    const { data: { user }, error: authError } = await client.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // POST: Create exam
    if (req.method === 'POST') {
      // Validate input
      const validationResult = CreateExamSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: `Validation error: ${validationResult.error.message}`,
        });
      }

      const result = await createExam(user.id, validationResult.data);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.data);
    }

    // GET: List exams
    if (req.method === 'GET') {
      const { status, limit, page } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit as string);
      if (page) filters.page = parseInt(page as string);

      const result = await listExams(user.id, filters);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json(result.data);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in exams endpoint:', message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
