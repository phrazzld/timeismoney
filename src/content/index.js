import { getSettings } from '../utils/storage.js';
import { initSettings, onSettingsChange, handleVisibilityChange } from './settingsManager.js';
import { walk } from './domScanner.js';
import { findPrices } from './priceFinder.js';
import { convertPriceToTimeString } from './priceConverter.js';
import { processTextNode } from './domModifier.js';

// Process page with current settings
function processPage(root) {
  walk(root, convert);
}

// Initialize settings and set up event handlers
initSettings(processPage);
onSettingsChange(processPage);
handleVisibilityChange(processPage);

/**
 * Converts price text in a DOM text node to include equivalent working time
 * Or reverts previously converted text back to original form
 *
 * @param {Node} textNode - The DOM text node to process
 */
const convert = (textNode) => {
  // Skip text nodes that are not valid or empty
  if (!textNode || !textNode.nodeValue || textNode.nodeValue.trim() === '') {
    return;
  }

  getSettings().then((settings) => {
    const formatSettings = {
      currencySymbol: settings.currencySymbol,
      currencyCode: settings.currencyCode,
      thousands: settings.thousands,
      decimal: settings.decimal,
      isReverseSearch: settings.disabled === true,
    };

    const priceMatch = findPrices(textNode.nodeValue, formatSettings);
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
  });
};
