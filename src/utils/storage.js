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
 * @returns {Promise<Object>} A promise that resolves to the settings object
 */
export function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, (items) => resolve(items));
  });
}

/**
 * Saves new settings to Chrome storage
 *
 * @param {Object} newSettings - The settings to save
 * @returns {Promise<void>} A promise that resolves when settings are saved
 */
export function saveSettings(newSettings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(newSettings, () => resolve());
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