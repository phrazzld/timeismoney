/**
 * Utility functions for parsing and normalizing amount strings
 * @module utils/parser
 */

/**
 * Normalizes an amount string based on thousands and decimal separators
 * Prepares numeric strings for conversion by standardizing separator formats
 *
 * @param {string} amountString - The amount string to normalize
 * @param {string} thousandsSeparator - The thousands separator type ('commas' or 'spacesAndDots')
 * @param {string} decimalSeparator - The decimal separator type ('dot' or 'comma')
 * @returns {string} Normalized amount string ready for parseFloat
 * @throws {Error} Indirectly if passed invalid parameters
 */
export function normalizeAmountString(amountString, thousandsSeparator, decimalSeparator) {
  let result = amountString;

  // Remove thousands separators
  if (thousandsSeparator === 'commas') {
    result = result.replace(/,/g, '');
  } else if (thousandsSeparator === 'spacesAndDots') {
    result = result.replace(/(\s|\.)/g, '');
  }

  // Normalize decimal separator to dot for parseFloat
  if (decimalSeparator === 'comma') {
    result = result.replace(',', '.');
  }

  return result;
}
