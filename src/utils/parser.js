/**
 * Normalizes an amount string based on thousands and decimal separators
 *
 * @param {string} amountString - The amount string to normalize
 * @param {string} thousandsSeparator - The thousands separator character
 * @param {string} decimalSeparator - The decimal separator character
 * @returns {string} Normalized amount string ready for parseFloat
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
