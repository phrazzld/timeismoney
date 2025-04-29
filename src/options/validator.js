/**
 * Validator module for options form
 * Contains all validation functions for form fields
 *
 * @module options/validator
 */

/**
 * Helper function to show an error message and clear it after a timeout
 *
 * @param {HTMLElement} status - Status element to display the message in
 * @param {string} message - Error message to display
 * @param {number} timeout - Time in ms before clearing the message
 * @returns {boolean} Always returns false for use in validation functions
 */
export function showError(status, message, timeout = 2000) {
  status.textContent = message;
  setTimeout(() => {
    status.textContent = '';
  }, timeout);
  return false;
}

/**
 * Validates a currency symbol
 *
 * @param {string} symbol - Symbol to validate
 * @param {HTMLElement} status - Status element for error messages
 * @returns {boolean} True if valid, false otherwise
 */
export function validateCurrencySymbol(symbol, status) {
  // Validate currency symbol is not empty
  if (!symbol) {
    return showError(
      status,
      chrome.i18n.getMessage('symbolErr') || 'Please enter a currency symbol.'
    );
  }

  // Validate symbol length is within acceptable range (1-3 characters)
  if (symbol.length < 1 || symbol.length > 3) {
    return showError(
      status,
      chrome.i18n.getMessage('symbolLengthErr') || 'Currency symbol must be 1-3 characters long.'
    );
  }

  // Validate symbol contains only permitted characters
  // Allow common currency symbols and alphanumeric characters
  const safeSymbolRegex = /^[$€£¥₹₽¢₩₪₴₺₼₸฿₫₭₲₡₱a-zA-Z0-9]+$/;
  if (!safeSymbolRegex.test(symbol)) {
    return showError(
      status,
      chrome.i18n.getMessage('symbolFormatErr') ||
        'Currency symbol can only contain alphanumeric characters and common currency symbols.'
    );
  }

  return true;
}

/**
 * List of common ISO 4217 currency codes
 * This is not an exhaustive list but covers major currencies
 */
const COMMON_CURRENCY_CODES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'HKD',
  'NZD',
  'SEK',
  'KRW',
  'SGD',
  'NOK',
  'MXN',
  'INR',
  'RUB',
  'ZAR',
  'TRY',
  'BRL',
  'TWD',
  'DKK',
  'PLN',
  'THB',
  'IDR',
  'HUF',
  'CZK',
  'ILS',
  'CLP',
  'PHP',
  'AED',
  'COP',
  'SAR',
  'MYR',
  'RON',
  'BGN',
  'HRK',
  'UAH',
];

/**
 * Validates a currency code
 *
 * @param {string} code - Code to validate
 * @param {HTMLElement} status - Status element for error messages
 * @returns {boolean} True if valid, false otherwise
 */
export function validateCurrencyCode(code, status) {
  // Validate currency code is not empty
  if (!code) {
    return showError(status, chrome.i18n.getMessage('codeErr') || 'Please enter a currency code.');
  }

  // Validate code is exactly 3 uppercase letters
  const codeRegex = /^[A-Z]{3}$/;
  if (!codeRegex.test(code)) {
    return showError(
      status,
      chrome.i18n.getMessage('codeFormatErr') ||
        'Currency code must be 3 uppercase letters (e.g., USD, EUR, GBP).'
    );
  }

  // Optional: Provide a warning for uncommon currency codes
  // This is a UX improvement - still allows the code but warns the user
  if (!COMMON_CURRENCY_CODES.includes(code)) {
    // Only show a warning, but still return true to allow saving
    status.textContent =
      chrome.i18n.getMessage('codeUncommonWarn') ||
      'Note: This appears to be an uncommon currency code. Please verify it is correct.';

    // Clear the warning after 3 seconds
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  }

  return true;
}

/**
 * Validates an amount value
 *
 * @param {string} rawAmount - Raw amount string from input
 * @param {number} amountFloat - Parsed float value
 * @param {HTMLElement} status - Status element for error messages
 * @returns {boolean} True if valid, false otherwise
 */
export function validateAmount(rawAmount, amountFloat, status) {
  // Validate input is not empty
  if (!rawAmount.trim()) {
    return showError(status, chrome.i18n.getMessage('amountEmptyErr') || 'Please enter an amount.');
  }

  // Check for valid numeric format
  const numberPattern = /^[0-9,.]+$/;
  if (!numberPattern.test(rawAmount.trim())) {
    return showError(
      status,
      chrome.i18n.getMessage('amountFormatErr') ||
        'Amount must contain only digits, commas, and decimal points.'
    );
  }

  // Validate input is a valid number
  if (isNaN(amountFloat)) {
    return showError(status, chrome.i18n.getMessage('amountErr') || 'Please enter a valid amount.');
  }

  // Validate input is finite
  if (!isFinite(amountFloat)) {
    return showError(status, chrome.i18n.getMessage('amountErr') || 'Please enter a valid amount.');
  }

  // Validate input is positive (not just non-negative)
  if (amountFloat <= 0) {
    // Use default message if translation is not available
    const positiveErrMsg =
      chrome.i18n.getMessage('positiveAmountErr') || 'Amount must be greater than zero.';
    return showError(status, positiveErrMsg);
  }

  // Validate input is within reasonable range
  const MIN_AMOUNT = 0.01; // Minimum sensible amount
  const MAX_AMOUNT = 1000000000; // 1 billion

  if (amountFloat < MIN_AMOUNT) {
    const minAmountMsg =
      chrome.i18n.getMessage('minAmountErr') || `Amount must be at least ${MIN_AMOUNT}.`;
    return showError(status, minAmountMsg);
  }

  if (amountFloat > MAX_AMOUNT) {
    const maxAmountMsg =
      chrome.i18n.getMessage('maxAmountErr') || `Amount must be less than ${MAX_AMOUNT}.`;
    return showError(status, maxAmountMsg);
  }

  // Validate number of decimal places (prevent super-precise values)
  const decimalStr = amountFloat.toString().split('.');
  if (decimalStr.length > 1 && decimalStr[1].length > 6) {
    return showError(
      status,
      chrome.i18n.getMessage('decimalPlacesErr') || 'Amount cannot have more than 6 decimal places.'
    );
  }

  return true;
}

/**
 * Validates a debounce interval value
 *
 * @param {string} intervalStr - Raw interval string from input
 * @param {HTMLElement} status - Status element for error messages
 * @returns {boolean} True if valid, false otherwise
 */
export function validateDebounceInterval(intervalStr, status) {
  // Empty input is valid, will use default value
  if (!intervalStr.trim()) {
    return true;
  }

  // Check that input contains only digits
  if (!/^\d+$/.test(intervalStr.trim())) {
    return showError(
      status,
      chrome.i18n.getMessage('debounceFormatErr') || 'Debounce interval must contain only digits.'
    );
  }

  // Parse interval to integer
  const interval = parseInt(intervalStr, 10);

  // Validate input is a number and not NaN
  if (isNaN(interval)) {
    return showError(
      status,
      chrome.i18n.getMessage('debounceIntervalErr') || 'Please enter a valid debounce interval.'
    );
  }

  // Validate input is finite
  if (!isFinite(interval)) {
    return showError(
      status,
      chrome.i18n.getMessage('debounceIntervalErr') || 'Please enter a valid debounce interval.'
    );
  }

  // Validate input is an integer
  if (interval !== parseFloat(intervalStr)) {
    return showError(
      status,
      chrome.i18n.getMessage('debounceIntegerErr') || 'Debounce interval must be a whole number.'
    );
  }

  // Validate input is within range (50-5000ms)
  const MIN_INTERVAL = 50;
  const MAX_INTERVAL = 5000;
  if (interval < MIN_INTERVAL || interval > MAX_INTERVAL) {
    const rangeErrMsg =
      chrome.i18n.getMessage('debounceRangeErr') ||
      `Interval must be between ${MIN_INTERVAL} and ${MAX_INTERVAL}ms.`;
    return showError(status, rangeErrMsg);
  }

  return true;
}
