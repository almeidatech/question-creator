import type { Config } from 'tailwindcss';
import { colors, typography, spacing, shadowLevels, semanticSpacing } from './src/tokens';

const config: Config = {
  content: [
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      // Color palette integration
      colors: {
        primary: colors.primary,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        neutral: colors.neutral,
      },

      // Font family integration
      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
      },

      // Font size integration
      fontSize: typography.fontSize,

      // Font weight integration
      fontWeight: typography.fontWeight,

      // Line height integration
      lineHeight: typography.lineHeight,

      // Letter spacing integration
      letterSpacing: typography.letterSpacing,

      // Spacing integration (padding, margin, gap, etc.)
      spacing,

      // Border radius integration
      borderRadius: semanticSpacing.borderRadius,

      // Shadow integration
      boxShadow: {
        sm: shadowLevels.level1,
        base: shadowLevels.level2,
        md: shadowLevels.level3,
        lg: shadowLevels.level4,
        xl: shadowLevels.level5,
        '2xl': shadowLevels.level6,
        'inset': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'focus': '0 0 0 3px rgba(59, 130, 246, 0.5)',
      },

      // Custom utilities
      gap: spacing,
      margin: spacing,
      padding: spacing,
    },
  },

  plugins: [],
};

export default config;
