/**
 * Question Data Transformers
 * Transforms database question format to API/UI format
 */

import { Question } from '@/stores/exam.store';
import { Tables } from '@/database/database.types';

/**
 * Convert database question row to UI question format
 * Maps: question_text -> text, option_a-e -> options[], letter -> index
 */
export function transformDBQuestionToUI(
  dbQuestion: Tables<'questions'>
): Question {
  // Build options array from individual option columns
  const options: string[] = [];
  if (dbQuestion.option_a) options.push(dbQuestion.option_a);
  if (dbQuestion.option_b) options.push(dbQuestion.option_b);
  if (dbQuestion.option_c) options.push(dbQuestion.option_c);
  if (dbQuestion.option_d) options.push(dbQuestion.option_d);
  if (dbQuestion.option_e) options.push(dbQuestion.option_e);

  // Convert correct_answer from letter (a, b, c, d, e) to index (0, 1, 2, 3, 4)
  const answerLetters = ['a', 'b', 'c', 'd', 'e'];
  const correctAnswerIndex = answerLetters.indexOf(
    (dbQuestion.correct_answer || 'a').toLowerCase()
  );

  return {
    id: dbQuestion.id,
    text: dbQuestion.question_text,
    options: options,
    correct_answer_index: Math.max(0, correctAnswerIndex), // Default to 0 if not found
    difficulty: dbQuestion.difficulty as 'easy' | 'medium' | 'hard',
    topic: dbQuestion.subject_id || 'General',
  };
}

/**
 * Convert correct_answer letter to index
 * Used in answer validation
 */
export function convertCorrectAnswerLetterToIndex(
  correctAnswerLetter: string
): number {
  const answerLetters = ['a', 'b', 'c', 'd', 'e'];
  const index = answerLetters.indexOf((correctAnswerLetter || 'a').toLowerCase());
  return Math.max(0, index);
}

/**
 * Convert correct_answer index back to letter
 * Reverse operation for storage/reference
 */
export function convertCorrectAnswerIndexToLetter(index: number): string {
  const answerLetters = ['a', 'b', 'c', 'd', 'e'];
  return answerLetters[index] || 'a';
}
