/**
 * Design System Shadow Tokens
 * Elevation system for depth and hierarchy
 * Material Design inspired shadow scale
 */

export const shadows = {
  // No shadow
  none: 'none',

  // Subtle shadow (elevation 1)
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  // Light shadow (elevation 2)
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',

  // Medium shadow (elevation 3)
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // Elevated shadow (elevation 4)
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

  // High elevation shadow (elevation 5)
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // Very high elevation (elevation 6)
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Floating card shadow
  card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // Modal/Dialog shadow
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // Dropdown shadow
  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

  // Focus ring shadow (interactive)
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)',

  // Inner shadow (pressed state)
  inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;

// Named shadow levels for component use
export const shadowLevels = {
  // Level 0 - No elevation
  level0: shadows.none,

  // Level 1 - Subtle hover state
  level1: shadows.sm,

  // Level 2 - Default component elevation
  level2: shadows.base,

  // Level 3 - Card hover or button elevation
  level3: shadows.md,

  // Level 4 - Floating elements, tooltips
  level4: shadows.lg,

  // Level 5 - Modals, dropdowns
  level5: shadows.xl,

  // Level 6 - Overlays, notifications
  level6: shadows['2xl'],
} as const;

// Component-specific shadows
export const componentShadows = {
  button: {
    default: shadows.base,
    hover: shadows.md,
    active: shadows.inset,
    focus: shadows.focus,
  },

  card: {
    default: shadows.card,
    hover: shadows.lg,
    focus: shadows.focus,
  },

  input: {
    default: shadows.sm,
    focus: shadows.focus,
    error: '0 0 0 3px rgba(239, 68, 68, 0.1)',
  },

  dropdown: {
    open: shadows.dropdown,
  },

  modal: {
    backdrop: 'none',
    content: shadows.modal,
  },

  tooltip: {
    default: shadows.lg,
  },

  notification: {
    default: shadows.lg,
  },
} as const;

export type ShadowKey = keyof typeof shadows;
export type ShadowLevel = keyof typeof shadowLevels;

