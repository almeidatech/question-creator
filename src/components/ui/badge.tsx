'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

/**
 * Badge Component Props
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge variant/color */
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge Atom Component
 *
 * Small status indicator component for labels, tags, and status
 *
 * @example
 * ```tsx
 * <Badge variant="primary">New</Badge>
 * <Badge variant="success" size="lg">Approved</Badge>
 * <Badge variant="error">Error</Badge>
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...props
  }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-full whitespace-nowrap';

    const variantStyles = {
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-success-100 text-success-800',
      error: 'bg-error-100 text-error-800',
      warning: 'bg-warning-100 text-warning-800',
      info: 'bg-info-100 text-info-800',
      neutral: 'bg-neutral-200 text-neutral-800',
    };

    const sizeStyles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    const finalClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <span ref={ref} className={finalClassName} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

