import { getSettings, onSettingsChanged } from '../utils/storage.js';

// Track the disabled state on the current page
let disabledOnPage = true;

/**
 * Initializes settings and applies them to the page if needed
 *
 * @param {Function} callback - Function to call with current settings and to process page when needed
 * @returns {Promise<Object>} Promise that resolves to the current settings
 */
export function initSettings(callback) {
  return getSettings().then((settings) => {
    if (!settings.disabled) {
      callback(document.body, settings);
      disabledOnPage = false;
    } else {
      disabledOnPage = true;
    }
    return settings;
  });
}

/**
 * Sets up a listener for settings changes
 *
 * @param {Function} callback - Function to call when settings change
 */
export function onSettingsChange(callback) {
  onSettingsChanged((updatedSettings) => {
    if ('disabled' in updatedSettings && !document.hidden) {
      console.debug('Running on detected change...');
      callback(document.body, updatedSettings);
      disabledOnPage = updatedSettings.disabled;
    }
  });
}

/**
 * Handles visibility change events (tab changes)
 *
 * @param {Function} callback - Function to call to process the page when settings changed
 */
export function handleVisibilityChange(callback) {
  document.addEventListener('visibilitychange', () => {
    if (!isValidChromeRuntime()) {
      console.log(
        `Run time is invalid! Please reload the page for the extension to work properly again...`
      );
    } else if (!document.hidden) {
      getSettings().then((settings) => {
        if (disabledOnPage !== settings.disabled) {
          console.debug('Running on visibility change...');
          callback(document.body, settings);
          disabledOnPage = settings.disabled;
        }
      });
    }
  });
}

/**
 * Gets the current disabled state on the page
 *
 * @returns {boolean} True if the extension is disabled on the current page
 */
export function isDisabled() {
  return disabledOnPage;
}

/**
 * Checks if the Chrome runtime is valid and accessible
 *
 * @returns {boolean} True if Chrome runtime and manifest are accessible, false otherwise
 */
function isValidChromeRuntime() {
  try {
    return chrome.runtime && !!chrome.runtime.getManifest();
  } catch (e) {
    return false;
  }
}
