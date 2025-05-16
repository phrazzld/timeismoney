/**
 * Sample Jest test file with complex mocks
 */

// Mock modules
vi.mock('../../src/utils/storage.js', () => ({
  getSettings: vi.fn().mockResolvedValue({
    currency: 'USD',
    rate: 1.0,
    showOriginal: true,
  }),
  saveSettings: vi.fn().mockResolvedValue(true),
}));

// Mock with factory function and implementation
vi.mock('../../src/utils/parser.js', () => {
  return {
    parsePrice: vi.fn().mockImplementation((price) => {
      if (!price) return null;
      const match = price.match(/\d+(\.\d+)?/);
      return match ? parseFloat(match[0]) : null;
    }),
    formatPrice: vi.fn().mockImplementation((value, currency) => {
      return `${currency} ${value.toFixed(2)}`;
    }),
  };
});

// Import the mocked modules
import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from '../../src/__tests__/setup/vitest-imports.js';
import { resetTestMocks } from '../../vitest.setup.js';
import * as storage from '../../src/utils/storage.js';
import * as parser from '../../src/utils/parser.js';
import { loadForm, saveOptions } from '../../src/options/formHandler.js';

describe('Complex Mocks Sample', () => {
  beforeEach(() => {
    resetTestMocks();

    // Set up DOM for testing
    document.body.innerHTML = `
      <form id="options-form">
        <input type="text" id="currency" value="EUR">
        <input type="number" id="rate" value="1.2">
        <input type="checkbox" id="show-original" checked>
        <button id="save">Save</button>
        <div id="status"></div>
      </form>
    `;
  });

  test('loadForm uses mocked storage module', async () => {
    // Call the function that uses the mocked module
    await loadForm();

    // Verify the mock was called
    expect(storage.getSettings).toHaveBeenCalled();

    // Verify DOM was updated with the mock data
    expect(document.getElementById('currency').value).toBe('USD');
    expect(document.getElementById('rate').value).toBe('1');
    expect(document.getElementById('show-original').checked).toBe(true);
  });

  test('saveOptions uses mocked modules', async () => {
    // Call the function that uses the mocked modules
    await saveOptions();

    // Verify the mocks were called with expected arguments
    expect(storage.saveSettings).toHaveBeenCalledWith({
      currency: 'EUR',
      rate: 1.2,
      showOriginal: true,
    });

    // Verify success message
    expect(document.getElementById('status').textContent).toBe('Options saved.');
  });

  test('parser module mock implementation works', () => {
    // Test the mocked implementation
    expect(parser.parsePrice('$12.34')).toBe(12.34);
    expect(parser.parsePrice('Invalid')).toBe(null);
    expect(parser.formatPrice(10.5, 'EUR')).toBe('EUR 10.50');
  });
});
