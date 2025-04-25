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

// Initial display for popup menu when opened
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();

  /**
   * Event handler for the extension enable/disable toggle
   * Updates the storage with the new disabled state
   *
   * @param {Event} event - The change event
   */
  const enable = document.getElementById('enabled');
  enable.addEventListener('change', (event) => {
    saveSettings({ disabled: !event.target.checked });
  });

  /**
   * Event handler for options button click
   * Opens the options page
   */
  const options = document.getElementById('options');
  options.onclick = () => {
    chrome.runtime.openOptionsPage();
  };
});
