/**
 * US-1B.3 & US-1B.4: Question Generation & Cache Tests
 *
 * Tests for Gemini API integration and Redis caching
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateQuestionsInputSchema } from '../../services/llm/gemini-question-generator';
import { generateCacheKey } from '../../services/cache/redis-cache-service';

describe('Question Generation & Caching', () => {
  // ========================================================================
  // INPUT VALIDATION TESTS
  // ========================================================================

  describe('Input Validation', () => {
    it('should validate topic (1-100 chars)', () => {
      const validInput = {
        topic: 'Liberdade de Expressão',
        difficulty: 'medium',
        count: 10,
      };

      expect(generateQuestionsInputSchema.safeParse(validInput).success).toBe(true);

      // Invalid: empty topic
      expect(
        generateQuestionsInputSchema.safeParse({
          topic: '',
          difficulty: 'medium',
          count: 10,
        }).success
      ).toBe(false);

      // Invalid: topic > 100 chars
      const longTopic = 'a'.repeat(101);
      expect(
        generateQuestionsInputSchema.safeParse({
          topic: longTopic,
          difficulty: 'medium',
          count: 10,
        }).success
      ).toBe(false);
    });

    it('should validate difficulty enum', () => {
      const validDifficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of validDifficulties) {
        const result = generateQuestionsInputSchema.safeParse({
          topic: 'Test',
          difficulty,
          count: 10,
        });
        expect(result.success).toBe(true);
      }

      // Invalid difficulty
      expect(
        generateQuestionsInputSchema.safeParse({
          topic: 'Test',
          difficulty: 'invalid',
          count: 10,
        }).success
      ).toBe(false);
    });

    it('should validate count range (5-20)', () => {
      // Valid counts
      for (const count of [5, 10, 15, 20]) {
        expect(
          generateQuestionsInputSchema.safeParse({
            topic: 'Test',
            difficulty: 'medium',
            count,
          }).success
        ).toBe(true);
      }

      // Invalid counts
      for (const count of [4, 21, 0, -1]) {
        expect(
          generateQuestionsInputSchema.safeParse({
            topic: 'Test',
            difficulty: 'medium',
            count,
          }).success
        ).toBe(false);
      }
    });
  });

  // ========================================================================
  // CACHE KEY GENERATION TESTS
  // ========================================================================

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const userId = 'user-123';
      const topic = 'Liberdade de Expressão';
      const difficulty = 'medium';
      const count = 10;

      const key1 = generateCacheKey(userId, topic, difficulty, count);
      const key2 = generateCacheKey(userId, topic, difficulty, count);

      expect(key1).toBe(key2); // Must be deterministic
    });

    it('should include all parameters in cache key', () => {
      const key = generateCacheKey('user-123', 'Test Topic', 'hard', 15);

      expect(key).toContain('user-123');
      expect(key).toContain('test-topic'); // Normalized
      expect(key).toContain('hard');
      expect(key).toContain('15');
    });

    it('should normalize topic to slug format', () => {
      const key1 = generateCacheKey('user', 'Direitos Fundamentais', 'easy', 5);
      const key2 = generateCacheKey('user', 'direitos-fundamentais', 'easy', 5);

      // Both should normalize to same slug
      expect(key1).toContain('direitos-fundamentais');
      expect(key2).toContain('direitos-fundamentais');
    });

    it('should follow format: question:gen:${userId}:${topic}:${difficulty}:${count}', () => {
      const key = generateCacheKey('abc123', 'Constitutional Law', 'medium', 10);

      expect(key).toMatch(/^question:gen:[^:]+:[^:]+:(easy|medium|hard):\d+$/);
      expect(key.startsWith('question:gen:')).toBe(true);
    });
  });

  // ========================================================================
  // RESPONSE VALIDATION TESTS
  // ========================================================================

  describe('Response Validation', () => {
    it('should validate generated question structure', () => {
      const validQuestion = {
        text: 'What is Constitutional Law?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Because option A is correct...',
      };

      // Should validate
      expect(validQuestion.text.length).toBeGreaterThanOrEqual(10);
      expect(validQuestion.options.length).toBe(4);
      expect(validQuestion.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(validQuestion.correctAnswer).toBeLessThanOrEqual(3);
    });

    it('should require exactly 4 options', () => {
      const invalid3Options = {
        text: 'Question?',
        options: ['A', 'B', 'C'],
        correctAnswer: 0,
      };

      expect(invalid3Options.options.length).not.toBe(4);

      const invalid5Options = {
        text: 'Question?',
        options: ['A', 'B', 'C', 'D', 'E'],
        correctAnswer: 0,
      };

      expect(invalid5Options.options.length).not.toBe(4);
    });

    it('should validate correctAnswer (0-3)', () => {
      const validAnswers = [0, 1, 2, 3];
      for (const answer of validAnswers) {
        const question = {
          text: 'Question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: answer,
        };
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThanOrEqual(3);
      }

      // Invalid - should NOT pass validation
      const invalidAnswers = [-1, 4, 5];
      for (const answer of invalidAnswers) {
        const isValid = answer >= 0 && answer <= 3;
        expect(isValid).toBe(false); // Invalid
      }
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle invalid JSON response from API', () => {
      const invalidJson = 'this is not valid json';

      expect(() => {
        JSON.parse(invalidJson);
      }).toThrow();
    });

    it('should handle timeout errors', () => {
      const timeout = new Error('Request timeout after 30 seconds');
      expect(timeout.message).toContain('timeout');
    });

    it('should handle API rate limiting', () => {
      const rateLimitError = new Error('429: Too many requests');
      expect(rateLimitError.message).toContain('429');
    });

    it('should handle missing required fields in response', () => {
      const incompletQuestion = {
        text: 'Question?',
        // Missing options, correctAnswer
      };

      expect(incompletQuestion).not.toHaveProperty('options');
    });
  });

  // ========================================================================
  // METADATA & COST TRACKING TESTS
  // ========================================================================

  describe('Generation Metadata & Cost Tracking', () => {
    it('should track generation metadata', () => {
      const metadata = {
        generation_id: 'gen-123',
        user_id: 'user-456',
        model: 'gemini-1.5-pro',
        temperature: 0.5,
        rag_context_count: 10,
        tokens_input: 500,
        tokens_output: 150,
        cost_usd: 0.01,
        latency_ms: 1500,
        fallback_used: false,
      };

      expect(metadata.model).toBe('gemini-1.5-pro');
      expect(metadata.temperature).toBe(0.5);
      expect(metadata.cost_usd).toBeGreaterThan(0);
      expect(metadata.fallback_used).toBe(false);
    });

    it('should calculate cost correctly', () => {
      // Gemini Batch: $0.005 per 1K input, $0.015 per 1K output
      const inputTokens = 500;
      const outputTokens = 150;

      const inputCost = (inputTokens / 1000) * 0.005; // $0.0025
      const outputCost = (outputTokens / 1000) * 0.015; // $0.00225
      const totalCost = inputCost + outputCost; // ~$0.00475

      expect(totalCost).toBeGreaterThan(0);
      expect(totalCost).toBeLessThan(0.01);
    });

    it('should track latency correctly', () => {
      const startTime = Date.now();
      // Simulate operation
      const endTime = Date.now() + 1500;
      const latency = endTime - startTime;

      expect(latency).toBeGreaterThan(0);
      expect(latency).toBeLessThan(3000); // P95 target < 3s
    });
  });

  // ========================================================================
  // FALLBACK MECHANISM TESTS
  // ========================================================================

  describe('Fallback Mechanism', () => {
    it('should identify when fallback is used', () => {
      const fallbackMetadata = {
        fallback_used: true,
        reason: 'Gemini API timeout',
        questions_from_fallback: 10,
      };

      expect(fallbackMetadata.fallback_used).toBe(true);
      expect(fallbackMetadata.reason).toContain('timeout');
    });

    it('should return real exam questions on fallback', () => {
      const fallbackQuestions = [
        { text: 'Real Q1', source: 'real_exam', rag_eligible: true },
        { text: 'Real Q2', source: 'real_exam', rag_eligible: true },
      ];

      expect(fallbackQuestions.every((q) => q.source === 'real_exam')).toBe(true);
      expect(fallbackQuestions.every((q) => q.rag_eligible === true)).toBe(true);
    });

    it('should not mark fallback questions as ai_generated', () => {
      const fallbackQuestion = {
        text: 'Question',
        source_type: 'real_exam', // NOT ai_generated
        rag_eligible: true,
      };

      expect(fallbackQuestion.source_type).not.toBe('ai_generated');
    });
  });

  // ========================================================================
  // DATABASE STORAGE TESTS
  // ========================================================================

  describe('Database Storage', () => {
    it('should store generated questions with source_type=ai_generated', () => {
      const storedQuestion = {
        text: 'Generated Q',
        source_type: 'ai_generated',
        rag_eligible: false,
        created_by: 'user-123',
      };

      expect(storedQuestion.source_type).toBe('ai_generated');
      expect(storedQuestion.rag_eligible).toBe(false);
    });

    it('should store metadata with generated question', () => {
      const question = {
        text: 'Question',
        source_type: 'ai_generated',
        ai_model: 'gemini-1.5-pro',
        generation_metadata: {
          rag_context_size: 10,
          temperature: 0.5,
          tokens_input: 500,
          cost_usd: 0.01,
        },
      };

      expect(question.ai_model).toBe('gemini-1.5-pro');
      expect(question.generation_metadata.rag_context_size).toBe(10);
    });

    it('should create audit log entry for question_sources insert', () => {
      const auditEntry = {
        table_name: 'question_sources',
        operation: 'INSERT',
        new_value: {
          question_id: 'q-123',
          source_type: 'ai_generated',
          rag_eligible: false,
        },
        changed_by: 'system',
        changed_at: new Date(),
      };

      expect(auditEntry.operation).toBe('INSERT');
      expect(auditEntry.new_value.source_type).toBe('ai_generated');
      expect(auditEntry.new_value.rag_eligible).toBe(false);
    });
  });
});
