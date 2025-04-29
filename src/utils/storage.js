/**
 * Storage utility functions for managing extension settings
 * Provides a Promise-based wrapper around Chrome's storage API
 *
 * @module utils/storage
 */

import { DEFAULT_SETTINGS } from './constants.js';

/**
 * Gets the current settings from Chrome storage
 *
 * @returns {Promise<object>} A promise that resolves to the settings object or rejects with an error
 * @throws Will reject the promise with chrome.runtime.lastError if the storage operation fails
 */
export function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
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
 * @param {object} newSettings - The settings to save
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
 * @param {object} callback.updated - Object containing the updated settings values
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
