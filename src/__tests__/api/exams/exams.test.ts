/**
 * Exam API Endpoint Tests
 * Tests for POST /api/exams and GET /api/exams endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateExamSchema, UpdateExamSchema } from '@/schemas/exam.schema';

describe('Exam API - Validation Schemas', () => {
  describe('CreateExamSchema', () => {
    const validInput = {
      name: 'Constitutional Law Final',
      description: 'Topics 1-5 comprehensive exam',
      question_ids: [
        '123e4567-e89b-12d3-a456-426614174000',
        '223e4567-e89b-12d3-a456-426614174000',
        '323e4567-e89b-12d3-a456-426614174000',
        '423e4567-e89b-12d3-a456-426614174000',
        '523e4567-e89b-12d3-a456-426614174000',
      ],
      duration_minutes: 120,
      passing_score: 70,
    };

    it('should accept valid input', () => {
      const result = CreateExamSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const input = { ...validInput };
      delete (input as any).name;
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 255 characters', () => {
      const input = {
        ...validInput,
        name: 'a'.repeat(256),
      };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const input = { ...validInput };
      delete (input as any).description;
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject description exceeding 1000 characters', () => {
      const input = {
        ...validInput,
        description: 'a'.repeat(1001),
      };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject less than 5 questions', () => {
      const input = {
        ...validInput,
        question_ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '223e4567-e89b-12d3-a456-426614174000',
          '323e4567-e89b-12d3-a456-426614174000',
          '423e4567-e89b-12d3-a456-426614174000',
        ],
      };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 questions', () => {
      const input = {
        ...validInput,
        question_ids: Array.from({ length: 51 }, (_, i) =>
          `123e4567-e89b-12d3-a456-4266141740${String(i).padStart(2, '0')}`
        ),
      };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const input = {
        ...validInput,
        question_ids: ['not-a-uuid', ...validInput.question_ids.slice(1)],
      };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject duration below 5 minutes', () => {
      const input = { ...validInput, duration_minutes: 4 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject duration above 180 minutes', () => {
      const input = { ...validInput, duration_minutes: 181 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer duration', () => {
      const input = { ...validInput, duration_minutes: 120.5 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject passing score below 0%', () => {
      const input = { ...validInput, passing_score: -1 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject passing score above 100%', () => {
      const input = { ...validInput, passing_score: 101 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer passing score', () => {
      const input = { ...validInput, passing_score: 70.5 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept 5 questions (minimum)', () => {
      const input = {
        ...validInput,
        question_ids: validInput.question_ids.slice(0, 5),
      };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept 50 questions (maximum)', () => {
      const input = {
        ...validInput,
        question_ids: Array.from({ length: 50 }, (_, i) =>
          `123e4567-e89b-12d3-a456-4266141740${String(i).padStart(2, '0')}`
        ),
      };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept 5 minute duration (minimum)', () => {
      const input = { ...validInput, duration_minutes: 5 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept 180 minute duration (maximum)', () => {
      const input = { ...validInput, duration_minutes: 180 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept 0% passing score (minimum)', () => {
      const input = { ...validInput, passing_score: 0 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept 100% passing score (maximum)', () => {
      const input = { ...validInput, passing_score: 100 };
      const result = CreateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateExamSchema', () => {
    it('should accept partial updates', () => {
      const input = {
        name: 'Updated Exam Name',
      };
      const result = UpdateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept empty update', () => {
      const input = {};
      const result = UpdateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid duration', () => {
      const input = { duration_minutes: 200 };
      const result = UpdateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept all fields', () => {
      const input = {
        name: 'Updated name',
        description: 'Updated description',
        question_ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '223e4567-e89b-12d3-a456-426614174000',
          '323e4567-e89b-12d3-a456-426614174000',
          '423e4567-e89b-12d3-a456-426614174000',
          '523e4567-e89b-12d3-a456-426614174000',
        ],
        duration_minutes: 90,
        passing_score: 75,
      };
      const result = UpdateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject less than 5 questions when updating questions', () => {
      const input = {
        question_ids: [
          '123e4567-e89b-12d3-a456-426614174000',
          '223e4567-e89b-12d3-a456-426614174000',
        ],
      };
      const result = UpdateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

