/**
 * Content Script Orchestrator
 *
 * This is the main entry point for the content script. It integrates all the
 * modules extracted during refactoring and coordinates their functionality.
 *
 * Flow:
 * 1. Settings are initialized using settingsManager
 * 2. DOM is scanned for text nodes using domScanner
 * 3. Price patterns are identified with priceFinder
 * 4. Prices are converted with priceConverter
 * 5. DOM is modified using domModifier
 *
 * @module content/index
 */

// Restore proper ES6 imports
import {
  initSettings,
  onSettingsChange,
  handleVisibilityChange,
  getSettingsWithCache,
} from './settingsManager.js';
import { walk, startObserver, stopObserver, createDomScannerState } from './domScanner.js';
import { findPrices } from './priceFinder.js';
import { convertPriceToTimeString } from '../utils/converter.js';
import { processTextNode, isValidForProcessing, globalCleanup } from './domModifier.js';
import { DEFAULT_DEBOUNCE_INTERVAL_MS } from '../utils/constants.js';
import {
  invalidateResponsiveCaches,
  warmStyleCaches,
  getCacheStatistics,
} from '../utils/styleCache.js';
import { mark, measure } from '../utils/performance.js';
import * as logger from '../utils/logger.js';
import type { Settings } from '../types/settings.js';

// Import service instances
// These services are instantiated here to ensure they're available
// They are used by converter.js so we need to import them even if not directly used here
// eslint-disable-next-line no-unused-vars
import recognitionService from '../services/recognitionService.js';
// eslint-disable-next-line no-unused-vars
import currencyService from '../services/currencyService.js';

/**
 * DOM Scanner state interface
 */
interface DomScannerState {
  domObserver: MutationObserver | null;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  pendingNodes: Set<Node>;
  pendingTextNodes: Set<Text>;
  isProcessing: boolean;
  reset: () => void;
}

/**
 * Price match result from priceFinder
 */
interface PriceMatch {
  text: string;
  culture: string;
  hasPotentialPrice: boolean;
  isReverseSearch: boolean;
  pattern: RegExp;
  reversePattern?: RegExp | null;
  thousands?: RegExp;
  decimal?: RegExp;
  formatInfo: {
    currencySymbol: string;
    currencyCode: string;
    thousands: string;
    decimal: string;
  } | null;
}

/**
 * Format settings for price finding
 */
interface FormatSettings {
  currencySymbol: string;
  currencyCode: string;
  thousands: string;
  decimal: string;
  isReverseSearch: boolean;
}

/**
 * Conversion information for the converter module
 */
interface ConversionInfo {
  convertFn: typeof convertPriceToTimeString;
  culture: string;
  formatters: {
    thousands?: RegExp;
    decimal?: RegExp;
  };
  wageInfo: {
    frequency: string;
    amount: string;
    currencyCode: string;
  };
}

// Create a single shared state object for the DOM scanner
const domScannerState: DomScannerState = createDomScannerState();

/**
 * Process the page by walking the DOM and converting prices
 * Traverses the DOM tree starting from the root node and applies price conversions
 * based on the provided settings.
 *
 * @param root - The root node to start processing from (usually document.body)
 * @param settings - Optional settings object if already loaded
 * @returns void
 * @throws Logs errors but doesn't throw to prevent breaking page functionality
 */
function processPage(root: Node, settings?: Settings): void {
  try {
    // Validate inputs first to avoid deeper errors
    if (!root || !(root instanceof Node)) {
      logger.error('processPage called with invalid root node');
      return;
    }

    // Also check document.body availability as fallback
    if (!document || !document.body) {
      logger.error('processPage called but document.body is not available');
      return;
    }

    // If no settings were provided, fetch them first
    if (!settings) {
      getSettingsWithCache()
        .then((fetchedSettings: Settings) => {
          // Validate settings before proceeding
          if (!fetchedSettings || typeof fetchedSettings !== 'object') {
            logger.error('Invalid settings received in processPage');
            return;
          }

          try {
            walk(
              root,
              (textNode: Text, nodeSettings: Settings) => convert(textNode, nodeSettings),
              fetchedSettings,
              {}
            );
          } catch (walkError) {
            const error = walkError as Error;
            logger.error('Error in DOM walker:', error.message, error.stack);
            // Important: Do not re-throw here, as it would break the promise chain
          }
        })
        .catch((error: Error) => {
          logger.error('Error fetching settings in processPage:', error.message, error.stack);
          // No recovery needed - just log and let the page continue without price conversion
        });
    } else {
      // Validate settings before proceeding with provided settings
      if (typeof settings !== 'object') {
        logger.error('Invalid settings object provided to processPage');
        return;
      }

      try {
        // Use the provided settings
        walk(
          root,
          (textNode: Text, nodeSettings: Settings) => convert(textNode, nodeSettings),
          settings,
          {}
        );
      } catch (walkError) {
        const error = walkError as Error;
        logger.error(
          'Error in DOM walker with pre-loaded settings:',
          error.message,
          error.stack
        );
        // Important: Errors in this block are already caught by the outer try-catch
      }
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Error processing page:', err.message, err.stack);
    // Continue page execution - do not re-throw
  }
}

/**
 * Initialize DOM observer to watch for dynamic changes
 * Sets up a MutationObserver to detect and process DOM changes as they occur
 *
 * @param root - The root node to observe (usually document.body)
 * @param callback - The callback function to process nodes
 * @param settings - Extension settings including debounce interval
 * @param state - Optional DOM scanner state. If not provided, uses the module's shared state.
 * @returns void
 * @throws Logs errors but doesn't throw to prevent breaking page functionality
 */
function initDomObserver(
  root: Node,
  callback: (textNode: Text) => void,
  settings: Settings,
  state: DomScannerState = domScannerState
): void {
  try {
    if (!root) {
      logger.error('Cannot initialize observer with invalid root node');
      return;
    }

    // Check if dynamic scanning is enabled in settings
    const isDynamicScanningEnabled = settings && settings.enableDynamicScanning !== false;

    // If dynamic scanning is disabled, log a message and return without starting the observer
    if (!isDynamicScanningEnabled) {
      logger.info('Dynamic scanning is disabled in user settings, observer not started');
      return;
    }

    // Get debounce interval from settings, fallback to default value
    let debounceInterval = DEFAULT_DEBOUNCE_INTERVAL_MS;

    // Try to parse the debounce interval from settings
    if (settings && 'debounceIntervalMs' in settings) {
      const parsedInterval = parseInt(String(settings.debounceIntervalMs), 10);
      if (!isNaN(parsedInterval) && parsedInterval > 0) {
        debounceInterval = parsedInterval;
      } else {
        logger.warn('Invalid debounce interval in settings, using default 200ms');
      }
    }

    // Start observing DOM changes with the configured debounce interval
    startObserver(root, callback, {}, debounceInterval, state);

    logger.info(`DOM observer initialized with ${debounceInterval}ms debounce interval`);
  } catch (error) {
    const err = error as Error;
    logger.error('Error initializing DOM observer:', err.message, err.stack);
  }
}

// Initialize settings and set up event handlers
initSettings((root: Node, settings: Settings) => {
  // Warm style caches on initialization
  try {
    warmStyleCaches();
    logger.debug('Style caches warmed on extension initialization');
  } catch (error) {
    const err = error as Error;
    logger.debug('Error warming style caches:', err.message);
  }

  // Process the page initially
  processPage(root, settings);

  // Set up the mutation observer for dynamic content, passing the settings to use the configured debounce interval
  initDomObserver(
    root,
    (textNode: Text) => convert(textNode, settings),
    settings,
    domScannerState
  );
});

// Handle settings changes
onSettingsChange((root: Node, updatedSettings: Settings) => {
  // Check if extension was disabled - if so, clean up all conversions
  if (updatedSettings.disabled === true) {
    logger.info('Extension disabled, cleaning up all price conversions');
    try {
      const cleanedCount = globalCleanup();
      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} price conversions after extension disable`);
      }
    } catch (cleanupError) {
      const error = cleanupError as Error;
      logger.error('Error cleaning up conversions on disable:', error.message);
    }

    // Stop observer when disabled
    stopObserver(domScannerState);
    return; // Don't process page or reinitialize observer when disabled
  }

  // Process the page with updated settings (only if not disabled)
  processPage(root, updatedSettings);

  // Check if dynamic scanning setting or debounce interval changed
  const dynamicScanningChanged = 'enableDynamicScanning' in updatedSettings;
  const debounceIntervalChanged = 'debounceIntervalMs' in updatedSettings;

  if (dynamicScanningChanged || debounceIntervalChanged) {
    // Log the change that triggered reinitialization
    if (dynamicScanningChanged) {
      logger.info(
        `Dynamic scanning ${updatedSettings.enableDynamicScanning ? 'enabled' : 'disabled'}`
      );
    }
    if (debounceIntervalChanged) {
      logger.info('Debounce interval changed, reinitializing observer');
    }

    // Stop the existing observer
    stopObserver(domScannerState);

    // Initialize a new observer with the updated settings
    // If dynamic scanning is disabled, initDomObserver will handle that internally
    initDomObserver(
      root,
      (textNode: Text) => convert(textNode, updatedSettings),
      updatedSettings,
      domScannerState
    );
  }
});

handleVisibilityChange(processPage);

/**
 * Handle script unload to clean up resources
 * Ensures proper cleanup of observers and event listeners when page unloads
 *
 * @param state - Optional DOM scanner state. If not provided, uses the module's shared state.
 * @returns void
 * @throws Logs errors but doesn't throw to prevent breaking page functionality
 */
function handleUnload(state: DomScannerState = domScannerState): void {
  try {
    // First check if the state is valid at all
    if (!state) {
      logger.debug('TimeIsMoney: No valid state to clean up during unload');
      return;
    }

    // STEP 1: Clean up all converted price elements from the DOM
    try {
      const cleanedCount = globalCleanup();
      if (cleanedCount > 0) {
        logger.debug(`TimeIsMoney: Cleaned up ${cleanedCount} price conversions during unload`);
      }
    } catch (cleanupError) {
      const error = cleanupError as Error;
      logger.debug('TimeIsMoney: Error during DOM cleanup:', error.message);
    }

    // STEP 2: Clean up DOM scanner state
    // Create a local copy of the domScannerState to prevent any reference issues
    const localState = state;

    // Safeguard against potential reference issues - manually clean up critical properties
    try {
      // Manually handle the debounce timer first
      if (localState.debounceTimer) {
        clearTimeout(localState.debounceTimer);
        localState.debounceTimer = null;
      }
    } catch (timerError) {
      const error = timerError as Error;
      logger.debug('TimeIsMoney: Error clearing timer during unload:', error.message);
    }

    // Try to safely disconnect the observer
    try {
      if (localState.domObserver) {
        // Extra safety check for disconnect method
        if (typeof localState.domObserver.disconnect === 'function') {
          localState.domObserver.disconnect();
        }
        localState.domObserver = null;
      }
    } catch (observerError) {
      const error = observerError as Error;
      logger.debug('TimeIsMoney: Error with observer during unload:', error.message);
    }

    // Try to clear collections safely
    try {
      if (localState.pendingNodes && typeof localState.pendingNodes.clear === 'function') {
        localState.pendingNodes.clear();
      }
      if (localState.pendingTextNodes && typeof localState.pendingTextNodes.clear === 'function') {
        localState.pendingTextNodes.clear();
      }
    } catch (collectionError) {
      const error = collectionError as Error;
      logger.debug(
        'TimeIsMoney: Error clearing collections during unload:',
        error.message
      );
    }

    // Now try using the stopObserver for additional cleanup, but only if we haven't already cleared everything
    try {
      // Make a safety check before calling stopObserver to avoid errors on null properties
      if (localState && localState.domObserver) {
        stopObserver(localState);
      }
    } catch (stopError) {
      const error = stopError as Error;
      logger.debug('TimeIsMoney: stopObserver failed during unload:', error.message);
    }
  } catch (error) {
    // Don't use logger here as it may cause additional errors during page unload
    // Use logger.debug to avoid cluttering the console with non-critical errors during unload
    const err = error as Error;
    logger.debug('TimeIsMoney: Error during unload cleanup:', err.message);
  }
}

// More robust set of event listeners for various cleanup scenarios
// 'pagehide' works better than 'unload' in many cases, especially for modern browsers
window.addEventListener('pagehide', () => handleUnload(), { passive: true });
window.addEventListener('unload', () => handleUnload(), { passive: true });
window.addEventListener('beforeunload', () => handleUnload(), { passive: true });

// For the case when browser navigation happens without triggering unload events
document.addEventListener(
  'visibilitychange',
  () => {
    if (document.visibilityState === 'hidden') {
      handleUnload();
    }
  },
  { passive: true }
);

// Add viewport change listener for cache invalidation
window.addEventListener(
  'resize',
  () => {
    try {
      invalidateResponsiveCaches();
      logger.debug('Responsive caches invalidated due to viewport change');
    } catch (error) {
      const err = error as Error;
      logger.debug('Error invalidating responsive caches:', err.message);
    }
  },
  { passive: true }
);

// Add periodic performance monitoring (every 30 seconds when active)
let performanceMonitorInterval: ReturnType<typeof setInterval> | null = null;

const startPerformanceMonitoring = (): void => {
  if (performanceMonitorInterval) {
    clearInterval(performanceMonitorInterval);
  }

  performanceMonitorInterval = setInterval(() => {
    try {
      const cacheStats = getCacheStatistics();
      if (cacheStats && Object.keys(cacheStats.statistics).length > 0) {
        logger.debug('Style Cache Performance Report:', {
          cacheHitRates: cacheStats.performance,
          cacheUtilization: cacheStats.caches,
          totalRequests: Object.values(cacheStats.statistics).reduce(
            (total, stat) => total + stat.hits + stat.misses,
            0
          ),
        });
      }
    } catch (error) {
      const err = error as Error;
      logger.debug('Error collecting cache statistics:', err.message);
    }
  }, 30000); // Report every 30 seconds
};

const stopPerformanceMonitoring = (): void => {
  if (performanceMonitorInterval) {
    clearInterval(performanceMonitorInterval);
    performanceMonitorInterval = null;
  }
};

// Start monitoring when page is visible
if (document.visibilityState === 'visible') {
  startPerformanceMonitoring();
}

// Handle visibility changes for performance monitoring
document.addEventListener(
  'visibilitychange',
  () => {
    if (document.visibilityState === 'visible') {
      startPerformanceMonitoring();
    } else {
      stopPerformanceMonitoring();
    }
  },
  { passive: true }
);

/**
 * Orchestrates the price conversion pipeline by separating the process into discrete steps:
 * 1. Check if the node is valid and not already processed (using domModifier.isValidForProcessing)
 * 2. Get settings (either from parameters or storage)
 * 3. Find prices in the text using the priceFinder module
 * 4. Create conversion info for the converter module
 * 5. Update the DOM using the domModifier module
 *
 * @param textNode - The DOM text node to process
 * @param preloadedSettings - Optional settings object if already loaded
 * @returns void
 */
const convert = (textNode: Text, preloadedSettings?: Settings): void => {
  // Start performance tracking
  mark('convert_start');
  const startTime = performance.now();

  try {
    // Validate text node
    if (!textNode || !textNode.nodeValue || textNode.nodeType !== 3) {
      return; // Silently return for invalid text nodes
    }

    // Use the domModifier's validation function to check if this node is valid for processing
    if (!isValidForProcessing(textNode)) {
      return;
    }

    // Verify we have access to the node content
    if (typeof textNode.nodeValue !== 'string') {
      return; // Silently return if we can't access the node's text content
    }

    // Security: Check the text node size to prevent excessive processing
    if (textNode.nodeValue.length > 10000) {
      // Skip extremely large text nodes to prevent slowdowns
      logger.debug(
        'Skipping excessively large text node:',
        textNode.nodeValue.substring(0, 50) + '...'
      );
      return;
    }

    // Use preloaded settings if provided, otherwise fetch them from cache
    // The MutationObserver in domScanner.js will now always provide preloadedSettings
    const settingsPromise = preloadedSettings
      ? Promise.resolve(preloadedSettings)
      : getSettingsWithCache();

    settingsPromise
      .then((settings: Settings) => {
        try {
          // Validate settings
          if (!settings || typeof settings !== 'object') {
            logger.error('Invalid or missing settings for conversion');
            return;
          }

          // STEP 1: Prepare the format settings for price finding
          const formatSettings: FormatSettings = {
            currencySymbol: settings.currencySymbol || '$', // Fallback to defaults if missing
            currencyCode: settings.currencyCode || 'USD',
            thousands: settings.thousands || 'commas',
            decimal: settings.decimal || 'dot',
            isReverseSearch: settings.disabled === true,
          };

          // STEP 2: Use priceFinder to identify prices in the text
          // First get the price patterns and formatters
          mark('price_find_start');
          let priceMatch: PriceMatch | null;
          try {
            priceMatch = findPrices(textNode.nodeValue, formatSettings);
            measure('price_find');
          } catch (priceFinderError) {
            measure('price_find');
            const error = priceFinderError as Error;
            logger.error('Error in price finding algorithm:', error.message, {
              textContent: textNode?.nodeValue?.substring(0, 50) + '...',
              formatSettings,
            });
            return; // Skip this node on price finding error
          }

          // Exit if no price patterns were found (not an error condition)
          if (!priceMatch) {
            return;
          }

          // STEP 2b: Extract actual price information using the patterns
          // Note: In the refactored approach, we don't need to extract matches manually as
          // the recognitionService will handle this. However, we keep this for backward compatibility
          // with the legacy implementation that expects pattern matching.
          try {
            // Use the pattern to check if there are matches in the text
            const matches = textNode.nodeValue.match(priceMatch.pattern);
            if (!matches || matches.length === 0) {
              // No actual price matches in the text
              return;
            }

            // We know there are matches, so we're good to proceed
            logger.debug('Found price match in text:', matches[0], {
              pattern: priceMatch.pattern.toString(),
              thousands: priceMatch.thousands?.toString() || 'N/A',
              decimal: priceMatch.decimal?.toString() || 'N/A',
              culture: priceMatch.culture || 'en-US',
              formatInfo: priceMatch.formatInfo,
            });
          } catch (matchError) {
            const error = matchError as Error;
            logger.error('Error matching prices in text:', error.message, {
              textContent: textNode?.nodeValue?.substring(0, 50) + '...',
            });
            return;
          }

          // STEP 3: Prepare conversion information for the converter
          const conversionInfo: ConversionInfo = {
            convertFn: convertPriceToTimeString,
            // If priceMatch has a culture property, use it. Otherwise use default 'en-US'.
            // This is the culture string used by the recognition service
            culture: priceMatch.culture || 'en-US',
            // Keep formatters for backward compatibility with legacy implementations
            formatters: {
              thousands: priceMatch.thousands,
              decimal: priceMatch.decimal,
            },
            wageInfo: {
              frequency: settings.frequency || 'hourly',
              amount: String(settings.amount) || '10', // Provide a reasonable default for amount
              // Add currencyCode for the new service-based implementation
              currencyCode: settings.currencyCode || 'USD',
            },
          };

          // Verify the wage amount is provided and valid
          if (
            !conversionInfo.wageInfo.amount ||
            isNaN(parseFloat(conversionInfo.wageInfo.amount)) ||
            parseFloat(conversionInfo.wageInfo.amount) <= 0
          ) {
            logger.warn('Invalid wage amount, using default');
            conversionInfo.wageInfo.amount = '10';
          }

          // STEP 4: Use domModifier to update the DOM with the converted prices
          mark('dom_modify_start');
          try {
            // Update the call to use culture alongside formatters for backward compatibility
            // This allows processTextNode to work with both the legacy and new service-based approach
            const result = processTextNode(
              textNode,
              priceMatch,
              conversionInfo,
              formatSettings.isReverseSearch,
              settings
            );
            measure('dom_modify');

            if (result) {
              logger.debug('Successfully converted price in DOM');
              // End the overall conversion measurement on success
              measure('convert');
            } else {
              measure('convert');
              logger.warn('Failed to convert price in DOM - processTextNode returned false', {
                textContent: textNode?.nodeValue?.substring(0, 50) + '...',
              });
            }
          } catch (domModifierError) {
            measure('dom_modify');
            measure('convert');
            const error = domModifierError as Error;
            logger.error('Error in DOM modification:', error.message, {
              textContent: textNode?.nodeValue?.substring(0, 50) + '...',
              priceMatch:
                typeof priceMatch === 'object'
                  ? { pattern: priceMatch.pattern?.toString(), culture: priceMatch.culture }
                  : 'Invalid priceMatch',
              errorDetails: error.stack,
            });
          }
        } catch (error) {
          const err = error as Error;
          logger.error('Error converting price in text node:', err.message, {
            textContent: textNode?.nodeValue?.substring(0, 50) + '...',
            errorDetails: err.stack,
          });
        }
      })
      .catch((error: Error) => {
        const processingTime = Math.round(performance.now() - startTime);
        // Handle settings retrieval errors separately to aid in debugging
        if (error && error.message === 'Extension context invalidated') {
          // This is expected during page unload - don't log as error
          return;
        } else if (error && error.message.includes('Extension context')) {
          // Other extension context issues - debug level
          logger.debug('Conversion skipped due to extension context issue:', error.message);
        } else {
          // Only log actual errors that might need attention
          logger.warn(`Processing failed after ${processingTime}ms due to settings error`);
        }
      });
  } catch (topLevelError) {
    // Catch all unexpected errors to prevent extension from breaking
    const error = topLevelError as Error;
    logger.error(
      'Unexpected error in convert function:',
      error.message,
      error.stack
    );
  }
};
