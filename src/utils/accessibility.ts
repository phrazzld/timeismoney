/**
 * Accessibility utilities for the TimeIsMoney extension
 * Provides ARIA labels, screen reader support, and accessibility helpers
 *
 * @module utils/accessibility
 */

import * as logger from './logger.js';

interface AccessibilityLabelOptions {
  verbose?: boolean;
  language?: string;
}

interface TooltipOptions {
  includeConversionNote?: boolean;
}

interface AccessibleRoleConfig {
  useIcon?: boolean;
  isReplacement?: boolean;
}

interface AccessibilityAttributesOptions {
  useIcon?: boolean;
  verbose?: boolean;
  includeTooltip?: boolean;
}

interface AccessibilityAttributesResult {
  attributes: {
    role: string;
    'aria-label': string;
    'aria-describedby'?: string;
    'aria-live': string;
    'aria-atomic': string;
  };
  tooltipId: string | null;
  tooltipContent: string | null;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  protectedProperties?: string[];
}

/**
 * Generates accessible label text for price conversion badges
 * Creates descriptive text that explains the price-to-time conversion
 */
export const generateAccessibleLabel = (
  originalPrice: string,
  timeDisplay: string,
  options: AccessibilityLabelOptions = {}
): string => {
  try {
    const { verbose = false } = options;

    // Clean up the time display for spoken text
    const spokenTime = formatTimeForScreenReader(timeDisplay);

    if (verbose) {
      return `Price converted to work time equivalent: ${spokenTime}, originally priced at ${originalPrice}`;
    } else {
      return `${spokenTime} work time, originally ${originalPrice}`;
    }
  } catch (error) {
    const err = error as Error;
    logger.debug('Error generating accessible label:', err.message);
    return `${timeDisplay}, originally ${originalPrice}`; // Safe fallback
  }
};

/**
 * Formats time display text for optimal screen reader pronunciation
 * Converts abbreviated time formats to full words for clarity
 */
export const formatTimeForScreenReader = (timeDisplay: string): string => {
  try {
    if (!timeDisplay || typeof timeDisplay !== 'string') {
      return 'unknown time';
    }

    // Match patterns like "3h 15m", "45m", "2h 0m"
    const timePattern = /^(?:(\d+)h\s*)?(?:(\d+)m)?$/;
    const match = timeDisplay.match(timePattern);

    if (!match) {
      return timeDisplay; // Return as-is if pattern doesn't match
    }

    const [, hours, minutes] = match;
    const parts: string[] = [];

    if (hours && parseInt(hours) > 0) {
      const hourNum = parseInt(hours);
      parts.push(`${hourNum} ${hourNum === 1 ? 'hour' : 'hours'}`);
    }

    if (minutes && parseInt(minutes) > 0) {
      const minuteNum = parseInt(minutes);
      parts.push(`${minuteNum} ${minuteNum === 1 ? 'minute' : 'minutes'}`);
    }

    if (parts.length === 0) {
      return 'less than a minute';
    }

    return parts.join(' and ');
  } catch (error) {
    const err = error as Error;
    logger.debug('Error formatting time for screen reader:', err.message);
    return timeDisplay; // Return original on error
  }
};

/**
 * Generates a unique ID for ARIA relationships
 * Creates unique identifiers for aria-describedby and other ARIA attributes
 */
export const generateAccessibleId = (prefix = 'tim-a11y'): string => {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}-${random}`;
  } catch (error) {
    const err = error as Error;
    logger.debug('Error generating accessible ID:', err.message);
    return `${prefix}-${Date.now()}`; // Simple fallback
  }
};

/**
 * Creates accessible tooltip content for price conversion badges
 * Generates detailed description for tooltip that explains the conversion
 */
export const generateTooltipContent = (
  originalPrice: string,
  timeDisplay: string,
  options: TooltipOptions = {}
): string => {
  try {
    const { includeConversionNote = true } = options;

    const baseContent = `Originally ${originalPrice}`;

    if (!includeConversionNote) {
      return baseContent;
    }

    const spokenTime = formatTimeForScreenReader(timeDisplay);
    return `${baseContent}. This price equals ${spokenTime} of work time based on your hourly wage.`;
  } catch (error) {
    const err = error as Error;
    logger.debug('Error generating tooltip content:', err.message);
    return `Originally ${originalPrice}`;
  }
};

/**
 * Determines the appropriate ARIA role for a price conversion badge
 * Selects semantic role based on badge content and context
 */
export const getAccessibleRole = (config: AccessibleRoleConfig = {}): string => {
  try {
    // Handle case where config is null/undefined or empty object with no properties
    if (!config || typeof config !== 'object' || Object.keys(config).length === 0) {
      return 'text';
    }

    const { useIcon = true, isReplacement = true } = config;

    // For badges that replace price text, use 'img' role to indicate
    // they represent information visually
    if (isReplacement && useIcon) {
      return 'img';
    }

    // For text-only badges or supplementary badges, use generic text role
    return 'text';
  } catch (error) {
    const err = error as Error;
    logger.debug('Error determining accessible role:', err.message);
    return 'text'; // Safe default
  }
};

/**
 * Creates accessibility attributes object for badge elements
 * Generates complete set of ARIA attributes for a price conversion badge
 */
export const createAccessibilityAttributes = (
  originalPrice: string,
  timeDisplay: string,
  options: AccessibilityAttributesOptions = {}
): AccessibilityAttributesResult => {
  try {
    const { useIcon = true, verbose = false, includeTooltip = true } = options;

    const attributes: AccessibilityAttributesResult['attributes'] = {
      role: 'text',
      'aria-label': '',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    };
    const tooltipId = includeTooltip ? generateAccessibleId('tim-tooltip') : null;

    // Set appropriate role
    attributes.role = getAccessibleRole({ useIcon, isReplacement: true });

    // Generate descriptive label
    attributes['aria-label'] = generateAccessibleLabel(originalPrice, timeDisplay, { verbose });

    // Add tooltip relationship if enabled
    if (includeTooltip && tooltipId) {
      attributes['aria-describedby'] = tooltipId;
    }

    return {
      attributes,
      tooltipId,
      tooltipContent: includeTooltip ? generateTooltipContent(originalPrice, timeDisplay) : null,
    };
  } catch (error) {
    const err = error as Error;
    logger.error('Error creating accessibility attributes:', err.message);
    return {
      attributes: {
        role: 'text',
        'aria-label': `${timeDisplay}, originally ${originalPrice}`,
        'aria-live': 'polite',
        'aria-atomic': 'true',
      },
      tooltipId: null,
      tooltipContent: null,
    };
  }
};

/**
 * Validates accessibility implementation for badge elements
 * Checks that required ARIA attributes are present and valid
 */
export const validateAccessibility = (element: HTMLElement): ValidationResult => {
  try {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!element || !element.nodeType) {
      return {
        isValid: false,
        issues: ['Element is null or not a DOM element'],
        suggestions: ['Provide a valid DOM element for validation'],
      };
    }

    // Check for ARIA label
    const ariaLabel = element.getAttribute('aria-label');
    if (!ariaLabel) {
      issues.push('Missing aria-label attribute');
      suggestions.push('Add descriptive aria-label explaining the price conversion');
    } else if (ariaLabel.length < 10) {
      issues.push('aria-label is too short to be descriptive');
      suggestions.push('Use more descriptive text that explains the conversion context');
    }

    // Check for appropriate role
    const role = element.getAttribute('role');
    if (!role) {
      issues.push('Missing role attribute');
      suggestions.push('Add role="img" or role="text" depending on content');
    }

    // Check for live region attributes for dynamic content
    const ariaLive = element.getAttribute('aria-live');
    if (!ariaLive) {
      suggestions.push('Consider adding aria-live="polite" for dynamic content updates');
    }

    // Check if tooltip is properly linked
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const tooltipElement = document.getElementById(ariaDescribedBy);
      if (!tooltipElement) {
        issues.push(`aria-describedby references non-existent element: ${ariaDescribedBy}`);
        suggestions.push('Ensure tooltip element exists or remove aria-describedby');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  } catch (error) {
    const err = error as Error;
    logger.debug('Error validating accessibility:', err.message);
    return {
      isValid: false,
      issues: ['Validation failed due to error'],
      suggestions: ['Check element and try again'],
    };
  }
};

/**
 * Creates a live region element for announcing dynamic badge updates
 * Useful for notifying screen readers when new badges are added
 */
export const createLiveRegion = (id: string | null = null): HTMLElement => {
  try {
    const liveRegion = document.createElement('div');

    if (id) {
      liveRegion.id = id;
    }

    // Configure as polite live region
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'false');
    liveRegion.className = 'tim-live-region';

    // Hide visually but keep accessible to screen readers
    liveRegion.style.cssText = [
      'position: absolute',
      'width: 1px',
      'height: 1px',
      'padding: 0',
      'margin: -1px',
      'overflow: hidden',
      'clip: rect(0, 0, 0, 0)',
      'white-space: nowrap',
      'border: 0',
    ].join('; ');

    return liveRegion;
  } catch (error) {
    const err = error as Error;
    logger.error('Error creating live region:', err.message);
    // Return a minimal fallback element with safe property access
    try {
      const fallback = document.createElement('div');
      fallback.style.display = 'none';
      return fallback;
    } catch {
      // If even createElement fails completely, return a minimal object
      return {
        tagName: 'DIV',
        textContent: '',
        style: { display: 'none' },
        setAttribute: () => {},
        appendChild: () => {},
      } as unknown as HTMLElement;
    }
  }
};

/**
 * Announces a message to screen readers via live region
 * Temporarily sets content in live region to trigger screen reader announcement
 */
export const announceToScreenReader = (
  message: string,
  liveRegion: HTMLElement | null = null,
  clearDelay = 1000
): void => {
  try {
    if (!message) return;

    // Find or create live region
    let region = liveRegion;
    if (!region) {
      const existingRegion = document.querySelector('.tim-live-region') as HTMLElement | null;
      if (existingRegion) {
        region = existingRegion;
      } else {
        region = createLiveRegion();
        document.body.appendChild(region);
      }
    }

    // Set the message
    region.textContent = message;

    // Clear the message after delay to reset for next announcement
    if (clearDelay > 0) {
      setTimeout(() => {
        if (region && region.textContent === message) {
          region.textContent = '';
        }
      }, clearDelay);
    }

    logger.debug('Announced to screen reader:', message);
  } catch (error) {
    const err = error as Error;
    logger.debug('Error announcing to screen reader:', err.message);
  }
};
