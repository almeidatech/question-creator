/**
 * Exam Service
 * Handles CRUD operations, validation, and business logic for exams
 */

import { getSupabaseServiceClient, hashUuidToLockId, withAdvisoryLock } from '@/services/database/supabase-client';
import {
  CreateExamInput,
  UpdateExamInput,
  ExamStatus,
  ExamWithQuestions,
  ExamListItem,
  ExamResponse,
} from '@/schemas/exam.schema';

interface ExamQueryFilters {
  status?: ExamStatus;
  limit?: number;
  page?: number;
}

/**
 * Validate that all question IDs exist in the database
 */
export async function checkQuestionIdsExist(questionIds: string[]): Promise<boolean> {
  const client = getSupabaseServiceClient();

  const { data, error } = await client
    .from('questions')
    .select('id')
    .in('id', questionIds);

  if (error) {
    console.error('Error checking question IDs:', error);
    return false;
  }

  // Check if all question IDs were found
  return data?.length === questionIds.length;
}

/**
 * Deduplicate question IDs array
 */
export function deduplicateQuestionIds(questionIds: string[]): string[] {
  return Array.from(new Set(questionIds));
}

/**
 * Create a new exam
 */
export async function createExam(
  userId: string,
  input: CreateExamInput
): Promise<{
  success: boolean;
  data?: { exam_id: string; name: string; question_count: number; created_at: string };
  error?: string;
}> {
  try {
    const client = getSupabaseServiceClient();

    // Deduplicate question IDs
    const deduplicatedIds = deduplicateQuestionIds(input.question_ids);

    // Verify deduplication didn't reduce count below minimum (shouldn't happen but safety check)
    if (deduplicatedIds.length < 5) {
      return {
        success: false,
        error: 'Exam must have at least 5 unique questions',
      };
    }

    // Check all question IDs exist
    const questionsExist = await checkQuestionIdsExist(deduplicatedIds);
    if (!questionsExist) {
      return {
        success: false,
        error: 'One or more question IDs do not exist',
      };
    }

    // Use advisory lock to prevent race conditions
    const lockId = hashUuidToLockId(userId);

    const result = await withAdvisoryLock(lockId, async () => {
      // Create exam
      const { data: examData, error: examError } = await client
        .from('exams')
        .insert([
          {
            user_id: userId,
            name: input.name,
            description: input.description || null,
            duration_minutes: input.duration_minutes,
            passing_score: input.passing_score,
            status: 'active',
          },
        ])
        .select('id, created_at')
        .single();

      if (examError || !examData) {
        console.error('Error creating exam:', examError);
        return {
          success: false,
          error: 'Failed to create exam',
        };
      }

      const examId = examData.id;
      const createdAt = examData.created_at;

      // Create exam_questions associations
      const examQuestions = deduplicatedIds.map((questionId, index) => ({
        exam_id: examId,
        question_id: questionId,
        order_index: index,
      }));

      const { error: associationError } = await client
        .from('exam_questions')
        .insert(examQuestions);

      if (associationError) {
        console.error('Error associating questions:', associationError);
        // Try to rollback exam creation
        await client.from('exams').delete().eq('id', examId);
        return {
          success: false,
          error: 'Failed to associate questions with exam',
        };
      }

      return {
        success: true,
        data: {
          exam_id: examId,
          name: input.name,
          question_count: deduplicatedIds.length,
          created_at: createdAt,
        },
      };
    });

    if (!result) {
      return {
        success: false,
        error: 'System busy, please try again',
      };
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in createExam:', message);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Get list of exams for a user with pagination and filtering
 */
export async function listExams(
  userId: string,
  filters?: ExamQueryFilters
): Promise<{
  success: boolean;
  data?: {
    exams: ExamListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}> {
  try {
    const client = getSupabaseServiceClient();
    const limit = Math.min(filters?.limit || 20, 100); // Max 100
    const page = Math.max(filters?.page || 1, 1);
    const offset = (page - 1) * limit;

    // Build query
    let countQuery = client
      .from('exams')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    let dataQuery = client
      .from('exams')
      .select(
        `
        id,
        name,
        status,
        created_at,
        updated_at
      `
      )
      .eq('user_id', userId);

    // Apply status filter if provided
    if (filters?.status) {
      countQuery = countQuery.eq('status', filters.status);
      dataQuery = dataQuery.eq('status', filters.status);
    }

    // Get total count
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting exams:', countError);
      return {
        success: false,
        error: 'Failed to retrieve exams',
      };
    }

    // Get paginated data
    const { data: exams, error: queryError } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error('Error fetching exams:', queryError);
      return {
        success: false,
        error: 'Failed to retrieve exams',
      };
    }

    // Get question counts efficiently with a single query (not N+1)
    // Use database-level aggregation instead of fetching all and counting in app
    const { data: questionCounts } = await client
      .from('exam_questions')
      .select('exam_id, count:id', { count: 'exact', head: false })
      .in('exam_id', (exams || []).map((e) => e.id));

    // Map counts by exam ID for easy lookup
    const countsByExamId = (questionCounts || []).reduce(
      (acc: Record<string, number>, row: any) => {
        acc[row.exam_id] = row.count || 0;
        return acc;
      },
      {}
    );

    // Transform exams with counts from single query
    const examsWithDetails = (exams || []).map((exam) => ({
      exam_id: exam.id,
      name: exam.name,
      question_count: countsByExamId[exam.id] || 0,
      status: exam.status,
      created_at: exam.created_at,
      last_attempted: undefined,
      best_score: undefined,
    }));

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return {
      success: true,
      data: {
        exams: examsWithDetails,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          pages: totalPages,
        },
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in listExams:', message);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Get exam details with questions and attempt history
 */
export async function getExamDetails(
  userId: string,
  examId: string
): Promise<{
  success: boolean;
  data?: ExamWithQuestions;
  error?: string;
  statusCode?: number;
}> {
  try {
    const client = getSupabaseServiceClient();

    // Get exam
    const { data: examData, error: examError } = await client
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('user_id', userId)
      .single();

    if (examError || !examData) {
      if (examError?.code === 'PGRST116') {
        return {
          success: false,
          error: 'Exam not found',
          statusCode: 404,
        };
      }
      console.error('Error fetching exam:', examError);
      return {
        success: false,
        error: 'Exam not found',
        statusCode: 404,
      };
    }

    // Verify ownership (RLS should handle this, but double-check)
    if (examData.user_id !== userId) {
      return {
        success: false,
        error: 'Access denied',
        statusCode: 403,
      };
    }

    // Get exam questions with question details
    const { data: examQuestions, error: questionsError } = await client
      .from('exam_questions')
      .select(
        `
        id,
        order_index,
        questions (
          id,
          text,
          options
        )
      `
      )
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching exam questions:', questionsError);
      return {
        success: false,
        error: 'Failed to fetch exam questions',
        statusCode: 500,
      };
    }

    // Format questions
    const formattedQuestions = (examQuestions || []).map((eq: any) => ({
      question_id: eq.questions.id,
      text: eq.questions.text,
      options: eq.questions.options || [],
      order: eq.order_index,
    }));

    // TODO: Get attempt history when exam_attempts table is created
    const attempts: any[] = [];

    return {
      success: true,
      data: {
        exam_id: examData.id,
        name: examData.name,
        description: examData.description,
        duration_minutes: examData.duration_minutes,
        passing_score: examData.passing_score,
        status: examData.status,
        questions: formattedQuestions,
        attempts,
        created_at: examData.created_at,
        updated_at: examData.updated_at,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in getExamDetails:', message);
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

/**
 * Update exam
 * Prevents updates if attempt is in progress
 */
export async function updateExam(
  userId: string,
  examId: string,
  input: UpdateExamInput
): Promise<{
  success: boolean;
  data?: ExamResponse;
  error?: string;
  statusCode?: number;
}> {
  try {
    const client = getSupabaseServiceClient();

    // Get exam and verify ownership
    const { data: examData, error: examError } = await client
      .from('exams')
      .select('*')
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

    // TODO: Check if attempt is in progress when exam_attempts table is created
    // For now, skip this check as the table doesn't exist yet
    const attemptInProgress = false;

    if (attemptInProgress) {
      return {
        success: false,
        error: 'Cannot update exam while an attempt is in progress',
        statusCode: 409,
      };
    }

    // If question_ids are being updated, validate them
    if (input.question_ids) {
      const deduplicatedIds = deduplicateQuestionIds(input.question_ids);

      if (deduplicatedIds.length < 5) {
        return {
          success: false,
          error: 'Exam must have at least 5 unique questions',
          statusCode: 400,
        };
      }

      const questionsExist = await checkQuestionIdsExist(deduplicatedIds);
      if (!questionsExist) {
        return {
          success: false,
          error: 'One or more question IDs do not exist',
          statusCode: 400,
        };
      }

      // Use advisory lock
      const lockId = hashUuidToLockId(examId);
      const result = await withAdvisoryLock(lockId, async () => {
        // Delete old exam_questions
        const { error: deleteError } = await client
          .from('exam_questions')
          .delete()
          .eq('exam_id', examId);

        if (deleteError) {
          console.error('Error deleting exam questions:', deleteError);
          return {
            success: false,
            error: 'Failed to update exam questions',
            statusCode: 500,
          };
        }

        // Insert new exam_questions
        const examQuestions = deduplicatedIds.map((questionId, index) => ({
          exam_id: examId,
          question_id: questionId,
          order_index: index,
        }));

        const { error: insertError } = await client
          .from('exam_questions')
          .insert(examQuestions);

        if (insertError) {
          console.error('Error inserting exam questions:', insertError);
          return {
            success: false,
            error: 'Failed to update exam questions',
            statusCode: 500,
          };
        }

        // Update exam metadata
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes;
        if (input.passing_score !== undefined) updateData.passing_score = input.passing_score;

        const { data: updatedExam, error: updateError } = await client
          .from('exams')
          .update(updateData)
          .eq('id', examId)
          .select()
          .single();

        if (updateError || !updatedExam) {
          console.error('Error updating exam:', updateError);
          return {
            success: false,
            error: 'Failed to update exam',
            statusCode: 500,
          };
        }

        return {
          success: true,
          data: {
            exam_id: updatedExam.id,
            name: updatedExam.name,
            description: updatedExam.description,
            duration_minutes: updatedExam.duration_minutes,
            passing_score: updatedExam.passing_score,
            status: updatedExam.status,
            created_at: updatedExam.created_at,
            updated_at: updatedExam.updated_at,
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
    }

    // Update exam metadata only (no question changes)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.duration_minutes !== undefined) updateData.duration_minutes = input.duration_minutes;
    if (input.passing_score !== undefined) updateData.passing_score = input.passing_score;

    const { data: updatedExam, error: updateError } = await client
      .from('exams')
      .update(updateData)
      .eq('id', examId)
      .select()
      .single();

    if (updateError || !updatedExam) {
      console.error('Error updating exam:', updateError);
      return {
        success: false,
        error: 'Failed to update exam',
        statusCode: 500,
      };
    }

    return {
      success: true,
      data: {
        exam_id: updatedExam.id,
        name: updatedExam.name,
        description: updatedExam.description,
        duration_minutes: updatedExam.duration_minutes,
        passing_score: updatedExam.passing_score,
        status: updatedExam.status,
        created_at: updatedExam.created_at,
        updated_at: updatedExam.updated_at,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in updateExam:', message);
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}

