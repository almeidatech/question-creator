'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import {
  ReputationLevel,
  REPUTATION_LEVELS,
  getBadgeSizeClasses,
  getReputationAriaLabel,
  getBaseBadgeClasses,
} from './badge-utils';

/**
 * ReputationBadge Component Props
 */
export interface ReputationBadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** User reputation level */
  level: ReputationLevel;
  /** Optional reputation score (0-100) */
  score?: number;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show the score value */
  showScore?: boolean;
  /** Show level icon/indicator */
  showIcon?: boolean;
}

/**
 * ReputationBadge Molecule Component
 *
 * Displays user reputation level with optional score indicator.
 * Supports 4 levels: Beginner, Intermediate, Advanced, Expert.
 * Each level has distinct color coding for visual differentiation.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ReputationBadge level="advanced" />
 *
 * // With score display
 * <ReputationBadge level="advanced" score={75} showScore size="lg" />
 *
 * // With icon indicator
 * <ReputationBadge level="expert" score={95} showIcon showScore />
 * ```
 */
export const ReputationBadge = forwardRef<HTMLDivElement, ReputationBadgeProps>(
  (
    {
      level,
      score,
      size = 'md',
      showScore = false,
      showIcon = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const config = REPUTATION_LEVELS[level];
    const sizeClasses = getBadgeSizeClasses(size);
    const baseClasses = getBaseBadgeClasses();
    const ariaLabel = getReputationAriaLabel(level, score);

    // Render star icons based on level
    const renderLevelIcon = () => {
      if (!showIcon) return null;

      const levelStarMap = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4,
      };

      const starCount = levelStarMap[level];
      return (
        <span className="flex gap-0.5" aria-hidden="true">
          {Array.from({ length: starCount }).map((_, i) => (
            <span
              key={i}
              className={`w-4 h-4 ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`}
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
        data-level={level}
        {...props}
      >
        {renderLevelIcon()}
        <span className="font-medium">{config.label}</span>
        {showScore && score !== undefined && (
          <span className="text-xs opacity-75" aria-label={`score: ${score}`}>
            {score}%
          </span>
        )}
      </div>
    );
  }
);

ReputationBadge.displayName = 'ReputationBadge';

