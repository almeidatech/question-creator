/**
 * Admin Dashboard Service
 * Aggregates dashboard statistics from multiple tables
 * Primary service for the admin dashboard feature
 *
 * Specification: US-3.2 Admin Dashboard & Review Queue
 */

import { getSupabaseServiceClient } from '@/services/database/supabase-client';
import { getSystemHealth, SystemHealthMetrics } from './metrics.service';

export interface UserStats {
  active_users_24h: number;
  active_users_7d: number;
  active_users_30d: number;
  total_users: number;
}

export interface QuestionStats {
  total_questions: number;
  real_exam_questions: number;
  ai_generated_questions: number;
  avg_reputation: number;
}

export interface ImportStats {
  total_completed_imports: number;
  total_failed_imports: number;
  last_import_date: string | null;
  questions_imported_total: number;
}

export interface ImportHistoryItem {
  id: string;
  filename: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  total_rows: number;
  successful_imports: number;
  duplicate_count: number;
  error_count: number;
  created_by?: string;
}

export interface ReviewStats {
  pending_feedback_count: number;
  questions_under_review: number;
}

export interface DashboardStats {
  users: UserStats;
  questions: QuestionStats;
  imports: ImportStats;
  reviews: ReviewStats;
  system_health: SystemHealthMetrics;
  recent_imports: ImportHistoryItem[];
  cached_at: string;
}

/**
 * Get user activity statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const client = getSupabaseServiceClient();

    // Query materialized view for cached stats
    const { data, error } = await client
      .from('admin_dashboard_stats')
      .select(
        'total_users, active_users_24h, active_users_7d, active_users_30d'
      )
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        active_users_24h: 0,
        active_users_7d: 0,
        active_users_30d: 0,
        total_users: 0,
      };
    }

    return {
      total_users: data?.total_users || 0,
      active_users_24h: data?.active_users_24h || 0,
      active_users_7d: data?.active_users_7d || 0,
      active_users_30d: data?.active_users_30d || 0,
    };
  } catch (err) {
    console.error('Failed to get user stats:', err);
    return {
      active_users_24h: 0,
      active_users_7d: 0,
      active_users_30d: 0,
      total_users: 0,
    };
  }
}

/**
 * Get question statistics
 */
export async function getQuestionStats(): Promise<QuestionStats> {
  try {
    const client = getSupabaseServiceClient();

    const { data, error } = await client
      .from('admin_dashboard_stats')
      .select(
        'total_questions, real_exam_questions, ai_generated_questions, avg_question_reputation'
      )
      .single();

    if (error) {
      console.error('Error fetching question stats:', error);
      return {
        total_questions: 0,
        real_exam_questions: 0,
        ai_generated_questions: 0,
        avg_reputation: 0,
      };
    }

    return {
      total_questions: data?.total_questions || 0,
      real_exam_questions: data?.real_exam_questions || 0,
      ai_generated_questions: data?.ai_generated_questions || 0,
      avg_reputation: data?.avg_question_reputation || 0,
    };
  } catch (err) {
    console.error('Failed to get question stats:', err);
    return {
      total_questions: 0,
      real_exam_questions: 0,
      ai_generated_questions: 0,
      avg_reputation: 0,
    };
  }
}

/**
 * Get import statistics
 */
export async function getImportStats(): Promise<ImportStats> {
  try {
    const client = getSupabaseServiceClient();

    const { data, error } = await client
      .from('admin_dashboard_stats')
      .select(
        'total_completed_imports, total_failed_imports, last_import_date'
      )
      .single();

    if (error) {
      console.error('Error fetching import stats:', error);
      return {
        total_completed_imports: 0,
        total_failed_imports: 0,
        last_import_date: null,
        questions_imported_total: 0,
      };
    }

    return {
      total_completed_imports: data?.total_completed_imports || 0,
      total_failed_imports: data?.total_failed_imports || 0,
      last_import_date: data?.last_import_date,
      questions_imported_total: 0, // Calculated separately
    };
  } catch (err) {
    console.error('Failed to get import stats:', err);
    return {
      total_completed_imports: 0,
      total_failed_imports: 0,
      last_import_date: null,
      questions_imported_total: 0,
    };
  }
}

/**
 * Get review queue statistics
 */
export async function getReviewStats(): Promise<ReviewStats> {
  try {
    const client = getSupabaseServiceClient();

    const { data, error } = await client
      .from('admin_dashboard_stats')
      .select('pending_feedback_count')
      .single();

    if (error) {
      console.error('Error fetching review stats:', error);
      return {
        pending_feedback_count: 0,
        questions_under_review: 0,
      };
    }

    return {
      pending_feedback_count: data?.pending_feedback_count || 0,
      questions_under_review: 0, // Calculated from feedback count
    };
  } catch (err) {
    console.error('Failed to get review stats:', err);
    return {
      pending_feedback_count: 0,
      questions_under_review: 0,
    };
  }
}

/**
 * Get recent import history (last 10 imports)
 */
export async function getRecentImports(): Promise<ImportHistoryItem[]> {
  try {
    const client = getSupabaseServiceClient();

    const { data, error } = await client
      .from('question_imports')
      .select('id, filename, status, created_at, completed_at, total_rows, successful_imports, duplicate_count, error_count')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent imports:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      filename: item.filename,
      status: item.status,
      created_at: item.created_at,
      completed_at: item.completed_at,
      total_rows: item.total_rows || 0,
      successful_imports: item.successful_imports || 0,
      duplicate_count: item.duplicate_count || 0,
      error_count: item.error_count || 0,
    }));
  } catch (err) {
    console.error('Failed to get recent imports:', err);
    return [];
  }
}

/**
 * Get comprehensive dashboard statistics
 * Aggregates all stats from multiple sources
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [users, questions, imports, reviews, systemHealth, recentImports] =
    await Promise.all([
      getUserStats(),
      getQuestionStats(),
      getImportStats(),
      getReviewStats(),
      getSystemHealth(),
      getRecentImports(),
    ]);

  return {
    users,
    questions,
    imports,
    reviews,
    system_health: systemHealth,
    recent_imports: recentImports,
    cached_at: new Date().toISOString(),
  };
}

