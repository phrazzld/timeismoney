/**
 * Settings Manager for content scripts
 * Handles initialization, updates, and visibility changes for extension settings
 *
 * @module content/settingsManager
 */

import { getSettings, onSettingsChanged } from '../utils/storage.js';

/**
 * Tracks whether the extension is currently disabled on the page
 * This state is used to determine if conversions should be applied or reverted
 *
 * @type {boolean}
 * @private
 */
let disabledOnPage = true;

/**
 * Initializes settings and applies them to the page if needed
 * Fetches settings and calls the provided callback if the extension is enabled
 *
 * @param {Function} callback - Function to call with current settings and DOM root
 * @param {Node} callback.root - The root DOM node (usually document.body)
 * @param {object} callback.settings - Current extension settings
 * @returns {Promise<object>} Promise that resolves to the current settings
 * @throws {Error} Will throw if there's an issue fetching settings (handled in catch block)
 */
export function initSettings(callback) {
  return getSettings()
    .then((settings) => {
      if (!settings.disabled) {
        callback(document.body, settings);
        disabledOnPage = false;
      } else {
        disabledOnPage = true;
      }
      return settings;
    })
    .catch((error) => {
      console.error('Storage operation failed:', error);
      return { disabled: true }; // Safe default if settings can't be loaded
    });
}

/**
 * Sets up a listener for settings changes
 * Registers a handler that reacts to changes in the extension's settings
 * Focused on the 'disabled' state changes and performance-related settings like debounceIntervalMs
 *
 * @param {Function} callback - Function to call when settings change
 * @param {Node} callback.root - The root DOM node (usually document.body)
 * @param {object} callback.updatedSettings - Object containing the updated settings
 * @returns {void}
 */
export function onSettingsChange(callback) {
  onSettingsChanged((updatedSettings) => {
    if (
      !document.hidden &&
      ('disabled' in updatedSettings || 'debounceIntervalMs' in updatedSettings)
    ) {
      // Call the callback when disabled state or debounce interval changes
      callback(document.body, updatedSettings);

      // Update the disabled state if it was changed
      if ('disabled' in updatedSettings) {
        disabledOnPage = updatedSettings.disabled;
      }
    }
  });
}

/**
 * Handles visibility change events (tab changes)
 * Re-applies settings when a tab becomes visible if important settings have changed
 * Ensures consistent behavior when users switch between tabs
 *
 * @param {Function} callback - Function to call to process the page when settings changed
 * @param {Node} callback.root - The root DOM node (usually document.body)
 * @param {object} callback.settings - Current extension settings
 * @returns {void}
 */
export function handleVisibilityChange(callback) {
  // Keep track of the last known debounce interval for comparison
  let lastKnownDebounceInterval = null;

  document.addEventListener('visibilitychange', () => {
    if (!isValidChromeRuntime()) {
      // Error log removed - consider adding proper error handling in the future
      // or using chrome.runtime.lastError
    } else if (!document.hidden) {
      getSettings()
        .then((settings) => {
          // Check if important settings have changed
          const disabledChanged = disabledOnPage !== settings.disabled;
          const debounceChanged =
            lastKnownDebounceInterval !== null &&
            lastKnownDebounceInterval !== settings.debounceIntervalMs;

          if (disabledChanged || debounceChanged) {
            // Update the tracked settings
            disabledOnPage = settings.disabled;
            lastKnownDebounceInterval = settings.debounceIntervalMs;

            // Process the page with the current settings
            callback(document.body, settings);
          } else {
            // Always update the tracked debounce interval even if we don't call the callback
            lastKnownDebounceInterval = settings.debounceIntervalMs;
          }
        })
        .catch((error) => {
          console.error('Storage operation failed:', error);
        });
    }
  });
}

/**
 * Gets the current disabled state on the page
 * Accessor for the private disabledOnPage state variable
 *
 * @returns {boolean} True if the extension is disabled on the current page
 */
export function isDisabled() {
  return disabledOnPage;
}

/**
 * Checks if the Chrome runtime is valid and accessible
 * Used to ensure the extension API is available before attempting to use it
 * Prevents errors when Chrome runtime becomes unavailable
 *
 * @returns {boolean} True if Chrome runtime and manifest are accessible, false otherwise
 * @private
 */
function isValidChromeRuntime() {
  try {
    return chrome.runtime && !!chrome.runtime.getManifest();
  } catch (e) {
    return false;
  }
}
