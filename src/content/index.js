import { getSettings } from '../utils/storage.js';
import { initSettings, onSettingsChange, handleVisibilityChange } from './settingsManager.js';
import { walk } from './domScanner.js';
import { findPrices } from './priceFinder.js';
import { convertPriceToTimeString } from './priceConverter.js';

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
  getSettings().then((settings) => {
    const formatSettings = {
      currencySymbol: settings.currencySymbol,
      currencyCode: settings.currencyCode,
      thousands: settings.thousands,
      decimal: settings.decimal,
      isReverseSearch: settings.disabled === true,
    };

    const { pattern, thousands, decimal } = findPrices(textNode.nodeValue, formatSettings);

    // Replace '$10' with '$10 (1h 30m)' or '10$' with '10$ (1h 30m)'
    if (!formatSettings.isReverseSearch) {
      textNode.nodeValue = textNode.nodeValue.replace(pattern, (priceString) => {
        const formatters = { thousands, decimal };
        const wageInfo = {
          frequency: settings.frequency,
          amount: settings.amount,
        };
        return convertPriceToTimeString(priceString, formatters, wageInfo);
      });
    } else {
      textNode.nodeValue = textNode.nodeValue.replace(pattern, '$1');
    }
  });
};
