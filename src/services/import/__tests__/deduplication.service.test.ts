import { describe, it, expect } from 'vitest';
import { DeduplicationService, DuplicateMatch } from '../deduplication.service';
import { DEDUPLICATION_THRESHOLD } from '../constants';

describe('DeduplicationService', () => {
  describe('Levenshtein Distance Calculation', () => {
    it('should return 0 for identical strings', () => {
      const distance = DeduplicationService.levenshteinDistance('hello', 'hello');
      expect(distance).toBe(0);
    });

    it('should return correct distance for simple insertion', () => {
      // 'cat' -> 'cats' requires 1 insertion
      const distance = DeduplicationService.levenshteinDistance('cat', 'cats');
      expect(distance).toBe(1);
    });

    it('should return correct distance for simple deletion', () => {
      // 'cats' -> 'cat' requires 1 deletion
      const distance = DeduplicationService.levenshteinDistance('cats', 'cat');
      expect(distance).toBe(1);
    });

    it('should return correct distance for simple substitution', () => {
      // 'cat' -> 'bat' requires 1 substitution
      const distance = DeduplicationService.levenshteinDistance('cat', 'bat');
      expect(distance).toBe(1);
    });

    it('should return correct distance for multiple edits', () => {
      // 'kitten' -> 'sitting'
      // k->s (1), e->i (1), insert g (1) = 3 edits
      const distance = DeduplicationService.levenshteinDistance('kitten', 'sitting');
      expect(distance).toBe(3);
    });

    it('should be case-insensitive', () => {
      const distance1 = DeduplicationService.levenshteinDistance('Hello', 'hello');
      const distance2 = DeduplicationService.levenshteinDistance('HELLO', 'hello');
      expect(distance1).toBe(0);
      expect(distance2).toBe(0);
    });

    it('should handle empty strings', () => {
      expect(DeduplicationService.levenshteinDistance('', '')).toBe(0);
      expect(DeduplicationService.levenshteinDistance('hello', '')).toBe(5);
      expect(DeduplicationService.levenshteinDistance('', 'world')).toBe(5);
    });

    it('should handle long strings', () => {
      const str1 = 'A quick brown fox jumps over the lazy dog';
      const str2 = 'A quick brown fox jumps over the hazy dog';
      // Only 'lazy' vs 'hazy' differs = 1 substitution
      const distance = DeduplicationService.levenshteinDistance(str1, str2);
      expect(distance).toBe(1);
    });
  });

  describe('Similarity Calculation', () => {
    it('should return 100 for identical strings', () => {
      const similarity = DeduplicationService.calculateSimilarity('question', 'question');
      expect(similarity).toBe(100);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = DeduplicationService.calculateSimilarity('abc', 'xyz');
      expect(similarity).toBe(0);
    });

    it('should return 100 for empty strings', () => {
      const similarity = DeduplicationService.calculateSimilarity('', '');
      expect(similarity).toBe(100);
    });

    it('should calculate similarity correctly for partial match', () => {
      // 'hello' vs 'hallo' - 1 edit out of 5 chars = 80%
      const similarity = DeduplicationService.calculateSimilarity('hello', 'hallo');
      expect(similarity).toBe(80);
    });

    it('should handle case-insensitive comparison', () => {
      const similarity1 = DeduplicationService.calculateSimilarity('HELLO', 'hello');
      expect(similarity1).toBe(100);
    });

    it('should return correct similarity for real questions', () => {
      const q1 = 'What is the capital of France?';
      const q2 = 'What is the capital of France';
      const similarity = DeduplicationService.calculateSimilarity(q1, q2);
      // Only missing '?' = 97%
      expect(similarity).toBeGreaterThan(90);
    });
  });

  describe('Deduplication', () => {
    it('should identify exact duplicates', () => {
      const csvRows = [
        {
          text: 'What is 2+2?',
          option_a: '3',
          option_b: '4',
          option_c: '5',
          option_d: '6',
          correct_index: 1,
          topic: 'math',
          difficulty: 'easy',
        },
      ];

      const existing = [
        { id: 'q1', text: 'What is 2+2?' },
      ];

      const result = DeduplicationService.deduplicate(csvRows, existing);

      expect(result.newQuestions).toHaveLength(0);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].similarity).toBe(100);
    });

    it('should identify fuzzy duplicates above threshold', () => {
      const csvRows = [
        {
          text: 'What is the capital of France',
          option_a: 'London',
          option_b: 'Paris',
          option_c: 'Berlin',
          option_d: 'Madrid',
          correct_index: 1,
          topic: 'geography',
          difficulty: 'easy',
        },
      ];

      const existing = [
        { id: 'q1', text: 'What is the capital of France?' }, // Very similar (only ? difference)
      ];

      const result = DeduplicationService.deduplicate(csvRows, existing);

      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].similarity).toBeGreaterThanOrEqual(90);
    });

    it('should not identify questions below threshold as duplicates', () => {
      const csvRows = [
        {
          text: 'What is the capital of France?',
          option_a: 'London',
          option_b: 'Paris',
          option_c: 'Berlin',
          option_d: 'Madrid',
          correct_index: 1,
          topic: 'geography',
          difficulty: 'easy',
        },
      ];

      const existing = [
        { id: 'q1', text: 'What is the largest country in Europe?' }, // Very different
      ];

      const result = DeduplicationService.deduplicate(csvRows, existing);

      expect(result.newQuestions).toHaveLength(1);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should identify multiple duplicates in batch', () => {
      const csvRows = [
        {
          text: 'What is 2+2?',
          option_a: '3',
          option_b: '4',
          option_c: '5',
          option_d: '6',
          correct_index: 1,
          topic: 'math',
          difficulty: 'easy',
        },
        {
          text: 'What is the capital of France',
          option_a: 'London',
          option_b: 'Paris',
          option_c: 'Berlin',
          option_d: 'Madrid',
          correct_index: 1,
          topic: 'geography',
          difficulty: 'easy',
        },
        {
          text: 'What is 5+5?',
          option_a: '8',
          option_b: '9',
          option_c: '10',
          option_d: '11',
          correct_index: 2,
          topic: 'math',
          difficulty: 'easy',
        },
      ];

      const existing = [
        { id: 'q1', text: 'What is 2+2?' },
        { id: 'q2', text: 'What is the capital of France?' }, // Very similar to second row
      ];

      const result = DeduplicationService.deduplicate(csvRows, existing);

      expect(result.newQuestions).toHaveLength(1);
      expect(result.duplicates).toHaveLength(2);
    });

    it('should preserve non-duplicate questions', () => {
      const csvRows = [
        {
          text: 'New question 1?',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 0,
          topic: 'topic1',
          difficulty: 'easy',
        },
        {
          text: 'New question 2?',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 1,
          topic: 'topic2',
          difficulty: 'hard',
        },
      ];

      const existing: any[] = [];

      const result = DeduplicationService.deduplicate(csvRows, existing);

      expect(result.newQuestions).toHaveLength(2);
      expect(result.duplicates).toHaveLength(0);
      expect(result.newQuestions).toEqual(csvRows);
    });

    it('should handle empty CSV rows', () => {
      const result = DeduplicationService.deduplicate([], []);
      expect(result.newQuestions).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should handle empty existing questions', () => {
      const csvRows = [
        {
          text: 'Question?',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 0,
          topic: 'topic',
          difficulty: 'easy',
        },
      ];

      const result = DeduplicationService.deduplicate(csvRows, []);

      expect(result.newQuestions).toHaveLength(1);
      expect(result.duplicates).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate deduplication rate correctly', () => {
      const result = {
        newQuestions: Array(70).fill({}),
        duplicates: Array(30).fill({} as DuplicateMatch),
      };

      const stats = DeduplicationService.getStatistics(result);

      expect(stats.newCount).toBe(70);
      expect(stats.duplicateCount).toBe(30);
      expect(stats.deduplicationRate).toBe(30);
    });

    it('should handle zero deduplication rate', () => {
      const result = {
        newQuestions: Array(100).fill({}),
        duplicates: [],
      };

      const stats = DeduplicationService.getStatistics(result);

      expect(stats.newCount).toBe(100);
      expect(stats.duplicateCount).toBe(0);
      expect(stats.deduplicationRate).toBe(0);
    });

    it('should handle 100% deduplication', () => {
      const result = {
        newQuestions: [],
        duplicates: Array(50).fill({} as DuplicateMatch),
      };

      const stats = DeduplicationService.getStatistics(result);

      expect(stats.newCount).toBe(0);
      expect(stats.duplicateCount).toBe(50);
      expect(stats.deduplicationRate).toBe(100);
    });
  });

  describe('Threshold Accuracy', () => {
    it('should use correct deduplication threshold', () => {
      expect(DEDUPLICATION_THRESHOLD).toBe(85);
    });

    it('should accept questions above threshold', () => {
      const csvRows = [
        {
          text: 'What is the capital of France?',
          option_a: 'London',
          option_b: 'Paris',
          option_c: 'Berlin',
          option_d: 'Madrid',
          correct_index: 1,
          topic: 'geography',
          difficulty: 'easy',
        },
      ];

      // Very similar strings with only 1 char difference
      // Should be >90% similar
      const existing = [
        { id: 'q1', text: 'What is the capital of France' }, // Only difference is ?
      ];

      const result = DeduplicationService.deduplicate(csvRows, existing);
      const similarity = result.duplicates[0]?.similarity || 0;

      expect(similarity).toBeGreaterThanOrEqual(DEDUPLICATION_THRESHOLD);
    });
  });
});

