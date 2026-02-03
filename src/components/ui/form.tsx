'use client';

import { forwardRef } from 'react';
import type { FormHTMLAttributes } from 'react';

/**
 * Form Component Props
 */
export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children?: React.ReactNode;
}

/**
 * Form Atom Component
 *
 * Form wrapper with styling
 *
 * @example
 * ```tsx
 * <Form onSubmit={handleSubmit}>
 *   <Input name="email" type="email" />
 *   <Button type="submit">Submit</Button>
 * </Form>
 * ```
 */
export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={`space-y-4 ${className}`.replace(/\s+/g, ' ').trim()}
        noValidate
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

