/**
 * Design System Typography Tokens
 * Font sizes, weights, and line heights for Question Creator MVP
 * Follows Tailwind convention with semantic naming
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
    ].join(', '),
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      '"SF Mono"',
      'Consolas',
      '"Liberation Mono"',
      'Menlo',
      'monospace',
    ].join(', '),
  },

  // Font Sizes (with line heights)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },

  // Font Weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Text Styles - Semantic typography combinations
export const textStyles = {
  // Headings
  'heading-1': {
    fontSize: typography.fontSize['4xl'][0],
    lineHeight: typography.fontSize['4xl'][1]?.lineHeight || '2.5rem',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },

  'heading-2': {
    fontSize: typography.fontSize['3xl'][0],
    lineHeight: typography.fontSize['3xl'][1]?.lineHeight || '2.25rem',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },

  'heading-3': {
    fontSize: typography.fontSize['2xl'][0],
    lineHeight: typography.fontSize['2xl'][1]?.lineHeight || '2rem',
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.tight,
  },

  'heading-4': {
    fontSize: typography.fontSize.xl[0],
    lineHeight: typography.fontSize.xl[1]?.lineHeight || '1.75rem',
    fontWeight: typography.fontWeight.semibold,
  },

  'heading-5': {
    fontSize: typography.fontSize.lg[0],
    lineHeight: typography.fontSize.lg[1]?.lineHeight || '1.75rem',
    fontWeight: typography.fontWeight.semibold,
  },

  // Body text
  'body-lg': {
    fontSize: typography.fontSize.base[0],
    lineHeight: typography.fontSize.base[1]?.lineHeight || '1.5rem',
    fontWeight: typography.fontWeight.normal,
  },

  body: {
    fontSize: typography.fontSize.sm[0],
    lineHeight: typography.fontSize.sm[1]?.lineHeight || '1.25rem',
    fontWeight: typography.fontWeight.normal,
  },

  'body-sm': {
    fontSize: typography.fontSize.xs[0],
    lineHeight: typography.fontSize.xs[1]?.lineHeight || '1rem',
    fontWeight: typography.fontWeight.normal,
  },

  // Labels
  label: {
    fontSize: typography.fontSize.sm[0],
    lineHeight: typography.fontSize.sm[1]?.lineHeight || '1.25rem',
    fontWeight: typography.fontWeight.medium,
  },

  // Caption
  caption: {
    fontSize: typography.fontSize.xs[0],
    lineHeight: typography.fontSize.xs[1]?.lineHeight || '1rem',
    fontWeight: typography.fontWeight.normal,
  },

  // Code/Monospace
  code: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm[0],
    lineHeight: typography.fontSize.sm[1]?.lineHeight || '1.25rem',
    fontWeight: typography.fontWeight.normal,
  },

  button: {
    fontSize: typography.fontSize.sm[0],
    lineHeight: typography.fontSize.sm[1]?.lineHeight || '1.25rem',
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
} as const;

export type TextStyle = keyof typeof textStyles;
export type FontWeight = keyof typeof typography.fontWeight;
export type FontSize = keyof typeof typography.fontSize;
