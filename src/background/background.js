/**
 * Background script for the Time Is Money extension.
 * Handles extension lifecycle events, icon updates, and user interactions.
 *
 * @module background/background
 */

import { getSettings, saveSettings, onSettingsChanged } from '../utils/storage.js';

/**
 * Event handler for action click
 * Opens the options page when user clicks the extension icon
 *
 * @returns {void}
 */
function handleActionClick() {
  chrome.runtime.openOptionsPage();
}

/**
 * Event handler for extension installation or update
 * Sets up default options and opens the options page
 * Preserves existing settings during updates
 *
 * @param {object} details - Installation details from Chrome
 * @param {string} details.reason - Reason for installation ('install' or 'update')
 */
function handleExtensionInstalled(details) {
  chrome.runtime.openOptionsPage();

  // Default settings
  const defaultSettings = {
    disabled: false,
    currencySymbol: '$',
    currencyCode: 'USD',
    frequency: 'hourly',
    amount: '15.00',
    thousands: 'commas',
    decimal: 'dot',
    debounceIntervalMs: 200, // Default debounce interval for MutationObserver
  };

  // For new installations, use defaults
  if (details.reason === 'install') {
    saveSettings(defaultSettings).catch((error) => {
      console.error('Failed to save default settings on extension install:', error);
    });
    return;
  }

  // For updates, preserve existing settings
  if (details.reason === 'update') {
    getSettings()
      .then((existingSettings) => {
        // Create a merged settings object
        const mergedSettings = {};

        // Only fill in values that don't exist
        for (const key in defaultSettings) {
          mergedSettings[key] =
            existingSettings[key] !== undefined ? existingSettings[key] : defaultSettings[key];
        }

        // Only save if there are differences
        if (JSON.stringify(existingSettings) !== JSON.stringify(mergedSettings)) {
          return saveSettings(mergedSettings);
        }
      })
      .catch((error) => {
        console.error('Failed to read existing settings during extension update:', error);
        // If we can't read settings, use defaults as fallback
        saveSettings(defaultSettings).catch((failError) => {
          console.error(
            'Failed to save default settings after read error during update:',
            failError
          );
        });
      });
  }
}

/**
 * Registers core extension event listeners
 * Sets up handlers for extension lifecycle events
 *
 * @returns {void}
 */
function registerEventListeners() {
  chrome.action.onClicked.addListener(handleActionClick);
  chrome.runtime.onInstalled.addListener(handleExtensionInstalled);
}

// Initialize event listeners
registerEventListeners();

/**
 * Updates the extension icon based on disabled state
 *
 * @param {object} settings - Object containing updated settings
 * @param {boolean} [settings.disabled] - Whether the extension is disabled
 * @returns {void}
 */
function updateIcon(settings) {
  if ('disabled' in settings) {
    if (settings.disabled) {
      chrome.action.setIcon({ path: '/images/icon_disabled_38.png' });
    } else {
      chrome.action.setIcon({ path: '/images/icon_38.png' });
    }
  }
}

/**
 * Sets up a listener for settings changes to update the icon accordingly
 *
 * @returns {void}
 */
function registerSettingsListener() {
  onSettingsChanged(updateIcon);
}

// Register settings change listener
registerSettingsListener();

/**
 * Initializes the extension icon on startup based on current settings
 * In service workers, we need to do this when the worker starts
 *
 * @returns {Promise<void>} Promise that resolves when icon is initialized
 * @throws {Error} If there's an error retrieving settings
 */
const initializeIcon = async () => {
  try {
    const settings = await getSettings();
    updateIcon({ disabled: settings.disabled });
  } catch (error) {
    console.error('Failed to initialize extension icon due to storage error:', error);
  }
};

// Start icon initialization
initializeIcon();

/**
 * Sets up service worker lifecycle event handlers
 *
 * @returns {void}
 */
function setupServiceWorkerEvents() {
  self.addEventListener('activate', () => {
    // Service worker activated
  });

  self.addEventListener('install', () => {
    self.skipWaiting(); // Ensure service worker activates immediately
  });
}

// Set up service worker events
setupServiceWorkerEvents();
