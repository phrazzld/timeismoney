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
export const CRITICAL_STYLE_PROPERTIES: Record<string, boolean> = {
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
export const DEFENSIVE_STYLE_PROPERTIES: Record<string, string> = {
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

interface StyleProtectionOptions {
  forceImportant?: boolean;
  excludeProperties?: string[];
}

/**
 * Adds !important declarations to critical CSS properties
 * Only adds !important to properties that are marked as critical
 */
export const addStyleProtection = (
  styles: Record<string, string>,
  options: StyleProtectionOptions = {}
): Record<string, string> => {
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
    const err = error as Error;
    logger.debug('Error adding style protection:', err.message);
    return styles; // Return original styles on error
  }
};

interface DefensiveStylesOptions {
  minimal?: boolean;
}

/**
 * Adds defensive CSS properties to styles to prevent host site interference
 * These properties help reset potentially conflicting styles from the host site
 */
export const addDefensiveStyles = (
  styles: Record<string, string>,
  options: DefensiveStylesOptions = {}
): Record<string, string> => {
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
    const err = error as Error;
    logger.debug('Error adding defensive styles:', err.message);
    return styles; // Return original styles on error
  }
};

/**
 * Gets a minimal set of defensive styles for low-impact protection
 * Used when full defensive styling might interfere with host site integration
 */
export const getMinimalDefensiveStyles = (): Record<string, string> => {
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

interface ConflictResistantOptions {
  protection?: boolean;
  defensive?: boolean;
  minimal?: boolean;
  forceImportant?: boolean;
  excludeProperties?: string[];
}

/**
 * Generates conflict-resistant CSS string with protection and defensive styling
 * Combines style protection and defensive styling for maximum conflict resistance
 */
export const generateConflictResistantStyles = (
  styles: Record<string, string>,
  options: ConflictResistantOptions = {}
): string => {
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
    const err = error as Error;
    logger.error('Error generating conflict-resistant styles:', err.message);
    // Return basic fallback CSS
    return Object.entries(styles)
      .map(([property, value]) => {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssProperty}: ${value}`;
      })
      .join('; ');
  }
};

interface StyleValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  protectedProperties: string[];
}

/**
 * Validates that critical styles are properly protected
 * Used for testing and debugging style conflict protection
 */
export const validateStyleProtection = (cssString: string): StyleValidationResult => {
  try {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Parse CSS string into properties
    const properties: Record<string, string> = {};
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
    const err = error as Error;
    logger.debug('Error validating style protection:', err.message);
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
 */
export const generateUniqueClassName = (baseClassName: string, randomLength = 8): string => {
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
    const err = error as Error;
    logger.debug('Error generating unique class name:', err.message);
    return baseClassName; // Return base name on error
  }
};

/**
 * Creates a style conflict test element for debugging
 * Used to test if styles are properly protected against host site interference
 */
export const createStyleConflictTestElement = (
  testStyles: string,
  testText = 'Test Badge'
): HTMLElement => {
  try {
    const testElement = document.createElement('span');
    testElement.className = 'tim-style-conflict-test';
    testElement.textContent = testText;
    testElement.style.cssText = testStyles;

    // Add debugging attributes
    testElement.setAttribute('data-test-styles', testStyles);
    testElement.setAttribute('data-test-timestamp', Date.now().toString());

    return testElement;
  } catch (error) {
    const err = error as Error;
    logger.error('Error creating style conflict test element:', err.message);
    // Use try-catch for fallback creation in case createElement is completely broken
    try {
      const fallback = document.createElement('span');
      fallback.textContent = testText;
      return fallback;
    } catch {
      // If createElement is completely broken, create a minimal object that mimics an element
      return {
        tagName: 'SPAN',
        textContent: testText,
        nodeType: 1, // Element node
        setAttribute: () => {},
        getAttribute: () => null,
        style: {},
      } as unknown as HTMLElement;
    }
  }
};
