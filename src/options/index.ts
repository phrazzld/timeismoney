/**
 * Options page main script
 * Handles UI initialization
 */

import { loadForm, setupListeners } from './formHandler.js';
import { initTooltips } from './tooltip.js';

/**
 * Loads localized messages for UI elements
 * Sets text content for all labels and buttons using Chrome i18n API
 */
const loadMessagesFromLocale = (): void => {
  const extDesc = document.getElementById('ext-desc') as HTMLElement;
  extDesc.textContent = chrome.i18n.getMessage('extDesc');

  const extInstructions = document.getElementById('ext-instructions') as HTMLElement;
  extInstructions.textContent = chrome.i18n.getMessage('instructions');

  const hourly = document.getElementById('hourly') as HTMLElement;
  hourly.textContent = chrome.i18n.getMessage('hourly');

  const yearly = document.getElementById('yearly') as HTMLElement;
  yearly.textContent = chrome.i18n.getMessage('yearly');

  const save = document.getElementById('save') as HTMLElement;
  save.textContent = chrome.i18n.getMessage('save');

  const togglr = document.getElementById('togglr') as HTMLElement;
  togglr.textContent = chrome.i18n.getMessage('advShow');

  const formattingHeader = document.getElementById('formatting-header') as HTMLElement;
  formattingHeader.textContent = chrome.i18n.getMessage('currencyFormat');

  const thousandsLabel = document.getElementById('thousands-label') as HTMLElement;
  thousandsLabel.textContent = chrome.i18n.getMessage('thousandsPlace');

  const decimalLabel = document.getElementById('decimal-label') as HTMLElement;
  decimalLabel.textContent = chrome.i18n.getMessage('decimalPlace');

  const commas = document.getElementById('commas') as HTMLElement;
  commas.textContent = chrome.i18n.getMessage('commas');

  const comma = document.getElementById('comma') as HTMLElement;
  comma.textContent = chrome.i18n.getMessage('comma');

  const spacesAndDots = document.getElementById('spaces-and-dots') as HTMLElement;
  spacesAndDots.textContent = chrome.i18n.getMessage('spacesAndDots');

  const dot = document.getElementById('dot') as HTMLElement;
  dot.textContent = chrome.i18n.getMessage('dot');

  const debounceLabel = document.getElementById('debounce-label') as HTMLElement;
  debounceLabel.textContent =
    chrome.i18n.getMessage('debounceLabel') || 'Debounce Interval (ms)';

  const dynamicScanningLabel = document.getElementById('dynamic-scanning-label') as HTMLElement;
  dynamicScanningLabel.textContent =
    chrome.i18n.getMessage('dynamicScanningLabel') || 'Enable Real-time Price Updates';

  document.title = chrome.i18n.getMessage('optionsTitle');
};

/**
 * Initialize the options page when DOM is loaded
 * Sets up localization, form data, event listeners, and tooltips
 * This is the main initialization function for the options page
 */
const initialize = (): void => {
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
