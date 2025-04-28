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

/**
 * Process the page by walking the DOM and converting prices
 *
 * @param {Node} root - The root node to start processing from
 * @param {Object} [settings] - Optional settings object if already loaded
 */
function processPage(root, settings) {
  try {
    if (!root) {
      console.error('TimeIsMoney: processPage called with invalid root node');
      return;
    }

    walk(root, (textNode) => convert(textNode, settings));
  } catch (error) {
    console.error('TimeIsMoney: Error processing page:', error.message, error.stack);
  }
}

/**
 * Initialize DOM observer to watch for dynamic changes
 *
 * @param {Node} root - The root node to observe (usually document.body)
 * @param {Function} callback - The callback function to process nodes
 */
function initDomObserver(root, callback) {
  try {
    if (!root) {
      console.error('TimeIsMoney: Cannot initialize observer with invalid root node');
      return;
    }

    // Start observing DOM changes
    startObserver(root, callback);
  } catch (error) {
    console.error('TimeIsMoney: Error initializing DOM observer:', error.message, error.stack);
  }
}

// Initialize settings and set up event handlers
initSettings((root, settings) => {
  // Process the page initially
  processPage(root, settings);

  // Set up the mutation observer for dynamic content
  initDomObserver(root, (textNode) => convert(textNode, settings));
});
onSettingsChange(processPage);
handleVisibilityChange(processPage);

/**
 * Handle script unload to clean up resources
 */
function handleUnload() {
  try {
    // Disconnect the MutationObserver and clean up resources
    stopObserver();
  } catch (error) {
    console.error('TimeIsMoney: Error during unload cleanup:', error.message, error.stack);
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
 * @param {Object} [preloadedSettings] - Optional settings object if already loaded
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
          console.error('TimeIsMoney: No settings available for conversion');
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
        console.error('TimeIsMoney: Error converting price in text node:', error.message, {
          textContent: textNode?.nodeValue?.substring(0, 50) + '...',
          errorDetails: error.stack,
        });
      }
    })
    .catch((error) => {
      console.error('TimeIsMoney: Failed to get settings:', error?.message || 'Unknown error');
    });
};
