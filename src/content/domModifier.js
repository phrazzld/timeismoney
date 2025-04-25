/**
 * DOM Modifier module for applying and reverting price conversions.
 * @module content/domModifier
 */

/**
 * CSS class used to identify converted price elements
 * @type {string}
 */
const CONVERTED_PRICE_CLASS = 'tim-converted-price';

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
  if (!textNode || !textNode.nodeValue || !pattern || !convertFn) {
    return false;
  }

  const text = textNode.nodeValue;
  const matches = [...text.matchAll(pattern)];

  if (matches.length === 0) {
    return false;
  }

  // Create a document fragment to hold the modified content
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  // Process each match
  matches.forEach((match) => {
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

  return false;
};

/**
 * Reverts all price conversions in a DOM subtree
 *
 * @param {Node} root - The root node to start reverting from
 * @returns {number} The number of elements reverted
 */
export const revertAll = (root) => {
  if (!root) {
    return 0;
  }

  const convertedElements = root.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
  let count = 0;

  convertedElements.forEach((element) => {
    const originalPrice = element.getAttribute('data-original-price');
    if (originalPrice) {
      const textNode = document.createTextNode(originalPrice);
      element.parentNode.replaceChild(textNode, element);
      count++;
    }
  });

  return count;
};

/**
 * Applies conversions to the DOM based on the current settings
 *
 * @param {Node} textNode - The DOM text node to process
 * @param {Object} priceMatch - Object with pattern and other price matching info
 * @param {Object} conversionInfo - Info needed for the conversion
 * @param {boolean} shouldRevert - Whether to revert conversions instead of applying them
 * @returns {boolean} True if modifications were made, false otherwise
 */
export const processTextNode = (textNode, priceMatch, conversionInfo, shouldRevert) => {
  if (shouldRevert) {
    // For reverting, we handle the parent element directly since we need to find spans
    const parent = textNode.parentNode;
    if (parent) {
      return revertAll(parent) > 0;
    }
    return false;
  } else {
    // For applying conversions, we use the applyConversion function
    const convertFn = (priceString) => {
      return conversionInfo.convertFn(
        priceString,
        conversionInfo.formatters,
        conversionInfo.wageInfo
      );
    };

    return applyConversion(textNode, priceMatch.pattern, convertFn);
  }
};
