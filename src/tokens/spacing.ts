/**
 * Design System Spacing Tokens
 * Consistent spacing scale for padding, margins, and gaps
 * Based on 4px grid system (Tailwind convention)
 */

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
} as const;

// Preset spacing combinations for common use cases
export const spacingCombinations = {
  // Compact layouts
  compact: {
    padding: spacing[2], // 8px
    gap: spacing[2],
    margin: spacing[1], // 4px
  },

  // Normal layouts
  normal: {
    padding: spacing[4], // 16px
    gap: spacing[4],
    margin: spacing[3], // 12px
  },

  // Spacious layouts
  spacious: {
    padding: spacing[6], // 24px
    gap: spacing[6],
    margin: spacing[4], // 16px
  },

  // Component padding
  component: {
    sm: spacing[2], // 8px
    md: spacing[3], // 12px
    lg: spacing[4], // 16px
  },

  // Container padding
  container: {
    mobile: spacing[4], // 16px
    tablet: spacing[6], // 24px
    desktop: spacing[8], // 32px
  },

  // Gap between items
  gap: {
    tight: spacing[2], // 8px
    normal: spacing[3], // 12px
    loose: spacing[4], // 16px
  },
} as const;

// Semantic spacing scales for specific use cases
export const semanticSpacing = {
  // Border radius (often related to spacing in design systems)
  borderRadius: {
    none: '0px',
    sm: '2px',
    base: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },

  // Icon sizes (often sized relative to spacing)
  iconSize: {
    xs: spacing[3], // 12px
    sm: spacing[4], // 16px
    md: spacing[6], // 24px
    lg: spacing[8], // 32px
    xl: spacing[10], // 40px
  },

  // Badge sizes
  badgeSize: {
    sm: {
      padding: `${spacing[1]} ${spacing[2]}`,
      height: spacing[5],
    },
    md: {
      padding: `${spacing[1]} ${spacing[3]}`,
      height: spacing[6],
    },
  },

  // Button sizes
  buttonSize: {
    sm: {
      padding: `${spacing[2]} ${spacing[3]}`,
      height: spacing[8],
      fontSize: '0.875rem',
    },
    md: {
      padding: `${spacing[2]} ${spacing[4]}`,
      height: spacing[10],
      fontSize: '1rem',
    },
    lg: {
      padding: `${spacing[3]} ${spacing[6]}`,
      height: spacing[12],
      fontSize: '1.125rem',
    },
  },

  // Input sizes
  inputSize: {
    sm: {
      padding: `${spacing[2]} ${spacing[3]}`,
      height: spacing[8],
    },
    md: {
      padding: `${spacing[2]} ${spacing[4]}`,
      height: spacing[10],
    },
    lg: {
      padding: `${spacing[3]} ${spacing[4]}`,
      height: spacing[12],
    },
  },
} as const;

export type SpacingValue = keyof typeof spacing;
export type BorderRadiusValue = keyof typeof semanticSpacing.borderRadius;
export type IconSizeValue = keyof typeof semanticSpacing.iconSize;
