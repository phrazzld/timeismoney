/**
 * Internal setup file for Vitest tests
 * This file is loaded by vitest.config.js for the internal test environment
 */

import { vi } from 'vitest';
import chromeMock, { resetChromeMocks } from '../mocks/chrome-api.mock.js';

// Make Chrome mock globally available
globalThis.chrome = chromeMock;

/**
 * Sets up common DOM elements for testing
 */
export const setupTestDom = (): void => {
  // Also set as global for backward compatibility
  globalThis.setupTestDom = setupTestDom;

  // Ensure document and body exist
  if (typeof document === 'undefined' || !document.body) {
    // If we're in a test environment where document isn't properly set up
    // Return without trying to manipulate the DOM
    return;
  }

  // Reset the document body before each test
  document.body.innerHTML = '';

  // Create status element used by many tests
  const statusElement = document.createElement('div');
  statusElement.id = 'status';
  document.body.appendChild(statusElement);

  // Create common form elements used in options tests
  const createFormElement = (id: string, type = 'text', value = ''): HTMLInputElement => {
    const element = document.createElement('input');
    element.id = id;
    element.type = type;
    element.value = value;
    document.body.appendChild(element);
    return element;
  };

  createFormElement('currency-symbol', 'text', '$');
  createFormElement('currency-code', 'text', 'USD');
  createFormElement('amount', 'text', '15.00');
  createFormElement('frequency', 'select', 'hourly');
  createFormElement('thousands', 'select', 'commas');
  createFormElement('decimal', 'select', 'dot');
  createFormElement('debounce-interval', 'number', '200');
  createFormElement('enable-dynamic-scanning', 'checkbox').checked = true;
  createFormElement('enable-debug-mode', 'checkbox').checked = false;
};

/**
 * Resets all mocks used in tests
 */
export const resetTestMocks = (): void => {
  // Also set as global for backward compatibility
  globalThis.resetTestMocks = resetTestMocks;
  vi.clearAllMocks();
  resetChromeMocks();
};

// Expose vi for test files
globalThis.vi = vi;
