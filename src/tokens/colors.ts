/**
 * Design System Color Tokens
 * Complete color palette for Question Creator MVP
 * Follows Tailwind CSS convention with 50-900 scale
 * Semantic naming: primary, success, error, warning, neutral
 */

export const colors = {
  // Primary Blue (Main brand color)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c3d66',
  },

  // Success Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
  },

  // Error Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Warning Orange/Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Info Cyan
  info: {
    50: '#ecf0ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Neutral Gray (for text, borders, backgrounds)
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Semantic color aliases
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  divider: '#d1d5db',
  disabled: '#9ca3af',
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#9ca3af',
    disabled: '#d1d5db',
    inverse: '#ffffff',
  },
} as const;

// Color exports for CSS variables
export const colorTokens = {
  // Primary
  '--color-primary-50': colors.primary[50],
  '--color-primary-100': colors.primary[100],
  '--color-primary-200': colors.primary[200],
  '--color-primary-300': colors.primary[300],
  '--color-primary-400': colors.primary[400],
  '--color-primary-500': colors.primary[500],
  '--color-primary-600': colors.primary[600],
  '--color-primary-700': colors.primary[700],
  '--color-primary-800': colors.primary[800],
  '--color-primary-900': colors.primary[900],

  // Success
  '--color-success-50': colors.success[50],
  '--color-success-100': colors.success[100],
  '--color-success-200': colors.success[200],
  '--color-success-300': colors.success[300],
  '--color-success-400': colors.success[400],
  '--color-success-500': colors.success[500],
  '--color-success-600': colors.success[600],
  '--color-success-700': colors.success[700],
  '--color-success-800': colors.success[800],
  '--color-success-900': colors.success[900],

  // Error
  '--color-error-50': colors.error[50],
  '--color-error-100': colors.error[100],
  '--color-error-200': colors.error[200],
  '--color-error-300': colors.error[300],
  '--color-error-400': colors.error[400],
  '--color-error-500': colors.error[500],
  '--color-error-600': colors.error[600],
  '--color-error-700': colors.error[700],
  '--color-error-800': colors.error[800],
  '--color-error-900': colors.error[900],

  // Warning
  '--color-warning-50': colors.warning[50],
  '--color-warning-100': colors.warning[100],
  '--color-warning-200': colors.warning[200],
  '--color-warning-300': colors.warning[300],
  '--color-warning-400': colors.warning[400],
  '--color-warning-500': colors.warning[500],
  '--color-warning-600': colors.warning[600],
  '--color-warning-700': colors.warning[700],
  '--color-warning-800': colors.warning[800],
  '--color-warning-900': colors.warning[900],

  // Info
  '--color-info-50': colors.info[50],
  '--color-info-100': colors.info[100],
  '--color-info-200': colors.info[200],
  '--color-info-300': colors.info[300],
  '--color-info-400': colors.info[400],
  '--color-info-500': colors.info[500],
  '--color-info-600': colors.info[600],
  '--color-info-700': colors.info[700],
  '--color-info-800': colors.info[800],
  '--color-info-900': colors.info[900],

  // Neutral
  '--color-neutral-0': colors.neutral[0],
  '--color-neutral-50': colors.neutral[50],
  '--color-neutral-100': colors.neutral[100],
  '--color-neutral-200': colors.neutral[200],
  '--color-neutral-300': colors.neutral[300],
  '--color-neutral-400': colors.neutral[400],
  '--color-neutral-500': colors.neutral[500],
  '--color-neutral-600': colors.neutral[600],
  '--color-neutral-700': colors.neutral[700],
  '--color-neutral-800': colors.neutral[800],
  '--color-neutral-900': colors.neutral[900],
} as const;

export type ColorKey = keyof typeof colors;
export type ColorShade = keyof typeof colors.primary;
