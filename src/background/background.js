import { saveSettings, onSettingsChanged } from '../utils/storage.js';

/**
 * Event handler for browser action click
 * Opens the options page when user clicks the extension icon
 */
chrome.browserAction.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

/**
 * Event handler for extension installation or update
 * Sets up default options and opens the options page
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
  saveSettings({
    disabled: false,
    currencySymbol: '$',
    currencyCode: 'USD',
    frequency: 'hourly',
    amount: '15.00',
    thousands: 'commas',
    decimal: 'dot',
  });
});

/**
 * Updates the extension icon based on disabled state
 *
 * @param {Object} settings - Object containing updated settings
 */
function updateIcon(settings) {
  if ('disabled' in settings) {
    if (settings.disabled) {
      chrome.browserAction.setIcon({ path: 'images/icon_disabled_38.png' });
    } else {
      chrome.browserAction.setIcon({ path: 'images/icon_38.png' });
    }
  }
}

// Register settings change listener
onSettingsChanged(updateIcon);
