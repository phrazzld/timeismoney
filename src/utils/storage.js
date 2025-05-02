/**
 * Storage utility functions for managing extension settings
 * Provides a Promise-based wrapper around Chrome's storage API
 *
 * @module utils/storage
 */

import { DEFAULT_SETTINGS } from './constants.js';
import * as logger from './logger.js';

/**
 * Gets the current settings from Chrome storage
 *
 * @returns {Promise<object>} A promise that resolves to the settings object or rejects with an error
 * @throws Will reject the promise with chrome.runtime.lastError if the storage operation fails
 */
export function getSettings() {
  return new Promise((resolve, reject) => {
    try {
      // Check if Chrome runtime is valid before proceeding
      if (!isValidChromeRuntime()) {
        reject(new Error('Extension context invalidated'));
        return;
      }

      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        // Check inside callback in case context was invalidated during async operation
        if (!isValidChromeRuntime()) {
          reject(new Error('Extension context invalidated'));
          return;
        }

        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(items);
        }
      });
    } catch (error) {
      reject(new Error(`Failed to access storage: ${error.message}`));
    }
  });
}

/**
 * Saves new settings to Chrome storage
 *
 * @param {object} newSettings - The settings to save
 * @returns {Promise<void>} A promise that resolves when settings are saved or rejects with an error
 * @throws Will reject the promise with chrome.runtime.lastError if the storage operation fails
 */
export function saveSettings(newSettings) {
  return new Promise((resolve, reject) => {
    try {
      // Check if Chrome runtime is valid before proceeding
      if (!isValidChromeRuntime()) {
        reject(new Error('Extension context invalidated'));
        return;
      }

      chrome.storage.sync.set(newSettings, () => {
        // Check inside callback in case context was invalidated during async operation
        if (!isValidChromeRuntime()) {
          reject(new Error('Extension context invalidated'));
          return;
        }

        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(new Error(`Failed to save settings: ${error.message}`));
    }
  });
}

/**
 * Sets up a callback for storage changes
 * Registers a listener that will be called whenever stored settings change
 *
 * @param {Function} callback - Function to call when settings change
 * @param {object} callback.updated - Object containing the updated settings values
 * @returns {void}
 */
export function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    try {
      // Don't proceed if Chrome runtime is invalid
      if (!isValidChromeRuntime()) {
        return;
      }

      // Only process 'sync' storage changes
      if (areaName !== 'sync') {
        return;
      }

      const updated = {};
      for (const key in changes) {
        updated[key] = changes[key].newValue;
      }
      callback(updated);
    } catch (error) {
      logger.error('Error handling settings change:', error);
    }
  });
}

/**
 * Checks if the Chrome runtime is valid and accessible
 * Used to ensure the extension API is available before attempting to use it
 *
 * @returns {boolean} True if Chrome runtime and manifest are accessible, false otherwise
 * @private
 */
function isValidChromeRuntime() {
  try {
    return (
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      !!chrome.runtime.getManifest &&
      !!chrome.runtime.getManifest()
    );
  } catch (e) {
    return false;
  }
}
