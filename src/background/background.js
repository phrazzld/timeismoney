import { getSettings, saveSettings, onSettingsChanged } from '../utils/storage.js';

/**
 * Event handler for action click
 * Opens the options page when user clicks the extension icon
 */
function handleActionClick() {
  chrome.runtime.openOptionsPage();
}

/**
 * Event handler for extension installation or update
 * Sets up default options and opens the options page
 * Preserves existing settings during updates
 *
 * @param {Object} details - Installation details from Chrome
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
  };

  // For new installations, use defaults
  if (details.reason === 'install') {
    saveSettings(defaultSettings).catch((error) => {
      console.error('Storage operation failed:', error);
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
        console.error('Storage operation failed:', error);
        // If we can't read settings, use defaults as fallback
        saveSettings(defaultSettings).catch((error) => {
          console.error('Storage operation failed:', error);
        });
      });
  }
}

// Register event listeners
chrome.action.onClicked.addListener(handleActionClick);
chrome.runtime.onInstalled.addListener(handleExtensionInstalled);

/**
 * Updates the extension icon based on disabled state
 *
 * @param {Object} settings - Object containing updated settings
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

// Register settings change listener
onSettingsChanged(updateIcon);

// Initialize icon on startup based on current settings
// In service workers, we need to do this when the worker starts
const initializeIcon = async () => {
  try {
    const settings = await getSettings();
    updateIcon({ disabled: settings.disabled });
  } catch (error) {
    console.error('Error initializing icon:', error);
  }
};

initializeIcon();

// Service worker lifecycle events
self.addEventListener('activate', () => {
  // Service worker activated
});

self.addEventListener('install', () => {
  self.skipWaiting(); // Ensure service worker activates immediately
});
