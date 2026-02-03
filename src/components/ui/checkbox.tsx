'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

/**
 * Checkbox Component Props
 */
export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Indeterminate state */
  indeterminate?: boolean;
}

/**
 * Checkbox Atom Component
 *
 * Checkbox input with label support
 *
 * @example
 * ```tsx
 * <Checkbox id="agree" label="I agree to terms" />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, indeterminate, className = '', ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className={`
            w-4 h-4 border-2 border-neutral-300 rounded
            checked:bg-primary-600 checked:border-primary-600
            hover:border-neutral-400
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
            ${className}
          `
            .replace(/\s+/g, ' ')
            .trim()}
          {...props}
        />
        {label && (
          <label
            htmlFor={props.id}
            className="ml-3 text-sm text-neutral-700 cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

