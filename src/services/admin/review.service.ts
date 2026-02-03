/**
 * Admin Review Service
 * Handles review queue and question approval/rejection
 *
 * Specification: US-1.3 Question Submission & Reputation System
 */

import { z } from 'zod';
import { getSupabaseClient, getSupabaseServiceClient } from '../database/supabase-client';

/**
 * Review decision schema
 */
export const reviewDecisionSchema = z.object({
  question_id: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
  notes: z.string().optional().default(''),
});

export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

/**
 * Review queue item
 */
export interface ReviewQueueItem {
  question_id: string;
  question_text: string;
  report_count: number;
  feedback: string[];
  last_reported: string;
  status: string;
  reputation_score: number;
}

/**
 * Review queue response
 */
export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Review decision response
 */
export interface ReviewDecisionResponse {
  question_id: string;
  status: string;
  reviewed_at: string;
}

/**
 * Verify user is admin
 */
export async function verifyAdminAccess(userId: string): Promise<boolean> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('users')
    .select('user_role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking admin access:', error);
    return false;
  }

  return data?.user_role === 'admin';
}

/**
 * Get flagged questions for review
 */
export async function getFlaggedQuestions(
  status: 'pending' | 'under_review' | 'approved' | 'rejected' = 'under_review',
  limit: number = 20,
  offset: number = 0
): Promise<{
  items: ReviewQueueItem[];
  total: number;
} | null> {
  const client = getSupabaseClient();

  // Fetch questions with status matching review criteria
  const { data, error, count } = await client
    .from('questions')
    .select(
      `
      id,
      question_text,
      question_reputation (
        current_score,
        problem_reports,
        status
      ),
      question_feedback (
        category,
        submitted_at
      )
    `,
      { count: 'exact' }
    )
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching flagged questions:', error);
    return null;
  }

  if (!data) {
    return { items: [], total: 0 };
  }

  // Transform data to ReviewQueueItem format
  const items: ReviewQueueItem[] = data.map((q: any) => {
    const reputation = q.question_reputation?.[0];
    const feedback = q.question_feedback || [];

    // Get unique feedback types
    const feedbackTypes = [...new Set(feedback.map((f: any) => f.category))] as string[];

    // Get latest report date
    const lastReported = feedback.length > 0
      ? new Date(Math.max(...feedback.map((f: any) => new Date(f.submitted_at).getTime())))
          .toISOString()
      : null;

    return {
      question_id: q.id,
      question_text: q.question_text,
      report_count: reputation?.problem_reports || 0,
      feedback: feedbackTypes,
      last_reported: lastReported || new Date().toISOString(),
      status: reputation?.status || 'active',
      reputation_score: reputation?.current_score || 5,
    };
  });

  return {
    items,
    total: count || 0,
  };
}

/**
 * Create a review record
 */
export async function createReview(
  reviewerId: string,
  questionId: string,
  decision: 'approve' | 'reject' | 'request_revision',
  notes: string
): Promise<{ review_id: string; reviewed_at: string } | null> {
  const client = getSupabaseServiceClient();

  const { data, error } = await client
    .from('question_reviews')
    .insert({
      question_id: questionId,
      reviewer_id: reviewerId,
      decision,
      notes,
    })
    .select('id, reviewed_at')
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return null;
  }

  return {
    review_id: data.id,
    reviewed_at: data.reviewed_at,
  };
}

/**
 * Update question status based on review decision
 */
export async function updateQuestionStatus(
  questionId: string,
  decision: 'approve' | 'reject'
): Promise<boolean> {
  const client = getSupabaseServiceClient();

  const newStatus = decision === 'approve' ? 'active' : 'disabled';

  const { error } = await client
    .from('question_reputation')
    .update({
      status: newStatus,
    })
    .eq('question_id', questionId);

  if (error) {
    console.error('Error updating question status:', error);
    return false;
  }

  return true;
}

/**
 * Main review decision handler
 */
export async function processReviewDecision(
  reviewerId: string,
  decision: ReviewDecision
): Promise<ReviewDecisionResponse | null> {
  try {
    // Create review record (triggers will update reputation)
    const review = await createReview(
      reviewerId,
      decision.question_id,
      decision.decision === 'approve' ? 'approve' : 'reject',
      decision.notes
    );

    if (!review) {
      console.error('Failed to create review');
      return null;
    }

    // Update question status
    const updated = await updateQuestionStatus(decision.question_id, decision.decision);
    if (!updated) {
      console.error('Failed to update question status');
      return null;
    }

    return {
      question_id: decision.question_id,
      status: decision.decision === 'approve' ? 'approved' : 'rejected',
      reviewed_at: review.reviewed_at,
    };
  } catch (err) {
    console.error('Error processing review decision:', err);
    return null;
  }
}

