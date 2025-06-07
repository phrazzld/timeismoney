/**
 * Settings Manager for content scripts
 * Handles initialization, updates, and visibility changes for extension settings
 *
 * @module content/settingsManager
 */

import { getSettings, onSettingsChanged } from '../utils/storage.js';
import * as logger from '../utils/logger.js';
import { DEFAULT_SETTINGS } from '../utils/constants.js';

/**
 * Tracks whether the extension is currently disabled on the page
 * This state is used to determine if conversions should be applied or reverted
 *
 * @type {boolean}
 * @private
 */
let disabledOnPage = true;

/**
 * Cached settings to avoid redundant Chrome storage calls
 *
 * @type {object|null}
 * @private
 */
let cachedSettings = null;

/**
 * Timestamp of last successful settings fetch
 *
 * @type {number}
 * @private
 */
let lastSettingsFetch = 0;

/**
 * Cache duration in milliseconds (5 seconds)
 *
 * @type {number}
 * @private
 */
const SETTINGS_CACHE_DURATION = 5000;

/**
 * Maximum consecutive storage failures before invalidating cache
 *
 * @type {number}
 * @private
 */
const MAX_CACHE_FAILURES = 3;

/**
 * Count of consecutive storage failures
 *
 * @type {number}
 * @private
 */
let consecutiveFailures = 0;

/**
 * Gets settings with caching to reduce Chrome storage calls
 *
 * @returns {Promise<object>} Promise that resolves to settings
 * @private
 */
function getCachedSettings() {
  const now = Date.now();

  // Return cached settings if still valid
  if (cachedSettings && now - lastSettingsFetch < SETTINGS_CACHE_DURATION) {
    return Promise.resolve(cachedSettings);
  }

  // Fetch fresh settings
  return getSettings()
    .then((settings) => {
      if (settings && typeof settings === 'object') {
        cachedSettings = { ...DEFAULT_SETTINGS, ...settings };
        lastSettingsFetch = now;
        consecutiveFailures = 0; // Reset failure count on success
        return cachedSettings;
      }
      throw new Error('Invalid settings received');
    })
    .catch((error) => {
      consecutiveFailures++;

      // After multiple consecutive failures, invalidate cache and use defaults
      if (consecutiveFailures >= MAX_CACHE_FAILURES) {
        logger.warn(
          `Storage failed ${consecutiveFailures} consecutive times, invalidating cache and using defaults:`,
          error.message
        );
        cachedSettings = null; // Invalidate cache
        lastSettingsFetch = 0;
        return { ...DEFAULT_SETTINGS };
      }

      // Return cached settings as fallback, or defaults if no cache
      if (cachedSettings) {
        logger.debug('Using cached settings due to storage error:', error.message);
        return cachedSettings;
      }

      // Use safe defaults
      logger.warn('Using default settings due to storage error:', error.message);
      cachedSettings = { ...DEFAULT_SETTINGS };
      return cachedSettings;
    });
}

/**
 * Resets the cache state for testing purposes
 *
 * @private
 */
function resetCacheState() {
  cachedSettings = null;
  lastSettingsFetch = 0;
  consecutiveFailures = 0;
}

/**
 * Invalidates the settings cache
 *
 * @private
 */
function invalidateSettingsCache() {
  cachedSettings = null;
  lastSettingsFetch = 0;
}

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
  try {
    // Check if document is valid and available
    if (!document || !document.body) {
      logger.warn('TimeIsMoney: Document or body not available in initSettings');
      return Promise.resolve({ disabled: true }); // Safely default to disabled
    }

    // Validate callback is a function
    if (typeof callback !== 'function') {
      logger.error('TimeIsMoney: Invalid callback passed to initSettings');
      return Promise.resolve({ disabled: true });
    }

    return getCachedSettings()
      .then((settings) => {
        // Validate settings
        if (!settings || typeof settings !== 'object') {
          logger.error('TimeIsMoney: Invalid settings object received in initSettings');
          return { disabled: true };
        }

        try {
          if (!settings.disabled) {
            callback(document.body, settings);
            disabledOnPage = false;
          } else {
            disabledOnPage = true;
          }
          return settings;
        } catch (callbackError) {
          logger.error('TimeIsMoney: Error in settings callback:', callbackError);
          disabledOnPage = true;
          return { ...settings, disabled: true }; // Safely disable if callback fails
        }
      })
      .catch((error) => {
        if (error && error.message === 'Extension context invalidated') {
          logger.debug('TimeIsMoney: Extension context invalidated during initSettings');
        } else {
          logger.error('TimeIsMoney: Storage operation failed:', error);
        }
        return { disabled: true }; // Safe default if settings can't be loaded
      });
  } catch (error) {
    logger.error('TimeIsMoney: Unexpected error in initSettings:', error);
    return Promise.resolve({ disabled: true }); // Safe default for any errors
  }
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
  try {
    // Validate callback is a function
    if (typeof callback !== 'function') {
      logger.error('TimeIsMoney: Invalid callback passed to onSettingsChange');
      return;
    }

    onSettingsChanged((updatedSettings) => {
      try {
        // Invalidate cache when settings change
        invalidateSettingsCache();

        // Validate document and body exist
        if (!document) {
          logger.warn('TimeIsMoney: Document not available in settings change handler');
          return;
        }

        // Validate updated settings
        if (!updatedSettings || typeof updatedSettings !== 'object') {
          logger.error('TimeIsMoney: Invalid settings object in onSettingsChanged');
          return;
        }

        // Only process if document is visible and relevant settings changed
        if (
          !document.hidden &&
          ('disabled' in updatedSettings || 'debounceIntervalMs' in updatedSettings)
        ) {
          try {
            // Ensure document.body exists before calling callback
            if (!document.body) {
              logger.warn('TimeIsMoney: Document body not available in settings change handler');
              return;
            }

            // Call the callback safely when disabled state or debounce interval changes
            callback(document.body, updatedSettings);

            // Update the disabled state if it was changed
            if ('disabled' in updatedSettings) {
              disabledOnPage = updatedSettings.disabled;
            }
          } catch (callbackError) {
            logger.error('TimeIsMoney: Error in settings change callback:', callbackError);
            // Continue execution, don't rethrow
          }
        }
      } catch (handlerError) {
        logger.error('TimeIsMoney: Error in settings change handler:', handlerError);
        // Continue execution, don't rethrow
      }
    });
  } catch (error) {
    logger.error('TimeIsMoney: Unexpected error in onSettingsChange:', error);
    // Continue execution, don't rethrow
  }
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
  try {
    // Validate callback is a function
    if (typeof callback !== 'function') {
      logger.error('TimeIsMoney: Invalid callback passed to handleVisibilityChange');
      return;
    }

    // Keep track of the last known debounce interval for comparison
    let lastKnownDebounceInterval = null;

    document.addEventListener(
      'visibilitychange',
      () => {
        try {
          // Skip if Chrome runtime is not valid
          if (!isValidChromeRuntime()) {
            logger.debug('TimeIsMoney: Extension context invalidated in visibility change handler');
            return;
          }

          // Only process when document becomes visible
          if (!document.hidden) {
            getCachedSettings()
              .then((settings) => {
                try {
                  // Validate settings
                  if (!settings || typeof settings !== 'object') {
                    logger.error('TimeIsMoney: Invalid settings in visibility change handler');
                    return;
                  }

                  // Check if important settings have changed
                  const disabledChanged = disabledOnPage !== settings.disabled;
                  const debounceChanged =
                    lastKnownDebounceInterval !== null &&
                    lastKnownDebounceInterval !== settings.debounceIntervalMs;

                  // Store current settings for future comparison
                  const previousDisabled = disabledOnPage;
                  disabledOnPage = !!settings.disabled; // Force boolean type
                  lastKnownDebounceInterval = settings.debounceIntervalMs;

                  if (disabledChanged || debounceChanged) {
                    // Log the change for debugging
                    if (disabledChanged) {
                      logger.debug(
                        `TimeIsMoney: Extension ${settings.disabled ? 'disabled' : 'enabled'} after visibility change`
                      );
                    }

                    // Ensure document.body exists before calling callback
                    if (!document.body) {
                      logger.warn(
                        'TimeIsMoney: Document body not available in visibility change handler'
                      );
                      return;
                    }

                    try {
                      // Process the page with the current settings
                      callback(document.body, settings);
                    } catch (callbackError) {
                      logger.error(
                        'TimeIsMoney: Error in visibility change callback:',
                        callbackError
                      );
                      // Revert state change if callback fails to avoid inconsistent state
                      disabledOnPage = previousDisabled;
                    }
                  }
                } catch (settingsError) {
                  logger.error(
                    'TimeIsMoney: Error processing settings in visibility change:',
                    settingsError
                  );
                }
              })
              .catch((error) => {
                if (error && error.message === 'Extension context invalidated') {
                  logger.debug(
                    'TimeIsMoney: Extension context invalidated during visibility change'
                  );
                } else {
                  logger.error(
                    'TimeIsMoney: Storage operation failed in visibility change:',
                    error
                  );
                }
              });
          }
        } catch (visibilityError) {
          logger.error('TimeIsMoney: Error in visibility change handler:', visibilityError);
          // Don't rethrow to allow page to continue functioning
        }
      },
      { passive: true }
    ); // Add passive flag for better performance
  } catch (setupError) {
    logger.error('TimeIsMoney: Error setting up visibility change listener:', setupError);
  }
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
 * Gets cached settings for use by other modules
 *
 * @returns {Promise<object>} Promise that resolves to cached settings
 */
export function getSettingsWithCache() {
  return getCachedSettings();
}

/**
 * Resets cache state for testing purposes
 *
 * @private
 */
export function resetCacheStateForTesting() {
  resetCacheState();
}

/**
 * Checks if the Chrome runtime is valid and accessible
 * Used to ensure the extension API is available before attempting to use it
 * Prevents errors when Chrome runtime becomes unavailable (e.g., during page unload or extension update)
 *
 * This is important because the Chrome extension context can become invalid in certain scenarios,
 * such as during navigation, extension updates, or when a tab is being closed.
 * Attempting to access APIs in an invalid context would throw errors.
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
