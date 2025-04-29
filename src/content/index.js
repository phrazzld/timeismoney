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
import { getSettings } from '../utils/storage.js';
import { initSettings, onSettingsChange, handleVisibilityChange } from './settingsManager.js';
import { walk, startObserver, stopObserver, createDomScannerState } from './domScanner.js';
import { findPrices } from './priceFinder.js';
import { convertPriceToTimeString } from '../utils/converter.js';
import { processTextNode, isValidForProcessing } from './domModifier.js';
import { DEFAULT_DEBOUNCE_INTERVAL_MS } from '../utils/constants.js';
import * as logger from '../utils/logger.js';

// Create a single shared state object for the DOM scanner
const domScannerState = createDomScannerState();

/**
 * Process the page by walking the DOM and converting prices
 * Traverses the DOM tree starting from the root node and applies price conversions
 * based on the provided settings.
 *
 * @param {Node} root - The root node to start processing from (usually document.body)
 * @param {object} [settings] - Optional settings object if already loaded
 * @param {boolean} [settings.disabled] - Whether the extension is disabled
 * @param {string} [settings.currencySymbol] - Currency symbol to use (e.g., "$")
 * @param {string} [settings.currencyCode] - Currency code to use (e.g., "USD")
 * @param {string} [settings.frequency] - Wage frequency ("hourly" or "yearly")
 * @param {string} [settings.amount] - Wage amount as string
 * @param {string} [settings.thousands] - Thousands separator format
 * @param {string} [settings.decimal] - Decimal separator format
 * @returns {void}
 * @throws {Error} Logs errors but doesn't throw to prevent breaking page functionality
 */
function processPage(root, settings) {
  try {
    if (!root) {
      logger.error('processPage called with invalid root node');
      return;
    }

    // If no settings were provided, fetch them first
    if (!settings) {
      getSettings()
        .then((fetchedSettings) => {
          walk(
            root,
            (textNode, nodeSettings) => convert(textNode, nodeSettings),
            fetchedSettings,
            {}
          );
        })
        .catch((error) => {
          logger.error('Error fetching settings in processPage:', error.message, error.stack);
        });
    } else {
      // Use the provided settings
      walk(root, (textNode, nodeSettings) => convert(textNode, nodeSettings), settings, {});
    }
  } catch (error) {
    logger.error('Error processing page:', error.message, error.stack);
  }
}

/**
 * Initialize DOM observer to watch for dynamic changes
 * Sets up a MutationObserver to detect and process DOM changes as they occur
 *
 * @param {Node} root - The root node to observe (usually document.body)
 * @param {Function} callback - The callback function to process nodes
 * @param {object} settings - Extension settings including debounce interval
 * @param {object} [state] - Optional DOM scanner state. If not provided, uses the module's shared state.
 * @returns {void}
 * @throws {Error} Logs errors but doesn't throw to prevent breaking page functionality
 */
function initDomObserver(root, callback, settings, state = domScannerState) {
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
      const parsedInterval = parseInt(settings.debounceIntervalMs, 10);
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
    logger.error('Error initializing DOM observer:', error.message, error.stack);
  }
}

// Initialize settings and set up event handlers
initSettings((root, settings) => {
  // Process the page initially
  processPage(root, settings);

  // Set up the mutation observer for dynamic content, passing the settings to use the configured debounce interval
  initDomObserver(root, (textNode) => convert(textNode, settings), settings, domScannerState);
});

// Handle settings changes
onSettingsChange((root, updatedSettings) => {
  // Process the page with updated settings
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
      (textNode) => convert(textNode, updatedSettings),
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
 * @param {object} [state] - Optional DOM scanner state. If not provided, uses the module's shared state.
 * @returns {void}
 * @throws {Error} Logs errors but doesn't throw to prevent breaking page functionality
 */
function handleUnload(state = domScannerState) {
  try {
    // Disconnect the MutationObserver and clean up resources
    stopObserver(state);
  } catch (error) {
    logger.error('Error during unload cleanup:', error.message, error.stack);
  }
}

// Add unload event listeners to clean up resources when the page is unloaded
window.addEventListener('unload', handleUnload);
window.addEventListener('beforeunload', handleUnload);

/**
 * Orchestrates the price conversion pipeline by separating the process into discrete steps:
 * 1. Check if the node is valid and not already processed (using domModifier.isValidForProcessing)
 * 2. Get settings (either from parameters or storage)
 * 3. Find prices in the text using the priceFinder module
 * 4. Create conversion info for the converter module
 * 5. Update the DOM using the domModifier module
 *
 * @param {Node} textNode - The DOM text node to process
 * @param {object} [preloadedSettings] - Optional settings object if already loaded
 * @param {boolean} [preloadedSettings.disabled] - Whether the extension is disabled
 * @param {string} [preloadedSettings.currencySymbol] - Currency symbol to use
 * @param {string} [preloadedSettings.currencyCode] - Currency code to use
 * @param {string} [preloadedSettings.frequency] - Wage frequency
 * @param {string} [preloadedSettings.amount] - Wage amount as string
 * @param {string} [preloadedSettings.thousands] - Thousands separator format
 * @param {string} [preloadedSettings.decimal] - Decimal separator format
 * @returns {void}
 */
const convert = (textNode, preloadedSettings) => {
  // Use the domModifier's validation function to check if this node is valid for processing
  if (!isValidForProcessing(textNode)) {
    return;
  }

  // Use preloaded settings if provided, otherwise fetch them
  // The MutationObserver in domScanner.js will now always provide preloadedSettings
  const settingsPromise = preloadedSettings ? Promise.resolve(preloadedSettings) : getSettings();

  settingsPromise
    .then((settings) => {
      try {
        if (!settings) {
          logger.error('No settings available for conversion');
          return;
        }

        // STEP 1: Prepare the format settings for price finding
        const formatSettings = {
          currencySymbol: settings.currencySymbol,
          currencyCode: settings.currencyCode,
          thousands: settings.thousands,
          decimal: settings.decimal,
          isReverseSearch: settings.disabled === true,
        };

        // STEP 2: Use priceFinder to identify prices in the text
        const priceMatch = findPrices(textNode.nodeValue, formatSettings);
        if (!priceMatch) {
          // Not an error, just no prices found
          return;
        }

        // STEP 3: Prepare conversion information for the converter
        const conversionInfo = {
          convertFn: convertPriceToTimeString,
          formatters: {
            thousands: priceMatch.thousands,
            decimal: priceMatch.decimal,
          },
          wageInfo: {
            frequency: settings.frequency,
            amount: settings.amount,
          },
        };

        // STEP 4: Use domModifier to update the DOM with the converted prices
        processTextNode(textNode, priceMatch, conversionInfo, formatSettings.isReverseSearch);
      } catch (error) {
        logger.error('Error converting price in text node:', error.message, {
          textContent: textNode?.nodeValue?.substring(0, 50) + '...',
          errorDetails: error.stack,
        });
      }
    })
    .catch((error) => {
      logger.error('Failed to get settings:', error?.message || 'Unknown error');
    });
};
