/**
 * Options page main script
 * Handles UI initialization
 * @module options/index
 */

import { loadForm, setupListeners } from './formHandler.js';
import { initTooltips } from './tooltip.js';

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

  // Initialize tooltips with delegated event handling
  initTooltips();
};

// Register initializer when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
