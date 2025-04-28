/**
 * Amazon Price Handler module
 *
 * Handles Amazon's specific price component structure where prices are split across
 * multiple DOM elements with specific class names.
 *
 * @module content/amazonHandler
 */

/**
 * Creates a new Amazon price state object
 *
 * @returns {Object} A new price state object with methods
 */
export const createPriceState = () => {
  return {
    currency: null,
    whole: null,
    active: false,
    reset() {
      this.currency = null;
      this.whole = null;
      this.active = false;
    },
  };
};

/**
 * Checks if a node belongs to Amazon's price component structure
 *
 * @param {Node} node - DOM node to check
 * @returns {boolean} True if node is part of Amazon price structure
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
 * Processes an Amazon price component node
 *
 * @param {Node} node - Amazon price component node
 * @param {Function} callback - Callback to apply to complete price node
 * @param {Object} state - The price state object to use
 * @returns {boolean} True if node was processed as Amazon price component
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
 *
 * @param {Node} node - DOM node to process
 * @param {Function} callback - Callback to apply to complete price nodes
 * @param {Object} [priceState] - Optional price state object to use for tracking
 * @returns {boolean} True if node was handled as Amazon price component
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
