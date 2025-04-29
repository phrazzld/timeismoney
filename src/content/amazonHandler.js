/**
 * Amazon Price Handler module
 *
 * Handles Amazon's specific price component structure where prices are split across
 * multiple DOM elements with specific class names.
 *
 * @module content/amazonHandler
 */

/**
 * Creates a new Amazon price state object to track Amazon's split price components
 * Amazon often splits prices across multiple DOM elements (currency, whole, fractional)
 * and this state object helps track these components during DOM traversal
 *
 * @returns {object} A new price state object with the following properties:
 *   - currency {string|null} - The currency symbol/code component
 *   - whole {string|null} - The whole number component
 *   - active {boolean} - Whether we're currently tracking a price component
 *   - reset {Function} - Function to reset the state
 */
export const createPriceState = () => {
  return {
    currency: null,
    whole: null,
    active: false,
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
    },
  };
};

/**
 * Checks if a DOM node belongs to Amazon's price component structure
 * Amazon uses specific class names for currency, whole number, and fractional parts
 *
 * @param {Node} node - DOM node to check
 * @returns {boolean} True if node has an Amazon price component class (sx-price-*)
 */
export const isAmazonPriceNode = (node) => {
  if (!node || !node.classList) return false;

  const className = node.classList.value;
  return (
    className === 'sx-price-currency' ||
    className === 'sx-price-whole' ||
    className === 'sx-price-fractional'
  );
};

/**
 * Processes an Amazon price component node and updates price state
 * Handles the different component types (currency, whole, fractional)
 * and combines them into a complete price for processing
 *
 * @param {Node} node - Amazon price component node to process
 * @param {Function} callback - Callback function to apply to the complete price node
 * @param {Function} callback.textNode - Text node containing the full price (passed to callback)
 * @param {object} state - The price state object tracking Amazon price components
 * @param {string|null} state.currency - The currency symbol/code component
 * @param {string|null} state.whole - The whole number component
 * @param {boolean} state.active - Whether we're currently tracking a price component
 * @returns {boolean} True if node was successfully processed as an Amazon price component
 */
export const handleAmazonPrice = (node, callback, state) => {
  if (!node || !node.classList) return false;

  const classes = node.classList;
  const className = classes.value;

  switch (className) {
    case 'sx-price-currency':
      state.currency = node.firstChild.nodeValue.toString();
      node.firstChild.nodeValue = null; // Clear the node value
      state.active = true;
      return true;

    case 'sx-price-whole':
      if (state.active && state.currency !== null) {
        // Combine currency and whole part
        const combinedPrice = state.currency + node.firstChild.nodeValue.toString();
        node.firstChild.nodeValue = combinedPrice;

        // Apply the callback to the whole part node (which now contains the full price)
        callback(node.firstChild);

        // Reset currency since we've used it
        state.whole = node.firstChild.nodeValue.toString();
        state.currency = null;
        return true;
      }
      return false;

    case 'sx-price-fractional':
      if (state.active) {
        // Clear the fractional part as it's already been processed with the whole part
        node.firstChild.nodeValue = null;

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
 *
 * @param {Node} node - DOM node to process
 * @param {Function} callback - Callback to apply to complete price nodes
 * @param {Node} callback.textNode - Text node containing the full price (passed to callback)
 * @param {object} [priceState] - Optional price state object to use for tracking
 *                               If not provided, a new state object will be created
 * @returns {boolean} True if node was handled as an Amazon price component,
 *                    false if the node is not an Amazon price component or processing failed
 */
export const processIfAmazon = (node, callback, priceState) => {
  // Create a new state object if none was provided
  const state = priceState || createPriceState();

  if (!isAmazonPriceNode(node)) {
    // If we've been tracking Amazon price components but found a non-Amazon node,
    // reset the state to avoid incomplete processing
    if (state.active) {
      state.reset();
    }
    return false;
  }

  return handleAmazonPrice(node, callback, state);
};
