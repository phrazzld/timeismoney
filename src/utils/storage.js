/**
 * Storage utility functions for managing extension settings
 * Provides a Promise-based wrapper around Chrome's storage API
 * @module utils/storage
 */

/**
 * Default settings for the extension
 * These values are used when no user settings are found
 *
 * @type {Object}
 */
const DEFAULTS = {
  amount: 30,
  frequency: 'hourly',
  currencySymbol: '$',
  currencyCode: 'USD',
  thousands: 'commas',
  decimal: 'dot',
  disabled: false,
};

/**
 * Gets the current settings from Chrome storage
 *
 * @returns {Promise<Object>} A promise that resolves to the settings object or rejects with an error
 * @throws Will reject the promise with chrome.runtime.lastError if the storage operation fails
 */
export function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(DEFAULTS, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(items);
      }
    });
  });
}

/**
 * Saves new settings to Chrome storage
 *
 * @param {Object} newSettings - The settings to save
 * @returns {Promise<void>} A promise that resolves when settings are saved or rejects with an error
 * @throws Will reject the promise with chrome.runtime.lastError if the storage operation fails
 */
export function saveSettings(newSettings) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(newSettings, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Sets up a callback for storage changes
 * Registers a listener that will be called whenever stored settings change
 *
 * @param {Function} callback - Function to call when settings change
 * @param {Object} callback.updated - Object containing the updated settings values
 * @returns {void}
 */
export function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes) => {
    const updated = {};
    for (const key in changes) {
      updated[key] = changes[key].newValue;
    }
    callback(updated);
  });
}
