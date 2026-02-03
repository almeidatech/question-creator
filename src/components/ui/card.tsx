'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

/**
 * Card Component Props
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant/style */
  variant?: 'default' | 'elevated' | 'outlined';
  /** Add padding inside card */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card Atom Component
 *
 * Container component for grouping related content
 *
 * @example
 * ```tsx
 * <Card variant="default" padding="md">
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    variant = 'default',
    padding = 'md',
    className = '',
    children,
    ...props
  }, ref) => {
    const baseStyles = 'rounded-lg transition-all';

    const variantStyles = {
      default: 'bg-white border border-neutral-200 shadow-sm',
      elevated: 'bg-white shadow-md',
      outlined: 'border-2 border-neutral-300 bg-neutral-50',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const finalClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${paddingStyles[padding]}
      ${className}
    `
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <div ref={ref} className={finalClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

