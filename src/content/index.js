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
import { walk, startObserver, stopObserver } from './domScanner.js';
import { findPrices } from './priceFinder.js';
import { convertPriceToTimeString } from '../utils/converter.js';
import { processTextNode } from './domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../utils/constants.js';
import * as logger from '../utils/logger.js';

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
 * @returns {void}
 * @throws {Error} Logs errors but doesn't throw to prevent breaking page functionality
 */
function initDomObserver(root, callback, settings) {
  try {
    if (!root) {
      logger.error('Cannot initialize observer with invalid root node');
      return;
    }

    // Get debounce interval from settings, fallback to default value of 200ms
    let debounceInterval = 200;

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
    startObserver(root, callback, {}, debounceInterval);

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
  initDomObserver(root, (textNode) => convert(textNode, settings), settings);
});

// Handle settings changes
onSettingsChange((root, updatedSettings) => {
  // Process the page with updated settings
  processPage(root, updatedSettings);

  // If debounce interval changed, reinitialize the observer with the new value
  if ('debounceIntervalMs' in updatedSettings) {
    logger.info('Debounce interval changed, reinitializing observer');
    // Stop the existing observer
    stopObserver();
    // Initialize a new observer with the updated debounce interval
    initDomObserver(root, (textNode) => convert(textNode, updatedSettings), updatedSettings);
  }
});

handleVisibilityChange(processPage);

/**
 * Handle script unload to clean up resources
 * Ensures proper cleanup of observers and event listeners when page unloads
 *
 * @returns {void}
 * @throws {Error} Logs errors but doesn't throw to prevent breaking page functionality
 */
function handleUnload() {
  try {
    // Disconnect the MutationObserver and clean up resources
    stopObserver();
  } catch (error) {
    logger.error('Error during unload cleanup:', error.message, error.stack);
  }
}

// Add unload event listeners to clean up resources when the page is unloaded
window.addEventListener('unload', handleUnload);
window.addEventListener('beforeunload', handleUnload);

/**
 * Converts price text in a DOM text node to include equivalent working time
 * Or reverts previously converted text back to original form
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
  // Skip text nodes that are not valid or empty
  if (!textNode || !textNode.nodeValue || textNode.nodeValue.trim() === '') {
    return;
  }

  // Skip already converted elements or their children
  // Check if this node or any ancestor has the converted class
  let parent = textNode.parentNode;
  while (parent) {
    if (parent.classList && parent.classList.contains(CONVERTED_PRICE_CLASS)) {
      return; // This is already within a converted price element
    }
    parent = parent.parentNode;
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

        const formatSettings = {
          currencySymbol: settings.currencySymbol,
          currencyCode: settings.currencyCode,
          thousands: settings.thousands,
          decimal: settings.decimal,
          isReverseSearch: settings.disabled === true,
        };

        const priceMatch = findPrices(textNode.nodeValue, formatSettings);
        if (!priceMatch) {
          // Not an error, just no prices found
          return;
        }

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

        // Process the text node using the DOM modifier
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
