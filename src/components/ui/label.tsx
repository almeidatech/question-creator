'use client';

import { forwardRef } from 'react';
import type { LabelHTMLAttributes } from 'react';

/**
 * Label Component Props
 */
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Whether the label indicates a required field */
  required?: boolean;
  /** Optional helper text */
  helperText?: string;
}

/**
 * Label Atom Component
 *
 * Accessible label for form fields with optional required indicator
 *
 * @example
 * ```tsx
 * <Label htmlFor="email" required>Email</Label>
 * <Label htmlFor="bio" helperText="Max 500 characters">Biography</Label>
 * ```
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, helperText, className = '', children, ...props }, ref) => {
    const baseStyles = 'block text-sm font-medium text-neutral-700';

    return (
      <div>
        <label
          ref={ref}
          className={`${baseStyles} ${className}`.replace(/\s+/g, ' ').trim()}
          {...props}
        >
          {children}
          {required && <span className="text-error-600 ml-1">*</span>}
        </label>
        {helperText && (
          <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Label.displayName = 'Label';

