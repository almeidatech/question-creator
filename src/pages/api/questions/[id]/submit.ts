/**
 * API Endpoint: POST /api/questions/{id}/submit
 * US-1.3: Question Submission & Reputation System
 *
 * Records answer submission, validates correctness, and returns reputation update
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { submissionSchema, processSubmission } from '../../../../services/questions/submission.service';
import { getSupabaseClient } from '../../../../services/database/supabase-client';

interface SubmissionApiResponse {
  correct: boolean;
  explanation: string;
  nextTopicSuggestion: string;
  reputation: {
    score: number;
    status: string;
  };
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
 * Handler for POST /api/questions/{id}/submit
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmissionApiResponse | ErrorResponse>
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
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.message,
      });
    }

    // Record start time for response time calculation
    const startTimeMs = Date.now();

    // Process submission
    const result = await processSubmission(userId, questionId, parsed.data, startTimeMs);

    if (!result) {
      return res.status(400).json({
        error: 'Failed to process submission',
        details: 'Check that question exists and you haven\'t already submitted an answer',
      });
    }

    // Return success response
    return res.status(200).json(result);
  } catch (error) {
    console.error('Submission endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
