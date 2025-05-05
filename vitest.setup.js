/**
 * Setup file for Vitest tests
 *
 * Provides DOM setup utilities and helpers for running tests with Vitest.
 * Includes functions to manage DOM elements and reset mock implementations.
 */

import { vi } from 'vitest';
import chromeMock from './src/__tests__/mocks/chrome-api.mock.js';

// Make chrome mock available globally
globalThis.chrome = chromeMock;

// Helper function to set up common DOM elements for tests
// This will be imported in test files that need it
/**
 * Sets up common DOM elements for testing
 *
 * Creates a standard set of form elements and DOM structure used
 * by multiple tests, ensuring consistent test environment
 *
 * @returns {void} Nothing is returned
 */
export const setupTestDom = () => {
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
  const createFormElement = (id, type = 'text', value = '') => {
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
};

/**
 * Resets all mocks between tests
 *
 * Clears all mock implementation data to ensure test isolation
 */
export const resetTestMocks = () => {
  vi.clearAllMocks();
};
