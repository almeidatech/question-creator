'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes, HTMLAttributes } from 'react';

/**
 * Radio Group Item Props
 */
export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Radio Group Container Props
 */
export interface RadioGroupProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * Radio Atom Component
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex items-center mb-2">
        <input
          ref={ref}
          type="radio"
          className={`
            w-4 h-4 border-2 border-neutral-300 rounded-full
            checked:border-primary-600 checked:bg-primary-600
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
          <label htmlFor={props.id} className="ml-3 text-sm text-neutral-700 cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

/**
 * RadioGroup Atom Component
 *
 * Container for radio button groups
 *
 * @example
 * ```tsx
 * <RadioGroup>
 *   <Radio id="opt1" name="choice" label="Option 1" />
 *   <Radio id="opt2" name="choice" label="Option 2" />
 * </RadioGroup>
 * ```
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col ${className}`.trim()}
        role="group"
        {...props}
      >
        {children}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

