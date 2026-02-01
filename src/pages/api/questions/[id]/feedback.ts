/**
 * API Endpoint: POST /api/questions/{id}/feedback
 * US-1.3: Question Submission & Reputation System
 *
 * Records feedback/problem reports on questions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { feedbackSchema, submitFeedback } from '../../../../services/questions/feedback.service';
import { getSupabaseClient } from '../../../../services/database/supabase-client';

interface FeedbackApiResponse {
  feedback_id: string;
  status: string;
  createdAt: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Extract user ID from Authorization header (JWT token)
 */
async function getUserIdFromAuth(req: NextApiRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const client = getSupabaseClient();

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    return data.user.id;
  } catch (err) {
    console.error('Error extracting user from auth:', err);
    return null;
  }
}

/**
 * Handler for POST /api/questions/{id}/feedback
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackApiResponse | ErrorResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: questionId } = req.query;

    if (!questionId || typeof questionId !== 'string') {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    // Get user ID from JWT
    const userId = await getUserIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.message,
      });
    }

    // Submit feedback
    const result = await submitFeedback(userId, questionId, parsed.data);

    if (!result) {
      return res.status(400).json({
        error: 'Failed to submit feedback',
        details: 'Check that question exists',
      });
    }

    // Return success response (201 Created)
    return res.status(201).json(result);
  } catch (error) {
    console.error('Feedback endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
