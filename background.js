/**
 * @deprecated Use src/background/background.js instead
 * This file is kept for historical reference only and will be removed in a future update.
 *
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
  chrome.storage.sync.set({
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
 * Event handler for storage changes
 * Updates the extension icon based on disabled state
 *
 * @param {Object} changes - Object mapping each changed key to its old and new values
 */
chrome.storage.onChanged.addListener((changes) => {
  if (changes.disabled) {
    if (changes.disabled.newValue) {
      chrome.browserAction.setIcon({ path: 'src/images/icon_disabled_38.png' });
    } else {
      chrome.browserAction.setIcon({ path: 'src/images/icon_38.png' });
    }
  }
});
