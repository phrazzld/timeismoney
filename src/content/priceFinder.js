/**
 * Price Finder module for detecting and processing price strings.
 * Enhanced to handle international currency formats more robustly.
 *
 * @module content/priceFinder
 */

import {
  CURRENCY_FORMATS,
  CURRENCY_SYMBOL_TO_FORMAT,
  CURRENCY_CODE_TO_FORMAT,
} from '../utils/constants.js';

// Cache for regex patterns to avoid rebuilding them
const patternCache = {
  match: new Map(),
  reverse: new Map(),
  thousands: new Map(),
  decimal: new Map(),
  locale: new Map(),
};

/**
 * Builds a regex pattern string for the thousands delimiter based on locale format
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
 * Builds a regex pattern string for the decimal delimiter based on locale format
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
 * Gets locale format information for a currency symbol or code
 *
 * @param {string} currencySymbol - The currency symbol (e.g., '$')
 * @param {string} currencyCode - The currency code (e.g., 'USD')
 * @returns {object} Locale format information
 */
export const getLocaleFormat = (currencySymbol, currencyCode) => {
  const cacheKey = `${currencySymbol}|${currencyCode}`;
  if (patternCache.locale.has(cacheKey)) {
    return patternCache.locale.get(cacheKey);
  }

  // Try to determine the format group from the currency symbol first
  let formatGroup = currencySymbol ? CURRENCY_SYMBOL_TO_FORMAT[currencySymbol] : null;

  // If not found or no symbol provided, try the currency code
  if (!formatGroup && currencyCode) {
    formatGroup = CURRENCY_CODE_TO_FORMAT[currencyCode];
  }

  // Default to US format if no match found
  formatGroup = formatGroup || 'US';
  const format = CURRENCY_FORMATS[formatGroup];

  patternCache.locale.set(cacheKey, format);
  return format;
};

/**
 * Builds a more robust regex pattern to match prices in various formats
 * This enhanced version provides better support for international formats
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

  const format = getLocaleFormat(currencySymbol, currencyCode);

  // Create patterns based on whether symbols typically come before or after the amount
  let symbolsBefore = '';
  let symbolsAfter = '';

  // Escape special regex characters in currency symbols
  const escapedSymbol = currencySymbol
    ? currencySymbol.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')
    : '';

  if (format.symbolsBeforeAmount) {
    symbolsBefore = `(${escapedSymbol}|${currencyCode})\\s?`;
    symbolsAfter = '';
  } else {
    symbolsBefore = '';
    symbolsAfter = `\\s?(${escapedSymbol}|${currencyCode})`;
  }

  // Enhanced number pattern that handles optional thousands separators and decimals
  // This handles both formats like 1,234.56 and 1.234,56 depending on locale
  const numberPattern = `\\d+(?:${thousandsString}\\d{3})*(?:${decimalString}\\d{1,2})?`;

  // Build regex patterns for both symbol-before and symbol-after cases
  const patterns = [];

  // If the currency can appear before the amount
  if (symbolsBefore) {
    patterns.push(`${symbolsBefore}${numberPattern}`);
  }

  // If the currency can appear after the amount
  if (symbolsAfter || !symbolsBefore) {
    // If no specific format is known, allow currency after as well
    patterns.push(`${numberPattern}${symbolsAfter}`);
  }

  // Also match currency codes with a space
  if (currencyCode) {
    patterns.push(`${currencyCode}\\s${numberPattern}`);
    patterns.push(`${numberPattern}\\s${currencyCode}`);
  }

  // Combine all patterns with OR
  const patternSource = patterns.join('|');
  const pattern = new RegExp(patternSource, 'g');

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

  // Get the price pattern first
  const pricePattern = buildMatchPattern(
    currencySymbol,
    currencyCode,
    thousandsString,
    decimalString
  );

  // Add the time annotation pattern
  const timeAnnotationPattern = '\\s\\(\\d+h\\s\\d+m\\)';

  // Create the full pattern
  const pattern = new RegExp(
    `(${pricePattern.source.replace(/\//g, '')})${timeAnnotationPattern}`,
    'g'
  );

  patternCache.reverse.set(cacheKey, pattern);
  return pattern;
};

/**
 * Detects the most likely locale format from a text sample
 * This helps improve price detection for users in different regions
 *
 * @param {string} text - Sample text containing potential prices
 * @returns {object} The detected format settings or null if no format detected
 */
export const detectFormatFromText = (text) => {
  if (!text || typeof text !== 'string') return null;

  // Look for currency symbols in the text
  let detectedFormat = null;

  // Check for currency symbols
  for (const [symbol, formatGroup] of Object.entries(CURRENCY_SYMBOL_TO_FORMAT)) {
    if (text.includes(symbol)) {
      detectedFormat = CURRENCY_FORMATS[formatGroup];
      break;
    }
  }

  // Check for currency codes if no symbol was found
  if (!detectedFormat) {
    for (const [code, formatGroup] of Object.entries(CURRENCY_CODE_TO_FORMAT)) {
      if (text.includes(code)) {
        detectedFormat = CURRENCY_FORMATS[formatGroup];
        break;
      }
    }
  }

  return detectedFormat;
};

/**
 * Finds price strings in a text based on format settings
 * Enhanced to support more international formats
 *
 * @param {string} text - The text to search for prices
 * @param {object} formatSettings - Settings for price formatting
 * @param {string} formatSettings.currencySymbol - The currency symbol (e.g., '$')
 * @param {string} formatSettings.currencyCode - The currency code (e.g., 'USD')
 * @param {string} formatSettings.thousands - The thousands delimiter type ('commas' or 'spacesAndDots')
 * @param {string} formatSettings.decimal - The decimal delimiter type ('dot' or 'comma')
 * @param {boolean} formatSettings.isReverseSearch - If true, search for prices with time annotations
 * @returns {object} Object with matches and regex patterns
 */
export const findPrices = (text, formatSettings) => {
  if (!text || !formatSettings) return null;

  // Try to detect the format from the text if not explicitly provided
  if (!formatSettings.thousands || !formatSettings.decimal) {
    const detectedFormat = detectFormatFromText(text);
    if (detectedFormat) {
      formatSettings.thousands = formatSettings.thousands || detectedFormat.thousands;
      formatSettings.decimal = formatSettings.decimal || detectedFormat.decimal;
    }
  }

  // Build the required regex patterns
  const thousandsString = buildThousandsString(formatSettings.thousands);
  const decimalString = buildDecimalString(formatSettings.decimal);
  const thousands = new RegExp(thousandsString, 'g');
  const decimal = new RegExp(decimalString, 'g');

  // Choose the appropriate match pattern
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
    formatInfo: getLocaleFormat(formatSettings.currencySymbol, formatSettings.currencyCode),
  };
};

/**
 * Extracts and normalizes price information from a text string
 * Enhanced to handle international formats
 *
 * @param {string} text - Text containing a price
 * @param {object} [formatSettings] - Optional format settings to use
 * @returns {object | null} Price information object or null if no valid price found
 */
export const getPriceInfo = (text, formatSettings = null) => {
  if (!text) return null;

  // Detect format if not provided
  if (!formatSettings) {
    const detectedFormat = detectFormatFromText(text);
    if (detectedFormat) {
      formatSettings = {
        currencySymbol: detectedFormat.currencySymbols[0],
        currencyCode: detectedFormat.currencyCodes[0],
        thousands: detectedFormat.thousands,
        decimal: detectedFormat.decimal,
        isReverseSearch: false,
      };
    } else {
      // Default to US format if nothing detected
      formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };
    }
  }

  // Find prices using the determined format
  const priceMatch = findPrices(text, formatSettings);
  if (!priceMatch || !priceMatch.pattern) return null;

  // Try to match the pattern in the text
  const matches = text.match(priceMatch.pattern);
  if (!matches || !matches.length) return null;

  // Process the first match
  const match = matches[0];

  // Extract the numeric part by removing currency symbols and codes
  let numericPart = match;

  // Remove currency symbols
  const formatGroup = priceMatch.formatInfo
    ? CURRENCY_FORMATS[priceMatch.formatInfo.localeId]
    : null;
  const currencySymbols = formatGroup?.currencySymbols || [];
  for (const symbol of currencySymbols) {
    numericPart = numericPart.replace(
      new RegExp(symbol.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'), 'g'),
      ''
    );
  }

  // Remove currency codes
  const currencyCodes = formatGroup?.currencyCodes || [];
  for (const code of currencyCodes) {
    numericPart = numericPart.replace(new RegExp(code, 'g'), '');
  }

  // Normalize the numeric part based on locale
  numericPart = numericPart.trim();

  // For a number like 1.234,56 (European format), convert to 1234.56
  if (formatSettings.decimal === 'comma' && formatSettings.thousands === 'spacesAndDots') {
    // Replace dots and spaces with nothing (remove thousands separators)
    numericPart = numericPart.replace(/[.\s]/g, '');
    // Replace comma with dot (normalize decimal separator)
    numericPart = numericPart.replace(/,/g, '.');
  } else if (formatSettings.decimal === 'dot' && formatSettings.thousands === 'commas') {
    // Standard US format - just remove commas
    numericPart = numericPart.replace(/,/g, '');
  }

  // Parse the normalized number
  const amount = parseFloat(numericPart);

  // Determine the currency
  let currency = 'USD'; // Default

  // Try to extract currency from the match
  for (const [symbol, formatGroupKey] of Object.entries(CURRENCY_SYMBOL_TO_FORMAT)) {
    if (match.includes(symbol)) {
      const formatGroup = CURRENCY_FORMATS[formatGroupKey];
      if (formatGroup && formatGroup.currencyCodes && formatGroup.currencyCodes.length > 0) {
        currency = formatGroup.currencyCodes[0];
      }
      break;
    }
  }

  // Check for currency codes explicitly
  for (const code of Object.keys(CURRENCY_CODE_TO_FORMAT)) {
    if (match.includes(code)) {
      currency = code;
      break;
    }
  }

  return {
    amount: amount,
    currency: currency,
    original: match,
    format: formatSettings,
  };
};
