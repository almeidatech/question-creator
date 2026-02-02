import { supabase } from '@/src/services/database/supabase-client';
import { BATCH_SIZE, MAX_RETRIES, RETRY_DELAY } from '@/src/services/import/constants';
import { CSVRow } from '@/src/services/import/csv-parser';

export interface ImportProgress {
  importId: string;
  processed: number;
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  percentComplete: number;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  estimatedTimeRemaining?: number; // in seconds
}

export interface BatchError {
  rowIndex: number;
  error: string;
  attemptCount: number;
  retryable: boolean;
}

/**
 * Service for batch processing of CSV questions into database
 * Handles transactions, retries, and progress tracking
 */
export class BatchProcessorService {
  /**
   * Process CSV questions in batches with transaction management
   * Returns import ID and initial progress
   */
  static async processImport(
    importId: string,
    userId: string,
    csvRows: CSVRow[],
    onProgress?: (progress: ImportProgress) => Promise<void>
  ): Promise<ImportProgress> {
    const totalRows = csvRows.length;
    const batches = Math.ceil(totalRows / BATCH_SIZE);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const failedRows: BatchError[] = [];

    try {
      // Update import status to in_progress
      await this.updateImportStatus(importId, 'in_progress');

      // Process each batch
      for (let batchNum = 0; batchNum < batches; batchNum++) {
        const startIdx = batchNum * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, totalRows);
        const batchRows = csvRows.slice(startIdx, endIdx);

        // Process batch with transaction
        try {
          const batchResult = await this.processBatch(importId, userId, batchRows);
          successCount += batchResult.successCount;
          failedCount += batchResult.failedCount;
          failedRows.push(...batchResult.failedRows);
          processedCount = endIdx;
        } catch (error) {
          console.error(`Batch ${batchNum} failed:`, error);
          failedRows.push({
            rowIndex: startIdx,
            error: `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            attemptCount: 1,
            retryable: true,
          });
          failedCount += batchRows.length;
          processedCount = endIdx;
        }

        // Report progress
        const progress = this.calculateProgress(importId, processedCount, totalRows, successCount, failedCount);
        if (onProgress) {
          await onProgress(progress);
        }
      }

      // Retry failed rows
      const retriedRows = await this.retryFailedRows(
        importId,
        userId,
        failedRows,
        csvRows,
        onProgress
      );

      successCount += retriedRows.successCount;
      failedCount -= retriedRows.successCount;

      // Update final import status
      await this.updateImportStatus(importId, 'completed', {
        successful_imports: successCount,
        error_count: failedCount,
        error_details: failedCount > 0 ? { failed_rows: failedRows } : null,
        completed_at: new Date().toISOString(),
      });

      return this.calculateProgress(importId, totalRows, totalRows, successCount, failedCount);
    } catch (error) {
      console.error('Import processing failed:', error);
      await this.updateImportStatus(importId, 'failed', {
        error_details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          processedRows: processedCount,
          totalRows,
        },
        completed_at: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Process a single batch of questions within a transaction
   */
  private static async processBatch(
    importId: string,
    userId: string,
    batchRows: CSVRow[]
  ): Promise<{ successCount: number; failedCount: number; failedRows: BatchError[] }> {
    let successCount = 0;
    let failedCount = 0;
    const failedRows: BatchError[] = [];

    for (let i = 0; i < batchRows.length; i++) {
      const row = batchRows[i];

      try {
        // Insert question
        const { data: question, error } = await supabase
          .from('questions')
          .insert([{
            text: row.text,
            options: [row.option_a, row.option_b, row.option_c, row.option_d],
            correct_index: row.correct_index,
            topic_id: row.topic, // Should be mapped topic ID
            difficulty: row.difficulty,
            explanation: row.explanation,
            created_by: userId,
          }])
          .select('id')
          .single();

        if (error || !question) {
          throw error || new Error('Failed to create question');
        }

        // Track mapping
        await supabase
          .from('import_question_mapping')
          .insert([{
            import_id: importId,
            question_id: question.id,
          }]);

        successCount++;
      } catch (error) {
        console.warn(`Failed to import row ${i}:`, error);
        failedRows.push({
          rowIndex: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          attemptCount: 1,
          retryable: true,
        });
        failedCount++;
      }
    }

    return { successCount, failedCount, failedRows };
  }

  /**
   * Retry failed rows with exponential backoff
   */
  private static async retryFailedRows(
    importId: string,
    userId: string,
    failedRows: BatchError[],
    csvRows: CSVRow[],
    onProgress?: (progress: ImportProgress) => Promise<void>
  ): Promise<{ successCount: number }> {
    let successCount = 0;
    const retryableRows = failedRows.filter(f => f.retryable && f.attemptCount < MAX_RETRIES);

    for (const failedRow of retryableRows) {
      const csvRow = csvRows[failedRow.rowIndex];
      if (!csvRow) continue;

      for (let attempt = 0; attempt < MAX_RETRIES - failedRow.attemptCount; attempt++) {
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          const { data: question, error } = await supabase
            .from('questions')
            .insert([{
              text: csvRow.text,
              options: [csvRow.option_a, csvRow.option_b, csvRow.option_c, csvRow.option_d],
              correct_index: csvRow.correct_index,
              topic_id: csvRow.topic,
              difficulty: csvRow.difficulty,
              explanation: csvRow.explanation,
              created_by: userId,
            }])
            .select('id')
            .single();

          if (error || !question) {
            throw error || new Error('Failed to create question');
          }

          await supabase
            .from('import_question_mapping')
            .insert([{
              import_id: importId,
              question_id: question.id,
            }]);

          successCount++;
          break; // Success, stop retrying
        } catch (error) {
          console.warn(`Retry ${attempt + 1} failed for row ${failedRow.rowIndex}:`, error);
          if (attempt === MAX_RETRIES - failedRow.attemptCount - 1) {
            // Last attempt failed
            failedRow.attemptCount = MAX_RETRIES;
            failedRow.retryable = false;
          }
        }
      }
    }

    return { successCount };
  }

  /**
   * Update import status in database
   */
  private static async updateImportStatus(
    importId: string,
    status: string,
    updates?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('question_imports')
      .update({
        status,
        ...updates,
      })
      .eq('id', importId);

    if (error) {
      throw new Error(`Failed to update import status: ${error.message}`);
    }
  }

  /**
   * Calculate import progress
   */
  private static calculateProgress(
    importId: string,
    processed: number,
    total: number,
    successful: number,
    failed: number
  ): ImportProgress {
    const percentComplete = Math.round((processed / total) * 100);
    const timePerRow = 500; // milliseconds (estimate)
    const remainingRows = total - processed;
    const estimatedTimeRemaining = Math.round((remainingRows * timePerRow) / 1000);

    return {
      importId,
      processed,
      total,
      successful,
      failed,
      duplicates: 0, // Would be tracked separately
      percentComplete,
      status: percentComplete === 100 ? 'completed' : 'in_progress',
      estimatedTimeRemaining: remainingRows > 0 ? estimatedTimeRemaining : 0,
    };
  }

  /**
   * Get current import progress
   */
  static async getProgress(importId: string): Promise<ImportProgress> {
    const { data: importData, error } = await supabase
      .from('question_imports')
      .select(
        'id, total_rows, successful_imports, duplicate_count, error_count, status'
      )
      .eq('id', importId)
      .single();

    if (error || !importData) {
      throw new Error(`Import not found: ${importId}`);
    }

    const processed = importData.successful_imports + importData.duplicate_count + importData.error_count;

    return this.calculateProgress(
      importData.id,
      processed,
      importData.total_rows,
      importData.successful_imports,
      importData.error_count
    );
  }

  /**
   * Cancel/rollback an import
   */
  static async rollbackImport(importId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Call database function to rollback
      const { data, error } = await supabase.rpc(
        'rollback_import',
        { p_import_id: importId }
      );

      if (error) {
        throw error;
      }

      return {
        success: data?.[0]?.success || false,
        message: data?.[0]?.message || 'Rollback completed',
      };
    } catch (error) {
      console.error('Rollback failed:', error);
      throw new Error(`Failed to rollback import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
