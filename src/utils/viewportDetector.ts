/**
 * Viewport detection utility for responsive design
 * Determines device type and screen size for adaptive styling
 *
 * @module utils/viewportDetector
 */

import * as logger from './logger.js';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface Breakpoint {
  min: number;
  max: number;
}

/**
 * Breakpoint definitions following common responsive design patterns
 * Based on popular frameworks like Tailwind CSS and Bootstrap
 */
export const BREAKPOINTS: Record<string, Breakpoint> = {
  // Mobile-first approach
  mobile: {
    min: 0,
    max: 767, // Up to tablet
  },
  tablet: {
    min: 768,
    max: 1023, // iPad and similar
  },
  desktop: {
    min: 1024,
    max: Infinity, // Desktop and larger
  },

  // Specific mobile breakpoints for fine-tuning
  small: {
    min: 0,
    max: 479, // Small phones
  },
  medium: {
    min: 480,
    max: 767, // Large phones
  },
};

export interface ResponsiveContext {
  deviceType: DeviceType;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  aspectRatio: number;
  isSmallMobile: boolean;
  isLargeMobile: boolean;
  scale: {
    text: number;
    icon: number;
    spacing: number;
  };
}

/**
 * Device type detection based on screen width
 * Uses window.innerWidth for real-time viewport detection
 */
export const detectDeviceType = (): DeviceType => {
  try {
    if (typeof window === 'undefined' || !window.innerWidth) {
      // Server-side or no window object - default to desktop
      return 'desktop';
    }

    const width = window.innerWidth;

    if (width <= BREAKPOINTS.mobile.max) {
      return 'mobile';
    } else if (width <= BREAKPOINTS.tablet.max) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  } catch (error) {
    const err = error as Error;
    logger.debug('Error detecting device type:', err.message);
    return 'desktop'; // Safe fallback
  }
};

/**
 * Checks if current viewport is mobile size
 * Convenience function for mobile-specific logic
 */
export const isMobile = (): boolean => {
  return detectDeviceType() === 'mobile';
};

/**
 * Checks if current viewport is tablet size
 * Convenience function for tablet-specific logic
 */
export const isTablet = (): boolean => {
  return detectDeviceType() === 'tablet';
};

/**
 * Checks if current viewport is desktop size
 * Convenience function for desktop-specific logic
 */
export const isDesktop = (): boolean => {
  return detectDeviceType() === 'desktop';
};

/**
 * Gets the exact screen width in pixels
 * Useful for precise responsive calculations
 */
export const getScreenWidth = (): number => {
  try {
    return window.innerWidth || 1024; // Desktop fallback
  } catch (error) {
    const err = error as Error;
    logger.debug('Error getting screen width:', err.message);
    return 1024; // Safe desktop fallback
  }
};

/**
 * Gets the exact screen height in pixels
 * Useful for viewport height calculations
 */
export const getScreenHeight = (): number => {
  try {
    return window.innerHeight || 768; // Standard desktop fallback
  } catch (error) {
    const err = error as Error;
    logger.debug('Error getting screen height:', err.message);
    return 768; // Safe fallback
  }
};

/**
 * Checks if the current device is likely touch-enabled
 * Uses multiple heuristics for better detection
 */
export const isTouchDevice = (): boolean => {
  try {
    // Check for touch events support
    const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check for mobile user agent patterns
    const mobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || ''
    );

    // Combine viewport size with other indicators
    const isSmallScreen = getScreenWidth() <= BREAKPOINTS.tablet.max;

    return hasTouchEvents || (mobileUserAgent && isSmallScreen);
  } catch (error) {
    const err = error as Error;
    logger.debug('Error detecting touch device:', err.message);
    return false; // Conservative fallback
  }
};

/**
 * Creates a responsive context object with device information
 * Useful for passing comprehensive viewport data to components
 */
export const createResponsiveContext = (): ResponsiveContext => {
  try {
    const deviceType = detectDeviceType();
    const width = getScreenWidth();
    const height = getScreenHeight();

    return {
      deviceType,
      width,
      height,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isTouchDevice: isTouchDevice(),
      aspectRatio: width / height,

      // Utility functions bound to current context
      isSmallMobile: width <= BREAKPOINTS.small.max,
      isLargeMobile: width > BREAKPOINTS.small.max && width <= BREAKPOINTS.medium.max,

      // Scaling factors for responsive design
      scale: {
        // Conservative scaling for text and icons
        text: deviceType === 'mobile' ? 0.9 : 1.0,
        icon: deviceType === 'mobile' ? 0.85 : 1.0,
        spacing: deviceType === 'mobile' ? 0.8 : 1.0,
      },
    };
  } catch (error) {
    const err = error as Error;
    logger.error('Error creating responsive context:', err.message);

    // Return safe fallback context
    return {
      deviceType: 'desktop',
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      aspectRatio: 1024 / 768,
      isSmallMobile: false,
      isLargeMobile: false,
      scale: {
        text: 1.0,
        icon: 1.0,
        spacing: 1.0,
      },
    };
  }
};

/**
 * Adds a resize event listener for dynamic responsive behavior
 * Calls the provided callback when viewport size changes
 */
export const addResponsiveListener = (
  callback: (context: ResponsiveContext) => void,
  debounceMs = 250
): (() => void) => {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {}; // No-op cleanup for invalid environments
  }

  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedCallback = (): void => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        const context = createResponsiveContext();
        callback(context);
      } catch (error) {
        const err = error as Error;
        logger.error('Error in responsive listener callback:', err.message);
      }
    }, debounceMs);
  };

  window.addEventListener('resize', debouncedCallback);

  // Return cleanup function
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    window.removeEventListener('resize', debouncedCallback);
  };
};
