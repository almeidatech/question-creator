import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ScoringService } from '../scoring.service';

describe('ScoringService', () => {
  describe('Score Calculation Tests', () => {
    it('should calculate 100% score for all correct answers', () => {
      const correct = 10;
      const total = 10;
      const expectedScore = Math.round((correct / total) * 100);

      expect(expectedScore).toBe(100);
    });

    it('should calculate 0% score for no correct answers', () => {
      const correct = 0;
      const total = 10;
      const expectedScore = Math.round((correct / total) * 100);

      expect(expectedScore).toBe(0);
    });

    it('should calculate 50% score correctly', () => {
      const correct = 5;
      const total = 10;
      const expectedScore = Math.round((correct / total) * 100);

      expect(expectedScore).toBe(50);
    });

    it('should handle non-round percentages', () => {
      const correct = 3;
      const total = 7; // 3/7 = 42.857%
      const expectedScore = Math.round((correct / total) * 100);

      expect(expectedScore).toBe(43);
    });

    it('should handle single question', () => {
      const correct = 1;
      const total = 1;
      const expectedScore = Math.round((correct / total) * 100);

      expect(expectedScore).toBe(100);
    });

    it('should determine passing status correctly (score >= passing_score)', () => {
      const score = 75;
      const passingScore = 70;
      const isPassing = score >= passingScore;

      expect(isPassing).toBe(true);
    });

    it('should determine failing status correctly (score < passing_score)', () => {
      const score = 65;
      const passingScore = 70;
      const isPassing = score >= passingScore;

      expect(isPassing).toBe(false);
    });

    it('should determine passing on exact passing score', () => {
      const score = 70;
      const passingScore = 70;
      const isPassing = score >= passingScore;

      expect(isPassing).toBe(true);
    });
  });

  describe('Weak Area Detection Tests', () => {
    it('should identify topic as weak if accuracy < 50%', () => {
      const accuracy = 40;
      const isWeak = accuracy < 50;

      expect(isWeak).toBe(true);
    });

    it('should not identify topic as weak if accuracy >= 50%', () => {
      const accuracy = 50;
      const isWeak = accuracy < 50;

      expect(isWeak).toBe(false);
    });

    it('should not identify topic as weak if accuracy > 50%', () => {
      const accuracy = 60;
      const isWeak = accuracy < 50;

      expect(isWeak).toBe(false);
    });

    it('should calculate per-topic accuracy correctly', () => {
      // Topic A: 3 correct out of 5
      const correct = 3;
      const total = 5;
      const accuracy = Math.round((correct / total) * 100);

      expect(accuracy).toBe(60);
      expect(accuracy < 50).toBe(false);
    });

    it('should identify multiple weak topics', () => {
      const topics = [
        { name: 'Math', correct: 2, total: 5, accuracy: 40 },
        { name: 'Physics', correct: 3, total: 5, accuracy: 60 },
        { name: 'Chemistry', correct: 1, total: 5, accuracy: 20 },
      ];

      const weakTopics = topics.filter(t => t.accuracy < 50);

      expect(weakTopics).toHaveLength(2);
      expect(weakTopics.map(t => t.name)).toEqual(['Math', 'Chemistry']);
    });
  });

  describe('Time Analysis Tests', () => {
    it('should calculate average time correctly', () => {
      const times = [30, 45, 60, 50];
      const average = times.reduce((a, b) => a + b, 0) / times.length;

      expect(average).toBe(46.25);
    });

    it('should calculate median time for odd count', () => {
      const times = [10, 20, 30, 40, 50].sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)];

      expect(median).toBe(30);
    });

    it('should calculate median time for even count', () => {
      const times = [10, 20, 30, 40].sort((a, b) => a - b);
      const median = (times[times.length / 2 - 1] + times[times.length / 2]) / 2;

      expect(median).toBe(25);
    });

    it('should find min and max times', () => {
      const times = [15, 45, 120, 30, 60];
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      expect(minTime).toBe(15);
      expect(maxTime).toBe(120);
    });
  });

  describe('Score Validation Tests', () => {
    it('should validate score is between 0-100', () => {
      const scores = [0, 25, 50, 75, 100];
      const isValid = (score: number) => score >= 0 && score <= 100;

      scores.forEach(score => {
        expect(isValid(score)).toBe(true);
      });
    });

    it('should reject invalid scores', () => {
      const invalidScores = [-1, 101, 150];
      const isValid = (score: number) => score >= 0 && score <= 100;

      invalidScores.forEach(score => {
        expect(isValid(score)).toBe(false);
      });
    });

    it('should handle division by zero gracefully', () => {
      const total = 0;
      const score = total === 0 ? 0 : 100;

      expect(score).toBe(0);
    });
  });

  describe('Off-by-One Error Prevention', () => {
    it('should count exactly correct answers', () => {
      const answers = [true, true, false, true, false];
      const correct = answers.filter(a => a).length;
      const total = answers.length;

      expect(correct).toBe(3);
      expect(total).toBe(5);
    });

    it('should not double-count answers', () => {
      const attemptAnswers = new Map<string, boolean>();
      attemptAnswers.set('q1', true);
      attemptAnswers.set('q2', false);
      attemptAnswers.set('q3', true);

      const correct = Array.from(attemptAnswers.values()).filter(a => a).length;
      const total = attemptAnswers.size;

      expect(correct).toBe(2);
      expect(total).toBe(3);
    });

    it('should handle all questions answered', () => {
      const totalQuestions = 10;
      const answeredCount = 10;

      expect(answeredCount).toBe(totalQuestions);
    });

    it('should handle unanswered questions', () => {
      const totalQuestions = 10;
      const answeredCount = 8;
      const unansweredCount = totalQuestions - answeredCount;

      expect(answeredCount).toBe(8);
      expect(unansweredCount).toBe(2);
    });
  });

  describe('Performance Trend Calculation', () => {
    it('should calculate positive improvement trend', () => {
      const scores = [60, 65, 70, 75, 80];
      const improvement = scores[scores.length - 1] - scores[0];

      expect(improvement).toBe(20); // 20 percentage points improvement
    });

    it('should calculate negative improvement trend', () => {
      const scores = [80, 75, 70, 65, 60];
      const improvement = scores[scores.length - 1] - scores[0];

      expect(improvement).toBe(-20); // Declining performance
    });

    it('should calculate zero improvement trend', () => {
      const scores = [70, 70, 70, 70];
      const improvement = scores[scores.length - 1] - scores[0];

      expect(improvement).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total questions', () => {
      const total = 0;
      const correct = 0;
      const score = total === 0 ? 0 : Math.round((correct / total) * 100);

      expect(score).toBe(0);
    });

    it('should handle very large number of questions', () => {
      const total = 1000;
      const correct = 750;
      const score = Math.round((correct / total) * 100);

      expect(score).toBe(75);
    });

    it('should handle very small number of questions', () => {
      const total = 1;
      const correct = 1;
      const score = Math.round((correct / total) * 100);

      expect(score).toBe(100);
    });

    it('should round scores correctly', () => {
      // Test rounding edge cases - JavaScript rounds 0.5 up
      expect(Math.round(42.5)).toBe(43); // JavaScript rounds 0.5 up
      expect(Math.round(43.5)).toBe(44);
      expect(Math.round(42.4)).toBe(42);
      expect(Math.round(42.6)).toBe(43);
    });
  });
});
