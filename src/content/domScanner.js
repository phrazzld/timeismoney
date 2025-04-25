/**
 * DOM Scanner module for traversing the DOM tree and processing text nodes.
 * @module content/domScanner
 */

/**
 * Traverses the DOM tree starting from the given node and applies a callback to text nodes
 * Credit to t-j-crowder on StackOverflow for this walk function
 * http://bit.ly/1o47R7V
 *
 * @param {Node} node - The starting node for traversal
 * @param {Function} callback - Function to call on text nodes
 * @param {Object} options - Optional settings for Amazon price handling
 */
export const walk = (node, callback, options = {}) => {
  let child, next, price;

  switch (node.nodeType) {
    case 1: // Element
    case 9: // Document
    case 11: // Document fragment
      child = node.firstChild;
      while (child) {
        next = child.nextSibling;

        // Check if child is Amazon display price
        const classes = child.classList;
        if (classes && classes.value === 'sx-price-currency') {
          price = child.firstChild.nodeValue.toString();
          child.firstChild.nodeValue = null;
        } else if (classes && classes.value === 'sx-price-whole') {
          price += child.firstChild.nodeValue.toString();
          child.firstChild.nodeValue = price;
          callback(child.firstChild);
          child = next;
        } else if (classes && classes.value === 'sx-price-fractional') {
          child.firstChild.nodeValue = null;
          price = null;
        }

        walk(child, callback, options);
        child = next;
      }
      break;
    case 3: // Text node
      callback(node);
      break;
  }
};
