/**
 * Price Finder module for detecting and processing price strings.
 * @module content/priceFinder
 */

// Cache for regex patterns to avoid rebuilding them
const patternCache = {
  match: new Map(),
  reverse: new Map(),
  thousands: new Map(),
  decimal: new Map(),
};

/**
 * Builds a regex pattern string for the thousands delimiter based on user settings
 *
 * @param {string} delimiter - The delimiter type for thousands ('commas' or 'spacesAndDots')
 * @returns {string} Regex pattern string for the thousands delimiter
 * @throws {Error} If delimiter is not recognized
 */
export const buildThousandsString = (delimiter) => {
  if (patternCache.thousands.has(delimiter)) {
    return patternCache.thousands.get(delimiter);
  }

  let pattern;
  if (delimiter === 'commas') {
    pattern = ',';
  } else if (delimiter === 'spacesAndDots') {
    pattern = '(\\s|\\.)';
  } else {
    throw new Error('Not a recognized delimiter for thousands!');
  }

  patternCache.thousands.set(delimiter, pattern);
  return pattern;
};

/**
 * Builds a regex pattern string for the decimal delimiter based on user settings
 *
 * @param {string} delimiter - The delimiter type for decimals ('dot' or 'comma')
 * @returns {string} Regex pattern string for the decimal delimiter
 * @throws {Error} If delimiter is not recognized
 */
export const buildDecimalString = (delimiter) => {
  if (patternCache.decimal.has(delimiter)) {
    return patternCache.decimal.get(delimiter);
  }

  let pattern;
  if (delimiter === 'dot') {
    pattern = '\\.';
  } else if (delimiter === 'comma') {
    pattern = ',';
  } else {
    throw new Error('Not a recognized delimiter for decimals!');
  }

  patternCache.decimal.set(delimiter, pattern);
  return pattern;
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
export const buildMatchPattern = (currencySymbol, currencyCode, thousandsString, decimalString) => {
  const cacheKey = `${currencySymbol}|${currencyCode}|${thousandsString}|${decimalString}`;
  if (patternCache.match.has(cacheKey)) {
    return patternCache.match.get(cacheKey);
  }

  const precedingMatchPattern = new RegExp(
    `(\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?`,
    'g'
  );
  const concludingMatchPattern = new RegExp(
    `\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})`,
    'g'
  );

  const pattern = new RegExp(
    `${precedingMatchPattern.source}|${concludingMatchPattern.source}`,
    'g'
  );
  patternCache.match.set(cacheKey, pattern);
  return pattern;
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
export const buildReverseMatchPattern = (
  currencySymbol,
  currencyCode,
  thousandsString,
  decimalString
) => {
  const cacheKey = `${currencySymbol}|${currencyCode}|${thousandsString}|${decimalString}`;
  if (patternCache.reverse.has(cacheKey)) {
    return patternCache.reverse.get(cacheKey);
  }

  const reversedPrecedingMatchPattern = new RegExp(
    `((\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?)\\s\\(\\d+h\\s\\d+m\\)`,
    'g'
  );
  const reversedConcludingMatchPattern = new RegExp(
    `\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})\\s\\(\\d+h\\s\\d+m\\)`,
    'g'
  );

  const pattern = new RegExp(
    `${reversedPrecedingMatchPattern.source}|${reversedConcludingMatchPattern.source}`,
    'g'
  );
  patternCache.reverse.set(cacheKey, pattern);
  return pattern;
};

/**
 * Finds price strings in a text based on format settings
 *
 * @param {string} text - The text to search for prices
 * @param {Object} formatSettings - Settings for price formatting
 * @param {string} formatSettings.currencySymbol - The currency symbol (e.g., '$')
 * @param {string} formatSettings.currencyCode - The currency code (e.g., 'USD')
 * @param {string} formatSettings.thousands - The thousands delimiter type ('commas' or 'spacesAndDots')
 * @param {string} formatSettings.decimal - The decimal delimiter type ('dot' or 'comma')
 * @param {boolean} formatSettings.isReverseSearch - If true, search for prices with time annotations
 * @returns {Object} Object with matches and regex patterns
 */
export const findPrices = (text, formatSettings) => {
  const thousandsString = buildThousandsString(formatSettings.thousands);
  const decimalString = buildDecimalString(formatSettings.decimal);
  const thousands = new RegExp(thousandsString, 'g');
  const decimal = new RegExp(decimalString, 'g');

  let matchPattern;
  if (formatSettings.isReverseSearch) {
    matchPattern = buildReverseMatchPattern(
      formatSettings.currencySymbol,
      formatSettings.currencyCode,
      thousandsString,
      decimalString
    );
  } else {
    matchPattern = buildMatchPattern(
      formatSettings.currencySymbol,
      formatSettings.currencyCode,
      thousandsString,
      decimalString
    );
  }

  // Return both the pattern and the additional formatters needed for conversion
  return {
    pattern: matchPattern,
    thousands,
    decimal,
  };
};

/**
 * Extracts price information from a text string
 *
 * @param {string} text - Text containing a price
 * @returns {Object|null} Price information object or null if no valid price found
 */
export const getPriceInfo = (text) => {
  if (!text) return null;

  // Simple regex to extract price values for testing purposes
  const priceMatch = text.match(/\$(\d+(\.\d+)?)/);

  if (!priceMatch) return null;

  return {
    amount: parseFloat(priceMatch[1]),
    currency: 'USD',
    original: priceMatch[0],
  };
};
