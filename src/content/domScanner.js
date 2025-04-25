/**
 * DOM Scanner module for traversing the DOM tree and processing text nodes.
 * @module content/domScanner
 */

import { processIfAmazon } from './amazonHandler.js';

/**
 * Traverses the DOM tree starting from the given node and applies a callback to text nodes
 * Credit to t-j-crowder on StackOverflow for this walk function
 * http://bit.ly/1o47R7V
 *
 * @param {Node} node - The starting node for traversal
 * @param {Function} callback - Function to call on text nodes
 * @param {Object} options - Optional settings for traversal
 */
export const walk = (node, callback, options = {}) => {
  let child, next;

  switch (node.nodeType) {
    case 1: // Element
    case 9: // Document
    case 11: // Document fragment
      child = node.firstChild;
      while (child) {
        next = child.nextSibling;

        // Handle Amazon price components with the dedicated handler
        const amazonProcessed = processIfAmazon(child, callback);

        // Only continue normal processing if it wasn't handled as an Amazon component
        if (!amazonProcessed) {
          walk(child, callback, options);
        }

        child = next;
      }
      break;
    case 3: // Text node
      callback(node);
      break;
  }
};
