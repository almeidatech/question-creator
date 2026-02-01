'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

/**
 * Divider Component Props
 */
export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Divider orientation */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Divider Atom Component
 *
 * Visual separator line
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" />
 * ```
 */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ orientation = 'horizontal', className = '', ...props }, ref) => {
    const orientationClass =
      orientation === 'vertical'
        ? 'w-px h-full border-l border-neutral-200'
        : 'w-full h-px border-t border-neutral-200';

    return (
      <hr
        ref={ref}
        className={`${orientationClass} ${className}`.replace(/\s+/g, ' ').trim()}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
