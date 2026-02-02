/**
 * Exam Service Tests
 * Comprehensive test suite for exam CRUD operations and validations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deduplicateQuestionIds,
  checkQuestionIdsExist,
} from '../exam.service';

describe('Exam Service - Validation & Utilities', () => {
  describe('deduplicateQuestionIds', () => {
    it('should remove duplicate question IDs', () => {
      const questionIds = ['id-1', 'id-2', 'id-1', 'id-3', 'id-2'];
      const result = deduplicateQuestionIds(questionIds);
      expect(result).toHaveLength(3);
      expect(new Set(result).size).toBe(result.length); // All unique
    });

    it('should maintain order of first occurrence', () => {
      const questionIds = ['id-3', 'id-1', 'id-2', 'id-1'];
      const result = deduplicateQuestionIds(questionIds);
      expect(result[0]).toBe('id-3');
      expect(result[1]).toBe('id-1');
      expect(result[2]).toBe('id-2');
    });

    it('should return empty array for empty input', () => {
      const result = deduplicateQuestionIds([]);
      expect(result).toEqual([]);
    });

    it('should handle single element', () => {
      const result = deduplicateQuestionIds(['id-1']);
      expect(result).toEqual(['id-1']);
    });

    it('should handle all duplicates', () => {
      const result = deduplicateQuestionIds(['id-1', 'id-1', 'id-1']);
      expect(result).toEqual(['id-1']);
    });
  });
});
