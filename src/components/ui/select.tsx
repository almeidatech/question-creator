'use client';

import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

/**
 * Select Component Props
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional label text */
  label?: string;
  /** Options array */
  options?: Array<{ value: string; label: string }>;
  /** Optional error message */
  errorMessage?: string;
}

/**
 * Select Atom Component
 *
 * Dropdown select component
 *
 * @example
 * ```tsx
 * <Select
 *   label="Choose option"
 *   options={[
 *     { value: 'a', label: 'Option A' },
 *     { value: 'b', label: 'Option B' },
 *   ]}
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    options = [],
    errorMessage,
    className = '',
    ...props
  }, ref) => {
    const baseStyles =
      'w-full px-4 py-2 text-base border-2 border-neutral-300 rounded-lg transition-colors focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 hover:border-neutral-400';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
            {props.required && <span className="text-error-600 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          className={`${baseStyles} ${className}`.replace(/\s+/g, ' ').trim()}
          aria-invalid={!!errorMessage}
          {...props}
        >
          <option value="">Select an option...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {errorMessage && (
          <p className="mt-1 text-sm text-error-600" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
