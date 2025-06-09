/**
 * CSS-in-JS style generator for the TimeIsMoney extension
 * Generates CSS strings from style constants and context
 *
 * @module utils/styleGenerator
 */

import { SPACING, ANIMATION, BADGE_STYLES, ICON_STYLES, TYPOGRAPHY } from './styleConstants.js';
import { createResponsiveContext } from './viewportDetector.js';
import { generateConflictResistantStyles } from './styleConflictProtection.js';
import {
  getCachedBadgeStyles,
  setCachedBadgeStyles,
  getCachedIconStyles,
  setCachedIconStyles,
  getCachedTheme,
  setCachedTheme,
  getCachedResponsiveContext,
  setCachedResponsiveContext,
} from './styleCache.js';
import { detectBackgroundImageTheme } from './imageThemeDetector.js';
import * as logger from './logger.js';

/**
 * Gets responsive value based on device type
 * Selects appropriate value from responsive scale
 *
 * @param {object} responsiveScale - Object with mobile/tablet/desktop keys
 * @param {string} [deviceType] - Device type override, auto-detected if not provided
 * @returns {*} The appropriate value for the current/specified device type
 */
export const getResponsiveValue = (responsiveScale, deviceType = null) => {
  try {
    if (!responsiveScale || typeof responsiveScale !== 'object') {
      return responsiveScale; // Return as-is if not a responsive scale
    }

    // Auto-detect device type if not provided using cached responsive context
    let finalDeviceType = deviceType;
    if (!finalDeviceType) {
      const cachedContext = getCachedResponsiveContext();
      if (cachedContext) {
        finalDeviceType = cachedContext.deviceType;
      } else {
        const responsiveContext = createResponsiveContext();
        setCachedResponsiveContext(responsiveContext);
        finalDeviceType = responsiveContext.deviceType;
      }
    }

    // Return device-specific value or fallback to desktop
    return responsiveScale[finalDeviceType] || responsiveScale.desktop || responsiveScale;
  } catch (error) {
    logger.debug('Error getting responsive value:', error.message);
    return responsiveScale.desktop || responsiveScale; // Safe fallback
  }
};

/**
 * Gets responsive font size based on size key and device type
 *
 * @param {string} sizeKey - Size key (xs, sm, base, lg, xl)
 * @param {string} [deviceType] - Device type override
 * @returns {string} CSS font size value
 */
export const getResponsiveFontSize = (sizeKey, deviceType = null) => {
  try {
    let finalDeviceType = deviceType;
    if (!finalDeviceType) {
      const cachedContext = getCachedResponsiveContext();
      if (cachedContext) {
        finalDeviceType = cachedContext.deviceType;
      } else {
        const responsiveContext = createResponsiveContext();
        setCachedResponsiveContext(responsiveContext);
        finalDeviceType = responsiveContext.deviceType;
      }
    }

    const responsiveSizes = TYPOGRAPHY.responsive.fontSize[finalDeviceType];

    return responsiveSizes?.[sizeKey] || TYPOGRAPHY.fontSize[sizeKey] || TYPOGRAPHY.fontSize.sm;
  } catch (error) {
    logger.debug('Error getting responsive font size:', error.message);
    return TYPOGRAPHY.fontSize[sizeKey] || TYPOGRAPHY.fontSize.sm;
  }
};

/**
 * Gets responsive spacing value based on spacing key and device type
 *
 * @param {string|number} spacingKey - Spacing key (0, 1, 2, etc.)
 * @param {string} [deviceType] - Device type override
 * @returns {string} CSS spacing value
 */
export const getResponsiveSpacing = (spacingKey, deviceType = null) => {
  try {
    let finalDeviceType = deviceType;
    if (!finalDeviceType) {
      const cachedContext = getCachedResponsiveContext();
      if (cachedContext) {
        finalDeviceType = cachedContext.deviceType;
      } else {
        const responsiveContext = createResponsiveContext();
        setCachedResponsiveContext(responsiveContext);
        finalDeviceType = responsiveContext.deviceType;
      }
    }

    const responsiveSpacing = SPACING.responsive[finalDeviceType];

    return responsiveSpacing?.[spacingKey] || SPACING[spacingKey] || SPACING[1];
  } catch (error) {
    logger.debug('Error getting responsive spacing:', error.message);
    return SPACING[spacingKey] || SPACING[1];
  }
};

/**
 * Gets responsive icon size based on size key and device type
 *
 * @param {string} sizeKey - Size key (xs, sm, base, lg)
 * @param {string} [deviceType] - Device type override
 * @returns {string} CSS icon size value
 */
export const getResponsiveIconSize = (sizeKey, deviceType = null) => {
  try {
    let finalDeviceType = deviceType;
    if (!finalDeviceType) {
      const cachedContext = getCachedResponsiveContext();
      if (cachedContext) {
        finalDeviceType = cachedContext.deviceType;
      } else {
        const responsiveContext = createResponsiveContext();
        setCachedResponsiveContext(responsiveContext);
        finalDeviceType = responsiveContext.deviceType;
      }
    }

    const responsiveSizes = ICON_STYLES.responsive[finalDeviceType];

    return responsiveSizes?.[sizeKey] || ICON_STYLES.size[sizeKey] || ICON_STYLES.size.xs;
  } catch (error) {
    logger.debug('Error getting responsive icon size:', error.message);
    return ICON_STYLES.size[sizeKey] || ICON_STYLES.size.xs;
  }
};

/**
 * Detects the background color/image of an element to determine appropriate styling
 * Now supports background images, gradients, and complex backgrounds
 *
 * @param {HTMLElement} element - The element to analyze
 * @returns {'light'|'dark'|'unknown'} The detected background theme
 */
export const detectBackgroundTheme = (element) => {
  try {
    if (!element || !window.getComputedStyle) {
      return 'unknown';
    }

    // Check cache first
    const cachedTheme = getCachedTheme(element);
    if (cachedTheme !== undefined) {
      return cachedTheme;
    }

    // Walk up the DOM tree to find a meaningful background
    let currentElement = element;
    let maxDepth = 10; // Prevent infinite loops
    let imageAnalysisTriggered = false;

    while (currentElement && maxDepth > 0) {
      const styles = window.getComputedStyle(currentElement);
      const backgroundColor = styles.backgroundColor;
      const backgroundImage = styles.backgroundImage;

      // First, try solid background color detection (fastest)
      if (
        backgroundColor &&
        backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        backgroundColor !== 'transparent'
      ) {
        // Parse RGB values to determine brightness
        const rgbMatch = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);

          // Calculate perceived brightness using the relative luminance formula
          // https://www.w3.org/WAI/GL/wiki/Relative_luminance
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          const theme = luminance > 0.5 ? 'light' : 'dark';

          // Cache the result
          setCachedTheme(element, theme);
          logger.debug('Theme detected from solid color', {
            element: currentElement.tagName,
            theme,
          });
          return theme;
        }
      }

      // If no solid color found, check for background images
      if (backgroundImage && backgroundImage !== 'none' && !imageAnalysisTriggered) {
        // Trigger async image analysis in background for future calls
        imageAnalysisTriggered = true;
        detectBackgroundImageTheme(currentElement)
          .then((imageTheme) => {
            if (imageTheme !== 'unknown') {
              setCachedTheme(element, imageTheme);
              logger.debug('Theme detected from background image (async)', {
                element: currentElement.tagName,
                theme: imageTheme,
              });
            }
          })
          .catch((error) => {
            logger.debug('Background image analysis failed:', error.message);
          });
      }

      currentElement = currentElement.parentElement;
      maxDepth--;
    }

    // If we have already triggered image analysis, check if results are available
    // This handles the case where image analysis completed very quickly
    const updatedCachedTheme = getCachedTheme(element);
    if (updatedCachedTheme !== undefined) {
      return updatedCachedTheme;
    }

    // Default to light if we can't determine immediately
    // Image analysis may update this asynchronously via cache
    const defaultTheme = 'light';
    setCachedTheme(element, defaultTheme);
    logger.debug('Theme detection fallback to default', {
      element: element.tagName,
      theme: defaultTheme,
      imageAnalysisTriggered,
    });
    return defaultTheme;
  } catch (error) {
    logger.debug('Error detecting background theme:', error.message);
    return 'light'; // Safe default
  }
};

/**
 * Async version of theme detection that waits for image analysis to complete
 * Use this when you can afford to wait for more accurate theme detection
 *
 * @param {HTMLElement} element - The element to analyze
 * @returns {Promise<'light'|'dark'|'unknown'>} The detected background theme
 */
export const detectBackgroundThemeAsync = async (element) => {
  try {
    if (!element || !window.getComputedStyle) {
      return 'unknown';
    }

    // First try synchronous detection (solid colors)
    const syncTheme = detectBackgroundTheme(element);

    // Check cache again to see if async analysis completed
    const cachedTheme = getCachedTheme(element);
    if (cachedTheme !== undefined && cachedTheme !== 'light') {
      // Return cached result if it's not the default fallback
      return cachedTheme;
    }

    // Walk up DOM tree to try image analysis on each element with background images
    let currentElement = element;
    let maxDepth = 10;

    while (currentElement && maxDepth > 0) {
      const styles = window.getComputedStyle(currentElement);
      const backgroundImage = styles.backgroundImage;

      if (backgroundImage && backgroundImage !== 'none') {
        const imageTheme = await detectBackgroundImageTheme(currentElement);
        if (imageTheme !== 'unknown') {
          setCachedTheme(element, imageTheme);
          logger.debug('Theme detected from background image (async)', {
            element: currentElement.tagName,
            theme: imageTheme,
          });
          return imageTheme;
        }
      }

      currentElement = currentElement.parentElement;
      maxDepth--;
    }

    // Return sync result if no image analysis succeeded
    return syncTheme;
  } catch (error) {
    logger.debug('Error in async background theme detection:', error.message);
    return 'light'; // Safe default
  }
};

/**
 * Generates CSS string for badge styling based on context
 *
 * @param {object} options - Styling options
 * @param {HTMLElement} [options.context] - DOM context for theme detection
 * @param {'default'|'light'|'dark'|'highContrast'} [options.variant] - Style variant
 * @param {object} [options.overrides] - CSS property overrides
 * @param {boolean} [options.responsive] - Whether to use responsive sizing (default: true)
 * @param {string} [options.deviceType] - Force specific device type for responsive styles
 * @param {boolean} [options.conflictProtection] - Enable style conflict protection (default: true)
 * @param {boolean} [options.defensiveStyles] - Enable defensive styling (default: true)
 * @param {boolean} [options.minimalDefensive] - Use minimal defensive styling (default: false)
 * @returns {string} CSS string ready for cssText assignment
 */
export const generateBadgeStyles = (options = {}) => {
  try {
    const {
      context = null,
      variant = 'default',
      overrides = {},
      responsive = true,
      deviceType = null,
      conflictProtection = true,
      defensiveStyles = true,
      minimalDefensive = false,
    } = options;

    // Check cache first
    const cachedStyles = getCachedBadgeStyles(options);
    if (cachedStyles !== undefined) {
      return cachedStyles;
    }

    // Auto-detect variant based on context if not specified
    let finalVariant = variant;
    if (variant === 'default' && context) {
      const detectedTheme = detectBackgroundTheme(context);
      finalVariant = detectedTheme === 'dark' ? 'dark' : 'light';
    }

    // Get base styles for the variant
    const baseStyles = BADGE_STYLES[finalVariant] || BADGE_STYLES.default;

    // Apply responsive sizing if enabled
    let responsiveStyles = {};
    if (responsive) {
      const responsiveContext = deviceType ? { deviceType } : createResponsiveContext();
      responsiveStyles = {
        fontSize: getResponsiveFontSize('sm', responsiveContext.deviceType),
        padding: `${getResponsiveSpacing(1, responsiveContext.deviceType)} ${getResponsiveSpacing(2, responsiveContext.deviceType)}`,
      };
    }

    // Merge with overrides
    const finalStyles = {
      ...baseStyles,
      ...responsiveStyles,
      ...overrides,
      // Always include these for cross-browser compatibility
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      verticalAlign: 'baseline',
      textDecoration: 'none',
      userSelect: 'none',
      transition: `opacity ${ANIMATION.duration.normal} ${ANIMATION.easing.easeOut}`,
    };

    // Generate conflict-resistant CSS string
    const generatedStyles = generateConflictResistantStyles(finalStyles, {
      protection: conflictProtection,
      defensive: defensiveStyles,
      minimal: minimalDefensive,
    });

    // Cache the result
    setCachedBadgeStyles(options, generatedStyles);

    return generatedStyles;
  } catch (error) {
    logger.error('Error generating badge styles:', error.message);
    // Return safe fallback styles
    return generateFallbackBadgeStyles();
  }
};

/**
 * Generates CSS string for icon styling
 *
 * @param {object} options - Icon styling options
 * @param {'xs'|'sm'|'base'|'lg'} [options.size] - Icon size
 * @param {string} [options.color] - Icon color
 * @param {object} [options.overrides] - CSS property overrides
 * @param {boolean} [options.responsive] - Whether to use responsive sizing (default: true)
 * @param {string} [options.deviceType] - Force specific device type for responsive styles
 * @param {boolean} [options.conflictProtection] - Enable style conflict protection (default: true)
 * @param {boolean} [options.defensiveStyles] - Enable defensive styling (default: false for icons)
 * @returns {string} CSS string for the icon
 */
export const generateIconStyles = (options = {}) => {
  try {
    const {
      size = 'xs',
      color = 'currentColor',
      overrides = {},
      responsive = true,
      deviceType = null,
      conflictProtection = true,
      defensiveStyles = false, // Icons typically need less defensive styling
    } = options;

    // Check cache first
    const cachedStyles = getCachedIconStyles(options);
    if (cachedStyles !== undefined) {
      return cachedStyles;
    }

    // Get icon size (responsive or standard)
    let iconSize;
    if (responsive) {
      const responsiveContext = deviceType ? { deviceType } : createResponsiveContext();
      iconSize = getResponsiveIconSize(size, responsiveContext.deviceType);
    } else {
      iconSize = ICON_STYLES.size[size] || ICON_STYLES.size.xs;
    }

    // Get responsive margin if responsive mode is enabled
    let marginRight;
    if (responsive) {
      const responsiveContext = deviceType ? { deviceType } : createResponsiveContext();
      marginRight = getResponsiveSpacing(1, responsiveContext.deviceType);
    } else {
      marginRight = SPACING[1];
    }

    const styles = {
      width: iconSize,
      height: iconSize,
      marginRight: marginRight,
      fill: color,
      stroke: color,
      verticalAlign: 'middle',
      flexShrink: '0',
      ...overrides,
    };

    // Generate conflict-resistant CSS string for icons
    const generatedStyles = generateConflictResistantStyles(styles, {
      protection: conflictProtection,
      defensive: defensiveStyles,
      minimal: true, // Icons use minimal defensive styling
    });

    // Cache the result
    setCachedIconStyles(options, generatedStyles);

    return generatedStyles;
  } catch (error) {
    logger.error('Error generating icon styles:', error.message);
    return 'width: 0.75rem; height: 0.75rem; margin-right: 0.25rem; vertical-align: middle;';
  }
};

/**
 * Generates fallback styles when the main style generation fails
 *
 * @returns {string} Safe fallback CSS string
 */
const generateFallbackBadgeStyles = () => {
  return [
    'color: #059669',
    'font-weight: 600',
    'font-size: 0.875rem',
    'white-space: nowrap',
    'vertical-align: baseline',
    'text-decoration: none',
    'display: inline-flex',
    'align-items: center',
    'opacity: 0.9',
  ].join('; ');
};

/**
 * Utility function to create CSS custom properties from design tokens
 * Useful for potential future Shadow DOM implementation
 *
 * @param {object} tokens - Design token object
 * @param {string} [prefix] - CSS custom property prefix
 * @returns {string} CSS custom properties as string
 */
export const generateCSSCustomProperties = (tokens, prefix = '--tim') => {
  try {
    const flatten = (obj, parentKey = '') => {
      let result = {};

      for (const [key, value] of Object.entries(obj)) {
        const newKey = parentKey ? `${parentKey}-${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result = { ...result, ...flatten(value, newKey) };
        } else {
          result[newKey] = value;
        }
      }

      return result;
    };

    const flatTokens = flatten(tokens);

    return Object.entries(flatTokens)
      .map(([key, value]) => `${prefix}-${key}: ${value}`)
      .join('; ');
  } catch (error) {
    logger.error('Error generating CSS custom properties:', error.message);
    return '';
  }
};

/**
 * Creates a style context object that can be passed around
 * Contains detected theme, responsive context, and helper functions
 *
 * @param {HTMLElement} element - Context element for theme detection
 * @param {object} [options] - Additional options
 * @param {boolean} [options.responsive] - Whether to enable responsive features (default: true)
 * @returns {object} Style context object with theme and responsive information
 */
export const createStyleContext = (element, options = {}) => {
  try {
    const { responsive = true } = options;

    const theme = detectBackgroundTheme(element);
    const responsiveContext = responsive ? createResponsiveContext() : null;

    return {
      theme,
      element,
      responsive: responsiveContext,

      // Helper functions that automatically use the context
      generateBadgeStyles: (styleOptions = {}) =>
        generateBadgeStyles({
          context: element,
          variant: theme,
          responsive,
          ...styleOptions,
        }),

      generateIconStyles: (styleOptions = {}) =>
        generateIconStyles({
          responsive,
          ...styleOptions,
        }),

      // Responsive utility functions
      getDeviceType: () => responsiveContext?.deviceType || 'desktop',
      isMobile: () => responsiveContext?.isMobile || false,
      isTablet: () => responsiveContext?.isTablet || false,
      isDesktop: () => responsiveContext?.isDesktop || true,

      // Direct access to responsive sizing functions
      getFontSize: (sizeKey) =>
        responsive
          ? getResponsiveFontSize(sizeKey, responsiveContext?.deviceType)
          : TYPOGRAPHY.fontSize[sizeKey],
      getSpacing: (spacingKey) =>
        responsive
          ? getResponsiveSpacing(spacingKey, responsiveContext?.deviceType)
          : SPACING[spacingKey],
      getIconSize: (sizeKey) =>
        responsive
          ? getResponsiveIconSize(sizeKey, responsiveContext?.deviceType)
          : ICON_STYLES.size[sizeKey],
    };
  } catch (error) {
    logger.error('Error creating style context:', error.message);
    return {
      theme: 'light',
      element: null,
      responsive: null,
      generateBadgeStyles: () => generateFallbackBadgeStyles(),
      generateIconStyles: () => generateIconStyles({ responsive: false }),
      getDeviceType: () => 'desktop',
      isMobile: () => false,
      isTablet: () => false,
      isDesktop: () => true,
      getFontSize: (sizeKey) => TYPOGRAPHY.fontSize[sizeKey] || TYPOGRAPHY.fontSize.sm,
      getSpacing: (spacingKey) => SPACING[spacingKey] || SPACING[1],
      getIconSize: (sizeKey) => ICON_STYLES.size[sizeKey] || ICON_STYLES.size.xs,
    };
  }
};
