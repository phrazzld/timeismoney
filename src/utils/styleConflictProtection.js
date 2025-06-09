/**
 * Style Conflict Protection utilities for the TimeIsMoney extension
 * Provides protection against host site CSS interference with extension styling
 *
 * @module utils/styleConflictProtection
 */

import * as logger from './logger.js';

/**
 * CSS properties that are critical for badge functionality and appearance
 * These properties will be protected with !important to prevent override
 */
export const CRITICAL_STYLE_PROPERTIES = {
  // Layout properties - essential for badge structure
  display: true,
  position: false, // We don't typically set position, let it inherit
  boxSizing: true,
  alignItems: true,
  justifyContent: false,
  flexDirection: false,
  flexShrink: true,
  flexGrow: false,

  // Typography - important for readability
  fontSize: true,
  fontWeight: true,
  lineHeight: false, // Let this inherit for better integration
  fontFamily: false, // Let this inherit for better integration
  textDecoration: true,
  textAlign: false,

  // Visual appearance - critical for badge recognition
  color: true,
  backgroundColor: false, // We often want this transparent for integration
  border: true,
  borderRadius: true,
  opacity: true,

  // Spacing - important for layout integrity
  padding: true,
  margin: false, // Usually want this to inherit/integrate

  // Interaction - critical for user experience
  userSelect: true,
  pointerEvents: false, // Only protect if explicitly set
  cursor: false,

  // Animation - important for smooth transitions
  transition: true,
  transform: false,
  animationName: true,
  animationDuration: true,
  animationTimingFunction: true,
  animationFillMode: true,
  willChange: true,

  // Text flow - critical for inline integration
  whiteSpace: true,
  verticalAlign: true,

  // Content protection
  content: true,
  quotes: false,

  // Visibility
  visibility: false,
  overflow: false,
  zIndex: false, // Only protect if explicitly set
};

/**
 * Defensive CSS properties to add to all badges for style conflict prevention
 * These properties help reset potentially conflicting host site styles
 */
export const DEFENSIVE_STYLE_PROPERTIES = {
  // Reset potentially problematic inherited styles
  textTransform: 'none', // Prevent uppercase/lowercase transformations
  letterSpacing: 'normal', // Reset letter spacing
  wordSpacing: 'normal', // Reset word spacing
  textIndent: '0', // Reset text indentation
  textShadow: 'none', // Remove text shadows that might clash

  // Reset box model properties that might interfere
  minWidth: 'auto', // Allow natural sizing
  maxWidth: 'none', // Don't constrain width
  minHeight: 'auto', // Allow natural sizing
  maxHeight: 'none', // Don't constrain height
  width: 'auto', // Let content determine width
  height: 'auto', // Let content determine height

  // Reset positioning that might interfere
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  left: 'auto',

  // Reset float and clear that might affect layout
  float: 'none',
  clear: 'none',

  // Reset outline that might interfere with design
  outline: 'none',

  // Reset list styles (in case badge is in a list context)
  listStyle: 'none',
  listStyleType: 'none',
  listStylePosition: 'outside',
  listStyleImage: 'none',

  // Reset table styles (in case badge is in a table context)
  borderCollapse: 'separate',
  borderSpacing: '0',
  captionSide: 'top',
  emptyCells: 'show',
  tableLayout: 'auto',

  // Reset flexbox properties that might be inherited
  order: '0',
  alignSelf: 'auto',
  justifySelf: 'auto',

  // Reset grid properties that might be inherited
  gridArea: 'auto',
  gridColumn: 'auto',
  gridRow: 'auto',
};

/**
 * Adds !important declarations to critical CSS properties
 * Only adds !important to properties that are marked as critical
 *
 * @param {object} styles - CSS styles object
 * @param {object} [options] - Protection options
 * @param {boolean} [options.forceImportant] - Force !important on all properties
 * @param {string[]} [options.excludeProperties] - Properties to exclude from protection
 * @returns {object} Styles object with !important added to critical properties
 */
export const addStyleProtection = (styles, options = {}) => {
  try {
    const { forceImportant = false, excludeProperties = [] } = options;
    const protectedStyles = { ...styles };

    Object.keys(protectedStyles).forEach((property) => {
      // Skip excluded properties
      if (excludeProperties.includes(property)) {
        return;
      }

      // Check if this property should be protected
      const shouldProtect = forceImportant || CRITICAL_STYLE_PROPERTIES[property];

      if (shouldProtect && protectedStyles[property]) {
        const currentValue = protectedStyles[property];

        // Only add !important if it's not already there
        if (typeof currentValue === 'string' && !currentValue.includes('!important')) {
          protectedStyles[property] = `${currentValue} !important`;
        }
      }
    });

    return protectedStyles;
  } catch (error) {
    logger.debug('Error adding style protection:', error.message);
    return styles; // Return original styles on error
  }
};

/**
 * Adds defensive CSS properties to styles to prevent host site interference
 * These properties help reset potentially conflicting styles from the host site
 *
 * @param {object} styles - Existing CSS styles object
 * @param {object} [options] - Defensive options
 * @param {boolean} [options.minimal] - Only add minimal defensive properties
 * @returns {object} Styles object with defensive properties added
 */
export const addDefensiveStyles = (styles, options = {}) => {
  try {
    const { minimal = false } = options;

    // Start with defensive properties
    const defensiveStyles = minimal
      ? getMinimalDefensiveStyles()
      : { ...DEFENSIVE_STYLE_PROPERTIES };

    // Merge with existing styles, giving priority to explicit styles
    return {
      ...defensiveStyles,
      ...styles, // User styles override defensive styles
    };
  } catch (error) {
    logger.debug('Error adding defensive styles:', error.message);
    return styles; // Return original styles on error
  }
};

/**
 * Gets a minimal set of defensive styles for low-impact protection
 * Used when full defensive styling might interfere with host site integration
 *
 * @returns {object} Minimal defensive styles object
 */
export const getMinimalDefensiveStyles = () => {
  return {
    textTransform: 'none',
    letterSpacing: 'normal',
    textIndent: '0',
    float: 'none',
    clear: 'none',
    outline: 'none',
    listStyle: 'none',
  };
};

/**
 * Generates conflict-resistant CSS string with protection and defensive styling
 * Combines style protection and defensive styling for maximum conflict resistance
 *
 * @param {object} styles - Base CSS styles object
 * @param {object} [options] - Protection options
 * @param {boolean} [options.protection] - Enable style protection (default: true)
 * @param {boolean} [options.defensive] - Enable defensive styling (default: true)
 * @param {boolean} [options.minimal] - Use minimal defensive styling (default: false)
 * @param {boolean} [options.forceImportant] - Force !important on all properties (default: false)
 * @param {string[]} [options.excludeProperties] - Properties to exclude from protection
 * @returns {string} CSS string with conflict resistance applied
 */
export const generateConflictResistantStyles = (styles, options = {}) => {
  try {
    const {
      protection = true,
      defensive = true,
      minimal = false,
      forceImportant = false,
      excludeProperties = [],
    } = options;

    let finalStyles = { ...styles };

    // Add defensive styles first (so they can be overridden by explicit styles)
    if (defensive) {
      finalStyles = addDefensiveStyles(finalStyles, { minimal });
    }

    // Add style protection (this affects the final styles)
    if (protection) {
      finalStyles = addStyleProtection(finalStyles, { forceImportant, excludeProperties });
    }

    // Convert to CSS string
    const cssString = Object.entries(finalStyles)
      .map(([property, value]) => {
        if (!value) return null; // Skip null/undefined values

        // Convert camelCase to kebab-case
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssProperty}: ${value}`;
      })
      .filter(Boolean) // Remove null entries
      .join('; ');

    return cssString;
  } catch (error) {
    logger.error('Error generating conflict-resistant styles:', error.message);
    // Return basic fallback CSS
    return Object.entries(styles)
      .map(([property, value]) => {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssProperty}: ${value}`;
      })
      .join('; ');
  }
};

/**
 * Validates that critical styles are properly protected
 * Used for testing and debugging style conflict protection
 *
 * @param {string} cssString - CSS string to validate
 * @returns {object} Validation result with any issues found
 */
export const validateStyleProtection = (cssString) => {
  try {
    const issues = [];
    const suggestions = [];

    // Parse CSS string into properties
    const properties = {};
    cssString.split(';').forEach((declaration) => {
      const [property, value] = declaration.split(':').map((s) => s.trim());
      if (property && value) {
        properties[property] = value;
      }
    });

    // Check for missing !important on critical properties
    Object.entries(CRITICAL_STYLE_PROPERTIES).forEach(([property, isCritical]) => {
      if (isCritical) {
        const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        const propertyValue = properties[kebabProperty];

        if (propertyValue && !propertyValue.includes('!important')) {
          issues.push(`Critical property '${kebabProperty}' lacks !important protection`);
          suggestions.push(`Add !important to ${kebabProperty}: ${propertyValue}`);
        }
      }
    });

    // Check for potentially problematic inherited styles
    const problematicStyles = ['text-transform', 'letter-spacing', 'text-indent'];
    problematicStyles.forEach((property) => {
      if (!properties[property]) {
        suggestions.push(`Consider adding defensive style: ${property}: none/normal/0`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      protectedProperties: Object.keys(properties).filter(
        (prop) => properties[prop] && properties[prop].includes('!important')
      ),
    };
  } catch (error) {
    logger.debug('Error validating style protection:', error.message);
    return {
      isValid: false,
      issues: ['Failed to validate style protection'],
      suggestions: [],
      protectedProperties: [],
    };
  }
};

/**
 * Utility to generate unique class names for additional conflict resistance
 * Generates class names with random suffixes to avoid collisions
 *
 * @param {string} baseClassName - Base class name (e.g., 'tim-badge')
 * @param {number} [randomLength] - Length of random suffix (default: 8)
 * @returns {string} Unique class name with random suffix
 */
export const generateUniqueClassName = (baseClassName, randomLength = 8) => {
  try {
    // Validate randomLength parameter
    if (randomLength <= 0) {
      return baseClassName; // Return base name for invalid length
    }

    // Generate random alphanumeric suffix
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomSuffix = '';

    for (let i = 0; i < randomLength; i++) {
      randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${baseClassName}-${randomSuffix}`;
  } catch (error) {
    logger.debug('Error generating unique class name:', error.message);
    return baseClassName; // Return base name on error
  }
};

/**
 * Creates a style conflict test element for debugging
 * Used to test if styles are properly protected against host site interference
 *
 * @param {string} testStyles - CSS styles to test
 * @param {string} [testText] - Text content for the test element
 * @returns {HTMLElement} Test element with applied styles
 */
export const createStyleConflictTestElement = (testStyles, testText = 'Test Badge') => {
  try {
    const testElement = document.createElement('span');
    testElement.className = 'tim-style-conflict-test';
    testElement.textContent = testText;
    testElement.style.cssText = testStyles;

    // Add debugging attributes
    testElement.setAttribute('data-test-styles', testStyles);
    testElement.setAttribute('data-test-timestamp', Date.now());

    return testElement;
  } catch (error) {
    logger.error('Error creating style conflict test element:', error.message);
    // Use try-catch for fallback creation in case createElement is completely broken
    try {
      const fallbackElement = document.createElement('span');
      fallbackElement.textContent = testText;
      return fallbackElement;
    } catch (fallbackError) {
      // If createElement is completely broken, create a minimal object that mimics an element
      return {
        tagName: 'SPAN',
        textContent: testText,
        nodeType: 1, // Element node
        setAttribute: () => {},
        getAttribute: () => null,
        style: {},
      };
    }
  }
};
