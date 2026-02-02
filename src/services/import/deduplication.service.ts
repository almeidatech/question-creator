import { DEDUPLICATION_THRESHOLD } from '@/src/services/import/constants';
import { CSVRow } from '@/src/services/import/csv-parser';

export interface DuplicateMatch {
  csvIndex: number;
  existingQuestionId: string;
  existingQuestionText: string;
  similarity: number;
}

export interface DeduplicationResult {
  newQuestions: CSVRow[];
  duplicates: DuplicateMatch[];
}

/**
 * Service for question deduplication using Levenshtein distance
 */
export class DeduplicationService {
  /**
   * Calculate Levenshtein distance between two strings
   * The distance is the minimum number of single-character edits
   * (insertions, deletions, substitutions) required to change one string into another
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const rows = str1.length + 1;
    const cols = str2.length + 1;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      matrix[i][0] = i;
    }

    for (let j = 0; j < cols; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const cost = str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Deletion
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }

    return matrix[str1.length][str2.length];
  }

  /**
   * Calculate similarity between two strings (0-100)
   * Based on Levenshtein distance
   */
  static calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);

    if (maxLen === 0) {
      return 100; // Both empty strings are identical
    }

    const distance = this.levenshteinDistance(str1, str2);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Deduplicate CSV rows against existing questions in the database
   * Returns new questions and list of found duplicates
   */
  static deduplicate(
    csvRows: CSVRow[],
    existingQuestions: Array<{ id: string; text: string }>
  ): DeduplicationResult {
    const newQuestions: CSVRow[] = [];
    const duplicates: DuplicateMatch[] = [];

    for (let csvIndex = 0; csvIndex < csvRows.length; csvIndex++) {
      const csvRow = csvRows[csvIndex];
      let foundDuplicate = false;

      // Check similarity against all existing questions
      for (const existing of existingQuestions) {
        const similarity = this.calculateSimilarity(csvRow.text, existing.text);

        if (similarity >= DEDUPLICATION_THRESHOLD) {
          duplicates.push({
            csvIndex,
            existingQuestionId: existing.id,
            existingQuestionText: existing.text,
            similarity,
          });
          foundDuplicate = true;
          break; // Stop checking after finding first match
        }
      }

      if (!foundDuplicate) {
        newQuestions.push(csvRow);
      }
    }

    return { newQuestions, duplicates };
  }

  /**
   * Get deduplication statistics
   */
  static getStatistics(result: DeduplicationResult): {
    newCount: number;
    duplicateCount: number;
    deduplicationRate: number;
  } {
    const totalProcessed = result.newQuestions.length + result.duplicates.length;
    const deduplicationRate =
      totalProcessed > 0 ? (result.duplicates.length / totalProcessed) * 100 : 0;

    return {
      newCount: result.newQuestions.length,
      duplicateCount: result.duplicates.length,
      deduplicationRate: Math.round(deduplicationRate * 100) / 100,
    };
  }

  /**
   * Verify Levenshtein distance calculation accuracy with test cases
   */
  static verifyDistance(str1: string, str2: string, expectedDistance: number): {
    actualDistance: number;
    isAccurate: boolean;
  } {
    const actualDistance = this.levenshteinDistance(str1, str2);
    return {
      actualDistance,
      isAccurate: actualDistance === expectedDistance,
    };
  }
}
