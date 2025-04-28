/**
 * Popup UI controller module
 * Handles toggle state management and user interactions for the popup UI
 * @module popup/popup
 */

import { getSettings, saveSettings } from '../utils/storage.js';

/**
 * Restores the enabled/disabled state of the extension toggle
 * Reads from Chrome storage and updates the UI accordingly
 *
 * @returns {Promise<void>} A promise that resolves when the UI is updated
 */
const restoreOptions = () => {
  getSettings()
    .then((settings) => {
      document.getElementById('enabled').checked = !settings.disabled;
    })
    .catch((error) => {
      console.error('Storage operation failed:', error);
    });
};

/**
 * Event handler for the extension enable/disable toggle
 * Updates the storage with the new disabled state
 * This triggers the background script to update tab icons accordingly
 *
 * @param {Event} event - The change event from the toggle checkbox
 * @returns {Promise<void>} A promise that resolves when settings are saved
 */
function handleEnableToggle(event) {
  saveSettings({ disabled: !event.target.checked }).catch((error) => {
    console.error('Storage operation failed:', error);
  });
}

/**
 * Event handler for options button click
 * Opens the extension's options page in a new tab
 * Uses Chrome API to open the correct options page
 *
 * @returns {void}
 */
function handleOptionsClick() {
  chrome.runtime.openOptionsPage();
}

/**
 * Event handler for DOMContentLoaded event
 * Initializes the popup UI and sets up event listeners
 * This is the main initialization function for the popup
 *
 * @param {Event} event - The DOMContentLoaded event
 * @returns {void}
 */
function handleDOMContentLoaded() {
  restoreOptions();

  const enable = document.getElementById('enabled');
  enable.addEventListener('change', handleEnableToggle);

  const options = document.getElementById('options');
  options.onclick = handleOptionsClick;
}

// Initial display for popup menu when opened
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
