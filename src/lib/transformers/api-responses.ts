/**
 * API Response Transformers
 * Transforms raw API/database responses to UI-ready formats
 * Ensures consistency between backend data and frontend components
 */

import { transformDBQuestionToUI } from './question';
import { Question } from '@/stores/exam.store';
import { Tables } from '@/database/database.types';

/**
 * Transform exam response from API to UI format
 */
export function transformExamResponse(apiExam: any): any {
  return {
    exam_id: apiExam.exam_id || apiExam.id,
    name: apiExam.name,
    description: apiExam.description,
    duration_minutes: apiExam.duration_minutes,
    passing_score: apiExam.passing_score,
    status: apiExam.status,
    created_at: apiExam.created_at,
    updated_at: apiExam.updated_at,
    questions: transformQuestionsList(apiExam.questions || []),
    attempts: apiExam.attempts || [],
  };
}

/**
 * Transform questions list from API to UI format
 */
export function transformQuestionsList(questions: any[]): Question[] {
  return questions.map(q => {
    // Handle nested structure from API
    const questionData = q.questions || q;
    return transformDBQuestionToUI(questionData);
  });
}

/**
 * Transform user object from API to store format
 */
export function transformUserResponse(apiUser: any): any {
  return {
    id: apiUser.id,
    email: apiUser.email,
    full_name: apiUser.full_name || `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim(),
    user_role: apiUser.user_role || 'student',
    subscription_tier: apiUser.subscription_tier || 'free',
    avatar_url: apiUser.avatar_url,
    is_active: apiUser.is_active !== false,
  };
}

/**
 * Transform login/signup response
 */
export function transformAuthResponse(apiResponse: any): any {
  return {
    user: transformUserResponse(apiResponse.user || apiResponse),
    token: apiResponse.token || apiResponse.access_token,
    refresh_token: apiResponse.refresh_token,
    token_type: apiResponse.token_type || 'Bearer',
    expires_in: apiResponse.expires_in,
  };
}

/**
 * Transform question generation response
 */
export function transformGeneratedQuestionsResponse(apiResponse: any): any {
  return {
    questions: (apiResponse.questions || []).map((q: any) => ({
      id: q.id || `generated_${Date.now()}_${Math.random()}`,
      text: q.text || q.question_text,
      options: Array.isArray(q.options)
        ? q.options
        : [q.option_a, q.option_b, q.option_c, q.option_d]
            .filter(Boolean),
      correct_answer_index: q.correct_answer_index ??
        (typeof q.correct_answer === 'string'
          ? ['a', 'b', 'c', 'd'].indexOf(q.correct_answer.toLowerCase())
          : q.correct_answer),
      difficulty: q.difficulty || 'medium',
      topic: q.topic || q.subject_id || 'General',
      explanation: q.explanation,
    })),
    metadata: apiResponse.metadata,
  };
}

/**
 * Transform exam attempt response
 */
export function transformAttemptResponse(apiResponse: any): any {
  return {
    attempt_id: apiResponse.attempt_id || apiResponse.id,
    exam_id: apiResponse.exam_id,
    status: apiResponse.status || 'in_progress',
    score: apiResponse.score,
    started_at: apiResponse.started_at,
    completed_at: apiResponse.completed_at,
    total_time_minutes: apiResponse.total_time_minutes || 0,
    answers: (apiResponse.answers || []).map((a: any) => ({
      question_id: a.question_id,
      question_text: a.question_text,
      user_answer_index: a.user_answer_index,
      correct_answer_index: a.correct_answer_index,
      is_correct: a.is_correct,
      time_spent_seconds: a.time_spent_seconds || 0,
      topic: a.topic || a.subject_id, // Topic for weak areas tracking
      subject_id: a.subject_id,
    })),
  };
}

/**
 * Transform dashboard stats response
 */
export function transformDashboardStatsResponse(apiResponse: any): any {
  return {
    stats: {
      total_questions_attempted: apiResponse.stats?.total_questions_attempted || 0,
      correct_count: apiResponse.stats?.correct_count || 0,
      accuracy_percentage: apiResponse.stats?.accuracy_percentage || 0,
      streak_days: apiResponse.stats?.streak_days || 0,
    },
    activity: apiResponse.activity || [],
    weakAreas: apiResponse.weakAreas || [],
  };
}

/**
 * Transform error response to consistent format
 */
export function transformErrorResponse(error: any): string {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'An unexpected error occurred';
}
