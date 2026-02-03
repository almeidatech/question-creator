/**
 * Question Submission Service
 * Handles answer submission, validation, and reputation updates
 *
 * Specification: US-1.3 Question Submission & Reputation System
 */

import { z } from 'zod';
import { getSupabaseClient, getSupabaseServiceClient } from '../database/supabase-client';

/**
 * Submission request validation schema
 */
export const submissionSchema = z.object({
  selected_option_index: z.number().int().min(0).max(3),
});

export type SubmissionRequest = z.infer<typeof submissionSchema>;

/**
 * Submission response
 */
export interface SubmissionResponse {
  correct: boolean;
  explanation: string;
  nextTopicSuggestion: string;
  reputation: {
    score: number;
    status: string;
  };
}

/**
 * Question details from database
 */
interface QuestionDetails {
  id: string;
  question_text: string;
  correct_answer: string; // 'a', 'b', 'c', 'd'
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e?: string;
  commentary: string;
  primary_topic_id: string;
}

/**
 * Reputation details
 */
interface QuestionReputation {
  current_score: number;
  status: string;
}

/**
 * Convert option index (0-3) to letter (a-d)
 */
function indexToLetter(index: number): string {
  return String.fromCharCode(97 + index); // 'a' = 97
}

/**
 * Convert option letter to index
 */
function letterToIndex(letter: string): number {
  return letter.charCodeAt(0) - 97;
}

/**
 * Check if user has already submitted this question
 */
export async function checkDuplicateSubmission(
  userId: string,
  questionId: string
): Promise<boolean> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('user_question_history')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .limit(1);

  if (error) {
    console.error('Error checking duplicate submission:', error);
    return true; // Assume duplicate if error (fail safe)
  }

  return (data && data.length > 0) || false;
}

/**
 * Get question details
 */
export async function getQuestionDetails(questionId: string): Promise<QuestionDetails | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('questions')
    .select(
      `
      id,
      question_text,
      correct_answer,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      commentary,
      primary_topic_id
    `
    )
    .eq('id', questionId)
    .single();

  if (error) {
    console.error('Error fetching question:', error);
    return null;
  }

  return data as QuestionDetails;
}

/**
 * Get topic name by ID
 */
export async function getTopicName(topicId: string | null): Promise<string> {
  if (!topicId) return 'general';

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('topics')
    .select('slug')
    .eq('id', topicId)
    .single();

  if (error) {
    console.error('Error fetching topic:', error);
    return 'general';
  }

  return data?.slug || 'general';
}

/**
 * Get current reputation score for question
 */
export async function getQuestionReputation(
  questionId: string
): Promise<QuestionReputation | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('question_reputation')
    .select('current_score, status')
    .eq('question_id', questionId)
    .single();

  if (error) {
    console.error('Error fetching reputation:', error);
    return null;
  }

  return data as QuestionReputation;
}

/**
 * Record user submission in database
 */
export async function recordSubmission(
  userId: string,
  questionId: string,
  selectedLetter: string,
  isCorrect: boolean,
  responseTimeMs: number
): Promise<string | null> {
  const client = getSupabaseServiceClient();

  const { data, error } = await client
    .from('user_question_history')
    .insert({
      user_id: userId,
      question_id: questionId,
      selected_answer: selectedLetter,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs,
      context: 'practice',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error recording submission:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Get next topic suggestion based on correctness
 */
export async function getNextTopicSuggestion(
  userId: string,
  topicId: string,
  isCorrect: boolean
): Promise<string> {
  if (isCorrect) {
    // If correct, suggest related topic from same subject
    return topicId || 'general';
  }

  // If incorrect, get a different topic for reinforcement
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('topics')
    .select('slug')
    .neq('id', topicId)
    .limit(1);

  if (error || !data || data.length === 0) {
    return 'general';
  }

  return data[0].slug;
}

/**
 * Main submission handler
 */
export async function processSubmission(
  userId: string,
  questionId: string,
  request: SubmissionRequest,
  startTimeMs: number
): Promise<SubmissionResponse | null> {
  try {
    // Validate question exists
    const question = await getQuestionDetails(questionId);
    if (!question) {
      console.error('Question not found:', questionId);
      return null;
    }

    // Validate option index
    if (request.selected_option_index < 0 || request.selected_option_index > 3) {
      console.error('Invalid option index:', request.selected_option_index);
      return null;
    }

    // Check for duplicate submission
    const isDuplicate = await checkDuplicateSubmission(userId, questionId);
    if (isDuplicate) {
      console.error('Duplicate submission detected');
      return null;
    }

    // Convert index to letter
    const selectedLetter = indexToLetter(request.selected_option_index);

    // Check if answer is correct
    const isCorrect = selectedLetter === question.correct_answer.toLowerCase();

    // Record response time
    const responseTimeMs = Date.now() - startTimeMs;

    // Record submission (triggers reputation update via trigger)
    const submissionId = await recordSubmission(
      userId,
      questionId,
      selectedLetter,
      isCorrect,
      responseTimeMs
    );

    if (!submissionId) {
      console.error('Failed to record submission');
      return null;
    }

    // Get updated reputation (trigger should have updated it)
    const reputation = await getQuestionReputation(questionId);
    if (!reputation) {
      console.error('Failed to fetch reputation');
      return null;
    }

    // Get next topic suggestion
    const nextTopic = await getNextTopicSuggestion(userId, question.primary_topic_id, isCorrect);

    // Determine reputation status based on score
    let statusBadge: string;
    if (reputation.current_score < 4) {
      statusBadge = 'needs_review';
    } else if (reputation.current_score < 7) {
      statusBadge = 'good';
    } else {
      statusBadge = 'excellent';
    }

    return {
      correct: isCorrect,
      explanation: question.commentary || 'No explanation available',
      nextTopicSuggestion: nextTopic,
      reputation: {
        score: Math.round(reputation.current_score * 10) / 10, // Round to 1 decimal
        status: statusBadge,
      },
    };
  } catch (err) {
    console.error('Error processing submission:', err);
    return null;
  }
}

