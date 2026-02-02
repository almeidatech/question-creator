import { parse } from 'csv-parse/sync';
import { BOM_CHARACTERS } from '@/src/services/import/constants';

export interface CSVRow {
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  topic: string;
  difficulty: string;
  explanation?: string;
}

export interface ParseResult {
  rows: CSVRow[];
  errors: ValidationError[];
  encoding: string;
  rowCount: number;
}

export interface ValidationError {
  row: number;
  field?: string;
  error: string;
}

/**
 * Service for parsing and validating CSV files
 */
export class CSVParser {
  private static readonly REQUIRED_COLUMNS = [
    'text',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_index',
    'topic',
    'difficulty',
  ];

  private static readonly OPTIONAL_COLUMNS = ['explanation'];

  private static readonly VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

  /**
   * Detect file encoding (UTF-8 or ISO-8859-1)
   * Returns 'utf8' if file appears to be valid UTF-8, otherwise 'iso-8859-1'
   */
  static detectEncoding(buffer: Buffer): string {
    try {
      // Try to decode as UTF-8
      const text = buffer.toString('utf8');
      // Check if it's valid UTF-8 by encoding back
      const reencoded = Buffer.from(text, 'utf8');
      if (reencoded.equals(buffer)) {
        return 'utf8';
      }
    } catch {
      // Fall through to ISO-8859-1
    }

    return 'iso-8859-1';
  }

  /**
   * Remove BOM (Byte Order Mark) characters from the beginning of the file
   */
  static removeBOM(content: string): string {
    for (const bom of BOM_CHARACTERS) {
      if (content.startsWith(bom)) {
        return content.slice(bom.length);
      }
    }
    return content;
  }

  /**
   * Parse CSV file buffer into structured rows
   */
  static parse(buffer: Buffer): ParseResult {
    const errors: ValidationError[] = [];

    try {
      // Detect encoding
      const encoding = this.detectEncoding(buffer);
      const content = buffer.toString(encoding);
      const cleanContent = this.removeBOM(content);

      // Parse CSV
      const records = parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: false,
      }) as Record<string, string>[];

      // Validate and transform rows
      const rows: CSVRow[] = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNumber = i + 2; // +1 for header, +1 for 1-based indexing

        // Validate required columns exist
        const columnErrors = this.validateColumns(record);
        if (columnErrors.length > 0) {
          errors.push(
            ...columnErrors.map(error => ({
              row: rowNumber,
              ...error,
            }))
          );
          continue;
        }

        // Validate row data
        const rowErrors = this.validateRow(record, rowNumber);
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          continue;
        }

        // Transform to CSVRow
        try {
          const csvRow: CSVRow = {
            text: record.text?.trim() || '',
            option_a: record.option_a?.trim() || '',
            option_b: record.option_b?.trim() || '',
            option_c: record.option_c?.trim() || '',
            option_d: record.option_d?.trim() || '',
            correct_index: parseInt(record.correct_index, 10),
            topic: record.topic?.trim() || '',
            difficulty: record.difficulty?.toLowerCase().trim() || '',
            explanation: record.explanation?.trim() || undefined,
          };

          rows.push(csvRow);
        } catch (error) {
          errors.push({
            row: rowNumber,
            error: `Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      return {
        rows,
        errors,
        encoding,
        rowCount: records.length,
      };
    } catch (error) {
      return {
        rows: [],
        errors: [
          {
            row: 0,
            error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        encoding: 'unknown',
        rowCount: 0,
      };
    }
  }

  /**
   * Validate that all required columns exist in the record
   */
  private static validateColumns(
    record: Record<string, string>
  ): Array<{ field?: string; error: string }> {
    const errors: Array<{ field?: string; error: string }> = [];

    for (const column of this.REQUIRED_COLUMNS) {
      if (!(column in record)) {
        errors.push({
          field: column,
          error: `Missing required column: ${column}`,
        });
      }
    }

    return errors;
  }

  /**
   * Validate row data
   */
  private static validateRow(
    record: Record<string, string>,
    rowNumber: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate text is not empty
    const text = record.text?.trim();
    if (!text) {
      errors.push({
        row: rowNumber,
        field: 'text',
        error: 'Question text cannot be empty',
      });
    }

    // Validate options are not empty
    for (const option of ['option_a', 'option_b', 'option_c', 'option_d']) {
      if (!record[option]?.trim()) {
        errors.push({
          row: rowNumber,
          field: option,
          error: `${option} cannot be empty`,
        });
      }
    }

    // Validate correct_index is 0-3
    const correctIndex = parseInt(record.correct_index, 10);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      errors.push({
        row: rowNumber,
        field: 'correct_index',
        error: 'correct_index must be a number between 0 and 3',
      });
    }

    // Validate difficulty
    const difficulty = record.difficulty?.toLowerCase().trim();
    if (difficulty && !this.VALID_DIFFICULTIES.includes(difficulty)) {
      errors.push({
        row: rowNumber,
        field: 'difficulty',
        error: `difficulty must be one of: ${this.VALID_DIFFICULTIES.join(', ')}`,
      });
    }

    // Validate topic is not empty
    const topic = record.topic?.trim();
    if (!topic) {
      errors.push({
        row: rowNumber,
        field: 'topic',
        error: 'Topic cannot be empty',
      });
    }

    return errors;
  }

  /**
   * Validate that parsing succeeded with no critical errors
   */
  static isValid(result: ParseResult): boolean {
    return result.rows.length > 0 && result.errors.length === 0;
  }

  /**
   * Get summary of parsing results
   */
  static getSummary(result: ParseResult): {
    successful: number;
    errors: number;
    errorRate: number;
  } {
    const successful = result.rows.length;
    const errors = result.errors.length;
    const errorRate = result.rowCount > 0 ? (errors / (successful + errors)) * 100 : 0;

    return {
      successful,
      errors,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }
}
