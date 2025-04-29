/**
 * DOM Scanner module for traversing the DOM tree and processing text nodes.
 * Also includes MutationObserver for monitoring DOM changes.
 *
 * @module content/domScanner
 */

import { processIfAmazon, createPriceState } from './amazonHandler.js';
import { CONVERTED_PRICE_CLASS } from '../utils/constants.js';
import { getSettings } from '../utils/storage.js';
import * as logger from '../utils/logger.js';

// Store a reference to the observer for later access
let domObserver = null;

// Debounce timeout reference
let debounceTimer = null;

// Maximum number of nodes to queue before forcing processing
const MAX_PENDING_NODES = 1000;

// Store nodes that need processing
const pendingNodes = new Set();
const pendingTextNodes = new Set();

// Track if processing is currently in progress to avoid concurrent processing
let isProcessing = false;

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
const debounce = (func, wait) => {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
};

/**
 * Traverses the DOM tree starting from the given node and applies a callback to text nodes
 * Credit to t-j-crowder on StackOverflow for this walk function
 * http://bit.ly/1o47R7V
 *
 * @param {Node} node - The starting node for traversal
 * @param {Function} callback - Function to call on text nodes
 * @param {object} options - Optional settings for traversal
 */
export const walk = (node, callback, options = {}) => {
  try {
    if (!node) {
      logger.error('walk called with invalid node');
      return;
    }

    if (!callback || typeof callback !== 'function') {
      logger.error('walk called with invalid callback');
      return;
    }

    // Create a local price state for this walk traversal
    const amazonPriceState = createPriceState();

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
              // Pass the local price state to maintain state between sibling nodes
              let amazonProcessed = false;
              try {
                amazonProcessed = processIfAmazon(child, callback, amazonPriceState);
              } catch (amazonError) {
                logger.error(
                  'Error in Amazon price processing:',
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
              logger.error('Error processing child node:', childError.message, childError.stack);
              // Skip problematic node and continue with next sibling
              child = child?.nextSibling || null;
            }
          }
          break;
        case 3: // Text node
          try {
            callback(node);
          } catch (callbackError) {
            logger.error('Error in node callback:', callbackError.message, {
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
      logger.error('Error accessing node properties:', nodeTypeError.message, nodeTypeError.stack);
    }
  } catch (error) {
    logger.error('Error in DOM walker:', error.message, error.stack);
  }
};

/**
 * Creates and initializes a MutationObserver to detect DOM changes
 *
 * @param {Function} callback - Function to process text nodes (same as walk callback)
 * @param {object} options - Optional configuration settings
 * @param {number} [debounceInterval] - Debounce interval in milliseconds. Higher values reduce CPU usage but may delay updates.
 * @returns {MutationObserver} The created observer instance
 */
export const observeDomChanges = (callback, options = {}, debounceInterval = 200) => {
  try {
    // Ensure callback is valid
    if (!callback || typeof callback !== 'function') {
      logger.error('observeDomChanges called with invalid callback');
      return null;
    }

    // Ensure debounceInterval is a valid number
    if (typeof debounceInterval !== 'number' || isNaN(debounceInterval) || debounceInterval < 0) {
      logger.warn('Invalid debounce interval, using default 200ms');
      debounceInterval = 200;
    }

    // Cap the debounce interval to reasonable values (50ms - 2000ms)
    debounceInterval = Math.max(50, Math.min(2000, debounceInterval));

    // Create a debounced processor function with the provided interval
    const debouncedProcess = debounce(() => {
      const startTime = performance.now();
      processPendingNodes(callback, options);
      const endTime = performance.now();
      logger.debug(`processPendingNodes: ${Math.round(endTime - startTime)} ms`);
    }, debounceInterval);

    logger.info(`Observer created with ${debounceInterval}ms debounce interval`);

    // Create the mutation observer
    const observer = new MutationObserver((mutations) => {
      try {
        logger.debug(`Processing ${mutations.length} mutations`);
        // Process each mutation
        for (const mutation of mutations) {
          // Handle added nodes
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              // Only queue element nodes (skip text nodes, comments, etc.)
              if (node.nodeType === 1) {
                // Skip nodes that are our converted price elements or their descendants
                let isConvertedPrice = false;
                let current = node;

                // Check if this node or any ancestor has the converted class
                while (current) {
                  if (current.classList && current.classList.contains(CONVERTED_PRICE_CLASS)) {
                    isConvertedPrice = true;
                    break;
                  }
                  current = current.parentNode;
                }

                if (!isConvertedPrice) {
                  // Check if we've reached the size limit
                  if (pendingNodes.size >= MAX_PENDING_NODES) {
                    logger.warn(
                      `Pending nodes limit (${MAX_PENDING_NODES}) reached, processing immediately`
                    );
                    // Cancel any pending debounce timer
                    clearTimeout(debounceTimer);
                    // Process pending nodes immediately if not already processing
                    if (!isProcessing) {
                      processPendingNodes(callback, options);
                    }
                  }

                  // Add node after potential processing to avoid adding to a full set
                  pendingNodes.add(node);
                }
              }
            }
          }

          // Handle character data changes on text nodes
          if (mutation.type === 'characterData' && mutation.target.nodeType === 3) {
            // Skip text nodes that are children of converted price elements
            let isInConvertedPrice = false;
            let current = mutation.target.parentNode;

            // Check if any ancestor has the converted class
            while (current) {
              if (current.classList && current.classList.contains(CONVERTED_PRICE_CLASS)) {
                isInConvertedPrice = true;
                break;
              }
              current = current.parentNode;
            }

            if (!isInConvertedPrice) {
              // Check if we've reached the size limit
              if (pendingTextNodes.size >= MAX_PENDING_NODES) {
                logger.warn(
                  `Pending text nodes limit (${MAX_PENDING_NODES}) reached, processing immediately`
                );
                // Cancel any pending debounce timer
                clearTimeout(debounceTimer);
                // Process pending nodes immediately if not already processing
                if (!isProcessing) {
                  processPendingNodes(callback, options);
                }
              }

              // Add text node after potential processing to avoid adding to a full set
              pendingTextNodes.add(mutation.target);
            }
          }
        }

        // Trigger the debounced processing
        logger.debug(
          `Queued nodes - Elements: ${pendingNodes.size}, Text nodes: ${pendingTextNodes.size}`
        );
        debouncedProcess();
      } catch (error) {
        logger.error('Error processing mutations:', error.message, error.stack);
      }
    });

    // Store a reference to the observer
    domObserver = observer;

    return observer;
  } catch (error) {
    logger.error('Error creating MutationObserver:', error.message, error.stack);
    return null;
  }
};

/**
 * Starts observing DOM changes on the given target node
 *
 * @param {Node} targetNode - The node to observe for changes (usually document.body)
 * @param {Function} callback - Function to process text nodes
 * @param {object} options - Optional configuration
 * @param {number} [debounceInterval] - Debounce interval in milliseconds. Higher values reduce CPU usage but may delay updates.
 * @returns {MutationObserver} The active observer
 */
export const startObserver = (targetNode, callback, options = {}, debounceInterval = 200) => {
  try {
    if (!targetNode) {
      logger.error('startObserver called with invalid target node');
      return null;
    }

    // Ensure debounceInterval is a valid number
    if (typeof debounceInterval !== 'number' || isNaN(debounceInterval) || debounceInterval < 0) {
      logger.warn('Invalid debounce interval in startObserver, using default 200ms');
      debounceInterval = 200;
    }

    // Cap the debounce interval to reasonable values (50ms - 2000ms)
    debounceInterval = Math.max(50, Math.min(2000, debounceInterval));

    // Create the observer if it doesn't exist
    const observer = domObserver || observeDomChanges(callback, options, debounceInterval);

    if (!observer) {
      logger.error('Failed to create MutationObserver');
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
    logger.error('Error starting MutationObserver:', error.message, error.stack);
    return null;
  }
};

/**
 * Processes all pending nodes that have been collected during mutations
 * Fetches settings only once per batch to improve performance
 *
 * @param {Function} callback - The function to call on each text node
 * @param {object} options - Optional settings for the walk function
 */
const processPendingNodes = (callback, options = {}) => {
  try {
    // Skip processing if no nodes to process
    if (pendingNodes.size === 0 && pendingTextNodes.size === 0) {
      return;
    }

    // Set processing flag to prevent concurrent processing
    isProcessing = true;

    // Use the imported getSettings function

    // Fetch settings once for the entire batch
    getSettings()
      .then((settings) => {
        try {
          // Process element nodes that need walking
          if (pendingNodes.size > 0) {
            // Convert Set to Array to avoid issues if the set is modified during processing
            const nodesToProcess = Array.from(pendingNodes);
            pendingNodes.clear();

            // Process each pending node with the settings
            for (const node of nodesToProcess) {
              if (node && node.nodeType === 1) {
                // Pass settings to walk which will pass them to the callback
                walk(node, (textNode) => callback(textNode, settings), options);
              }
            }
          }

          // Process text nodes directly
          if (pendingTextNodes.size > 0) {
            // Convert Set to Array to avoid issues if the set is modified during processing
            const textNodesToProcess = Array.from(pendingTextNodes);
            pendingTextNodes.clear();

            // Call callback directly on each text node with the settings
            for (const textNode of textNodesToProcess) {
              if (textNode && textNode.nodeType === 3) {
                try {
                  callback(textNode, settings);
                } catch (callbackError) {
                  logger.error('Error in debounced node callback:', callbackError.message, {
                    nodeContent: textNode?.nodeValue?.substring(0, 50) + '...',
                    errorDetails: callbackError.stack,
                  });
                }
              }
            }
          }
        } finally {
          // Always clear the processing flag, even if errors occur during processing
          isProcessing = false;
        }
      })
      .catch((error) => {
        logger.error('Error fetching settings for batch processing:', error);
        // Clear the pending nodes to avoid a growing backlog if settings can't be fetched
        pendingNodes.clear();
        pendingTextNodes.clear();
        // Clear the processing flag to allow future processing
        isProcessing = false;
      });
  } catch (error) {
    logger.error('Error processing pending nodes:', error.message, error.stack);

    // Clear the pending nodes to avoid a growing backlog on error
    pendingNodes.clear();
    pendingTextNodes.clear();
    // Clear the processing flag to allow future processing
    isProcessing = false;
  }
};

/**
 * Stops the MutationObserver and cleans up all resources
 *
 * @returns {boolean} True if observer was successfully stopped, false otherwise
 */
export const stopObserver = () => {
  try {
    // Clear any pending debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // Clear any pending nodes
    pendingNodes.clear();
    pendingTextNodes.clear();

    // Reset processing flag
    isProcessing = false;

    // Disconnect the observer
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error stopping MutationObserver:', error.message, error.stack);
    return false;
  }
};
