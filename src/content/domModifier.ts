/**
 * DOM Modifier module for applying and reverting price conversions.
 * Responsible for all DOM manipulation related to price conversions.
 *
 * @module content/domModifier
 */

import { CONVERTED_PRICE_CLASS } from '../utils/constants.js';
import * as logger from '../utils/logger.js';
import { createPriceBadge } from '../components/PriceBadge.js';
import { createShadowPriceBadge } from '../components/ShadowPriceBadge.js';

/**
 * Settings interface
 */
interface Settings {
  badgeDisplayMode?: string;
  useShadowDOM?: boolean;
  [key: string]: any;
}

/**
 * Creates a time conversion badge element with clock icon and tooltip
 * Supports both modern (PriceBadge) and legacy display modes via feature flag
 *
 * @param {string} originalPrice - The original price string (e.g., "$30.00")
 * @param {string} timeDisplay - The formatted time display (e.g., "3h 0m" or "45m")
 * @param {HTMLElement} [context] - DOM context for theme detection and styling
 * @param {Settings} [settings] - Extension settings including badgeDisplayMode
 * @returns {HTMLElement} A configured span element showing the time with tooltip
 */
const createBadge = (
  originalPrice: string,
  timeDisplay: string,
  context: HTMLElement | null = null,
  settings: Settings | null = null
): HTMLElement => {
  try {
    // Check the badgeDisplayMode setting to determine which badge style to use
    const badgeMode = settings?.badgeDisplayMode || 'modern';
    const useShadowDOM = settings?.useShadowDOM || false;

    if (badgeMode === 'legacy') {
      // Use legacy badge creation for backward compatibility/rollback
      return createLegacyBadge(originalPrice, timeDisplay, context);
    } else if (useShadowDOM) {
      // Use Shadow DOM badge for perfect style isolation (experimental)
      return createShadowPriceBadge(originalPrice, timeDisplay, context);
    } else {
      // Use the modern PriceBadge component class via factory function (default)
      // Enable hover toggle for modern badge mode (including invalid modes that fall back to modern)
      const isModernMode = badgeMode === 'modern' || !['legacy', 'shadow'].includes(badgeMode);
      const badgeOptions = isModernMode ? { enableHoverToggle: true } : {};
      return createPriceBadge(originalPrice, timeDisplay, context, badgeOptions);
    }
  } catch (error) {
    logger.error('Error creating badge:', (error as Error).message, {
      originalPrice,
      timeDisplay,
      badgeMode: settings?.badgeDisplayMode || 'modern',
      useShadowDOM: settings?.useShadowDOM || false,
    });
    // Return a simple fallback element
    return createFallbackBadge(originalPrice, timeDisplay);
  }
};

/**
 * Creates a legacy badge with the original simple style
 * Provides backward compatibility and rollback option for users
 *
 * @param {string} originalPrice - The original price string
 * @param {string} timeDisplay - The formatted time display
 * @param {HTMLElement} [context] - DOM context (unused in legacy mode)
 * @returns {HTMLElement} A legacy-styled badge element
 */
const createLegacyBadge = (
  originalPrice: string,
  timeDisplay: string,
  context: HTMLElement | null = null
): HTMLElement => {
  try {
    const timeElement = document.createElement('span');
    timeElement.className = CONVERTED_PRICE_CLASS;
    timeElement.setAttribute('data-original-price', originalPrice);
    timeElement.title = `Originally ${originalPrice}`;

    // Legacy format: show both original price and time conversion
    // Example: "$30.00 (3h 0m)" - the old augmentation style
    timeElement.textContent = `${originalPrice} (${timeDisplay})`;

    // Legacy styling - simple green text with basic formatting
    timeElement.style.cssText = [
      'color: #059669',
      'font-weight: 600',
      'font-size: inherit',
      'white-space: nowrap',
      'vertical-align: baseline',
      'text-decoration: none',
      'opacity: 0.9',
      'margin-left: 0.25em', // Small spacing from preceding text
    ].join('; ');

    return timeElement;
  } catch (legacyError) {
    logger.error('Error creating legacy badge:', (legacyError as Error).message);
    // Fall back to the simple fallback badge
    return createFallbackBadge(originalPrice, timeDisplay);
  }
};

/**
 * Creates a fallback badge when the main badge creation fails
 * Simplified fallback that doesn't depend on the component system
 *
 * @param {string} originalPrice - The original price string
 * @param {string} timeDisplay - The formatted time display
 * @returns {HTMLElement} A simple badge element with basic styling
 */
const createFallbackBadge = (originalPrice: string, timeDisplay: string): HTMLElement => {
  try {
    const timeElement = document.createElement('span');
    timeElement.className = CONVERTED_PRICE_CLASS;
    timeElement.setAttribute('data-original-price', originalPrice);
    timeElement.title = `Originally ${originalPrice}`;
    timeElement.textContent = timeDisplay;

    // Basic fallback styles
    timeElement.style.cssText = [
      'color: #059669',
      'font-weight: 600',
      'font-size: inherit',
      'white-space: nowrap',
      'vertical-align: baseline',
      'text-decoration: none',
      'opacity: 0.9',
    ].join('; ');

    return timeElement;
  } catch (fallbackError) {
    logger.error('Error creating fallback badge:', (fallbackError as Error).message);
    // Last resort: return a simple text node
    return document.createTextNode(timeDisplay) as any;
  }
};

/**
 * Checks if a node is valid for processing and not already processed
 *
 * @param {Node} textNode - The text node to check
 * @returns {boolean} True if the node is valid and not yet processed, false otherwise
 */
export const isValidForProcessing = (textNode: Node): boolean => {
  try {
    // Check if the node itself is valid
    if (!textNode || !textNode.nodeValue || textNode.nodeValue.trim() === '') {
      return false;
    }

    // Check if the node is already within a converted price element
    let parent = (textNode as ChildNode).parentNode;
    while (parent) {
      if ((parent as Element).classList && (parent as Element).classList.contains(CONVERTED_PRICE_CLASS)) {
        return false; // This is already within a converted price element
      }
      parent = parent.parentNode;
    }

    return true;
  } catch (error) {
    logger.error('Error checking if node is valid for processing:', (error as Error).message, (error as Error).stack);
    return false;
  }
};

/**
 * Applies a price conversion to a text node by replacing the matched text
 * with a span containing both the original price and the conversion
 *
 * @param {Node} textNode - The DOM text node containing price text
 * @param {RegExp} pattern - Regex pattern for matching prices
 * @param {Function} convertFn - Function that converts a price string to a display string
 * @param {Settings} [settings] - Extension settings including badgeDisplayMode
 * @returns {boolean} True if modifications were made, false otherwise
 */
export const applyConversion = (
  textNode: Node,
  pattern: RegExp,
  convertFn: (price: string) => string,
  settings: Settings | null = null
): boolean => {
  try {
    if (!textNode || !textNode.nodeValue || !pattern || !convertFn) {
      return false;
    }

    const text = textNode.nodeValue;

    try {
      // Ensure the pattern is a global RegExp before using matchAll
      const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, 'g');

      // Try to get matches - this could fail if the pattern is invalid
      let matches: RegExpMatchArray[] = [];
      try {
        matches = [...text.matchAll(globalPattern)];
      } catch (matchAllError) {
        // If matchAll fails, fall back to match() which is more forgiving
        logger.debug('matchAll failed, falling back to match():', (matchAllError as Error).message);
        const simpleMatches = text.match(globalPattern);
        if (simpleMatches) {
          // Convert basic match results to match the matchAll format
          // This is a simplified version that doesn't include capture groups
          matches = simpleMatches.map((match) => {
            const index = text.indexOf(match);
            return Object.assign([match], {
              index: index,
              input: text,
              groups: undefined,
            });
          });
        }
      }

      if (matches.length === 0) {
        return false;
      }

      // Create a document fragment to hold the modified content
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      // Process each match
      matches.forEach((match) => {
        try {
          // Skip invalid matches (defensive programming)
          if (!match || typeof match[0] !== 'string' || typeof match.index !== 'number') {
            logger.debug('Skipping invalid match:', match);
            return; // Skip this match and continue with others
          }

          const originalPrice = match[0];

          // Skip if the match is just whitespace or too short to be a price
          if (!originalPrice || originalPrice.trim().length < 2) {
            return; // Skip and continue
          }

          const convertedText = convertFn(originalPrice);

          // Extract time portion from convertedText (e.g., "3h 0m" from "$30.00 (3h 0m)")
          const timeMatch = convertedText.match(/\(([^)]+)\)/);
          let timeDisplay = timeMatch ? timeMatch[1] : convertedText;

          // Format time nicely - omit hours when zero
          timeDisplay = timeDisplay.replace(/^0h\s*/, ''); // Remove "0h " from start
          if (!timeDisplay.trim()) {
            timeDisplay = '0m'; // Fallback if empty
          }

          // Add text before the match
          if (match.index! > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
          }

          // Create clean time-only replacement using extracted function
          // Pass the parent element as context for theme detection and settings for display mode
          const timeElement = createBadge(
            originalPrice,
            timeDisplay,
            (textNode as ChildNode).parentElement,
            settings
          );
          fragment.appendChild(timeElement);

          lastIndex = match.index! + originalPrice.length;
        } catch (matchError) {
          logger.error('Error processing price match:', (matchError as Error).message, {
            match: match[0],
            errorDetails: (matchError as Error).stack,
          });
          // Skip this match and continue with others
        }
      });

      // Add any remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      // Replace the original text node with our fragment
      if ((textNode as ChildNode).parentNode) {
        (textNode as ChildNode).parentNode!.replaceChild(fragment, textNode as ChildNode);
        return true;
      }
    } catch (matchesError) {
      logger.error('Error in regex pattern matching:', (matchesError as Error).message, {
        pattern: pattern.toString(),
        textSample: text.substring(0, 50) + '...',
        errorDetails: (matchesError as Error).stack,
      });
    }

    return false;
  } catch (error) {
    logger.error('Error in applyConversion:', (error as Error).message, (error as Error).stack);
    return false;
  }
};

/**
 * Performs global cleanup of all price conversions across the entire document
 * This is a higher-level cleanup function that ensures no converted prices remain
 *
 * @returns {number} The total number of elements cleaned up
 */
export const globalCleanup = (): number => {
  try {
    logger.info('Performing global cleanup of all price conversions');
    const cleanupCount = revertAll(document.body || document.documentElement);

    // Additional cleanup: remove any orphaned elements that might have lost their parent
    try {
      const orphanedElements = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      let orphanCount = 0;
      orphanedElements.forEach((element) => {
        try {
          if (element.parentNode) {
            const originalPrice = element.getAttribute('data-original-price');
            if (originalPrice) {
              const textNode = document.createTextNode(originalPrice);
              element.parentNode.replaceChild(textNode, element);
              orphanCount++;
            }
          }
        } catch (cleanupError) {
          logger.debug('Error cleaning up orphaned element:', (cleanupError as Error).message);
        }
      });

      if (orphanCount > 0) {
        logger.info(`Cleaned up ${orphanCount} orphaned conversion elements`);
      }

      return cleanupCount + orphanCount;
    } catch (orphanCleanupError) {
      logger.error('Error during orphan cleanup:', (orphanCleanupError as Error).message);
      return cleanupCount;
    }
  } catch (error) {
    logger.error('Error in global cleanup:', (error as Error).message, (error as Error).stack);
    return 0;
  }
};

/**
 * Reverts all price conversions in a DOM subtree
 *
 * @param {Node} root - The root node to start reverting from
 * @returns {number} The number of elements reverted
 */
export const revertAll = (root: Node): number => {
  try {
    if (!root) {
      return 0;
    }

    let convertedElements: NodeListOf<Element>;
    try {
      convertedElements = (root as Element).querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    } catch (queryError) {
      logger.error('Error querying for converted elements:', (queryError as Error).message, {
        className: CONVERTED_PRICE_CLASS,
        errorDetails: (queryError as Error).stack,
      });
      return 0;
    }

    let count = 0;

    convertedElements.forEach((element) => {
      try {
        const originalPrice = element.getAttribute('data-original-price');
        if (originalPrice) {
          const textNode = document.createTextNode(originalPrice);
          if (element.parentNode) {
            element.parentNode.replaceChild(textNode, element);
            count++;
          }
        }
      } catch (elementError) {
        logger.error('Error reverting converted element:', (elementError as Error).message, {
          element: (element as HTMLElement).outerHTML?.substring(0, 100) || 'unknown element',
          errorDetails: (elementError as Error).stack,
        });
        // Continue with other elements
      }
    });

    return count;
  } catch (error) {
    logger.error('Error in revertAll:', (error as Error).message, (error as Error).stack);
    return 0;
  }
};

/**
 * Conversion info interface
 */
interface ConversionInfo {
  convertFn: (priceString: string, formatters: any, wageInfo: any) => string;
  formatters: any;
  wageInfo: any;
}

/**
 * Creates a conversion function that uses the provided conversion info to transform
 * a price string into a display string with time equivalents
 *
 * @param {ConversionInfo} conversionInfo - Info needed for the conversion
 * @returns {Function} A function that converts a price string to a display string
 */
const createPriceToTimeConverter = (conversionInfo: ConversionInfo): (priceString: string) => string => {
  return (priceString: string): string => {
    try {
      return conversionInfo.convertFn(
        priceString,
        conversionInfo.formatters,
        conversionInfo.wageInfo
      );
    } catch (error) {
      logger.error('Error in price conversion function:', (error as Error).message, {
        priceString,
        errorDetails: (error as Error).stack,
      });
      return priceString; // Return original price if conversion fails
    }
  };
};

/**
 * Price match interface
 */
interface PriceMatch {
  pattern: RegExp;
  thousands?: RegExp;
  decimal?: RegExp;
  formatInfo?: any;
}

/**
 * Applies or reverts price conversions to the DOM based on current settings
 * Serves as the main entry point for modifying text nodes with price information
 *
 * @param {Node} textNode - The DOM text node to process
 * @param {PriceMatch} priceMatch - Object with pattern and other price matching info
 * @param {ConversionInfo} conversionInfo - Info needed for the conversion
 * @param {boolean} shouldRevert - Whether to revert conversions instead of applying them
 * @param {Settings} [settings] - Extension settings including badgeDisplayMode
 * @returns {boolean} True if modifications were made, false otherwise
 */
export const processTextNode = (
  textNode: Node,
  priceMatch: PriceMatch,
  conversionInfo: ConversionInfo,
  shouldRevert: boolean,
  settings: Settings | null = null
): boolean => {
  try {
    if (!textNode) {
      logger.error('processTextNode called with invalid text node');
      return false;
    }

    // Handle reversion mode - when extension is disabled, revert any converted prices
    if (shouldRevert) {
      const parent = (textNode as ChildNode).parentNode;
      if (parent) {
        return revertAll(parent) > 0;
      }
      return false;
    }

    // Handle conversion mode - find and convert prices
    if (!priceMatch || !priceMatch.pattern || !conversionInfo) {
      logger.error('Missing required data for price conversion', {
        hasMatch: !!priceMatch,
        hasPattern: !!(priceMatch && priceMatch.pattern),
        hasConversionInfo: !!conversionInfo,
      });
      return false;
    }

    // Create a converter function that will transform price strings
    const converter = createPriceToTimeConverter(conversionInfo);

    // Apply the conversion to the DOM
    return applyConversion(textNode, priceMatch.pattern, converter, settings);
  } catch (error) {
    logger.error('Error in processTextNode:', (error as Error).message, (error as Error).stack);
    return false;
  }
};
