/**
 * Badge Utility Functions and Types
 * Shared logic for reputation and difficulty badges
 */

/**
 * Reputation level types
 */
export type ReputationLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Difficulty level types
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Reputation level configuration
 */
export interface ReputationLevelConfig {
  label: string;
  color: string;
  minScore: number;
  bgClass: string;
  textClass: string;
}

/**
 * Difficulty level configuration
 */
export interface DifficultyLevelConfig {
  label: string;
  color: string;
  stars: number;
  bgClass: string;
  textClass: string;
}

/**
 * Reputation level mapping with colors and metadata
 */
export const REPUTATION_LEVELS: Record<ReputationLevel, ReputationLevelConfig> = {
  beginner: {
    label: 'Beginner',
    color: 'primary',
    minScore: 0,
    bgClass: 'bg-primary-100',
    textClass: 'text-primary-800',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'success',
    minScore: 30,
    bgClass: 'bg-success-100',
    textClass: 'text-success-800',
  },
  advanced: {
    label: 'Advanced',
    color: 'warning',
    minScore: 60,
    bgClass: 'bg-warning-100',
    textClass: 'text-warning-800',
  },
  expert: {
    label: 'Expert',
    color: 'error',
    minScore: 90,
    bgClass: 'bg-error-100',
    textClass: 'text-error-800',
  },
};

/**
 * Difficulty level mapping with colors and stars
 */
export const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyLevelConfig> = {
  easy: {
    label: 'Easy',
    color: 'success',
    stars: 1,
    bgClass: 'bg-success-100',
    textClass: 'text-success-800',
  },
  medium: {
    label: 'Medium',
    color: 'warning',
    stars: 2,
    bgClass: 'bg-warning-100',
    textClass: 'text-warning-800',
  },
  hard: {
    label: 'Hard',
    color: 'error',
    stars: 3,
    bgClass: 'bg-error-100',
    textClass: 'text-error-800',
  },
  expert: {
    label: 'Expert',
    color: 'primary',
    stars: 4,
    bgClass: 'bg-primary-100',
    textClass: 'text-primary-800',
  },
};

/**
 * Get size classes for badge variants
 * @param size - Badge size (sm, md, lg)
 * @returns Tailwind classes for sizing
 */
export function getBadgeSizeClasses(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const sizeMap = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  return sizeMap[size];
}

/**
 * Get ARIA label for reputation level
 * @param level - Reputation level
 * @param score - Optional score value
 * @returns ARIA label string
 */
export function getReputationAriaLabel(level: ReputationLevel, score?: number): string {
  const config = REPUTATION_LEVELS[level];
  if (score !== undefined) {
    return `${config.label} reputation, score ${score}`;
  }
  return `${config.label} reputation level`;
}

/**
 * Get ARIA label for difficulty level
 * @param difficulty - Difficulty level
 * @returns ARIA label string
 */
export function getDifficultyAriaLabel(difficulty: DifficultyLevel): string {
  const config = DIFFICULTY_LEVELS[difficulty];
  return `${config.label} difficulty level, ${config.stars} out of 4 difficulty stars`;
}

/**
 * Get base badge styling classes
 * @returns Tailwind classes for badge base styles
 */
export function getBaseBadgeClasses(): string {
  return 'inline-flex items-center justify-center gap-2 font-semibold rounded-full whitespace-nowrap transition-colors duration-200';
}
