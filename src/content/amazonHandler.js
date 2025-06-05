/**
 * Amazon Price Handler module
 *
 * Handles Amazon's specific price component structure where prices are split across
 * multiple DOM elements with specific class names.
 *
 * @module content/amazonHandler
 */

import { AMAZON_PRICE_CLASSES } from '../utils/constants.js';

/**
 * Creates a new Amazon price state object to track Amazon's split price components
 * Amazon often splits prices across multiple DOM elements (currency, whole, fractional)
 * and this state object helps track these components during DOM traversal
 *
 * @returns {object} A new price state object with the following properties:
 *   - currency {string|null} - The currency symbol/code component
 *   - whole {string|null} - The whole number component
 *   - active {boolean} - Whether we're currently tracking a price component
 *   - patternType {string|null} - Which Amazon price pattern is being used ('sx' or 'a')
 *   - reset {Function} - Function to reset the state
 */
export const createPriceState = () => {
  return {
    currency: null,
    whole: null,
    active: false,
    patternType: null,
    /**
     * Resets the price state to its initial values
     * Used to start a new price component scan or when abandoning incomplete price components
     *
     * @returns {void}
     * @memberof priceState
     */
    reset() {
      this.currency = null;
      this.whole = null;
      this.active = false;
      this.patternType = null;
    },
  };
};

/**
 * Checks if a DOM node belongs to Amazon's price component structure
 * Amazon uses specific class names for currency, whole number, and fractional parts
 * Supports both 'sx-price-*' and 'a-price-*' patterns
 *
 * @param {Node} node - DOM node to check
 * @returns {boolean|string} False if not an Amazon price node, or the pattern type ('sx' or 'a') if it is
 */
export const isAmazonPriceNode = (node) => {
  if (!node || !node.classList) return false;

  const className = node.classList.value;

  // Check for sx-price-* pattern
  if (
    className === AMAZON_PRICE_CLASSES.CURRENCY.sx ||
    className === AMAZON_PRICE_CLASSES.WHOLE.sx ||
    className === AMAZON_PRICE_CLASSES.FRACTIONAL.sx
  ) {
    return 'sx';
  }

  // Check for a-price-* pattern
  if (
    className === AMAZON_PRICE_CLASSES.CURRENCY.a ||
    className === AMAZON_PRICE_CLASSES.WHOLE.a ||
    className === AMAZON_PRICE_CLASSES.FRACTIONAL.a
  ) {
    return 'a';
  }

  return false;
};

/**
 * Processes an Amazon price component node and updates price state
 * Handles the different component types (currency, whole, fractional)
 * and combines them into a complete price for processing
 * Supports both 'sx-price-*' and 'a-price-*' patterns
 *
 * @param {Node} node - Amazon price component node to process
 * @param {Function} callback - Callback function to apply to the complete price node
 * @param {Node} callback.textNode - Text node containing the full price (passed to callback)
 * @param {object} callback.settings - The current extension settings (passed by domScanner)
 * @param {object} state - The price state object tracking Amazon price components
 * @param {string|null} state.currency - The currency symbol/code component
 * @param {string|null} state.whole - The whole number component
 * @param {boolean} state.active - Whether we're currently tracking a price component
 * @param {string} patternType - The Amazon price pattern type ('sx' or 'a')
 * @returns {boolean} True if node was successfully processed as an Amazon price component
 */
export const handleAmazonPrice = (node, callback, state, patternType) => {
  if (!node || !node.classList) return false;

  const classes = node.classList;
  const className = classes.value;

  // Only process if we have a valid pattern type
  if (patternType !== 'sx' && patternType !== 'a') {
    return false;
  }

  // Use the appropriate pattern classes based on the pattern type
  const currencyClass = AMAZON_PRICE_CLASSES.CURRENCY[patternType];
  const wholeClass = AMAZON_PRICE_CLASSES.WHOLE[patternType];
  const fractionalClass = AMAZON_PRICE_CLASSES.FRACTIONAL[patternType];

  // Add pattern type to state for logging if debugMode is enabled
  if (!state.patternType) {
    state.patternType = patternType;
  }

  switch (className) {
    case currencyClass:
      // Safely extract currency value with validation
      if (node.firstChild && typeof node.firstChild.nodeValue === 'string') {
        state.currency = node.firstChild.nodeValue;
        node.firstChild.nodeValue = null; // Clear the node value
        state.active = true;
        return true;
      }
      return false;

    case wholeClass:
      if (
        state.active &&
        state.currency !== null &&
        node.firstChild &&
        typeof node.firstChild.nodeValue === 'string'
      ) {
        // Combine currency and whole part
        const combinedPrice = state.currency + node.firstChild.nodeValue;
        node.firstChild.nodeValue = combinedPrice;

        // Apply the callback to the whole part node (which now contains the full price)
        // The callback is expected to handle settings parameter which is passed through from the domScanner
        callback(node.firstChild);

        // Reset currency since we've used it
        state.whole = node.firstChild.nodeValue;
        state.currency = null;
        return true;
      }
      return false;

    case fractionalClass:
      if (state.active) {
        // Clear the fractional part as it's already been processed with the whole part
        // Only clear if we have a valid firstChild with nodeValue
        if (node.firstChild && node.firstChild.nodeValue !== null) {
          node.firstChild.nodeValue = null;
        }

        // Reset the price state after completing a price
        state.reset();
        return true;
      }
      return false;

    default:
      return false;
  }
};

/**
 * Main entry point for Amazon price handling
 * Processes a node if it's an Amazon price component, applies callback as needed
 * This function orchestrates the Amazon-specific price processing logic
 * Supports both 'sx-price-*' and 'a-price-*' patterns
 *
 * @param {Node} node - DOM node to process
 * @param {Function} callback - Callback to apply to complete price nodes
 * @param {Node} callback.textNode - Text node containing the full price (passed to callback)
 * @param {object} callback.settings - The current extension settings (passed by domScanner)
 * @param {object} [priceState] - Optional price state object to use for tracking
 *                               If not provided, a new state object will be created
 * @returns {boolean} True if node was handled as an Amazon price component,
 *                    false if the node is not an Amazon price component or processing failed
 */
export const processIfAmazon = (node, callback, priceState) => {
  // Create a new state object if none was provided
  const state = priceState || createPriceState();

  // Check if this is an Amazon price node and get the pattern type
  const patternType = isAmazonPriceNode(node);

  if (!patternType) {
    // If we've been tracking Amazon price components but found a non-Amazon node,
    // reset the state to avoid incomplete processing
    if (state.active) {
      state.reset();
    }
    return false;
  }

  // If we have a pattern type but it doesn't match the current state's pattern type
  // and we're in the middle of processing a different pattern, reset the state
  if (state.active && state.patternType && state.patternType !== patternType) {
    state.reset();
  }

  // Process the node with the appropriate pattern
  return handleAmazonPrice(node, callback, state, patternType);
};
