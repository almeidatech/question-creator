import { getSupabaseClient } from '@/services/database/supabase-client';

export interface ExamScore {
  score: number;
  passing: boolean;
  weak_areas: WeakArea[];
}

export interface WeakArea {
  topic_id: string;
  topic_name: string;
  accuracy: number;
  total_questions?: number;
  correct_answers?: number;
}

export interface ExamAnalytics {
  exam_id: string;
  exam_name: string;
  total_attempts: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  passing_rate: number;
  average_time_minutes: number;
}

export interface StudentAnalytics {
  total_exams_taken: number;
  average_score: number;
  improvement_trend: number;
  total_study_time_minutes: number;
}

export interface TimeAnalysis {
  average_time_seconds: number;
  median_time_seconds: number;
  min_time_seconds: number;
  max_time_seconds: number;
}

/**
 * Service for exam scoring and analytics
 */
export class ScoringService {
  /**
   * Calculate exam score and weak areas for a specific attempt
   * This is typically called automatically by the database trigger
   */
  static async calculateExamScore(
    attemptId: string,
    examId: string
  ): Promise<ExamScore> {
    const { data, error } = await getSupabaseClient().rpc(
      'calculate_exam_score',
      {
        p_attempt_id: attemptId,
        p_exam_id: examId,
      }
    );

    if (error) {
      console.error('Error calculating exam score:', error);
      throw new Error(`Failed to calculate exam score: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No score calculation result returned');
    }

    const result = data[0];
    return {
      score: result.score,
      passing: result.passing,
      weak_areas: result.weak_areas || [],
    };
  }

  /**
   * Get performance analytics for a specific exam
   */
  static async getExamAnalytics(
    examId: string,
    userId: string
  ): Promise<ExamAnalytics> {
    const { data, error } = await getSupabaseClient().rpc(
      'get_exam_analytics',
      {
        p_exam_id: examId,
        p_user_id: userId,
      }
    );

    if (error) {
      console.error('Error fetching exam analytics:', error);
      throw new Error(`Failed to fetch exam analytics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No analytics data found for exam');
    }

    const result = data[0];
    return {
      exam_id: result.exam_id,
      exam_name: result.exam_name,
      total_attempts: result.total_attempts || 0,
      average_score: result.average_score || 0,
      best_score: result.best_score || 0,
      worst_score: result.worst_score || 0,
      passing_rate: result.passing_rate || 0,
      average_time_minutes: result.average_time_minutes || 0,
    };
  }

  /**
   * Get frequent weak areas across all attempts for an exam
   */
  static async getFrequentWeakAreas(
    examId: string,
    userId: string
  ): Promise<WeakArea[]> {
    const { data, error } = await getSupabaseClient().rpc(
      'get_frequent_weak_areas',
      {
        p_exam_id: examId,
        p_user_id: userId,
      }
    );

    if (error) {
      console.error('Error fetching weak areas:', error);
      throw new Error(`Failed to fetch weak areas: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      topic_id: item.topic_id,
      topic_name: item.topic_name,
      accuracy: item.average_accuracy,
      frequency: item.frequency,
    }));
  }

  /**
   * Get overall student performance analytics
   */
  static async getStudentAnalytics(userId: string): Promise<StudentAnalytics> {
    const { data, error } = await getSupabaseClient().rpc(
      'get_student_analytics',
      {
        p_user_id: userId,
      }
    );

    if (error) {
      console.error('Error fetching student analytics:', error);
      throw new Error(`Failed to fetch student analytics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        total_exams_taken: 0,
        average_score: 0,
        improvement_trend: 0,
        total_study_time_minutes: 0,
      };
    }

    const result = data[0];
    return {
      total_exams_taken: result.total_exams_taken || 0,
      average_score: result.average_score || 0,
      improvement_trend: result.improvement_trend || 0,
      total_study_time_minutes: result.total_study_time_minutes || 0,
    };
  }

  /**
   * Get time analysis for a specific attempt
   */
  static async getTimeAnalysis(attemptId: string): Promise<TimeAnalysis> {
    const { data, error } = await getSupabaseClient().rpc(
      'get_time_analysis',
      {
        p_attempt_id: attemptId,
      }
    );

    if (error) {
      console.error('Error fetching time analysis:', error);
      throw new Error(`Failed to fetch time analysis: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No time analysis data found');
    }

    const result = data[0];
    return {
      average_time_seconds: result.average_time_seconds || 0,
      median_time_seconds: result.median_time_seconds || 0,
      min_time_seconds: result.min_time_seconds || 0,
      max_time_seconds: result.max_time_seconds || 0,
    };
  }

  /**
   * Get weak areas for a specific attempt
   */
  static async getAttemptWeakAreas(attemptId: string): Promise<WeakArea[]> {
    const { data, error } = await getSupabaseClient()
      .from('exam_results')
      .select('weak_areas')
      .eq('attempt_id', attemptId)
      .single();

    if (error) {
      console.error('Error fetching attempt weak areas:', error);
      throw new Error(`Failed to fetch weak areas: ${error.message}`);
    }

    if (!data || !data.weak_areas) {
      return [];
    }

    return data.weak_areas;
  }

  /**
   * Verify scoring calculation accuracy with test data
   */
  static async verifyScoring(
    attemptId: string,
    expectedCorrectAnswers: number,
    expectedTotalQuestions: number
  ): Promise<{ score: number; isAccurate: boolean }> {
    // Get actual correct answers from database
    const { data: answerData, error: answerError } = await getSupabaseClient()
      .from('exam_answers')
      .select('is_correct')
      .eq('attempt_id', attemptId);

    if (answerError) {
      throw new Error(`Failed to verify answers: ${answerError.message}`);
    }

    const actualCorrect = answerData?.filter((a: any) => a.is_correct).length || 0;
    const actualTotal = answerData?.length || 0;

    const expectedScore = Math.round(
      (expectedCorrectAnswers / expectedTotalQuestions) * 100
    );
    const actualScore = Math.round((actualCorrect / actualTotal) * 100);

    return {
      score: actualScore,
      isAccurate: expectedScore === actualScore,
    };
  }
}

