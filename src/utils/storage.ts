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
 */
export function getSettings(): Promise<typeof DEFAULT_SETTINGS> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      // Check if Chrome runtime is valid before proceeding
      if (!isValidChromeRuntime()) {
        reject(new Error('Extension context invalidated'));
        return;
      }

      // Add timeout to prevent hanging storage calls
      timeoutId = setTimeout(() => {
        reject(new Error('Storage operation timed out'));
      }, 3000);

      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        clearTimeout(timeoutId);

        // Check inside callback in case context was invalidated during async operation
        if (!isValidChromeRuntime()) {
          reject(new Error('Extension context invalidated'));
          return;
        }

        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(items as typeof DEFAULT_SETTINGS);
        }
      });
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      const err = error as Error;
      reject(new Error(`Failed to access storage: ${err.message}`));
    }
  });
}

/**
 * Saves new settings to Chrome storage
 */
export function saveSettings(newSettings: Partial<typeof DEFAULT_SETTINGS>): Promise<void> {
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
      const err = error as Error;
      reject(new Error(`Failed to save settings: ${err.message}`));
    }
  });
}

/**
 * Sets up a callback for storage changes
 * Registers a listener that will be called whenever stored settings change
 */
export function onSettingsChanged(
  callback: (updated: Partial<typeof DEFAULT_SETTINGS>) => void
): void {
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

      const updated: Partial<typeof DEFAULT_SETTINGS> = {};
      for (const key in changes) {
        updated[key as keyof typeof DEFAULT_SETTINGS] = changes[key].newValue;
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
 */
function isValidChromeRuntime(): boolean {
  try {
    return (
      typeof chrome !== 'undefined' &&
      chrome.runtime &&
      !!chrome.runtime.getManifest &&
      !!chrome.runtime.getManifest()
    );
  } catch {
    return false;
  }
}
