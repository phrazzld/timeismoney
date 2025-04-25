import { getSettings } from '../utils/storage.js';
import { initSettings, onSettingsChange, handleVisibilityChange } from './settingsManager.js';
import { walk } from './domScanner.js';
import { findPrices } from './priceFinder.js';

// Process page with current settings
function processPage(root) {
  walk(root, convert);
}

// Initialize settings and set up event handlers
initSettings(processPage);
onSettingsChange(processPage);
handleVisibilityChange(processPage);

/**
 * Helper function to convert a price string to equivalent working time
 *
 * @param {string} e - The original price string
 * @param {RegExp} thousands - Regex for thousands delimiter
 * @param {RegExp} decimal - Regex for decimal delimiter
 * @param {string} frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string} amount - Wage amount as string
 * @returns {string} Formatted string with price and equivalent working time
 */
const convertHelper = (e, thousands, decimal, frequency, amount) => {
  let sourceMoney = e
    .replace(thousands, '@')
    .replace(decimal, '~')
    .replace('~', '.')
    .replace('@', '');
  sourceMoney = parseFloat(sourceMoney.replace(/[^\d.]/g, '')).toFixed(2);
  const workingWage = buildWorkingWage(frequency, amount);
  return makeSnippet(e, sourceMoney, workingWage);
};

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

    // Replace '$10' with '$10 (1 h)' or '10$' with '10$ (1h)'
    if (!formatSettings.isReverseSearch) {
      textNode.nodeValue = textNode.nodeValue.replace(pattern, (e) => {
        return convertHelper(e, thousands, decimal, settings.frequency, settings.amount);
      });
    } else {
      textNode.nodeValue = textNode.nodeValue.replace(pattern, '$1');
    }
  });
};

/**
 * Calculates the hourly wage based on frequency and amount
 *
 * @param {string} frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string} amount - Wage amount as string
 * @returns {string} Hourly wage as fixed-point string with 2 decimal places
 */
const buildWorkingWage = (frequency, amount) => {
  let workingWage = parseFloat(amount);
  if (frequency === 'yearly') {
    workingWage = workingWage / 52 / 40;
  }
  return workingWage.toFixed(2);
};

/**
 * Builds text element in the form of: original (hours h minutes m)
 *
 * @param {string} sourceElement - The original price string
 * @param {number} sourceMoney - The price value as a number
 * @param {number} workingWage - The hourly wage
 * @returns {string} Formatted string with price and equivalent working time
 */
const makeSnippet = (sourceElement, sourceMoney, workingWage) => {
  const workHours = sourceMoney / workingWage;
  let hours, minutes, message;
  if (!isNaN(workHours)) {
    hours = Math.floor(workHours);
    minutes = Math.ceil(60 * (workHours - hours));
    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }
    message = `${sourceElement} (${hours}h ${minutes}m)`;
  } else {
    message = sourceElement;
  }
  return message;
};
