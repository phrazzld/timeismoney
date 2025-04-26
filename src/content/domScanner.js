/**
 * DOM Scanner module for traversing the DOM tree and processing text nodes.
 * Also includes MutationObserver for monitoring DOM changes.
 * @module content/domScanner
 */

import { processIfAmazon } from './amazonHandler.js';

// Store a reference to the observer for later access
let domObserver = null;

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

/**
 * Creates and initializes a MutationObserver to detect DOM changes
 *
 * @param {Function} callback - Function to process text nodes (same as walk callback)
 * @param {Object} options - Optional configuration settings
 * @returns {MutationObserver} The created observer instance
 */
export const observeDomChanges = (callback, options = {}) => {
  try {
    // Ensure callback is valid
    if (!callback || typeof callback !== 'function') {
      console.error('TimeIsMoney: observeDomChanges called with invalid callback');
      return null;
    }

    // Create the mutation observer
    const observer = new MutationObserver((mutations) => {
      try {
        // Process each mutation
        for (const mutation of mutations) {
          // Handle added nodes
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              // Only process element nodes (skip text nodes, comments, etc.)
              if (node.nodeType === 1) {
                walk(node, callback, options);
              }
            }
          }

          // Handle character data changes on text nodes
          if (mutation.type === 'characterData' && mutation.target.nodeType === 3) {
            callback(mutation.target);
          }
        }
      } catch (error) {
        console.error('TimeIsMoney: Error processing mutations:', error.message, error.stack);
      }
    });

    // Store a reference to the observer
    domObserver = observer;

    return observer;
  } catch (error) {
    console.error('TimeIsMoney: Error creating MutationObserver:', error.message, error.stack);
    return null;
  }
};

/**
 * Starts observing DOM changes on the given target node
 *
 * @param {Node} targetNode - The node to observe for changes (usually document.body)
 * @param {Function} callback - Function to process text nodes
 * @param {Object} options - Optional configuration
 * @returns {MutationObserver} The active observer
 */
export const startObserver = (targetNode, callback, options = {}) => {
  try {
    if (!targetNode) {
      console.error('TimeIsMoney: startObserver called with invalid target node');
      return null;
    }

    // Create the observer if it doesn't exist
    const observer = domObserver || observeDomChanges(callback, options);

    if (!observer) {
      console.error('TimeIsMoney: Failed to create MutationObserver');
      return null;
    }

    // Configure the observer
    const observerConfig = {
      childList: true, // Watch for added/removed nodes
      subtree: true, // Monitor changes to the target and its descendants
      characterData: true, // Watch for text content changes
    };

    // Start observing
    observer.observe(targetNode, observerConfig);

    return observer;
  } catch (error) {
    console.error('TimeIsMoney: Error starting MutationObserver:', error.message, error.stack);
    return null;
  }
};

/**
 * Stops and disconnects the DOM observer
 *
 * @returns {boolean} True if successfully disconnected, false otherwise
 */
export const stopObserver = () => {
  try {
    if (domObserver) {
      domObserver.disconnect();
      return true;
    }
    return false;
  } catch (error) {
    console.error('TimeIsMoney: Error stopping MutationObserver:', error.message, error.stack);
    return false;
  }
};
