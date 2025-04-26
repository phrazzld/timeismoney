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
 * Saves options from the form to storage
 * Shows success message and closes the options page
 */
function saveOptions() {
  const currencySymbol = document.getElementById('currency-symbol').value;
  const currencyCode = document.getElementById('currency-code').value;
  const frequency = document.getElementById('frequency').value;
  const rawAmount = document.getElementById('amount').value;
  const thousands = document.getElementById('thousands').value;
  const decimal = document.getElementById('decimal').value;

  // Use parser utility to normalize amount string
  const normalizedAmount = normalizeAmountString(rawAmount, thousands, decimal);

  // Parse to float and fix to 2 decimal places
  const amountFloat = parseFloat(normalizedAmount);
  const status = document.getElementById('status');

  // Validate input is a number
  if (isNaN(amountFloat)) {
    status.textContent = chrome.i18n.getMessage('amountErr');
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
    return;
  }

  // Validate input is non-negative
  if (amountFloat < 0) {
    // Use default message if translation is not available
    const negativeErrMsg =
      chrome.i18n.getMessage('negativeAmountErr') || 'Amount must be non-negative.';
    status.textContent = chrome.i18n.getMessage('amountErr') + ' ' + negativeErrMsg;
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
    return;
  }

  // Format to 2 decimal places
  const amount = amountFloat.toFixed(2);

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
