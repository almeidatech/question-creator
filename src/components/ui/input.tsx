'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

/**
 * Input Component Props
 * Text input supporting multiple variants and states
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visual state variant */
  variant?: 'default' | 'error' | 'success';
  /** Optional error message */
  errorMessage?: string;
  /** Optional helper text */
  helperText?: string;
  /** Optional label text */
  label?: string;
}

/**
 * Input Atom Component
 *
 * Text input field with state variants and optional validation messages
 *
 * @example
 * ```tsx
 * <Input
 *   type="email"
 *   placeholder="Enter email"
 *   label="Email"
 * />
 * <Input
 *   variant="error"
 *   errorMessage="Email is invalid"
 *   label="Email"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    variant = 'default',
    errorMessage,
    helperText,
    label,
    className = '',
    disabled = false,
    ...props
  }, ref) => {
    // Base input styles
    const baseStyles =
      'w-full px-4 py-2 text-base border-2 rounded-lg transition-colors focus:outline-none disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50';

    // Variant styles
    const variantStyles = {
      default:
        'border-neutral-300 text-neutral-900 placeholder-neutral-400 hover:border-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
      error:
        'border-error-500 text-neutral-900 placeholder-neutral-400 hover:border-error-600 focus:border-error-500 focus:ring-1 focus:ring-error-500',
      success:
        'border-success-500 text-neutral-900 placeholder-neutral-400 hover:border-success-600 focus:border-success-500 focus:ring-1 focus:ring-success-500',
    };

    // Combine styles
    const finalInputClassName = `${baseStyles} ${variantStyles[variant]} ${className}`
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {label}
            {props.required && <span className="text-error-600 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          className={finalInputClassName}
          disabled={disabled}
          {...(variant === 'error' ? { "aria-invalid": "true" } : {})}
          aria-describedby={
            errorMessage ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
          }
          {...props}
        />

        {errorMessage && variant === 'error' && (
          <p
            id={`${props.id}-error`}
            className="mt-1 text-sm text-error-600"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        {helperText && variant !== 'error' && (
          <p
            id={`${props.id}-helper`}
            className="mt-1 text-sm text-neutral-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
