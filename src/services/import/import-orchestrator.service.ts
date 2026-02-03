import { getSupabaseClient } from '@/services/database/supabase-client';
import { CSVParser, CSVRow } from '@/services/import/csv-parser';
import { DeduplicationService } from '@/services/import/deduplication.service';
import { SemanticMappingService } from '@/services/import/semantic-mapping.service';
import { BatchProcessorService } from '@/services/import/batch-processor.service';

export interface ImportJob {
  importId: string;
  filename: string;
  userId: string;
  totalRows: number;
  status: 'queued' | 'parsing' | 'deduplicating' | 'mapping' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export interface ImportResult {
  importId: string;
  filename: string;
  totalRows: number;
  successfulImports: number;
  duplicatesFound: number;
  errorCount: number;
  status: string;
  message: string;
  duration: number; // milliseconds
}

/**
 * Orchestrates the entire CSV import process
 * Coordinates CSV parsing, deduplication, semantic mapping, and batch processing
 */
export class ImportOrchestrator {
  /**
   * Execute complete import workflow
   */
  static async executeImport(
    buffer: Buffer,
    filename: string,
    userId: string,
    onProgress?: (job: ImportJob) => Promise<void>
  ): Promise<ImportResult> {
    const startTime = Date.now();
    let importId = '';
    let csvRows: CSVRow[] = [];
    let deduplicatedRows: CSVRow[] = [];

    try {
      // Step 1: Create import record
      importId = await this.createImportRecord(filename, userId);
      console.log(`Created import record: ${importId}`);

      // Step 2: Parse CSV
      await this.reportProgress(
        { importId, filename, userId, totalRows: 0, status: 'parsing', progress: 10 },
        onProgress
      );

      const parseResult = CSVParser.parse(buffer);
      if (!CSVParser.isValid(parseResult)) {
        throw new Error(
          `CSV parsing failed: ${parseResult.errors.map(e => `Row ${e.row}: ${e.error}`).join('; ')}`
        );
      }

      csvRows = parseResult.rows;
      const totalRows = csvRows.length;

      await this.updateImportRecord(importId, { total_rows: totalRows, status: 'parsing' });

      console.log(`Parsed ${totalRows} rows from CSV`);

      // Step 3: Deduplicate
      await this.reportProgress(
        { importId, filename, userId, totalRows, status: 'deduplicating', progress: 30 },
        onProgress
      );

      const existingQuestions = await this.getExistingQuestions();
      const deduplicationResult = DeduplicationService.deduplicate(csvRows, existingQuestions);

      deduplicatedRows = deduplicationResult.newQuestions;
      const duplicateCount = deduplicationResult.duplicates.length;

      await this.updateImportRecord(importId, {
        duplicate_count: duplicateCount,
        status: 'mapping',
      });

      console.log(`Deduplication complete: ${deduplicatedRows.length} new, ${duplicateCount} duplicates`);

      // Step 4: Semantic mapping
      await this.reportProgress(
        { importId, filename, userId, totalRows, status: 'mapping', progress: 50 },
        onProgress
      );

      const mappingResult = await SemanticMappingService.mapTopics(deduplicatedRows);

      if (!SemanticMappingService.isComplete(mappingResult)) {
        // Create missing topics
        for (const unmappedTopic of mappingResult.unmappedTopics) {
          const newTopicId = await SemanticMappingService.createTopicIfMissing(unmappedTopic);
          mappingResult.mappings.push({
            csvTopicName: unmappedTopic,
            mappedTopicId: newTopicId,
            mappedTopicName: unmappedTopic,
            confidence: 50,
            method: 'fallback',
          });
        }
      }

      // Apply mappings to CSV rows
      const enrichedRows = deduplicatedRows.map(row => {
        const mapping = SemanticMappingService.getMapping(row.topic, mappingResult.mappings);
        if (!mapping) {
          throw new Error(`No topic mapping found for: ${row.topic}`);
        }
        return { ...row, topic: mapping.mappedTopicId } as CSVRow;
      });

      console.log(`Topic mapping complete: ${mappingResult.successCount} mapped`);

      // Step 5: Batch process
      await this.reportProgress(
        { importId, filename, userId, totalRows, status: 'processing', progress: 70 },
        onProgress
      );

      const finalProgress = await BatchProcessorService.processImport(
        importId,
        userId,
        enrichedRows,
        async (progress) => {
          // Map batch processor progress (0-100) to overall progress (70-100)
          const overallProgress = 70 + (progress.percentComplete * 0.3);
          await this.reportProgress(
            {
              importId,
              filename,
              userId,
              totalRows,
              status: 'processing',
              progress: Math.round(overallProgress),
            },
            onProgress
          );
        }
      );

      // Final update
      await this.reportProgress(
        { importId, filename, userId, totalRows, status: 'completed', progress: 100 },
        onProgress
      );

      const duration = Date.now() - startTime;

      return {
        importId,
        filename,
        totalRows,
        successfulImports: finalProgress.successful,
        duplicatesFound: duplicateCount,
        errorCount: finalProgress.failed,
        status: 'completed',
        message: `Import completed successfully: ${finalProgress.successful} questions added, ${duplicateCount} duplicates skipped`,
        duration,
      };
    } catch (error) {
      console.error('Import failed:', error);
      if (importId) {
        await this.updateImportRecord(importId, {
          status: 'failed',
          error_details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            parsedRows: csvRows.length,
          },
          completed_at: new Date().toISOString(),
        });
      }

      const duration = Date.now() - startTime;

      return {
        importId: importId || 'unknown',
        filename,
        totalRows: csvRows.length,
        successfulImports: 0,
        duplicatesFound: 0,
        errorCount: csvRows.length,
        status: 'failed',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      };
    }
  }

  /**
   * Create import record in database
   */
  private static async createImportRecord(
    filename: string,
    userId: string
  ): Promise<string> {
    const { data, error } = await getSupabaseClient()
      .from('question_imports')
      .insert([{
        admin_id: userId,
        csv_filename: filename,
        total_rows: 0,
        status: 'queued',
      }])
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create import record: ${error?.message || 'Unknown error'}`);
    }

    return data.id;
  }

  /**
   * Update import record
   */
  private static async updateImportRecord(
    importId: string,
    updates: Record<string, any>
  ): Promise<void> {
    const { error } = await getSupabaseClient()
      .from('question_imports')
      .update(updates)
      .eq('id', importId);

    if (error) {
      console.warn(`Failed to update import record: ${error.message}`);
    }
  }

  /**
   * Get existing questions for deduplication
   */
  private static async getExistingQuestions(): Promise<Array<{ id: string; text: string }>> {
    const { data, error } = await getSupabaseClient()
      .from('questions')
      .select('id, text')
      .limit(10000) // Reasonable limit to avoid memory issues
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch existing questions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Report progress
   */
  private static async reportProgress(
    job: ImportJob,
    onProgress?: (job: ImportJob) => Promise<void>
  ): Promise<void> {
    if (onProgress) {
      try {
        await onProgress(job);
      } catch (error) {
        console.warn('Progress reporting failed:', error);
      }
    }
  }

  /**
   * Get import status
   */
  static async getImportStatus(importId: string): Promise<any> {
    const { data, error } = await getSupabaseClient()
      .from('question_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (error) {
      throw new Error(`Import not found: ${importId}`);
    }

    return data;
  }

  /**
   * Get import history for a user
   */
  static async getImportHistory(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await getSupabaseClient()
      .from('question_imports')
      .select('*')
      .eq('admin_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch import history:', error);
      return [];
    }

    return data || [];
  }
}

