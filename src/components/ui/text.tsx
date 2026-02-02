'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { TextStyle } from '@/tokens';

/**
 * Text/Typography Component Props
 */
export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Text style variant */
  variant?: TextStyle;
  /** HTML element to render as */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label' | 'small';
  /** Text color */
  color?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'white';
}

/**
 * Text Component - Generic Typography
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({
    variant = 'body',
    as = 'p',
    color = 'primary',
    className = '',
    children,
    ...props
  }, ref) => {
    const Element = as as any;

    const variantClasses = {
      'heading-1': 'text-4xl font-bold leading-tight',
      'heading-2': 'text-3xl font-bold leading-snug',
      'heading-3': 'text-2xl font-semibold leading-snug',
      'heading-4': 'text-xl font-semibold',
      'heading-5': 'text-lg font-semibold',
      'body-lg': 'text-base leading-relaxed',
      body: 'text-sm leading-normal',
      'body-sm': 'text-xs leading-normal',
      label: 'text-sm font-medium',
      caption: 'text-xs text-neutral-500',
      code: 'text-sm font-mono bg-neutral-100 px-2 py-1 rounded',
      button: 'text-sm font-semibold tracking-wide',
    };

    const colorClasses = {
      primary: 'text-neutral-900',
      secondary: 'text-neutral-600',
      tertiary: 'text-neutral-500',
      disabled: 'text-neutral-300',
      white: 'text-white',
    };

    return (
      <Element
        ref={ref}
        className={`
          ${variantClasses[variant] || variantClasses.body}
          ${colorClasses[color]}
          ${className}
        `
          .replace(/\s+/g, ' ')
          .trim()}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Text.displayName = 'Text';

/**
 * Heading Component - h1
 */
export const Heading1 = forwardRef<HTMLHeadingElement, TextProps>(
  (props, ref) => <Text ref={ref} as="h1" variant="heading-1" {...props} />
);
Heading1.displayName = 'Heading1';

/**
 * Heading Component - h2
 */
export const Heading2 = forwardRef<HTMLHeadingElement, TextProps>(
  (props, ref) => <Text ref={ref} as="h2" variant="heading-2" {...props} />
);
Heading2.displayName = 'Heading2';

/**
 * Heading Component - h3
 */
export const Heading3 = forwardRef<HTMLHeadingElement, TextProps>(
  (props, ref) => <Text ref={ref} as="h3" variant="heading-3" {...props} />
);
Heading3.displayName = 'Heading3';

/**
 * Paragraph Component
 */
export const Paragraph = forwardRef<HTMLParagraphElement, TextProps>(
  (props, ref) => <Text ref={ref} as="p" variant="body" {...props} />
);
Paragraph.displayName = 'Paragraph';

/**
 * Caption Component
 */
export const Caption = forwardRef<HTMLElement, TextProps>(
  (props, ref) => <Text ref={ref} as="small" variant="caption" {...props} />
);
Caption.displayName = 'Caption';
