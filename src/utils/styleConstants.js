/**
 * Centralized style constants for the TimeIsMoney extension
 * Provides consistent design tokens for colors, typography, and spacing
 *
 * @module utils/styleConstants
 */

/**
 * Color palette for the extension
 * Uses semantic naming for easy theme switching
 */
export const COLORS = {
  // Primary brand colors
  primary: {
    main: '#2563eb', // Blue-600, professional and highly readable
    light: '#3b82f6', // Blue-500, lighter variant for dark backgrounds
    dark: '#1d4ed8', // Blue-700, darker variant for emphasis
  },

  // Neutral colors for text and backgrounds
  neutral: {
    white: '#ffffff',
    gray: {
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
  },

  // Semantic colors for different states
  semantic: {
    success: '#3b82f6', // Blue-500, matches primary theme
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#2563eb', // Blue-600, primary brand color
  },
};

/**
 * Typography scale following a consistent ratio
 * Font sizes in rem units for accessibility
 */
export const TYPOGRAPHY = {
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  // Responsive typography scales
  responsive: {
    // Font sizes optimized for different device types
    fontSize: {
      mobile: {
        xs: '0.6875rem', // 11px - slightly smaller for mobile
        sm: '0.75rem', // 12px - reduced from 14px
        base: '0.875rem', // 14px - reduced from 16px
        lg: '1rem', // 16px - reduced from 18px
        xl: '1.125rem', // 18px - reduced from 20px
      },
      tablet: {
        xs: '0.75rem', // 12px - same as default
        sm: '0.8125rem', // 13px - slight reduction
        base: '0.9375rem', // 15px - slight reduction
        lg: '1.0625rem', // 17px - slight reduction
        xl: '1.1875rem', // 19px - slight reduction
      },
      desktop: {
        xs: '0.75rem', // 12px - default sizes
        sm: '0.875rem', // 14px
        base: '1rem', // 16px
        lg: '1.125rem', // 18px
        xl: '1.25rem', // 20px
      },
    },
  },
};

/**
 * Spacing scale using a consistent 4px base unit
 * Values in rem for consistency with typography
 */
export const SPACING = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px

  // Responsive spacing scales
  responsive: {
    mobile: {
      0: '0',
      1: '0.1875rem', // 3px - reduced from 4px
      2: '0.375rem', // 6px - reduced from 8px
      3: '0.5625rem', // 9px - reduced from 12px
      4: '0.75rem', // 12px - reduced from 16px
      5: '0.9375rem', // 15px - reduced from 20px
      6: '1.125rem', // 18px - reduced from 24px
      8: '1.5rem', // 24px - reduced from 32px
    },
    tablet: {
      0: '0',
      1: '0.21875rem', // 3.5px - slight reduction
      2: '0.4375rem', // 7px - slight reduction
      3: '0.65625rem', // 10.5px - slight reduction
      4: '0.875rem', // 14px - slight reduction
      5: '1.09375rem', // 17.5px - slight reduction
      6: '1.3125rem', // 21px - slight reduction
      8: '1.75rem', // 28px - slight reduction
    },
    desktop: {
      0: '0',
      1: '0.25rem', // 4px - default
      2: '0.5rem', // 8px
      3: '0.75rem', // 12px
      4: '1rem', // 16px
      5: '1.25rem', // 20px
      6: '1.5rem', // 24px
      8: '2rem', // 32px
    },
  },
};

/**
 * Border radius values for consistent rounded corners
 */
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  full: '9999px', // Fully rounded
};

/**
 * Animation and transition values
 */
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    // Micro-interaction specific durations
    entrance: '250ms',
    exit: '200ms',
    hover: '150ms',
    focus: '100ms',
    update: '300ms',
  },

  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Micro-interaction specific easing
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },

  // Micro-interaction animation configurations
  microInteractions: {
    badgeEntrance: {
      duration: '250ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      keyframes: 'tim-badge-entrance',
    },
    badgeExit: {
      duration: '200ms',
      easing: 'ease-in',
      keyframes: 'tim-badge-exit',
    },
    badgeUpdate: {
      duration: '300ms',
      easing: 'ease-in-out',
      keyframes: 'tim-badge-update',
    },
    hover: {
      duration: '150ms',
      easing: 'ease-out',
      properties: ['opacity', 'transform'],
    },
    focus: {
      duration: '100ms',
      easing: 'ease-out',
      properties: ['box-shadow', 'outline'],
    },
    // Aliases for simpler usage
    entrance: {
      duration: '250ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      keyframes: 'tim-badge-entrance',
    },
    exit: {
      duration: '200ms',
      easing: 'ease-in',
      keyframes: 'tim-badge-exit',
    },
    update: {
      duration: '300ms',
      easing: 'ease-in-out',
      keyframes: 'tim-badge-update',
    },
  },

  // CSS keyframes definitions
  keyframes: {
    'tim-badge-entrance': `
      @keyframes tim-badge-entrance {
        0% {
          opacity: 0;
          transform: scale(0.8) translateY(-2px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `,
    'tim-badge-exit': `
      @keyframes tim-badge-exit {
        0% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        100% {
          opacity: 0;
          transform: scale(0.9) translateY(-1px);
        }
      }
    `,
    'tim-badge-update': `
      @keyframes tim-badge-update {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
        100% {
          opacity: 1;
        }
      }
    `,
  },
};

/**
 * Z-index scale for layering
 */
export const Z_INDEX = {
  base: 1,
  overlay: 10,
  modal: 100,
  tooltip: 1000,
  maximum: 9999,
};

/**
 * Badge-specific design tokens
 * Combines base tokens into component-specific configurations
 */
export const BADGE_STYLES = {
  // Default badge appearance
  default: {
    color: COLORS.primary.main,
    backgroundColor: 'transparent',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    padding: `${SPACING[1]} ${SPACING[2]}`,
    borderRadius: BORDER_RADIUS.sm,
    border: 'none',
  },

  // Badge on light backgrounds
  light: {
    color: COLORS.primary.main,
    backgroundColor: COLORS.neutral.gray[50],
    borderColor: COLORS.neutral.gray[200],
  },

  // Badge on dark backgrounds
  dark: {
    color: COLORS.primary.light,
    backgroundColor: COLORS.neutral.gray[800],
    borderColor: COLORS.neutral.gray[600],
  },

  // High contrast mode
  highContrast: {
    color: COLORS.neutral.white,
    backgroundColor: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
};

/**
 * Icon styling constants
 */
export const ICON_STYLES = {
  size: {
    xs: '0.75rem', // 12px
    sm: '1rem', // 16px
    base: '1.25rem', // 20px
    lg: '1.5rem', // 24px
  },

  clock: {
    width: '0.75rem', // 12px
    height: '0.75rem', // 12px
    marginRight: SPACING[1],
  },

  // Responsive icon sizes
  responsive: {
    mobile: {
      xs: '0.625rem', // 10px - smaller for mobile
      sm: '0.75rem', // 12px - reduced from 16px
      base: '0.875rem', // 14px - reduced from 20px
      lg: '1rem', // 16px - reduced from 24px
    },
    tablet: {
      xs: '0.6875rem', // 11px - slight reduction
      sm: '0.875rem', // 14px - slight reduction
      base: '1.0625rem', // 17px - slight reduction
      lg: '1.25rem', // 20px - slight reduction
    },
    desktop: {
      xs: '0.75rem', // 12px - default
      sm: '1rem', // 16px
      base: '1.25rem', // 20px
      lg: '1.5rem', // 24px
    },
  },
};
