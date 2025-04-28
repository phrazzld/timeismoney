/**
 * DOM Modifier module for applying and reverting price conversions.
 *
 * @module content/domModifier
 */

import { CONVERTED_PRICE_CLASS } from '../utils/constants.js';

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
      const matches = [...text.matchAll(globalPattern)];

      if (matches.length === 0) {
        return false;
      }

      // Create a document fragment to hold the modified content
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      // Process each match
      matches.forEach((match) => {
        try {
          const originalPrice = match[0];
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
          console.error('TimeIsMoney: Error processing price match:', matchError.message, {
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
      console.error('TimeIsMoney: Error in regex pattern matching:', matchesError.message, {
        pattern: pattern.toString(),
        textSample: text.substring(0, 50) + '...',
        errorDetails: matchesError.stack,
      });
    }

    return false;
  } catch (error) {
    console.error('TimeIsMoney: Error in applyConversion:', error.message, error.stack);
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
      console.error('TimeIsMoney: Error querying for converted elements:', queryError.message, {
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
        console.error('TimeIsMoney: Error reverting converted element:', elementError.message, {
          element: element.outerHTML?.substring(0, 100) || 'unknown element',
          errorDetails: elementError.stack,
        });
        // Continue with other elements
      }
    });

    return count;
  } catch (error) {
    console.error('TimeIsMoney: Error in revertAll:', error.message, error.stack);
    return 0;
  }
};

/**
 * Applies conversions to the DOM based on the current settings
 *
 * @param {Node} textNode - The DOM text node to process
 * @param {object} priceMatch - Object with pattern and other price matching info
 * @param {object} conversionInfo - Info needed for the conversion
 * @param {boolean} shouldRevert - Whether to revert conversions instead of applying them
 * @returns {boolean} True if modifications were made, false otherwise
 */
export const processTextNode = (textNode, priceMatch, conversionInfo, shouldRevert) => {
  try {
    if (!textNode) {
      console.error('TimeIsMoney: processTextNode called with invalid text node');
      return false;
    }

    if (shouldRevert) {
      // For reverting, we handle the parent element directly since we need to find spans
      const parent = textNode.parentNode;
      if (parent) {
        return revertAll(parent) > 0;
      }
      return false;
    } else {
      if (!priceMatch || !priceMatch.pattern || !conversionInfo) {
        console.error('TimeIsMoney: Missing required data for price conversion', {
          hasMatch: !!priceMatch,
          hasPattern: !!(priceMatch && priceMatch.pattern),
          hasConversionInfo: !!conversionInfo,
        });
        return false;
      }

      // For applying conversions, we use the applyConversion function
      /**
       * Converts a price string to a display string with time equivalents
       *
       * @param {string} priceString - The original price string to convert
       * @returns {string} The formatted price string with time equivalent
       */
      const convertFn = (priceString) => {
        try {
          return conversionInfo.convertFn(
            priceString,
            conversionInfo.formatters,
            conversionInfo.wageInfo
          );
        } catch (error) {
          console.error('TimeIsMoney: Error in price conversion function:', error.message, {
            priceString,
            errorDetails: error.stack,
          });
          return priceString; // Return original price if conversion fails
        }
      };

      return applyConversion(textNode, priceMatch.pattern, convertFn);
    }
  } catch (error) {
    console.error('TimeIsMoney: Error in processTextNode:', error.message, error.stack);
    return false;
  }
};
