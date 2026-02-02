/**
 * Exam Attempt & Answer Validation Schemas
 * Zod schemas for exam attempts and answers with strict validation
 */

import { z } from 'zod';

// ============================================================================
// ATTEMPT STATUS ENUM
// ============================================================================

export const AttemptStatusSchema = z.enum(['in_progress', 'completed']);
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>;

// ============================================================================
// ANSWER SUBMISSION
// ============================================================================

export const SubmitAnswerSchema = z.object({
  question_id: z
    .string()
    .uuid('Invalid question ID format'),
  selected_option_index: z
    .number()
    .int('Option index must be an integer')
    .min(0, 'Option index must be between 0 and 3')
    .max(3, 'Option index must be between 0 and 3'),
});

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

// ============================================================================
// ATTEMPT CREATION RESPONSE
// ============================================================================

export const StartAttemptResponseSchema = z.object({
  attempt_id: z.string().uuid(),
  exam_id: z.string().uuid(),
  status: AttemptStatusSchema,
  duration_minutes: z.number(),
  questions_count: z.number(),
  started_at: z.string().datetime(),
});

export type StartAttemptResponse = z.infer<typeof StartAttemptResponseSchema>;

// ============================================================================
// ANSWER SUBMISSION RESPONSE
// ============================================================================

export const SubmitAnswerResponseSchema = z.object({
  correct: z.boolean(),
  answer_number: z.number().int(),
  total_questions: z.number().int(),
});

export type SubmitAnswerResponse = z.infer<typeof SubmitAnswerResponseSchema>;

// ============================================================================
// ATTEMPT COMPLETION RESPONSE
// ============================================================================

export const WeakAreaSchema = z.object({
  topic: z.string(),
  accuracy: z.number().int().min(0).max(100),
});

export type WeakArea = z.infer<typeof WeakAreaSchema>;

export const CompleteAttemptResponseSchema = z.object({
  attempt_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  passing: z.boolean(),
  passed_at: z.string().datetime(),
  weak_areas: z.array(WeakAreaSchema),
});

export type CompleteAttemptResponse = z.infer<typeof CompleteAttemptResponseSchema>;

// ============================================================================
// ATTEMPT DETAIL RESPONSE
// ============================================================================

export const AnswerDetailSchema = z.object({
  question_id: z.string().uuid(),
  question_text: z.string(),
  user_answer_index: z.number().int().min(0).max(3),
  correct_answer_index: z.number().int().min(0).max(3),
  is_correct: z.boolean(),
  time_spent_seconds: z.number().int().min(0),
});

export type AnswerDetail = z.infer<typeof AnswerDetailSchema>;

export const GetAttemptResponseSchema = z.object({
  attempt_id: z.string().uuid(),
  exam_id: z.string().uuid(),
  status: AttemptStatusSchema,
  score: z.number().int().min(0).max(100).optional(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  total_time_minutes: z.number().int().optional(),
  answers: z.array(AnswerDetailSchema),
});

export type GetAttemptResponse = z.infer<typeof GetAttemptResponseSchema>;

// ============================================================================
// INTERNAL DATA STRUCTURES
// ============================================================================

export const ExamAttemptRecordSchema = z.object({
  id: z.string().uuid(),
  exam_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: AttemptStatusSchema,
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  score: z.number().int().min(0).max(100).optional(),
  passing: z.boolean().optional(),
  created_at: z.string().datetime(),
});

export type ExamAttemptRecord = z.infer<typeof ExamAttemptRecordSchema>;

export const ExamAnswerRecordSchema = z.object({
  id: z.string().uuid(),
  attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  selected_option_index: z.number().int().min(0).max(3),
  is_correct: z.boolean().optional(),
  time_spent_seconds: z.number().int().min(0).optional(),
  answered_at: z.string().datetime(),
});

export type ExamAnswerRecord = z.infer<typeof ExamAnswerRecordSchema>;

export const ExamResultRecordSchema = z.object({
  id: z.string().uuid(),
  attempt_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  passing: z.boolean(),
  weak_areas: z.array(WeakAreaSchema).nullable().optional(),
  created_at: z.string().datetime(),
});

export type ExamResultRecord = z.infer<typeof ExamResultRecordSchema>;
