'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import {
  DifficultyLevel,
  DIFFICULTY_LEVELS,
  getBadgeSizeClasses,
  getDifficultyAriaLabel,
  getBaseBadgeClasses,
} from './badge-utils';

/**
 * DifficultyBadge Component Props
 */
export interface DifficultyBadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Question or task difficulty level */
  difficulty: DifficultyLevel;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show difficulty icon/star indicators */
  showIcon?: boolean;
  /** Show difficulty label text */
  showLabel?: boolean;
}

/**
 * DifficultyBadge Molecule Component
 *
 * Displays difficulty level with optional star indicators.
 * Supports 4 levels: Easy, Medium, Hard, Expert.
 * Each level has distinct color coding and star count representation.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DifficultyBadge difficulty="medium" />
 *
 * // With icon and label
 * <DifficultyBadge difficulty="hard" showIcon showLabel size="lg" />
 *
 * // Icon only (no label)
 * <DifficultyBadge difficulty="expert" showIcon size="md" showLabel={false} />
 * ```
 */
export const DifficultyBadge = forwardRef<HTMLDivElement, DifficultyBadgeProps>(
  (
    {
      difficulty,
      size = 'md',
      showIcon = true,
      showLabel = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const config = DIFFICULTY_LEVELS[difficulty];
    const sizeClasses = getBadgeSizeClasses(size);
    const baseClasses = getBaseBadgeClasses();
    const ariaLabel = getDifficultyAriaLabel(difficulty);

    // Render star indicators for difficulty level
    const renderStarIndicators = () => {
      if (!showIcon) return null;

      return (
        <span className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: config.stars }).map((_, i) => (
            <span
              key={i}
              className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`}
            >
              ⭐
            </span>
          ))}
          {Array.from({ length: 4 - config.stars }).map((_, i) => (
            <span
              key={`empty-${i}`}
              className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} opacity-25`}
            >
              ⭐
            </span>
          ))}
        </span>
      );
    };

    const finalClassName = `${baseClasses} ${config.bgClass} ${config.textClass} ${sizeClasses} ${className}`
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <div
        ref={ref}
        role="status"
        className={finalClassName}
        aria-label={ariaLabel}
        data-difficulty={difficulty}
        {...props}
      >
        {renderStarIndicators()}
        {showLabel && <span className="font-medium">{config.label}</span>}
      </div>
    );
  }
);

DifficultyBadge.displayName = 'DifficultyBadge';
