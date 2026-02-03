/**
 * API Endpoint: GET /api/admin/review-queue
 * US-1.3: Question Submission & Reputation System
 *
 * Returns flagged questions awaiting expert review
 * Admin only endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import {
  verifyAdminAccess,
  getFlaggedQuestions,
  ReviewQueueResponse,
} from '../../../services/admin/review.service';
import { getSupabaseClient } from '../../../services/database/supabase-client';

/**
 * Query parameters schema
 */
const reviewQueueQuerySchema = z.object({
  page: z.string().default('1').transform((v) => parseInt(v, 10)),
  limit: z.string().default('20').transform((v) => parseInt(v, 10)),
  status: z.enum(['pending', 'under_review', 'approved', 'rejected']).default('under_review'),
});

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
 * Handler for GET /api/admin/review-queue
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReviewQueueResponse | ErrorResponse>
) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from JWT
    const userId = await getUserIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(userId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validate query parameters
    const parsed = reviewQueueQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: parsed.error.message,
      });
    }

    const { page, limit, status } = parsed.data;
    const offset = (page - 1) * limit;

    // Fetch flagged questions
    const result = await getFlaggedQuestions(
      status as 'pending' | 'under_review' | 'approved' | 'rejected',
      limit,
      offset
    );

    if (!result) {
      return res.status(500).json({ error: 'Failed to fetch review queue' });
    }

    const response: ReviewQueueResponse = {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        has_next: offset + limit < result.total,
        has_prev: page > 1,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Review queue endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


