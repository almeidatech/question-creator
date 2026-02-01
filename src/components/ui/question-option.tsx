'use client';

import { forwardRef, ReactNode } from 'react';
import { KeyboardEvents } from './input-utils';

/**
 * Props for QuestionOption component
 */
export interface QuestionOptionProps {
  /** Unique identifier for the option */
  id: string;
  /** Label text for the option */
  label: string;
  /** Optional description text */
  description?: string;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Whether option is selected */
  isSelected?: boolean;
  /** Whether option is disabled */
  isDisabled?: boolean;
  /** Type of control: radio or checkbox */
  type?: 'radio' | 'checkbox';
  /** Callback when selection changes */
  onChange?: (selected: boolean) => void;
  /** Callback for keyboard events */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** Custom CSS classes */
  className?: string;
}

/**
 * QuestionOption Molecule Component
 *
 * A selectable option for questions with support for radio/checkbox,
 * keyboard navigation, and accessibility features.
 *
 * Features:
 * - Radio button and checkbox support
 * - Selected/disabled states
 * - Keyboard navigation (Tab, Enter, Space)
 * - WCAG AA accessibility (aria-checked, role attributes)
 * - Hover and focus visual feedback
 *
 * @example
 * ```tsx
 * <QuestionOption
 *   id="opt-1"
 *   label="Option A"
 *   description="This is option A"
 *   isSelected={selectedOption === 'opt-1'}
 *   type="radio"
 *   onChange={() => setSelectedOption('opt-1')}
 * />
 * ```
 */
export const QuestionOption = forwardRef<HTMLDivElement, QuestionOptionProps>(
  (
    {
      id,
      label,
      description,
      icon,
      isSelected = false,
      isDisabled = false,
      type = 'radio',
      onChange,
      onKeyDown,
      className = '',
    },
    ref
  ) => {
    const handleClick = () => {
      if (!isDisabled) {
        onChange?.(!isSelected);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isDisabled) return;

      if (KeyboardEvents.isSpace(e.key) || KeyboardEvents.isEnter(e.key)) {
        e.preventDefault();
        onChange?.(!isSelected);
      }

      onKeyDown?.(e);
    };

    // Base styles
    const baseStyles =
      'flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Variant styles based on state
    const variantStyles = isDisabled
      ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-50'
      : isSelected
        ? 'border-primary-500 bg-primary-50'
        : 'border-neutral-300 bg-white hover:border-primary-300 hover:bg-primary-50';

    // Focus ring color
    const focusRing = isDisabled
      ? 'focus:ring-neutral-300'
      : 'focus:ring-primary-500';

    const containerClasses = `${baseStyles} ${variantStyles} ${focusRing} ${className}`
      .replace(/\s+/g, ' ')
      .trim();

    // Checkbox/Radio control styles
    const controlBaseStyles =
      'flex-shrink-0 w-5 h-5 border-2 rounded transition-colors';
    const controlVariantStyles = isDisabled
      ? 'border-neutral-300 bg-neutral-100'
      : isSelected
        ? 'border-primary-500 bg-primary-500'
        : 'border-neutral-300 bg-white';

    const controlClasses = `${controlBaseStyles} ${controlVariantStyles}`
      .replace(/\s+/g, ' ')
      .trim();

    // Checkbox shape
    const controlShape = type === 'radio' ? 'rounded-full' : 'rounded';

    return (
      <div
        ref={ref}
        role={type}
        aria-checked={isSelected}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        className={containerClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Control (Radio/Checkbox) */}
        <div
          className={`${controlClasses} ${controlShape} flex items-center justify-center`}
        >
          {isSelected && (
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Icon (optional) */}
        {icon && <div className="flex-shrink-0 text-neutral-600">{icon}</div>}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-900">{label}</div>
          {description && (
            <div className="text-sm text-neutral-600 mt-0.5">{description}</div>
          )}
        </div>
      </div>
    );
  }
);

QuestionOption.displayName = 'QuestionOption';
