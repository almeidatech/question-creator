'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Button Component Props
 * Flexible button component supporting multiple variants and sizes
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading state */
  isLoading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Button Atom Component
 *
 * Fundamental button component with multiple variants and sizes
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="outline" size="lg" disabled>Disabled</Button>
 * <Button isLoading={true}>Loading...</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled = false,
    children,
    ...props
  }, ref) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm h-8',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-6 py-3 text-lg h-12',
    };

    // Variant styles
    const variantStyles = {
      primary:
        'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 focus:ring-sky-500',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 focus:ring-gray-500',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
      ghost:
        'bg-transparent text-sky-600 hover:bg-sky-50 active:bg-sky-100 focus:ring-sky-500',
      outline:
        'border-2 border-gray-300 text-gray-900 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-500',
    };

    // Combine styles
    const finalClassName = `
      ${baseStyles}
      ${sizeStyles[size]}
      ${variantStyles[variant]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <button
        ref={ref}
        className={finalClassName}
        disabled={disabled || isLoading}
        {...(isLoading ? { "aria-busy": "true" } : {})}
        {...(disabled || isLoading ? { "aria-disabled": "true" } : {})}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

