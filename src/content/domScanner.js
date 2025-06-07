/**
 * DOM Scanner module for traversing the DOM tree and processing text nodes.
 * Also includes MutationObserver for monitoring DOM changes.
 *
 * @module content/domScanner
 */

import { processIfAmazon, createPriceState } from './amazonHandler.js';
import { processIfEbay } from './ebayHandler.js';
import { processElementAttributes } from './attributeDetector.js';
import {
  CONVERTED_PRICE_CLASS,
  MAX_PENDING_NODES,
  DEFAULT_DEBOUNCE_INTERVAL_MS,
} from '../utils/constants.js';
import { getSettings } from '../utils/storage.js';
import * as debugTools from './debugTools.js';
import * as logger from '../utils/logger.js';

/**
 * Creates and initializes a DomScannerState object for tracking mutation observer state
 *
 * @returns {object} A state object for managing DOM scanner state
 */
export const createDomScannerState = () => {
  return {
    // Observer reference for later access
    domObserver: null,

    // Debounce timeout reference
    debounceTimer: null,

    // Store nodes that need processing
    pendingNodes: new Set(),
    pendingTextNodes: new Set(),

    // Track if processing is currently in progress to avoid concurrent processing
    isProcessing: false,

    /**
     * Resets the state to its initial values
     */
    reset() {
      this.domObserver = null;
      this.debounceTimer = null;
      this.pendingNodes.clear();
      this.pendingTextNodes.clear();
      this.isProcessing = false;
    },
  };
};

// Create a default state for backward compatibility
const defaultState = createDomScannerState();

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {object} state - The state object containing the debounceTimer reference
 * @returns {Function} The debounced function
 */
const debounce = (func, wait, state) => {
  return function (...args) {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
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
 * @param {object} settings - The current extension settings
 * @param {object} options - Optional settings for traversal
 */
export const walk = (node, callback, settings, options = {}) => {
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
          // Mark element as candidate in debug mode if it's not a doc/fragment
          if (settings?.debugMode && node.nodeType === 1) {
            debugTools.markPriceCandidate(node);
          }

          child = node.firstChild;
          while (child) {
            try {
              next = child.nextSibling;

              // Handle Amazon price components with the dedicated handler
              // Pass the local price state to maintain state between sibling nodes
              let specialHandlerProcessed = false;

              // Try Amazon handler first
              try {
                specialHandlerProcessed = processIfAmazon(
                  child,
                  (textNode) => callback(textNode, settings),
                  amazonPriceState
                );
              } catch (amazonError) {
                logger.error(
                  'Error in Amazon price processing:',
                  amazonError.message,
                  amazonError.stack
                );
              }

              // If not processed by Amazon handler, try eBay handler
              if (!specialHandlerProcessed) {
                try {
                  specialHandlerProcessed = processIfEbay(
                    child,
                    (textNode) => callback(textNode, settings),
                    settings
                  );
                } catch (ebayError) {
                  logger.error(
                    'Error in eBay price processing:',
                    ebayError.message,
                    ebayError.stack
                  );
                }
              }

              // If not processed by site-specific handlers, try attribute-based detection
              if (!specialHandlerProcessed) {
                try {
                  specialHandlerProcessed = processElementAttributes(
                    child,
                    (textNode) => callback(textNode, settings),
                    settings
                  );
                } catch (attributeError) {
                  logger.error(
                    'Error in attribute-based price processing:',
                    attributeError.message,
                    attributeError.stack
                  );
                }
              }

              // Only continue normal processing if it wasn't handled by any special handler
              if (!specialHandlerProcessed) {
                walk(child, callback, settings, options);
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
            // Mark text node in debug mode if enabled
            if (settings?.debugMode) {
              const textContent = node.nodeValue || '';
              const hasPotentialPrice =
                textContent.match(/\d+/) &&
                (textContent.match(/[$€£¥₹₽¢]/) || textContent.length < 30);
              debugTools.markTextProcessed(node, textContent, hasPotentialPrice);
            }

            callback(node, settings);
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
 * @param {object} [state] - Optional state object to use. If not provided, uses the default state.
 * @param {Function} [ObserverClass] - Optional MutationObserver constructor for testing. If not provided, uses the global MutationObserver.
 * @returns {MutationObserver} The created observer instance
 */
export const observeDomChanges = (
  callback,
  options = {},
  debounceInterval = DEFAULT_DEBOUNCE_INTERVAL_MS,
  state = defaultState,
  ObserverClass = null
) => {
  try {
    // Ensure callback is valid
    if (!callback || typeof callback !== 'function') {
      logger.error('observeDomChanges called with invalid callback');
      return null;
    }

    // Ensure debounceInterval is a valid number
    if (typeof debounceInterval !== 'number' || isNaN(debounceInterval) || debounceInterval < 0) {
      logger.warn(
        'Invalid debounce interval, using default ' + DEFAULT_DEBOUNCE_INTERVAL_MS + 'ms'
      );
      debounceInterval = DEFAULT_DEBOUNCE_INTERVAL_MS;
    }

    // Cap the debounce interval to reasonable values (50ms - 2000ms)
    debounceInterval = Math.max(50, Math.min(2000, debounceInterval));

    // Create a debounced processor function with the provided interval
    const debouncedProcess = debounce(
      () => {
        const startTime = performance.now();
        processPendingNodes(callback, options, state);
        const endTime = performance.now();
        logger.debug(`processPendingNodes: ${Math.round(endTime - startTime)} ms`);
      },
      debounceInterval,
      state
    );

    logger.info(`Observer created with ${debounceInterval}ms debounce interval`);

    // Use the provided observer class or fall back to the global MutationObserver
    const ActualObserver = ObserverClass || MutationObserver;

    // Create the mutation observer
    const observer = new ActualObserver((mutations) => {
      try {
        // Process mutations using the extractable, testable function
        processMutations(mutations, callback, options, state, debouncedProcess);
      } catch (error) {
        logger.error('Error processing mutations:', error.message, error.stack);
      }
    });

    // Store a reference to the observer in the state
    state.domObserver = observer;

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
 * @param {object} [state] - Optional state object to use. If not provided, uses the default state.
 * @param {Function} [ObserverClass] - Optional MutationObserver constructor for testing. If not provided, uses the global MutationObserver.
 * @returns {MutationObserver} The active observer
 */
export const startObserver = (
  targetNode,
  callback,
  options = {},
  debounceInterval = DEFAULT_DEBOUNCE_INTERVAL_MS,
  state = defaultState,
  ObserverClass = null
) => {
  try {
    if (!targetNode) {
      logger.error('startObserver called with invalid target node');
      return null;
    }

    // Ensure debounceInterval is a valid number
    if (typeof debounceInterval !== 'number' || isNaN(debounceInterval) || debounceInterval < 0) {
      logger.warn(
        'Invalid debounce interval in startObserver, using default ' +
          DEFAULT_DEBOUNCE_INTERVAL_MS +
          'ms'
      );
      debounceInterval = DEFAULT_DEBOUNCE_INTERVAL_MS;
    }

    // Cap the debounce interval to reasonable values (50ms - 2000ms)
    debounceInterval = Math.max(50, Math.min(2000, debounceInterval));

    // Initialize debug mode with graceful fallback for test environments
    getSettings()
      .then((settings) => {
        debugTools.initDebugMode(settings);
      })
      .catch((error) => {
        // Handle Chrome context errors gracefully for debug mode
        if (error && error.message === 'Extension context invalidated') {
          logger.debug('Debug mode unavailable: Extension context invalidated');
          // Initialize debug mode with disabled state for test environments
          debugTools.initDebugMode({ debugMode: false });
        } else {
          logger.warn('Debug mode initialization failed:', error.message);
          // Fallback to disabled debug mode for any other errors
          debugTools.initDebugMode({ debugMode: false });
        }
      });

    // Create the observer if it doesn't exist
    const observer =
      state.domObserver ||
      observeDomChanges(callback, options, debounceInterval, state, ObserverClass);

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
 * Processes mutation records from MutationObserver and adds nodes to the queues
 * This function is separate from the observer callback for testability
 *
 * @param {MutationRecord[]} mutations - Array of mutation records from MutationObserver
 * @param {Function} callback - The function to call on text nodes
 * @param {object} options - Optional settings for processing
 * @param {object} state - The scanner state object
 * @param {Function} debouncedProcessFn - The debounced processing function to trigger
 * @returns {void}
 */
export const processMutations = (
  mutations,
  callback,
  options = {},
  state = defaultState,
  debouncedProcessFn
) => {
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
            // Skip elements that are unlikely to contain prices (script, style, etc.)
            const skipNodeTypes = ['SCRIPT', 'STYLE', 'SVG', 'IFRAME', 'NOSCRIPT', 'META', 'LINK'];
            if (node.nodeName && skipNodeTypes.includes(node.nodeName.toUpperCase())) {
              continue;
            }

            // Filter out elements with very little text that are unlikely to contain prices
            // This helps reduce the queue size while still catching actual prices
            if (node.textContent && node.textContent.trim().length < 3) {
              continue;
            }

            // Check if we've reached the size limit
            if (state.pendingNodes.size >= MAX_PENDING_NODES) {
              // But don't log a warning for every node, just once per batch to reduce log spam
              if (state.pendingNodes.size === MAX_PENDING_NODES) {
                logger.warn(
                  `Pending nodes limit (${MAX_PENDING_NODES}) reached, processing batch immediately`
                );
              }

              // Cancel any pending debounce timer
              clearTimeout(state.debounceTimer);
              // Process pending nodes immediately if not already processing
              if (!state.isProcessing) {
                processPendingNodes(callback, options, state);
              }
            }

            // Add node after potential processing to avoid adding to a full set
            state.pendingNodes.add(node);
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
        // Skip text nodes with very little content that are unlikely to contain prices
        const textContent = mutation.target.nodeValue || '';
        if (textContent.trim().length < 3) {
          continue;
        }

        // Check if we've reached the size limit
        if (state.pendingTextNodes.size >= MAX_PENDING_NODES) {
          // But don't log a warning for every node, just once per batch to reduce log spam
          if (state.pendingTextNodes.size === MAX_PENDING_NODES) {
            logger.warn(
              `Pending text nodes limit (${MAX_PENDING_NODES}) reached, processing batch immediately`
            );
          }

          // Cancel any pending debounce timer
          clearTimeout(state.debounceTimer);
          // Process pending nodes immediately if not already processing
          if (!state.isProcessing) {
            processPendingNodes(callback, options, state);
          }
        }

        // Add text node after potential processing to avoid adding to a full set
        state.pendingTextNodes.add(mutation.target);
      }
    }
  }

  // Trigger the debounced processing
  logger.debug(
    `Queued nodes - Elements: ${state.pendingNodes.size}, Text nodes: ${state.pendingTextNodes.size}`
  );
  debouncedProcessFn();
};

/**
 * Processes all pending nodes that have been collected during mutations
 * Fetches settings only once per batch to improve performance
 * This function is called via the debounced handler when DOM mutations occur
 *
 * @param {Function} callback - The function to call on each text node
 * @param {Node} callback.textNode - The text node to process
 * @param {object} callback.settings - The current extension settings
 * @param {object} options - Optional settings for the walk function
 * @param {object} state - The scanner state object
 * @param {Set<Node>} state.pendingNodes - Set of element nodes to process
 * @param {Set<Node>} state.pendingTextNodes - Set of text nodes to process
 * @param {boolean} state.isProcessing - Flag to prevent concurrent processing
 * @returns {void}
 */
export const processPendingNodes = (callback, options = {}, state = defaultState) => {
  try {
    // Performance timing - start overall processing
    performance.mark('processPendingNodes-start');

    // Start debug timer if debug mode is enabled
    debugTools.startScanTimer();

    // Skip processing if no nodes to process
    if (state.pendingNodes.size === 0 && state.pendingTextNodes.size === 0) {
      return;
    }

    // Set processing flag to prevent concurrent processing
    state.isProcessing = true;

    // Log queue sizes for performance monitoring
    logger.debug(
      `Processing queue: ${state.pendingNodes.size} element nodes, ${state.pendingTextNodes.size} text nodes`
    );

    // Fetch settings once for the entire batch
    performance.mark('settings-fetch-start');
    getSettings()
      .then((settings) => {
        performance.mark('settings-fetch-end');
        performance.measure('Settings Fetch Time', 'settings-fetch-start', 'settings-fetch-end');

        try {
          // Process element nodes that need walking
          if (state.pendingNodes.size > 0) {
            performance.mark('element-nodes-start');

            // Convert Set to Array to avoid issues if the set is modified during processing
            const nodesToProcess = Array.from(state.pendingNodes);
            state.pendingNodes.clear();

            const nodeCount = nodesToProcess.length;

            // Process each pending node with the settings
            for (const node of nodesToProcess) {
              if (node && node.nodeType === 1) {
                // Pass settings to walk which will pass them to the callback
                walk(node, (textNode) => callback(textNode, settings), settings, options);
              }
            }

            performance.mark('element-nodes-end');
            performance.measure(
              'Element Nodes Processing',
              'element-nodes-start',
              'element-nodes-end'
            );
            const elementMeasures = performance.getEntriesByName('Element Nodes Processing');
            const elementMeasure =
              elementMeasures && elementMeasures.length > 0 ? elementMeasures.pop() : null;
            if (elementMeasure) {
              logger.debug(
                `Processed ${nodeCount} element nodes in ${Math.round(elementMeasure.duration)}ms`
              );
            }
          }

          // Process text nodes directly
          if (state.pendingTextNodes.size > 0) {
            performance.mark('text-nodes-start');

            // Convert Set to Array to avoid issues if the set is modified during processing
            const textNodesToProcess = Array.from(state.pendingTextNodes);
            state.pendingTextNodes.clear();

            const textNodeCount = textNodesToProcess.length;

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

            performance.mark('text-nodes-end');
            performance.measure('Text Nodes Processing', 'text-nodes-start', 'text-nodes-end');
            const textMeasures = performance.getEntriesByName('Text Nodes Processing');
            const textMeasure = textMeasures && textMeasures.length > 0 ? textMeasures.pop() : null;
            if (textMeasure) {
              logger.debug(
                `Processed ${textNodeCount} text nodes in ${Math.round(textMeasure.duration)}ms`
              );
            }
          }
        } finally {
          // Always clear the processing flag, even if errors occur during processing
          state.isProcessing = false;

          // Complete overall timing
          performance.mark('processPendingNodes-end');
          performance.measure(
            'Total Processing Time',
            'processPendingNodes-start',
            'processPendingNodes-end'
          );

          // Log the overall timing results
          const totalMeasures = performance.getEntriesByName('Total Processing Time');
          const totalMeasure =
            totalMeasures && totalMeasures.length > 0 ? totalMeasures.pop() : null;
          if (totalMeasure && totalMeasure.duration !== undefined) {
            const duration = Math.round(totalMeasure.duration);
            logger.debug(`Total processing time: ${duration}ms`);

            // End debug timer if debug mode is enabled
            debugTools.endScanTimer();
          }

          // Clean up performance entries to avoid memory leaks
          performance.clearMarks('processPendingNodes-start');
          performance.clearMarks('processPendingNodes-end');
          performance.clearMarks('settings-fetch-start');
          performance.clearMarks('settings-fetch-end');
          performance.clearMarks('element-nodes-start');
          performance.clearMarks('element-nodes-end');
          performance.clearMarks('text-nodes-start');
          performance.clearMarks('text-nodes-end');
          performance.clearMeasures('Total Processing Time');
          performance.clearMeasures('Settings Fetch Time');
          performance.clearMeasures('Element Nodes Processing');
          performance.clearMeasures('Text Nodes Processing');
        }
      })
      .catch((error) => {
        logger.error('Error fetching settings for batch processing:', error);
        // Clear the pending nodes to avoid a growing backlog if settings can't be fetched
        state.pendingNodes.clear();
        state.pendingTextNodes.clear();
        // Clear the processing flag to allow future processing
        state.isProcessing = false;

        // Complete timing on error
        performance.mark('processPendingNodes-end');
        performance.measure(
          'Total Processing Time (Error)',
          'processPendingNodes-start',
          'processPendingNodes-end'
        );
        const errorMeasures = performance.getEntriesByName('Total Processing Time (Error)');
        const errorMeasure = errorMeasures && errorMeasures.length > 0 ? errorMeasures.pop() : null;
        if (errorMeasure && errorMeasure.duration !== undefined) {
          logger.error(
            `Processing failed after ${Math.round(errorMeasure.duration)}ms due to settings error`
          );
        }

        // Clean up performance entries
        performance.clearMarks('processPendingNodes-start');
        performance.clearMarks('processPendingNodes-end');
        performance.clearMarks('settings-fetch-start');
        performance.clearMeasures('Total Processing Time (Error)');
      });
  } catch (error) {
    logger.error('Error processing pending nodes:', error.message, error.stack);

    // Clear the pending nodes to avoid a growing backlog on error
    state.pendingNodes.clear();
    state.pendingTextNodes.clear();
    // Clear the processing flag to allow future processing
    state.isProcessing = false;

    // Log error timing if the performance mark was created
    try {
      performance.mark('processPendingNodes-end');
      performance.measure(
        'Total Processing Time (Exception)',
        'processPendingNodes-start',
        'processPendingNodes-end'
      );
      const exceptionMeasure = performance
        .getEntriesByName('Total Processing Time (Exception)')
        .pop();
      logger.error(
        `Processing failed after ${Math.round(exceptionMeasure.duration)}ms due to exception`
      );

      // Clean up performance entries
      performance.clearMarks('processPendingNodes-start');
      performance.clearMarks('processPendingNodes-end');
      performance.clearMeasures('Total Processing Time (Exception)');
    } catch (perfError) {
      // Handle case where initial mark wasn't set
      logger.error('Error adding performance timing on exception:', perfError.message);
    }
  }
};

/**
 * Stops the MutationObserver and cleans up all resources
 *
 * @param {object} [state] - Optional state object to use. If not provided, uses the default state.
 * @returns {boolean} True if observer was successfully stopped, false otherwise
 */
export const stopObserver = (state = defaultState) => {
  try {
    // Check if state exists
    if (!state) {
      logger.error('Invalid state passed to stopObserver');
      return false;
    }

    // Safe cleanup of resources, checking existence of each property
    try {
      // Clear any pending debounce timer
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = null;
      }
    } catch (timerError) {
      logger.error('Error clearing debounce timer:', timerError.message);
    }

    try {
      // Clear any pending nodes, safely handling case where sets might not exist
      // First explicitly check for null or undefined
      if (state.pendingNodes !== null && state.pendingNodes !== undefined) {
        // Then check if it has a clear method
        if (typeof state.pendingNodes.clear === 'function') {
          state.pendingNodes.clear();
        } else {
          // If no clear method, just set to a new empty Set
          state.pendingNodes = new Set();
        }
      } else {
        // Initialize if it doesn't exist
        state.pendingNodes = new Set();
      }

      // Do the same for pendingTextNodes
      if (state.pendingTextNodes !== null && state.pendingTextNodes !== undefined) {
        if (typeof state.pendingTextNodes.clear === 'function') {
          state.pendingTextNodes.clear();
        } else {
          state.pendingTextNodes = new Set();
        }
      } else {
        state.pendingTextNodes = new Set();
      }
    } catch (nodesError) {
      logger.error('Error clearing pending nodes:', nodesError.message);
      // Try to recover by resetting to new empty Sets
      try {
        state.pendingNodes = new Set();
        state.pendingTextNodes = new Set();
      } catch (recoveryError) {
        logger.error('Failed to recover from nodes error:', recoveryError.message);
      }
    }

    // Reset processing flag
    try {
      state.isProcessing = false;
    } catch (flagError) {
      logger.error('Error resetting processing flag:', flagError.message);
    }

    // Disconnect the observer, safely with multiple checks
    try {
      // Check if state.domObserver exists and is an object
      if (state.domObserver && typeof state.domObserver === 'object') {
        // Check if disconnect method exists and is a function
        if (typeof state.domObserver.disconnect === 'function') {
          try {
            // Call disconnect in a separate try block
            state.domObserver.disconnect();
          } catch (disconnectCallError) {
            // Just log but continue execution
            logger.warn(
              'MutationObserver.disconnect() failed (non-critical):',
              disconnectCallError.message
            );
          }
        }
        // Always null out the reference to prevent future errors
        state.domObserver = null;
        return true;
      }
      // If we reach here, either the observer doesn't exist or its disconnect method is not a function
      state.domObserver = null; // Make sure to clean up the reference anyway
    } catch (disconnectError) {
      logger.error('Error disconnecting observer:', disconnectError.message);
      // Attempt to clean up reference even if an error occurred
      try {
        state.domObserver = null;
      } catch (finalCleanupError) {
        // Last resort error handler
        logger.error('Error in final observer cleanup:', finalCleanupError.message);
      }
    }

    return false;
  } catch (error) {
    logger.error('Error stopping MutationObserver:', error.message, error.stack);
    return false;
  }
};
