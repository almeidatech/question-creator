/**
 * Question Feedback Service
 * Handles feedback reporting and auto-flagging
 *
 * Specification: US-1.3 Question Submission & Reputation System
 */

import { z } from 'zod';
import { getSupabaseClient, getSupabaseServiceClient } from '../database/supabase-client';

/**
 * Feedback request validation schema
 */
export const feedbackSchema = z.object({
  feedback_type: z.enum(['wrong_answer', 'unclear', 'offensive', 'typo', 'other']),
  comment: z.string().optional().default(''),
});

export type FeedbackRequest = z.infer<typeof feedbackSchema>;

/**
 * Feedback response
 */
export interface FeedbackResponse {
  feedback_id: string;
  status: string;
  createdAt: string;
}

/**
 * Check if question exists
 */
export async function questionExists(questionId: string): Promise<boolean> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('questions')
    .select('id')
    .eq('id', questionId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
}

/**
 * Count recent reports for question (last 24 hours)
 */
export async function countRecentReports(questionId: string): Promise<number> {
  const client = getSupabaseClient();

  // Calculate 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error, count } = await client
    .from('question_feedback')
    .select('id', { count: 'exact' })
    .eq('question_id', questionId)
    .in('category', ['incorrect_answer', 'unclear', 'offensive'])
    .gte('submitted_at', twentyFourHoursAgo);

  if (error) {
    console.error('Error counting recent reports:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Create feedback record
 */
export async function createFeedback(
  userId: string,
  questionId: string,
  category: string,
  feedbackText: string
): Promise<{ feedback_id: string; createdAt: string } | null> {
  const client = getSupabaseServiceClient();

  const { data, error } = await client
    .from('question_feedback')
    .insert({
      user_id: userId,
      question_id: questionId,
      category,
      feedback_text: feedbackText,
      status: 'pending',
    })
    .select('id, submitted_at')
    .single();

  if (error) {
    console.error('Error creating feedback:', error);
    return null;
  }

  return {
    feedback_id: data.id,
    createdAt: data.submitted_at,
  };
}

/**
 * Check if question should be flagged (3+ reports in 24h)
 * Returns tuple: [shouldFlag, reportCount] to avoid duplicate queries
 */
export async function shouldFlagQuestion(questionId: string): Promise<[boolean, number]> {
  const count = await countRecentReports(questionId);
  return [count >= 3, count];
}

/**
 * Update question reputation status to under_review
 * Note: Trigger will also handle this, but we call it directly to be explicit
 */
export async function flagQuestionForReview(
  questionId: string,
  reportCount?: number
): Promise<boolean> {
  const client = getSupabaseServiceClient();

  // Use provided count if available to avoid duplicate query; otherwise query
  const problemReports = reportCount ?? (await countRecentReports(questionId));

  const { error } = await client
    .from('question_reputation')
    .update({
      status: 'under_review',
      problem_reports: problemReports,
    })
    .eq('question_id', questionId);

  if (error) {
    console.error('Error flagging question:', error);
    return false;
  }

  return true;
}

/**
 * Main feedback submission handler
 */
export async function submitFeedback(
  userId: string,
  questionId: string,
  request: FeedbackRequest
): Promise<FeedbackResponse | null> {
  try {
    // Verify question exists
    const exists = await questionExists(questionId);
    if (!exists) {
      console.error('Question not found:', questionId);
      return null;
    }

    // Create feedback record
    const feedback = await createFeedback(userId, questionId, request.feedback_type, request.comment);
    if (!feedback) {
      console.error('Failed to create feedback');
      return null;
    }

    // Check if question should be flagged (3+ reports in 24h)
    // shouldFlagQuestion now returns [shouldFlag, reportCount] to avoid duplicate queries
    const [shouldFlag, reportCount] = await shouldFlagQuestion(questionId);
    if (shouldFlag) {
      // Pass reportCount to avoid duplicate countRecentReports() query
      await flagQuestionForReview(questionId, reportCount);
    }

    return {
      feedback_id: feedback.feedback_id,
      status: shouldFlag ? 'flagged' : 'pending',
      createdAt: feedback.createdAt,
    };
  } catch (err) {
    console.error('Error submitting feedback:', err);
    return null;
  }
}
