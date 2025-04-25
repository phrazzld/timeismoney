/**
 * Options page main script
 * Handles UI initialization and tooltip functionality
 * @module options/index
 */

import { loadForm, setupListeners } from './formHandler.js';

/**
 * Determines tooltip text based on input field ID
 *
 * @param {string} id - The ID of the input field
 * @returns {string} The tooltip text for the given field
 */
const setTooltipText = (id) => {
  switch (id) {
    case 'currency-code':
      return chrome.i18n.getMessage('currencyCode');
    case 'currency-symbol':
      return chrome.i18n.getMessage('currencySymbol');
    case 'amount':
      return chrome.i18n.getMessage('incomeAmount');
    case 'frequency':
      return chrome.i18n.getMessage('payFrequency');
    default:
      return '';
  }
};

/**
 * Event handler to show tooltip for the current input field
 * Uses this.id to determine which field is focused
 */
const showTooltip = function () {
  const tooltip = document.getElementById('master-tooltip');
  tooltip.textContent = '';
  tooltip.textContent = setTooltipText(this.id);
};

/**
 * Event handler to hide tooltip when input loses focus
 */
const hideTooltip = function () {
  const tooltip = document.getElementById('master-tooltip');
  tooltip.textContent = '';
};

/**
 * Loads localized messages for UI elements
 */
const loadMessagesFromLocale = () => {
  document.getElementById('ext-desc').textContent = chrome.i18n.getMessage('extDesc');
  document.getElementById('ext-instructions').textContent = chrome.i18n.getMessage('instructions');
  document.getElementById('hourly').textContent = chrome.i18n.getMessage('hourly');
  document.getElementById('yearly').textContent = chrome.i18n.getMessage('yearly');
  document.getElementById('save').textContent = chrome.i18n.getMessage('save');
  document.getElementById('togglr').textContent = chrome.i18n.getMessage('advShow');
  document.getElementById('formatting-header').textContent =
    chrome.i18n.getMessage('currencyFormat');
  document.getElementById('thousands-label').textContent = chrome.i18n.getMessage('thousandsPlace');
  document.getElementById('decimal-label').textContent = chrome.i18n.getMessage('decimalPlace');
  document.getElementById('commas').textContent = chrome.i18n.getMessage('commas');
  document.getElementById('comma').textContent = chrome.i18n.getMessage('comma');
  document.getElementById('spaces-and-dots').textContent = chrome.i18n.getMessage('spacesAndDots');
  document.getElementById('dot').textContent = chrome.i18n.getMessage('dot');
  document.title = chrome.i18n.getMessage('optionsTitle');
};

/**
 * Initialize the page when DOM is loaded
 */
const initialize = () => {
  // Load localized messages
  loadMessagesFromLocale();

  // Load form data and set up form listeners
  loadForm();
  setupListeners();

  // Set up tooltip listeners
  document.getElementById('currency-code').addEventListener('focus', showTooltip);
  document.getElementById('currency-symbol').addEventListener('focus', showTooltip);
  document.getElementById('amount').addEventListener('focus', showTooltip);
  document.getElementById('frequency').addEventListener('focus', showTooltip);
  document.getElementById('currency-code').addEventListener('blur', hideTooltip);
  document.getElementById('currency-symbol').addEventListener('blur', hideTooltip);
  document.getElementById('amount').addEventListener('blur', hideTooltip);
  document.getElementById('frequency').addEventListener('blur', hideTooltip);
};

// Register initializer when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
