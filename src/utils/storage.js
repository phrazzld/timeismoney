/**
 * Default settings for the extension
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
 *
 * @param {Function} callback - Function to call when settings change
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
