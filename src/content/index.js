import { getSettings, onSettingsChanged } from '../utils/storage.js';

let disabledOnPage = true;

// Should only run on first page load
getSettings().then((settings) => {
  if (!settings.disabled) {
    walk(document.body);
    disabledOnPage = false;
  }
});

// Should run whenever the popup switch is flipped on the current page
onSettingsChanged((updatedSettings) => {
  if ('disabled' in updatedSettings && !document.hidden) {
    console.debug('Running on detected change...');
    walk(document.body);
    disabledOnPage = updatedSettings.disabled;
  }
});

/**
 * Checks if the Chrome runtime is valid and accessible
 *
 * @returns {boolean} True if Chrome runtime and manifest are accessible, false otherwise
 */
const isValidChromeRuntime = () => {
  try {
    return chrome.runtime && !!chrome.runtime.getManifest();
  } catch (e) {
    return false;
  }
};

// Should run whenever the tab is changed and the current extension state
// differs from the previous one that was run on the page
document.addEventListener('visibilitychange', () => {
  if (!isValidChromeRuntime()) {
    console.log(
      `Run time is invalid! Please reload the page for the extension to work properly again...`
    );
  } else if (!document.hidden) {
    getSettings().then((settings) => {
      if (disabledOnPage !== settings.disabled) {
        console.debug('Running on visibility change...');
        walk(document.body);
        disabledOnPage = settings.disabled;
      }
    });
  }
});

/**
 * Traverses the DOM tree starting from the given node and applies price conversion
 * Credit to t-j-crowder on StackOverflow for this walk function
 * http://bit.ly/1o47R7V
 *
 * @param {Node} node - The starting node for traversal
 */
const walk = (node) => {
  let child, next, price;

  switch (node.nodeType) {
    case 1: // Element
    case 9: // Document
    case 11: // Document fragment
      child = node.firstChild;
      while (child) {
        next = child.nextSibling;

        // Check if child is Amazon display price
        const classes = child.classList;
        if (classes && classes.value === 'sx-price-currency') {
          price = child.firstChild.nodeValue.toString();
          child.firstChild.nodeValue = null;
        } else if (classes && classes.value === 'sx-price-whole') {
          price += child.firstChild.nodeValue.toString();
          child.firstChild.nodeValue = price;
          convert(child.firstChild);
          child = next;
        } else if (classes && classes.value === 'sx-price-fractional') {
          child.firstChild.nodeValue = null;
          price = null;
        }

        walk(child);
        child = next;
      }
      break;
    case 3: // Text node
      convert(node);
      break;
  }
};

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
