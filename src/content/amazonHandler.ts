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
 * Amazon price state interface
 */
interface AmazonPriceState {
  currency: string | null;
  whole: string | null;
  active: boolean;
  patternType: string | null;
  reset(): void;
}

/**
 * Amazon price pattern type
 */
type PatternType = 'sx' | 'a' | false;

/**
 * Creates a new Amazon price state object to track Amazon's split price components
 * Amazon often splits prices across multiple DOM elements (currency, whole, fractional)
 * and this state object helps track these components during DOM traversal
 *
 * @returns {AmazonPriceState} A new price state object with the following properties:
 *   - currency {string|null} - The currency symbol/code component
 *   - whole {string|null} - The whole number component
 *   - active {boolean} - Whether we're currently tracking a price component
 *   - patternType {string|null} - Which Amazon price pattern is being used ('sx' or 'a')
 *   - reset {Function} - Function to reset the state
 */
export const createPriceState = (): AmazonPriceState => {
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
 * @returns {PatternType} False if not an Amazon price node, or the pattern type ('sx' or 'a') if it is
 */
export const isAmazonPriceNode = (node: Node): PatternType => {
  if (!node || !(node as Element).classList) return false;

  const element = node as Element;
  const className = element.classList.value;

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
 * @param {AmazonPriceState} state - The price state object tracking Amazon price components
 * @param {string} patternType - The Amazon price pattern type ('sx' or 'a')
 * @returns {boolean} True if node was successfully processed as an Amazon price component
 */
export const handleAmazonPrice = (
  node: Node,
  callback: (textNode: Node) => void,
  state: AmazonPriceState,
  patternType: string
): boolean => {
  if (!node || !(node as Element).classList) return false;

  const element = node as Element;
  const classes = element.classList;
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
      // Store currency component and hide it from display
      if (element.firstChild && element.firstChild.nodeValue) {
        state.currency = element.firstChild.nodeValue.toString();
        element.firstChild.nodeValue = ''; // Hide currency component to prevent duplication
        state.active = true;
        return true;
      }
      return false;

    case wholeClass:
      if (state.active && state.currency !== null) {
        // Combine currency and whole part for processing
        if (element.firstChild && element.firstChild.nodeValue) {
          const wholeValue = element.firstChild.nodeValue.toString();
          const combinedPrice = state.currency + wholeValue;

          // Store the combined price for tracking
          state.whole = combinedPrice;

          // Set the combined price in the whole part node for badge system processing
          element.firstChild.nodeValue = combinedPrice;

          // Apply the callback to let the badge system handle DOM modification
          // The badge system will replace this text node with a styled badge
          callback(element.firstChild);

          // Reset currency since we've used it
          state.currency = null;
          return true;
        }
      }
      return false;

    case fractionalClass:
      if (state.active) {
        // Hide fractional part since it's already included in the whole part
        if (element.firstChild) {
          element.firstChild.nodeValue = '';
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
 * @param {AmazonPriceState} [priceState] - Optional price state object to use for tracking
 *                               If not provided, a new state object will be created
 * @returns {boolean} True if node was handled as an Amazon price component,
 *                    false if the node is not an Amazon price component or processing failed
 */
export const processIfAmazon = (
  node: Node,
  callback: (textNode: Node) => void,
  priceState?: AmazonPriceState
): boolean => {
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
