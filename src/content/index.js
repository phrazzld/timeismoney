import { getSettings } from '../utils/storage.js';
import { initSettings, onSettingsChange, handleVisibilityChange } from './settingsManager.js';
import { walk } from './domScanner.js';

// Process page with current settings
function processPage(root) {
  walk(root, convert);
}

// Initialize settings and set up event handlers
initSettings(processPage);
onSettingsChange(processPage);
handleVisibilityChange(processPage);

/**
 * Builds a regex pattern string for the thousands delimiter based on user settings
 *
 * @param {string} delimiter - The delimiter type for thousands ('commas' or 'spacesAndDots')
 * @returns {string} Regex pattern string for the thousands delimiter
 * @throws {Error} If delimiter is not recognized
 */
const buildThousandsString = (delimiter) => {
  if (delimiter === 'commas') {
    return ',';
  } else if (delimiter === 'spacesAndDots') {
    return '(\\s|\\.)';
  } else {
    throw new Error('Not a recognized delimiter for thousands!');
  }
};

/**
 * Builds a regex pattern string for the decimal delimiter based on user settings
 *
 * @param {string} delimiter - The delimiter type for decimals ('dot' or 'comma')
 * @returns {string} Regex pattern string for the decimal delimiter
 * @throws {Error} If delimiter is not recognized
 */
const buildDecimalString = (delimiter) => {
  if (delimiter === 'dot') {
    return '\\.';
  } else if (delimiter === 'comma') {
    return ',';
  } else {
    throw new Error('Not a recognized delimiter for decimals!');
  }
};

/**
 * Builds a regex pattern to match prices in various formats
 *
 * @param {string} currencySymbol - The currency symbol (e.g., '$')
 * @param {string} currencyCode - The currency code (e.g., 'USD')
 * @param {string} thousandsString - Regex pattern for thousands delimiter
 * @param {string} decimalString - Regex pattern for decimal delimiter
 * @returns {RegExp} Regex pattern to match prices
 */
const buildMatchPattern = (currencySymbol, currencyCode, thousandsString, decimalString) => {
  const precedingMatchPattern = new RegExp(
    `(\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?`,
    'g'
  );
  const concludingMatchPattern = new RegExp(
    `\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})`,
    'g'
  );

  return new RegExp(`${precedingMatchPattern.source}|${concludingMatchPattern.source}`);
};

/**
 * Builds a regex pattern to match prices with time conversion annotations
 * Used to revert prices back to their original form
 *
 * @param {string} currencySymbol - The currency symbol (e.g., '$')
 * @param {string} currencyCode - The currency code (e.g., 'USD')
 * @param {string} thousandsString - Regex pattern for thousands delimiter
 * @param {string} decimalString - Regex pattern for decimal delimiter
 * @returns {RegExp} Regex pattern to match prices with time annotations
 */
const buildReverseMatchPattern = (currencySymbol, currencyCode, thousandsString, decimalString) => {
  const reversedPrecedingMatchPattern = new RegExp(
    `((\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?)\\s\\(\\d+h\\s\\d+m\\)`,
    'g'
  );
  const reversedConcludingMatchPattern = new RegExp(
    `\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})\\s\\(\\d+h\\s\\d+m\\)`,
    'g'
  );

  return new RegExp(
    `${reversedPrecedingMatchPattern.source}|${reversedConcludingMatchPattern.source}`
  );
};

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
    let matchPattern;
    const currencySymbol = settings.currencySymbol;
    const currencyCode = settings.currencyCode;
    const amount = settings.amount;
    const frequency = settings.frequency;
    const disabled = settings.disabled;
    const thousandsString = buildThousandsString(settings.thousands);
    const thousands = new RegExp(thousandsString, 'g');
    const decimalString = buildDecimalString(settings.decimal);
    const decimal = new RegExp(decimalString, 'g');
    // Replace '$10' with '$10 (1 h)' or '10$' with '10$ (1h)'
    if (disabled !== true) {
      matchPattern = buildMatchPattern(
        currencySymbol,
        currencyCode,
        thousandsString,
        decimalString
      );
      textNode.nodeValue = textNode.nodeValue.replace(matchPattern, (e) => {
        return convertHelper(e, thousands, decimal, frequency, amount);
      });
    } else {
      matchPattern = buildReverseMatchPattern(
        currencySymbol,
        currencyCode,
        thousandsString,
        decimalString
      );
      textNode.nodeValue = textNode.nodeValue.replace(matchPattern, '$1');
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
