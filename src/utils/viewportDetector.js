/**
 * Viewport detection utility for responsive design
 * Determines device type and screen size for adaptive styling
 *
 * @module utils/viewportDetector
 */

import * as logger from './logger.js';

/**
 * Breakpoint definitions following common responsive design patterns
 * Based on popular frameworks like Tailwind CSS and Bootstrap
 */
export const BREAKPOINTS = {
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

/**
 * Device type detection based on screen width
 * Uses window.innerWidth for real-time viewport detection
 *
 * @returns {'mobile'|'tablet'|'desktop'} Device type classification
 */
export const detectDeviceType = () => {
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
    logger.debug('Error detecting device type:', error.message);
    return 'desktop'; // Safe fallback
  }
};

/**
 * Checks if current viewport is mobile size
 * Convenience function for mobile-specific logic
 *
 * @returns {boolean} True if viewport is mobile size
 */
export const isMobile = () => {
  return detectDeviceType() === 'mobile';
};

/**
 * Checks if current viewport is tablet size
 * Convenience function for tablet-specific logic
 *
 * @returns {boolean} True if viewport is tablet size
 */
export const isTablet = () => {
  return detectDeviceType() === 'tablet';
};

/**
 * Checks if current viewport is desktop size
 * Convenience function for desktop-specific logic
 *
 * @returns {boolean} True if viewport is desktop size
 */
export const isDesktop = () => {
  return detectDeviceType() === 'desktop';
};

/**
 * Gets the exact screen width in pixels
 * Useful for precise responsive calculations
 *
 * @returns {number} Screen width in pixels, or 1024 as fallback
 */
export const getScreenWidth = () => {
  try {
    return window.innerWidth || 1024; // Desktop fallback
  } catch (error) {
    logger.debug('Error getting screen width:', error.message);
    return 1024; // Safe desktop fallback
  }
};

/**
 * Gets the exact screen height in pixels
 * Useful for viewport height calculations
 *
 * @returns {number} Screen height in pixels, or 768 as fallback
 */
export const getScreenHeight = () => {
  try {
    return window.innerHeight || 768; // Standard desktop fallback
  } catch (error) {
    logger.debug('Error getting screen height:', error.message);
    return 768; // Safe fallback
  }
};

/**
 * Checks if the current device is likely touch-enabled
 * Uses multiple heuristics for better detection
 *
 * @returns {boolean} True if device likely supports touch
 */
export const isTouchDevice = () => {
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
    logger.debug('Error detecting touch device:', error.message);
    return false; // Conservative fallback
  }
};

/**
 * Creates a responsive context object with device information
 * Useful for passing comprehensive viewport data to components
 *
 * @returns {object} Responsive context with device type and capabilities
 */
export const createResponsiveContext = () => {
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
    logger.error('Error creating responsive context:', error.message);

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
 *
 * @param {Function} callback - Function to call on resize
 * @param {number} [debounceMs] - Debounce delay in milliseconds
 * @returns {Function} Cleanup function to remove the listener
 */
export const addResponsiveListener = (callback, debounceMs = 250) => {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {}; // No-op cleanup for invalid environments
  }

  let timeoutId = null;

  const debouncedCallback = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        const context = createResponsiveContext();
        callback(context);
      } catch (error) {
        logger.error('Error in responsive listener callback:', error.message);
      }
    }, debounceMs);
  };

  window.addEventListener('resize', debouncedCallback);

  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', debouncedCallback);
  };
};
