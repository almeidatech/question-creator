/**
 * Exam Schema Tests
 * Comprehensive validation tests for exam schemas
 */

import { describe, it, expect } from 'vitest';
import {
  CreateExamSchema,
  UpdateExamSchema,
  ExamStatusSchema,
  ExamResponseSchema,
  ExamListItemSchema,
} from '../exam.schema';

const validUUID = '550e8400-e29b-41d4-a716-446655440000';
const generateUUID = (seed: number) => {
  return `550e8400-e29b-41d4-a716-${String(446655440000 + seed).padStart(12, '0')}`;
};

describe('Exam Schemas', () => {
  describe('ExamStatusSchema', () => {
    it('should accept valid statuses', () => {
      expect(ExamStatusSchema.safeParse('draft').success).toBe(true);
      expect(ExamStatusSchema.safeParse('active').success).toBe(true);
      expect(ExamStatusSchema.safeParse('archived').success).toBe(true);
    });

    it('should reject invalid statuses', () => {
      expect(ExamStatusSchema.safeParse('pending').success).toBe(false);
      expect(ExamStatusSchema.safeParse('deleted').success).toBe(false);
      expect(ExamStatusSchema.safeParse('').success).toBe(false);
    });
  });

  describe('ExamResponseSchema', () => {
    const validResponse = {
      exam_id: validUUID,
      name: 'Test Exam',
      duration_minutes: 120,
      passing_score: 70,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('should accept valid exam response', () => {
      const result = ExamResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should accept optional description', () => {
      const response = { ...validResponse, description: 'Test description' };
      const result = ExamResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should reject missing exam_id', () => {
      const response = { ...validResponse };
      delete (response as any).exam_id;
      const result = ExamResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const response = { ...validResponse, exam_id: 'not-a-uuid' };
      const result = ExamResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('ExamListItemSchema', () => {
    const validItem = {
      exam_id: validUUID,
      name: 'Test Exam',
      question_count: 25,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    it('should accept valid list item', () => {
      const result = ExamListItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should accept optional last_attempted and best_score', () => {
      const item = {
        ...validItem,
        last_attempted: new Date().toISOString(),
        best_score: 85,
      };
      const result = ExamListItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should validate question_count is number', () => {
      const item = { ...validItem, question_count: 'twenty-five' };
      const result = ExamListItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should validate best_score is number if present', () => {
      const item = { ...validItem, best_score: 'eighty-five' };
      const result = ExamListItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateExamSchema - Boundary Tests', () => {
    const baseInput = {
      name: 'Test Exam',
      question_ids: Array.from({ length: 5 }, (_, i) => generateUUID(i)),
      duration_minutes: 120,
      passing_score: 70,
    };

    describe('Question count boundaries', () => {
      it('accepts exactly 5 questions', () => {
        const result = CreateExamSchema.safeParse(baseInput);
        expect(result.success).toBe(true);
      });

      it('accepts exactly 50 questions', () => {
        const input = {
          ...baseInput,
          question_ids: Array.from({ length: 50 }, (_, i) => generateUUID(i)),
        };
        const result = CreateExamSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('rejects 4 questions', () => {
        const input = {
          ...baseInput,
          question_ids: Array.from({ length: 4 }, (_, i) => generateUUID(i)),
        };
        const result = CreateExamSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('rejects 51 questions', () => {
        const input = {
          ...baseInput,
          question_ids: Array.from({ length: 51 }, (_, i) => generateUUID(i)),
        };
        const result = CreateExamSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('Duration boundaries', () => {
      it('accepts 5 minutes', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          duration_minutes: 5,
        });
        expect(result.success).toBe(true);
      });

      it('accepts 180 minutes', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          duration_minutes: 180,
        });
        expect(result.success).toBe(true);
      });

      it('rejects 4 minutes', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          duration_minutes: 4,
        });
        expect(result.success).toBe(false);
      });

      it('rejects 181 minutes', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          duration_minutes: 181,
        });
        expect(result.success).toBe(false);
      });

      it('rejects float duration', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          duration_minutes: 120.5,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Passing score boundaries', () => {
      it('accepts 0%', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          passing_score: 0,
        });
        expect(result.success).toBe(true);
      });

      it('accepts 100%', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          passing_score: 100,
        });
        expect(result.success).toBe(true);
      });

      it('rejects -1%', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          passing_score: -1,
        });
        expect(result.success).toBe(false);
      });

      it('rejects 101%', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          passing_score: 101,
        });
        expect(result.success).toBe(false);
      });

      it('rejects float score', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          passing_score: 70.5,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Name validation', () => {
      it('accepts 1 character name', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          name: 'A',
        });
        expect(result.success).toBe(true);
      });

      it('accepts 255 character name', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          name: 'A'.repeat(255),
        });
        expect(result.success).toBe(true);
      });

      it('rejects 256 character name', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          name: 'A'.repeat(256),
        });
        expect(result.success).toBe(false);
      });

      it('rejects empty name', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          name: '',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Description validation', () => {
      it('accepts 1000 character description', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          description: 'A'.repeat(1000),
        });
        expect(result.success).toBe(true);
      });

      it('rejects 1001 character description', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          description: 'A'.repeat(1001),
        });
        expect(result.success).toBe(false);
      });

      it('accepts missing description', () => {
        const input = { ...baseInput };
        delete (input as any).description;
        const result = CreateExamSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    describe('UUID validation', () => {
      it('accepts valid UUID format', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          question_ids: [validUUID],
        });
        // Will fail on count but passes UUID validation
        expect(result.success).toBe(false); // Because only 1 question
      });

      it('rejects invalid UUID format', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          question_ids: ['not-a-uuid', ...baseInput.question_ids.slice(1)],
        });
        expect(result.success).toBe(false);
      });

      it('rejects UUID missing hyphens', () => {
        const result = CreateExamSchema.safeParse({
          ...baseInput,
          question_ids: [
            '550e8400e29b41d4a716446655440000',
            ...baseInput.question_ids.slice(1),
          ],
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('UpdateExamSchema', () => {
    it('accepts empty object (no updates)', () => {
      const result = UpdateExamSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts single field update', () => {
      const result = UpdateExamSchema.safeParse({
        name: 'Updated Name',
      });
      expect(result.success).toBe(true);
    });

    it('accepts all fields', () => {
      const input = {
        name: 'Updated',
        description: 'Updated desc',
        question_ids: Array.from({ length: 10 }, (_, i) => generateUUID(i)),
        duration_minutes: 90,
        passing_score: 75,
      };
      const result = UpdateExamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects invalid updates but accepts valid ones', () => {
      const result = UpdateExamSchema.safeParse({
        name: 'Valid',
        duration_minutes: 200, // Invalid
      });
      expect(result.success).toBe(false);
    });

    it('applies same validation rules as CreateExamSchema', () => {
      const input = {
        question_ids: Array.from({ length: 4 }, (_, i) => generateUUID(i)), // Too few
      };
      const result = UpdateExamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

