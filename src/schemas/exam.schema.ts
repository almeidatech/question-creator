/**
 * Exam Validation Schemas
 * Zod schemas for exam CRUD operations with strict validation
 */

import { z } from 'zod';

export const CreateExamSchema = z.object({
  name: z
    .string()
    .min(1, 'Exam name is required')
    .max(255, 'Exam name must not exceed 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  question_ids: z
    .array(z.string().uuid('Invalid question ID format'))
    .min(5, 'Exam must have at least 5 questions')
    .max(50, 'Exam must not exceed 50 questions'),
  duration_minutes: z
    .number()
    .int('Duration must be an integer')
    .min(5, 'Duration must be at least 5 minutes')
    .max(180, 'Duration must not exceed 180 minutes'),
  passing_score: z
    .number()
    .int('Passing score must be an integer')
    .min(0, 'Passing score must be at least 0%')
    .max(100, 'Passing score must not exceed 100%'),
});

export type CreateExamInput = z.infer<typeof CreateExamSchema>;

export const UpdateExamSchema = z.object({
  name: z
    .string()
    .min(1, 'Exam name is required')
    .max(255, 'Exam name must not exceed 255 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  question_ids: z
    .array(z.string().uuid('Invalid question ID format'))
    .min(5, 'Exam must have at least 5 questions')
    .max(50, 'Exam must not exceed 50 questions')
    .optional(),
  duration_minutes: z
    .number()
    .int('Duration must be an integer')
    .min(5, 'Duration must be at least 5 minutes')
    .max(180, 'Duration must not exceed 180 minutes')
    .optional(),
  passing_score: z
    .number()
    .int('Passing score must be an integer')
    .min(0, 'Passing score must be at least 0%')
    .max(100, 'Passing score must not exceed 100%')
    .optional(),
});

export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;

export const ExamStatusSchema = z.enum(['draft', 'active', 'archived']);

export type ExamStatus = z.infer<typeof ExamStatusSchema>;

// Response schemas
export const ExamResponseSchema = z.object({
  exam_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  duration_minutes: z.number(),
  passing_score: z.number(),
  status: ExamStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ExamResponse = z.infer<typeof ExamResponseSchema>;

export const ExamWithQuestionsSchema = z.object({
  exam_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  duration_minutes: z.number(),
  passing_score: z.number(),
  status: ExamStatusSchema,
  questions: z.array(
    z.object({
      question_id: z.string().uuid(),
      text: z.string(),
      options: z.array(z.string()),
      order: z.number(),
    })
  ),
  attempts: z.array(
    z.object({
      attempt_id: z.string().uuid(),
      score: z.number().optional(),
      attempted_at: z.string().datetime(),
    })
  ).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ExamWithQuestions = z.infer<typeof ExamWithQuestionsSchema>;

export const ExamListItemSchema = z.object({
  exam_id: z.string().uuid(),
  name: z.string(),
  question_count: z.number(),
  status: ExamStatusSchema,
  created_at: z.string().datetime(),
  last_attempted: z.string().datetime().optional(),
  best_score: z.number().optional(),
});

export type ExamListItem = z.infer<typeof ExamListItemSchema>;
