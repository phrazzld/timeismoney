/**
 * DOM Modifier module for applying and reverting price conversions.
 * Responsible for all DOM manipulation related to price conversions.
 *
 * @module content/domModifier
 */

import { CONVERTED_PRICE_CLASS } from '../utils/constants.js';
import * as logger from '../utils/logger.js';

/**
 * Checks if a node is valid for processing and not already processed
 *
 * @param {Node} textNode - The text node to check
 * @returns {boolean} True if the node is valid and not yet processed, false otherwise
 */
export const isValidForProcessing = (textNode) => {
  try {
    // Check if the node itself is valid
    if (!textNode || !textNode.nodeValue || textNode.nodeValue.trim() === '') {
      return false;
    }

    // Check if the node is already within a converted price element
    let parent = textNode.parentNode;
    while (parent) {
      if (parent.classList && parent.classList.contains(CONVERTED_PRICE_CLASS)) {
        return false; // This is already within a converted price element
      }
      parent = parent.parentNode;
    }

    return true;
  } catch (error) {
    logger.error('Error checking if node is valid for processing:', error.message, error.stack);
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
 * @returns {boolean} True if modifications were made, false otherwise
 */
export const applyConversion = (textNode, pattern, convertFn) => {
  try {
    if (!textNode || !textNode.nodeValue || !pattern || !convertFn) {
      return false;
    }

    const text = textNode.nodeValue;

    try {
      // Ensure the pattern is a global RegExp before using matchAll
      const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, 'g');

      // Try to get matches - this could fail if the pattern is invalid
      let matches = [];
      try {
        matches = [...text.matchAll(globalPattern)];
      } catch (matchAllError) {
        // If matchAll fails, fall back to match() which is more forgiving
        logger.debug('matchAll failed, falling back to match():', matchAllError.message);
        const simpleMatches = text.match(globalPattern);
        if (simpleMatches) {
          // Convert basic match results to match the matchAll format
          // This is a simplified version that doesn't include capture groups
          matches = simpleMatches.map((match) => {
            const index = text.indexOf(match);
            return {
              0: match,
              index: index,
              input: text,
              groups: undefined,
            };
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

          // Add text before the match
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
          }

          // Create the span with the converted price
          const span = document.createElement('span');
          span.className = CONVERTED_PRICE_CLASS;
          span.setAttribute('data-original-price', originalPrice);
          span.textContent = convertedText;
          fragment.appendChild(span);

          lastIndex = match.index + originalPrice.length;
        } catch (matchError) {
          logger.error('Error processing price match:', matchError.message, {
            match: match[0],
            errorDetails: matchError.stack,
          });
          // Skip this match and continue with others
        }
      });

      // Add any remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      // Replace the original text node with our fragment
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
        return true;
      }
    } catch (matchesError) {
      logger.error('Error in regex pattern matching:', matchesError.message, {
        pattern: pattern.toString(),
        textSample: text.substring(0, 50) + '...',
        errorDetails: matchesError.stack,
      });
    }

    return false;
  } catch (error) {
    logger.error('Error in applyConversion:', error.message, error.stack);
    return false;
  }
};

/**
 * Reverts all price conversions in a DOM subtree
 *
 * @param {Node} root - The root node to start reverting from
 * @returns {number} The number of elements reverted
 */
export const revertAll = (root) => {
  try {
    if (!root) {
      return 0;
    }

    let convertedElements;
    try {
      convertedElements = root.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    } catch (queryError) {
      logger.error('Error querying for converted elements:', queryError.message, {
        className: CONVERTED_PRICE_CLASS,
        errorDetails: queryError.stack,
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
        logger.error('Error reverting converted element:', elementError.message, {
          element: element.outerHTML?.substring(0, 100) || 'unknown element',
          errorDetails: elementError.stack,
        });
        // Continue with other elements
      }
    });

    return count;
  } catch (error) {
    logger.error('Error in revertAll:', error.message, error.stack);
    return 0;
  }
};

/**
 * Creates a conversion function that uses the provided conversion info to transform
 * a price string into a display string with time equivalents
 *
 * @param {object} conversionInfo - Info needed for the conversion
 * @param {Function} conversionInfo.convertFn - Function that converts price strings
 * @param {object} conversionInfo.formatters - Formatting options for currency
 * @param {object} conversionInfo.wageInfo - Information about hourly wage for conversion
 * @returns {Function} A function that converts a price string to a display string
 */
const createPriceToTimeConverter = (conversionInfo) => {
  return (priceString) => {
    try {
      return conversionInfo.convertFn(
        priceString,
        conversionInfo.formatters,
        conversionInfo.wageInfo
      );
    } catch (error) {
      logger.error('Error in price conversion function:', error.message, {
        priceString,
        errorDetails: error.stack,
      });
      return priceString; // Return original price if conversion fails
    }
  };
};

/**
 * Applies or reverts price conversions to the DOM based on current settings
 * Serves as the main entry point for modifying text nodes with price information
 *
 * @param {Node} textNode - The DOM text node to process
 * @param {object} priceMatch - Object with pattern and other price matching info
 * @param {RegExp} priceMatch.pattern - Regex pattern for matching prices in text
 * @param {object} priceMatch.thousands - Regex for thousands delimiter
 * @param {object} priceMatch.decimal - Regex for decimal delimiter
 * @param {object} priceMatch.formatInfo - Currency format information
 * @param {object} conversionInfo - Info needed for the conversion
 * @param {Function} conversionInfo.convertFn - Function that converts price strings
 * @param {object} conversionInfo.formatters - Formatting options for currency
 * @param {object} conversionInfo.wageInfo - Information about hourly wage for conversion
 * @param {boolean} shouldRevert - Whether to revert conversions instead of applying them
 * @returns {boolean} True if modifications were made, false otherwise
 */
export const processTextNode = (textNode, priceMatch, conversionInfo, shouldRevert) => {
  try {
    if (!textNode) {
      logger.error('processTextNode called with invalid text node');
      return false;
    }

    // Handle reversion mode - when extension is disabled, revert any converted prices
    if (shouldRevert) {
      const parent = textNode.parentNode;
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
    return applyConversion(textNode, priceMatch.pattern, converter);
  } catch (error) {
    logger.error('Error in processTextNode:', error.message, error.stack);
    return false;
  }
};
