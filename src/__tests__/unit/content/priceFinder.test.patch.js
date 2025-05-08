/**
 * Mock implementations for priceFinder functions
 *
 * This file provides simplified mock implementations for testing purposes,
 * particularly to reduce memory usage and improve test performance.
 */

/**
 * Simplified mock for buildMatchPattern that uses string includes instead of regex
 *
 * Creates a regex-like object that matches strings containing currency symbols or codes
 * without the memory overhead of complex regex patterns
 *
 * @param {string} currencySymbol - The currency symbol to match (e.g., '$', '€')
 * @param {string} currencyCode - The currency code to match (e.g., 'USD', 'EUR')
 * @returns {object} A regex-like object with test and exec methods
 */
export const mockBuildMatchPattern = (currencySymbol, currencyCode) => {
  // Create a simple mock object that simulates regex behavior
  return {
    test: (str) => {
      // Simple implementation that checks for currency symbols/codes
      return str.includes(currencySymbol) || str.includes(currencyCode);
    },
    exec: (str) => {
      if (str.includes(currencySymbol) || str.includes(currencyCode)) {
        return [str];
      }
      return null;
    },
    source: 'simplified-for-memory-efficiency',
    global: true,
  };
};

/**
 * Simplified mock for buildReverseMatchPattern that detects time annotations
 *
 * Creates a regex-like object that matches strings containing time annotations
 * like "(2h 30m)" without the memory overhead of complex regex patterns
 *
 * @param {string} currencySymbol - The currency symbol (not used in implementation but kept for API compatibility)
 * @param {string} currencyCode - The currency code (not used in implementation but kept for API compatibility)
 * @returns {object} A regex-like object with test and exec methods
 */
// eslint-disable-next-line no-unused-vars
export const mockBuildReverseMatchPattern = (currencySymbol, currencyCode) => {
  // Create a simple mock object that simulates regex behavior for annotated prices
  return {
    test: (str) => {
      // Check for time annotations
      return str.includes('(') && str.includes('h') && str.includes('m') && str.includes(')');
    },
    exec: (str) => {
      if (str.includes('(') && str.includes('h') && str.includes('m') && str.includes(')')) {
        return [str];
      }
      return null;
    },
    source: 'simplified-for-memory-efficiency',
    global: true,
  };
};
