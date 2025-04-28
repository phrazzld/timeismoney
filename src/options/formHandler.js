/**
 * Form Handler for options page
 * Handles loading, validating, and saving form data
 * @module options/formHandler
 */

import { getSettings, saveSettings } from '../utils/storage.js';
import { normalizeAmountString } from '../utils/parser.js';

/**
 * Loads the form with saved settings from storage
 *
 * @returns {Promise<void>} A promise that resolves when form is loaded
 */
export async function loadForm() {
  try {
    const items = await getSettings();
    loadSavedOption('currency-symbol', items.currencySymbol);
    loadSavedOption('currency-code', items.currencyCode);
    loadSavedOption('frequency', items.frequency);
    loadSavedOption('amount', items.amount, items.decimal);
    loadSavedOption('thousands', items.thousands);
    loadSavedOption('decimal', items.decimal);

    // Initialize formatting display
    document.getElementById('formatting').style.display = 'none';
  } catch (error) {
    console.error('Error loading options form:', error);
  }
}

/**
 * Sets up all form event listeners
 */
export function setupListeners() {
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('togglr').addEventListener('click', toggleFormatting);
}

/**
 * Helper function to show an error message and clear it after a timeout
 *
 * @param {HTMLElement} status - Status element to display the message in
 * @param {string} message - Error message to display
 * @param {number} timeout - Time in ms before clearing the message
 * @returns {boolean} Always returns false for use in validation functions
 */
function showError(status, message, timeout = 2000) {
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
function validateCurrencySymbol(symbol, status) {
  // Validate currency symbol is not empty
  if (!symbol) {
    return showError(
      status,
      chrome.i18n.getMessage('symbolErr') || 'Please enter a currency symbol.'
    );
  }

  // Validate symbol doesn't contain HTML or is too long
  const symbolRegex = /^[^<>]{1,5}$/;
  if (!symbolRegex.test(symbol)) {
    return showError(
      status,
      chrome.i18n.getMessage('symbolFormatErr') ||
        'Currency symbol must be 1-5 characters and cannot contain < or >.'
    );
  }

  return true;
}

/**
 * Validates a currency code
 *
 * @param {string} code - Code to validate
 * @param {HTMLElement} status - Status element for error messages
 * @returns {boolean} True if valid, false otherwise
 */
function validateCurrencyCode(code, status) {
  // Validate currency code is not empty
  if (!code) {
    return showError(status, chrome.i18n.getMessage('codeErr') || 'Please enter a currency code.');
  }

  // Validate code is a standard 3-letter code with only letters
  const codeRegex = /^[A-Z]{3}$/;
  if (!codeRegex.test(code)) {
    return showError(
      status,
      chrome.i18n.getMessage('codeFormatErr') ||
        'Currency code must be 3 letters (e.g., USD, EUR, GBP).'
    );
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
function validateAmount(rawAmount, amountFloat, status) {
  // Validate input is a number
  if (isNaN(amountFloat) || !rawAmount.trim()) {
    return showError(status, chrome.i18n.getMessage('amountErr') || 'Please enter a valid amount.');
  }

  // Validate input is finite
  if (!isFinite(amountFloat)) {
    return showError(status, chrome.i18n.getMessage('amountErr') || 'Please enter a valid amount.');
  }

  // Validate input is non-negative
  if (amountFloat < 0) {
    // Use default message if translation is not available
    const negativeErrMsg =
      chrome.i18n.getMessage('negativeAmountErr') || 'Amount must be non-negative.';
    return showError(status, chrome.i18n.getMessage('amountErr') + ' ' + negativeErrMsg);
  }

  // Validate input is within reasonable range (less than 1 billion)
  const MAX_AMOUNT = 1000000000; // 1 billion
  if (amountFloat > MAX_AMOUNT) {
    const maxAmountMsg =
      chrome.i18n.getMessage('maxAmountErr') || 'Amount must be less than 1 billion.';
    return showError(status, chrome.i18n.getMessage('amountErr') + ' ' + maxAmountMsg);
  }

  return true;
}

/**
 * Saves options from the form to storage
 * Shows success message and closes the options page
 * All validation is performed upfront before any processing
 */
function saveOptions() {
  // Get form values
  const currencySymbol = document.getElementById('currency-symbol').value.trim();
  const currencyCode = document.getElementById('currency-code').value.trim().toUpperCase();
  const frequency = document.getElementById('frequency').value;
  const rawAmount = document.getElementById('amount').value;
  const thousands = document.getElementById('thousands').value;
  const decimal = document.getElementById('decimal').value;
  const status = document.getElementById('status');

  // Normalize and parse amount for validation
  const normalizedAmount = normalizeAmountString(rawAmount, thousands, decimal);
  const amountFloat = parseFloat(normalizedAmount);

  // Perform all validation upfront
  if (
    !validateCurrencySymbol(currencySymbol, status) ||
    !validateCurrencyCode(currencyCode, status) ||
    !validateAmount(rawAmount, amountFloat, status)
  ) {
    return; // Validation failed, don't proceed with saving
  }

  // Format amount to 2 decimal places
  const amount = amountFloat.toFixed(2);

  // All validation passed, save settings
  saveSettings({
    currencySymbol,
    currencyCode,
    frequency,
    amount,
    thousands,
    decimal,
  })
    .then(() => {
      status.textContent = chrome.i18n.getMessage('saveSuccess');
      setTimeout(() => {
        status.textContent = '';
        window.close();
      }, 2000);
    })
    .catch((error) => {
      console.error('Error saving options:', error);
      status.textContent = 'Error saving options';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
}

/**
 * Toggles the display of advanced formatting options
 * Updates the toggle button text based on current state
 */
function toggleFormatting() {
  const formatting = document.getElementById('formatting');
  const togglr = document.getElementById('togglr');
  if (formatting.style.display === 'none') {
    togglr.textContent = chrome.i18n.getMessage('advHide');
    formatting.style.display = 'block';
  } else {
    togglr.textContent = chrome.i18n.getMessage('advShow');
    formatting.style.display = 'none';
  }
}

/**
 * Sets the value of a form element with saved data
 *
 * @param {string} elementId - The ID of the element to update
 * @param {*} value - The value to set
 * @param {string} decimal - The decimal format to use (default: 'dot')
 */
function loadSavedOption(elementId, value, decimal = 'dot') {
  if (value !== undefined && value !== null) {
    document.getElementById(elementId).value =
      elementId === 'amount' ? formatIncomeAmount(value, decimal) : value;
  }
}

/**
 * Formats a number according to the user's decimal format preference
 *
 * @param {string|number} x - The number to format
 * @param {string} decimal - The decimal format ('dot' or 'comma')
 * @returns {string} Formatted number string
 */
function formatIncomeAmount(x, decimal) {
  if (decimal === 'dot') {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    return x
      .toString()
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
