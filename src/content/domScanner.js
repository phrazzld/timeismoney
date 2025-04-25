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
  try {
    if (!node) {
      console.error('TimeIsMoney: walk called with invalid node');
      return;
    }

    if (!callback || typeof callback !== 'function') {
      console.error('TimeIsMoney: walk called with invalid callback');
      return;
    }

    let child, next;

    try {
      switch (node.nodeType) {
        case 1: // Element
        case 9: // Document
        case 11: // Document fragment
          child = node.firstChild;
          while (child) {
            try {
              next = child.nextSibling;

              // Handle Amazon price components with the dedicated handler
              let amazonProcessed = false;
              try {
                amazonProcessed = processIfAmazon(child, callback);
              } catch (amazonError) {
                console.error(
                  'TimeIsMoney: Error in Amazon price processing:',
                  amazonError.message,
                  amazonError.stack
                );
              }

              // Only continue normal processing if it wasn't handled as an Amazon component
              if (!amazonProcessed) {
                walk(child, callback, options);
              }

              child = next;
            } catch (childError) {
              console.error(
                'TimeIsMoney: Error processing child node:',
                childError.message,
                childError.stack
              );
              // Skip problematic node and continue with next sibling
              child = child?.nextSibling || null;
            }
          }
          break;
        case 3: // Text node
          try {
            callback(node);
          } catch (callbackError) {
            console.error('TimeIsMoney: Error in node callback:', callbackError.message, {
              nodeContent: node?.nodeValue?.substring(0, 50) + '...',
              errorDetails: callbackError.stack,
            });
          }
          break;
        default:
          // Silently ignore other node types
          break;
      }
    } catch (nodeTypeError) {
      console.error(
        'TimeIsMoney: Error accessing node properties:',
        nodeTypeError.message,
        nodeTypeError.stack
      );
    }
  } catch (error) {
    console.error('TimeIsMoney: Error in DOM walker:', error.message, error.stack);
  }
};
