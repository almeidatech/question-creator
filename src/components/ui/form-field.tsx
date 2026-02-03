'use client';

import { forwardRef } from 'react';
import type { ReactNode } from 'react';

/**
 * FormField Component Props
 * Wrapper for form inputs with label, error, and helper text support
 */
export interface FormFieldProps {
  /** Label text for the field */
  label?: ReactNode;
  /** Whether the field is required */
  required?: boolean;
  /** Helper text displayed below label */
  helperText?: string;
  /** Error message displayed when variant is error */
  errorMessage?: string;
  /** Visual state variant */
  variant?: 'default' | 'error' | 'success';
  /** The input element(s) to wrap */
  children: ReactNode;
  /** Connect label to input via htmlFor attribute */
  htmlFor?: string;
  /** CSS class name for the container */
  className?: string;
}

/**
 * FormField Molecule Component
 *
 * Combines Label + Input/Select + Error/Helper Text into a reusable form field wrapper.
 * Handles label associations, error display, and accessibility attributes.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   required
 *   helperText="We'll never share your email"
 *   htmlFor="email-input"
 * >
 *   <Input id="email-input" type="email" />
 * </FormField>
 *
 * <FormField
 *   label="Password"
 *   errorMessage="Password must be at least 8 characters"
 *   variant="error"
 *   htmlFor="password-input"
 * >
 *   <Input id="password-input" type="password" />
 * </FormField>
 * ```
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    label,
    required = false,
    helperText,
    errorMessage,
    variant = 'default',
    children,
    htmlFor,
    className = '',
  }, ref) => {
    // Determine the ID for aria-describedby
    const describedById = errorMessage
      ? `${htmlFor}-error`
      : helperText
        ? `${htmlFor}-helper`
        : undefined;

    // Get color classes based on variant
    const labelColorClass = variant === 'error' ? 'text-error-600' : 'text-neutral-700';
    const errorColorClass = 'text-error-600';
    const helperColorClass = 'text-neutral-500';

    return (
      <div
        ref={ref}
        className={`w-full ${className}`.replace(/\s+/g, ' ').trim()}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={htmlFor}
            className={`block text-sm font-medium ${labelColorClass} mb-2`}
          >
            {label}
            {required && <span className="text-error-600 ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        {/* Children (Input, Select, etc.) */}
        <div
          aria-describedby={describedById}
        >
          {children}
        </div>

        {/* Error Message */}
        {errorMessage && variant === 'error' && (
          <p
            id={describedById}
            className={`mt-2 text-sm ${errorColorClass}`}
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        {/* Helper Text */}
        {helperText && variant !== 'error' && (
          <p
            id={describedById}
            className={`mt-2 text-sm ${helperColorClass}`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

