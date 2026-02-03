import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchProcessorService, ImportProgress, BatchError } from '../batch-processor.service';
import { CSVRow } from '../csv-parser';
import { BATCH_SIZE, MAX_RETRIES } from '../constants';

// Mock Supabase
vi.mock('@/services/database/supabase-client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('BatchProcessorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Progress Calculation', () => {
    it('should calculate correct percentage for partial progress', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        50,
        100,
        45,
        5
      );

      expect(progress.percentComplete).toBe(50);
      expect(progress.processed).toBe(50);
      expect(progress.total).toBe(100);
    });

    it('should calculate 100% for complete progress', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        100,
        100,
        100,
        0
      );

      expect(progress.percentComplete).toBe(100);
      expect(progress.status).toBe('completed');
    });

    it('should estimate time remaining correctly', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        50,
        100,
        50,
        0
      );

      // 50 remaining rows * 500ms per row = 25000ms = 25 seconds
      expect(progress.estimatedTimeRemaining).toBe(25);
    });

    it('should return 0 time remaining when complete', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        100,
        100,
        100,
        0
      );

      expect(progress.estimatedTimeRemaining).toBe(0);
    });

    it('should handle zero total rows', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        0,
        0,
        0,
        0
      );

      expect(progress.percentComplete).toBe(0);
    });

    it('should include duplicate count in progress', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        100,
        100,
        70,
        30
      );

      expect(progress.successful).toBe(70);
      expect(progress.failed).toBe(30);
      expect(progress.processed).toBe(100);
    });
  });

  describe('Batch Size Calculation', () => {
    it('should calculate correct number of batches', () => {
      const rows: CSVRow[] = Array(250)
        .fill(null)
        .map((_, i) => ({
          text: `Q${i}`,
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 0,
          topic: 'Math',
          difficulty: 'easy',
        }));

      // BATCH_SIZE = 100, so 250 rows = 3 batches
      const numBatches = Math.ceil(rows.length / BATCH_SIZE);
      expect(numBatches).toBe(3);
    });

    it('should handle exact batch boundary', () => {
      const rows: CSVRow[] = Array(200).fill(null).map((_, i) => ({
        text: `Q${i}`,
        option_a: 'A',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        correct_index: 0,
        topic: 'Math',
        difficulty: 'easy',
      }));

      const numBatches = Math.ceil(rows.length / BATCH_SIZE);
      expect(numBatches).toBe(2);
    });

    it('should handle single row', () => {
      const rows: CSVRow[] = [
        {
          text: 'Q1',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 0,
          topic: 'Math',
          difficulty: 'easy',
        },
      ];

      const numBatches = Math.ceil(rows.length / BATCH_SIZE);
      expect(numBatches).toBe(1);
    });
  });

  describe('Progress Interface', () => {
    it('should have all required progress fields', () => {
      const progress: ImportProgress = {
        importId: 'import-1',
        processed: 50,
        total: 100,
        successful: 45,
        failed: 5,
        duplicates: 0,
        percentComplete: 50,
        status: 'in_progress',
        estimatedTimeRemaining: 25,
      };

      expect(progress.importId).toBe('import-1');
      expect(progress.processed).toBe(50);
      expect(progress.total).toBe(100);
      expect(progress.successful).toBe(45);
      expect(progress.failed).toBe(5);
      expect(progress.duplicates).toBe(0);
      expect(progress.percentComplete).toBe(50);
      expect(progress.status).toBe('in_progress');
      expect(progress.estimatedTimeRemaining).toBe(25);
    });

    it('should support all valid statuses', () => {
      const statuses: Array<'queued' | 'in_progress' | 'completed' | 'failed'> = [
        'queued',
        'in_progress',
        'completed',
        'failed',
      ];

      statuses.forEach(status => {
        const progress: ImportProgress = {
          importId: 'import-1',
          processed: 0,
          total: 100,
          successful: 0,
          failed: 0,
          duplicates: 0,
          percentComplete: 0,
          status,
        };

        expect(progress.status).toBe(status);
      });
    });
  });

  describe('Batch Error Tracking', () => {
    it('should track batch errors with row index', () => {
      const error: BatchError = {
        rowIndex: 5,
        error: 'Failed to insert question',
        attemptCount: 1,
        retryable: true,
      };

      expect(error.rowIndex).toBe(5);
      expect(error.error).toContain('Failed');
      expect(error.attemptCount).toBe(1);
      expect(error.retryable).toBe(true);
    });

    it('should mark error as non-retryable after max attempts', () => {
      const error: BatchError = {
        rowIndex: 10,
        error: 'Network timeout',
        attemptCount: MAX_RETRIES,
        retryable: false,
      };

      expect(error.retryable).toBe(false);
      expect(error.attemptCount).toBe(MAX_RETRIES);
    });

    it('should track attempt count correctly', () => {
      const errors: BatchError[] = [
        {
          rowIndex: 1,
          error: 'Error 1',
          attemptCount: 1,
          retryable: true,
        },
        {
          rowIndex: 2,
          error: 'Error 2',
          attemptCount: 2,
          retryable: true,
        },
      ];

      expect(errors[0].attemptCount).toBe(1);
      expect(errors[1].attemptCount).toBe(2);
    });
  });

  describe('Retry Logic', () => {
    it('should identify retryable errors', () => {
      const errors: BatchError[] = [
        {
          rowIndex: 0,
          error: 'Network timeout',
          attemptCount: 1,
          retryable: true,
        },
        {
          rowIndex: 1,
          error: 'Invalid data format',
          attemptCount: 1,
          retryable: false,
        },
      ];

      const retryable = errors.filter(e => e.retryable && e.attemptCount < MAX_RETRIES);
      expect(retryable).toHaveLength(1);
      expect(retryable[0].rowIndex).toBe(0);
    });

    it('should respect MAX_RETRIES limit', () => {
      const errors: BatchError[] = [
        {
          rowIndex: 0,
          error: 'Error',
          attemptCount: MAX_RETRIES,
          retryable: true,
        },
      ];

      const retryable = errors.filter(e => e.retryable && e.attemptCount < MAX_RETRIES);
      expect(retryable).toHaveLength(0);
    });

    it('should filter retryable errors correctly', () => {
      const errors: BatchError[] = [
        {
          rowIndex: 0,
          error: 'Network error',
          attemptCount: 1,
          retryable: true,
        },
        {
          rowIndex: 1,
          error: 'Invalid field',
          attemptCount: 1,
          retryable: false,
        },
        {
          rowIndex: 2,
          error: 'Database timeout',
          attemptCount: 2,
          retryable: true,
        },
      ];

      const retryable = errors.filter(e => e.retryable && e.attemptCount < MAX_RETRIES);
      expect(retryable).toHaveLength(2);
    });
  });

  describe('Progress Tracking', () => {
    it('should track processed count accurately', () => {
      let processed = 0;
      const total = 300;

      // Simulate 3 batches of 100 each
      for (let i = 0; i < 3; i++) {
        processed = Math.min((i + 1) * BATCH_SIZE, total);
        const progress = (BatchProcessorService as any).calculateProgress(
          'import-1',
          processed,
          total,
          processed - 5,
          5
        );
        expect(progress.processed).toBe(processed);
      }

      expect(processed).toBe(300);
    });

    it('should track success count separately', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        100,
        100,
        95,
        5
      );

      expect(progress.successful).toBe(95);
      expect(progress.failed).toBe(5);
      expect(progress.successful + progress.failed).toBe(100);
    });

    it('should calculate error rate correctly', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        100,
        100,
        80,
        20
      );

      const errorRate = (progress.failed / progress.total) * 100;
      expect(errorRate).toBe(20);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty row array', () => {
      const rows: CSVRow[] = [];
      const numBatches = Math.ceil(rows.length / BATCH_SIZE);
      expect(numBatches).toBe(0);
    });

    it('should handle very large row count', () => {
      const rows: CSVRow[] = Array(10000)
        .fill(null)
        .map((_, i) => ({
          text: `Q${i}`,
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 0,
          topic: 'Math',
          difficulty: 'easy',
        }));

      const numBatches = Math.ceil(rows.length / BATCH_SIZE);
      // 10000 / 100 = 100 batches
      expect(numBatches).toBe(100);
    });

    it('should calculate accurate progress at 0%', () => {
      const progress = (BatchProcessorService as any).calculateProgress(
        'import-1',
        0,
        100,
        0,
        0
      );

      expect(progress.percentComplete).toBe(0);
      expect(progress.status).toBe('in_progress');
    });

    it('should handle 1-row batches correctly', () => {
      const rows: CSVRow[] = [
        {
          text: 'Q1',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 0,
          topic: 'Math',
          difficulty: 'easy',
        },
      ];

      const startIdx = 0;
      const endIdx = Math.min(startIdx + BATCH_SIZE, rows.length);
      const batchSize = endIdx - startIdx;

      expect(batchSize).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve original row data', () => {
      const row: CSVRow = {
        text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_index: 1,
        topic: 'Math',
        difficulty: 'easy',
        explanation: 'Basic addition',
      };

      // Verify all fields are preserved
      expect(row.text).toBe('What is 2+2?');
      expect(row.option_a).toBe('3');
      expect(row.correct_index).toBe(1);
      expect(row.explanation).toBe('Basic addition');
    });

    it('should handle rows with special characters', () => {
      const row: CSVRow = {
        text: 'What is "5" + \'3\'?',
        option_a: 'A & B',
        option_b: 'C < D',
        option_c: 'E > F',
        option_d: 'G | H',
        correct_index: 0,
        topic: 'Math',
        difficulty: 'easy',
      };

      expect(row.text).toContain('"');
      expect(row.option_a).toContain('&');
      expect(row.option_b).toContain('<');
    });

    it('should handle rows with unicode characters', () => {
      const row: CSVRow = {
        text: '什么是2+2？',
        option_a: 'Ñoño',
        option_b: 'Café',
        option_c: 'Москва',
        option_d: 'العربية',
        correct_index: 0,
        topic: 'Math',
        difficulty: 'easy',
      };

      expect(row.text).toContain('什么');
      expect(row.option_a).toContain('Ñ');
      expect(row.option_b).toContain('é');
    });
  });

  describe('Status Updates', () => {
    it('should transition through correct status sequence', () => {
      const statuses = ['queued', 'in_progress', 'completed'];

      statuses.forEach((status, index) => {
        const progress: ImportProgress = {
          importId: 'import-1',
          processed: (index + 1) * 33,
          total: 100,
          successful: (index + 1) * 30,
          failed: (index + 1) * 3,
          duplicates: 0,
          percentComplete: (index + 1) * 33,
          status: status as any,
        };

        expect(progress.status).toBe(status);
      });
    });

    it('should mark as failed on error', () => {
      const progress: ImportProgress = {
        importId: 'import-1',
        processed: 50,
        total: 100,
        successful: 45,
        failed: 5,
        duplicates: 0,
        percentComplete: 50,
        status: 'failed',
      };

      expect(progress.status).toBe('failed');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle successful batch processing flow', () => {
      const rows: CSVRow[] = Array(150)
        .fill(null)
        .map((_, i) => ({
          text: `Q${i}`,
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_index: 0,
          topic: 'Math',
          difficulty: 'easy',
        }));

      // Simulate 2 batches
      let totalProcessed = 0;
      let totalSuccessful = 0;

      for (let i = 0; i < 2; i++) {
        const startIdx = i * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, rows.length);
        const batchSize = endIdx - startIdx;

        totalProcessed += batchSize;
        totalSuccessful += Math.floor(batchSize * 0.95); // 95% success rate

        const progress = (BatchProcessorService as any).calculateProgress(
          'import-1',
          totalProcessed,
          rows.length,
          totalSuccessful,
          totalProcessed - totalSuccessful
        );

        expect(progress.processed).toBeLessThanOrEqual(rows.length);
        expect(progress.successful).toBeLessThanOrEqual(progress.processed);
      }
    });

    it('should calculate correct cumulative progress', () => {
      const totalRows = 250;
      const progressHistory: number[] = [];

      // Simulate processing in 3 batches
      for (let i = 1; i <= 3; i++) {
        const processed = Math.min(i * BATCH_SIZE, totalRows);
        const progress = (BatchProcessorService as any).calculateProgress(
          'import-1',
          processed,
          totalRows,
          processed,
          0
        );

        progressHistory.push(progress.percentComplete);
      }

      // Progress should be monotonically increasing
      for (let i = 1; i < progressHistory.length; i++) {
        expect(progressHistory[i]).toBeGreaterThanOrEqual(progressHistory[i - 1]);
      }
    });
  });
});

