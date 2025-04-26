import { getSettings, saveSettings } from '../utils/storage.js';

/**
 * Restores the enabled/disabled state of the extension toggle
 * Reads from Chrome storage and updates the UI accordingly
 */
const restoreOptions = () => {
  getSettings().then((settings) => {
    document.getElementById('enabled').checked = !settings.disabled;
  });
};

/**
 * Event handler for the extension enable/disable toggle
 * Updates the storage with the new disabled state
 *
 * @param {Event} event - The change event
 */
function handleEnableToggle(event) {
  saveSettings({ disabled: !event.target.checked });
}

/**
 * Event handler for options button click
 * Opens the options page
 */
function handleOptionsClick() {
  chrome.runtime.openOptionsPage();
}

/**
 * Event handler for DOMContentLoaded event
 * Initializes the popup UI and sets up event listeners
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
