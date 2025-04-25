/**
 * Amazon Price Handler module
 *
 * Handles Amazon's specific price component structure where prices are split across
 * multiple DOM elements with specific class names.
 *
 * @module content/amazonHandler
 */

// Track price components during DOM traversal
const priceState = {
  currency: null,
  whole: null,
  active: false,
  reset() {
    this.currency = null;
    this.whole = null;
    this.active = false;
  },
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
 * @returns {boolean} True if node was processed as Amazon price component
 */
export const handleAmazonPrice = (node, callback) => {
  if (!node || !node.classList) return false;

  const classes = node.classList;
  const className = classes.value;

  switch (className) {
    case 'sx-price-currency':
      priceState.currency = node.firstChild.nodeValue.toString();
      node.firstChild.nodeValue = null; // Clear the node value
      priceState.active = true;
      return true;

    case 'sx-price-whole':
      if (priceState.active && priceState.currency !== null) {
        // Combine currency and whole part
        const combinedPrice = priceState.currency + node.firstChild.nodeValue.toString();
        node.firstChild.nodeValue = combinedPrice;

        // Apply the callback to the whole part node (which now contains the full price)
        callback(node.firstChild);

        // Reset currency since we've used it
        priceState.whole = node.firstChild.nodeValue.toString();
        priceState.currency = null;
        return true;
      }
      return false;

    case 'sx-price-fractional':
      if (priceState.active) {
        // Clear the fractional part as it's already been processed with the whole part
        node.firstChild.nodeValue = null;

        // Reset the price state after completing a price
        priceState.reset();
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
 * @returns {boolean} True if node was handled as Amazon price component
 */
export const processIfAmazon = (node, callback) => {
  if (!isAmazonPriceNode(node)) {
    // If we've been tracking Amazon price components but found a non-Amazon node,
    // reset the state to avoid incomplete processing
    if (priceState.active) {
      priceState.reset();
    }
    return false;
  }

  return handleAmazonPrice(node, callback);
};
