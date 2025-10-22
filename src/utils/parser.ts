/**
 * Utility functions for parsing and normalizing amount strings
 *
 * @module utils/parser
 */

/**
 * Normalizes an amount string based on thousands and decimal separators
 * Prepares numeric strings for conversion by standardizing separator formats
 */
export function normalizeAmountString(
  amountString: string,
  thousandsSeparator: string,
  decimalSeparator: string
): string {
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
