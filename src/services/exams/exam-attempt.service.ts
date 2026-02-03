/**
 * Exam Attempt Service
 * Handles exam attempt lifecycle: start, answer submission, completion, and review
 * Includes state machine validation, scoring, and weak area detection
 */

import { getSupabaseServiceClient, hashUuidToLockId, withAdvisoryLock } from '@/services/database/supabase-client';
import {
  StartAttemptResponse,
  SubmitAnswerResponse,
  CompleteAttemptResponse,
  GetAttemptResponse,
  SubmitAnswerInput,
  WeakArea,
  AnswerDetail,
} from '@/schemas/exam-attempt.schema';
import {
  convertCorrectAnswerLetterToIndex,
} from '@/lib/transformers/question';

// ============================================================================
// START ATTEMPT
// ============================================================================

/**
 * Start a new exam attempt
 * Creates attempt record, validates exam exists, and locks for modifications
 */
export async function startExamAttempt(
  userId: string,
  examId: string
): Promise<{
  success: boolean;
  data?: StartAttemptResponse;
  error?: string;
  statusCode?: number;
}> {
  try {
    const client = getSupabaseServiceClient();

    // Validate exam exists and belongs to user
    const { data: examData, error: examError } = await client
      .from('exams')
      .select('id, duration_minutes, status')
      .eq('id', examId)
      .eq('user_id', userId)
      .single();

    if (examError || !examData) {
      return {
        success: false,
        error: 'Exam not found',
        statusCode: 404,
      };
    }

    // Check exam is active
    if (examData.status !== 'active') {
      return {
        success: false,
        error: 'Exam is not available',
        statusCode: 400,
      };
    }

    // Count questions in exam
    const { count: questionsCount, error: countError } = await client
      .from('exam_questions')
      .select('*', { count: 'exact' })
      .eq('exam_id', examId);

    if (countError) {
      return {
        success: false,
        error: 'Failed to retrieve exam questions',
        statusCode: 500,
      };
    }

    // Use advisory lock to prevent race conditions
    const lockId = hashUuidToLockId(examId);

    const result = await withAdvisoryLock(lockId, async () => {
      // Create attempt record
      const { data: attemptData, error: attemptError } = await client
        .from('user_exam_attempts')
        .insert([
          {
            exam_id: examId,
            user_id: userId,
            is_completed: false,
            started_at: new Date().toISOString(),
          },
        ])
        .select('id, started_at')
        .single();

      if (attemptError || !attemptData) {
        console.error('Error creating exam attempt:', attemptError);
        return {
          success: false,
          error: 'Failed to create exam attempt',
          statusCode: 500,
        };
      }

      return {
        success: true,
        data: {
          attempt_id: attemptData.id,
          exam_id: examId,
          status: 'in_progress' as const,
          duration_minutes: examData.duration_minutes,
          questions_count: questionsCount || 0,
          started_at: attemptData.started_at,
        },
      };
    });

    if (!result) {
      return {
        success: false,
        error: 'System busy, please try again',
        statusCode: 503,
      };
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in startExamAttempt:', message);
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

// ============================================================================
// SUBMIT ANSWER
// ============================================================================

/**
 * Submit an answer to a question
 * Validates option exists, prevents duplicate answers, and records timing
 */
export async function submitAnswer(
  userId: string,
  attemptId: string,
  input: SubmitAnswerInput,
  timeSpentSeconds?: number
): Promise<{
  success: boolean;
  data?: SubmitAnswerResponse;
  error?: string;
  statusCode?: number;
}> {
  try {
    const client = getSupabaseServiceClient();

    // Validate attempt exists and belongs to user
    const { data: attemptData, error: attemptError } = await client
      .from('user_exam_attempts')
      .select('id, exam_id, is_completed')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();

    if (attemptError || !attemptData) {
      return {
        success: false,
        error: 'Attempt not found',
        statusCode: 404,
      };
    }

    // Verify attempt is still in progress
    if (attemptData.is_completed) {
      return {
        success: false,
        error: 'Attempt is not in progress',
        statusCode: 400,
      };
    }

    // Validate question exists and is in exam
    const { data: questionData, error: questionError } = await client
      .from('exam_questions')
      .select('questions(id, option_a, option_b, option_c, option_d, option_e)')
      .eq('exam_id', attemptData.exam_id)
      .eq('question_id', input.question_id)
      .single();

    if (questionError || !questionData) {
      return {
        success: false,
        error: 'Question not found in exam',
        statusCode: 404,
      };
    }

    // Validate option index is valid
    const questions = questionData.questions as any;
    const questionRecord = Array.isArray(questions) ? questions[0] : questions;
    const options = [
      questionRecord?.option_a,
      questionRecord?.option_b,
      questionRecord?.option_c,
      questionRecord?.option_d,
      questionRecord?.option_e,
    ].filter(Boolean);
    if (input.selected_option_index < 0 || input.selected_option_index >= options.length) {
      return {
        success: false,
        error: 'Invalid option index',
        statusCode: 400,
      };
    }

    // Use advisory lock to prevent race conditions on answer submission
    const lockId = hashUuidToLockId(attemptId);

    const result = await withAdvisoryLock(lockId, async () => {
      // Check if already answered
      const { data: existingAnswer, error: checkError } = await client
        .from('user_exam_answers')
        .select('id')
        .eq('attempt_id', attemptId)
        .eq('question_id', input.question_id)
        .single();

      if (!checkError && existingAnswer) {
        return {
          success: false,
          error: 'Already answered this question',
          statusCode: 409,
        };
      }

      // Get correct answer from question
      const { data: fullQuestion, error: fullQuestionError } = await client
        .from('questions')
        .select('correct_answer')
        .eq('id', input.question_id)
        .single();

      if (fullQuestionError || !fullQuestion) {
        return {
          success: false,
          error: 'Failed to retrieve question details',
          statusCode: 500,
        };
      }

      // Convert correct_answer letter to index for comparison
      const correctAnswerIndex = convertCorrectAnswerLetterToIndex(
        fullQuestion.correct_answer
      );
      const isCorrect = input.selected_option_index === correctAnswerIndex;

      // Record answer
      const { error: insertError } = await client
        .from('user_exam_answers')
        .insert([
          {
            attempt_id: attemptId,
            question_id: input.question_id,
            selected_answer: input.selected_option_index.toString(),
            is_correct: isCorrect,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        // Check if it's a duplicate constraint error
        if (insertError.code === '23505') {
          return {
            success: false,
            error: 'Already answered this question',
            statusCode: 409,
          };
        }
        console.error('Error recording answer:', insertError);
        return {
          success: false,
          error: 'Failed to record answer',
          statusCode: 500,
        };
      }

      // Count total questions and answered efficiently (single query instead of N+1)
      // Fetch both counts with Promise.all for parallelization
      const [totalQuestionsResult, answeredCountResult] = await Promise.all([
        client
          .from('exam_questions')
          .select('id', { count: 'exact', head: true })
          .eq('exam_id', attemptData.exam_id),
        client
          .from('user_exam_answers')
          .select('id', { count: 'exact', head: true })
          .eq('attempt_id', attemptId),
      ]);

      const totalQuestions = totalQuestionsResult.count || 0;
      const answeredCount = answeredCountResult.count || 0;

      return {
        success: true,
        data: {
          correct: isCorrect,
          answer_number: (answeredCount || 0) + 1,
          total_questions: totalQuestions || 0,
        },
      };
    });

    if (!result) {
      return {
        success: false,
        error: 'System busy, please try again',
        statusCode: 503,
      };
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in submitAnswer:', message);
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

// ============================================================================
// COMPLETE ATTEMPT
// ============================================================================

/**
 * Complete an exam attempt
 * Triggers scoring calculation and stores results
 */
export async function completeExamAttempt(
  userId: string,
  attemptId: string
): Promise<{
  success: boolean;
  data?: CompleteAttemptResponse;
  error?: string;
  statusCode?: number;
}> {
  try {
    const client = getSupabaseServiceClient();

    // Validate attempt exists and belongs to user
    const { data: attemptData, error: attemptError } = await client
      .from('user_exam_attempts')
      .select('id, exam_id, is_completed')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();

    if (attemptError || !attemptData) {
      return {
        success: false,
        error: 'Attempt not found',
        statusCode: 404,
      };
    }

    // Verify attempt is in progress
    if (attemptData.is_completed) {
      return {
        success: false,
        error: 'Attempt is not in progress',
        statusCode: 400,
      };
    }

    // Use advisory lock
    const lockId = hashUuidToLockId(attemptId);

    const result = await withAdvisoryLock(lockId, async () => {
      // Calculate score using stored procedure
      const { data: scoreData, error: scoreError } = await client
        .rpc('calculate_exam_score', {
          p_attempt_id: attemptId,
          p_exam_id: attemptData.exam_id,
        });

      if (scoreError || !scoreData || scoreData.length === 0) {
        console.error('Error calculating score:', scoreError);
        return {
          success: false,
          error: 'Failed to calculate exam score',
          statusCode: 500,
        };
      }

      const { score, passing, weak_areas } = scoreData[0];

      // Update attempt with completion data
      const completedAt = new Date().toISOString();
      const { error: updateError } = await client
        .from('user_exam_attempts')
        .update({
          is_completed: true,
          completed_at: completedAt,
        })
        .eq('id', attemptId);

      if (updateError) {
        console.error('Error updating attempt:', updateError);
        return {
          success: false,
          error: 'Failed to complete attempt',
          statusCode: 500,
        };
      }

      return {
        success: true,
        data: {
          attempt_id: attemptId,
          score: score,
          passing: passing,
          passed_at: completedAt,
          weak_areas: weak_areas || [],
        },
      };
    });

    if (!result) {
      return {
        success: false,
        error: 'System busy, please try again',
        statusCode: 503,
      };
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in completeExamAttempt:', message);
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

// ============================================================================
// GET ATTEMPT DETAILS
// ============================================================================

/**
 * Get attempt details with all answers and review data
 */
export async function getAttemptDetails(
  userId: string,
  attemptId: string
): Promise<{
  success: boolean;
  data?: GetAttemptResponse;
  error?: string;
  statusCode?: number;
}> {
  try {
    const client = getSupabaseServiceClient();

    // Get attempt
    const { data: attemptData, error: attemptError } = await client
      .from('user_exam_attempts')
      .select('id, exam_id, is_completed, started_at, completed_at')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();

    if (attemptError || !attemptData) {
      return {
        success: false,
        error: 'Attempt not found',
        statusCode: 404,
      };
    }

    // Get all answers with question details
    const { data: answersData, error: answersError } = await client
      .from('user_exam_answers')
      .select(
        `
        id,
        question_id,
        selected_answer,
        is_correct,
        created_at,
        questions(id, question_text, correct_answer, subject_id)
      `
      )
      .eq('attempt_id', attemptId)
      .order('created_at', { ascending: true });

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return {
        success: false,
        error: 'Failed to retrieve answers',
        statusCode: 500,
      };
    }

    // Format answers
    const formattedAnswers: AnswerDetail[] = (answersData || []).map((answer: any) => {
      const correctAnswerIndex = convertCorrectAnswerLetterToIndex(
        answer.questions?.correct_answer || 'a'
      );
      return {
        question_id: answer.question_id,
        question_text: answer.questions?.question_text || '',
        user_answer_index: parseInt(answer.selected_answer || '0', 10),
        correct_answer_index: correctAnswerIndex,
        is_correct: answer.is_correct || false,
        time_spent_seconds: 0, // Not stored in new schema, calculated separately if needed
        subject_id: answer.questions?.subject_id, // Include topic for weak areas
      } as any;
    });

    // Calculate total time
    const totalTimeMinutes = formattedAnswers.reduce((sum, a) => sum + a.time_spent_seconds, 0) / 60;

    return {
      success: true,
      data: {
        attempt_id: attemptData.id,
        exam_id: attemptData.exam_id,
        status: attemptData.is_completed ? 'completed' : 'in_progress',
        started_at: attemptData.started_at,
        completed_at: attemptData.completed_at || undefined,
        total_time_minutes: Math.round(totalTimeMinutes),
        answers: formattedAnswers,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in getAttemptDetails:', message);
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

// ============================================================================
// HELPER: Get answer count for attempt
// ============================================================================

export async function getAnswerCount(attemptId: string): Promise<number> {
  const client = getSupabaseServiceClient();
  const { count } = await client
    .from('user_exam_answers')
    .select('*', { count: 'exact' })
    .eq('attempt_id', attemptId);
  return count || 0;
}

