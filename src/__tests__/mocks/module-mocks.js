/**
 * Standardized Node.js module mocks
 *
 * This file provides reusable mock factories for commonly mocked modules
 * to ensure consistency across test files and reduce code duplication.
 *
 * @module mocks/module-mocks
 */

import { vi } from 'vitest';

/**
 * Creates a standardized mock for the storage utility module
 *
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock storage module
 */
export const createStorageMock = (overrides = {}) => {
  const defaultMocks = {
    getSettings: vi.fn(() =>
      Promise.resolve({
        amount: '15.00',
        frequency: 'hourly',
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: ',',
        decimal: '.',
        debounceIntervalMs: 200,
        enableDynamicScanning: true,
        debugMode: false,
        disabled: false,
      })
    ),
    saveSettings: vi.fn(() => Promise.resolve()),
    onSettingsChanged: vi.fn(() => {
      // Return an unsubscribe function
      return () => {};
    }),
  };

  return {
    ...defaultMocks,
    ...overrides,
  };
};

/**
 * Creates a standardized mock for the logger utility module
 *
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock logger module
 */
export const createLoggerMock = (overrides = {}) => {
  const defaultMocks = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    LOG_LEVEL: {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    },
  };

  return {
    ...defaultMocks,
    ...overrides,
  };
};

/**
 * Creates a standardized mock for the money.js library
 *
 * @param {object} overrides - Optional property overrides
 * @returns {object} Mock money.js module
 */
export const createMoneyMock = (overrides = {}) => {
  const defaultMock = {
    rates: {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
    },
    base: 'USD',
    convert: vi.fn((amount, options) => {
      // Simple mock conversion logic
      const { from = 'USD', to = 'USD' } = options || {};
      if (from === to) return amount;
      // Mock conversion rates
      const rates = { USD: 1, EUR: 0.85, GBP: 0.73 };
      return (amount / rates[from]) * rates[to];
    }),
  };

  return {
    default: { ...defaultMock, ...overrides },
    ...defaultMock,
    ...overrides,
  };
};

/**
 * Creates a standardized mock for fs/promises module
 *
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock fs/promises module
 */
export const createFsPromisesMock = (overrides = {}) => {
  const defaultMocks = {
    readFile: vi.fn(() => Promise.resolve('{"vulnerabilities": []}')),
    writeFile: vi.fn(() => Promise.resolve()),
    access: vi.fn(() => Promise.resolve()),
    constants: {
      F_OK: 0,
      R_OK: 4,
      W_OK: 2,
      X_OK: 1,
    },
  };

  const mocks = {
    ...defaultMocks,
    ...overrides,
  };

  return {
    default: mocks,
    ...mocks,
  };
};

/**
 * Creates a standardized mock for validator module
 *
 * @param {object} overrides - Optional method overrides
 * @returns {object} Mock validator module
 */
export const createValidatorMock = (overrides = {}) => {
  const defaultMocks = {
    validateCurrencySymbol: vi.fn(() => true),
    validateCurrencyCode: vi.fn(() => true),
    validateAmount: vi.fn(() => true),
    validateDebounceInterval: vi.fn(() => true),
  };

  return {
    ...defaultMocks,
    ...overrides,
  };
};

/**
 * Factory for creating mock scenarios for common test patterns
 */
export const mockScenarios = {
  /**
   * Storage error scenario - all storage operations fail
   *
   * @returns {object} Storage mock with error behaviors
   */
  storageError: () =>
    createStorageMock({
      getSettings: vi.fn(() => Promise.reject(new Error('Storage error'))),
      saveSettings: vi.fn(() => Promise.reject(new Error('Storage save error'))),
    }),

  /**
   * Network error scenario - storage operations fail with network errors
   *
   * @returns {object} Storage mock with network error behaviors
   */
  networkError: () =>
    createStorageMock({
      getSettings: vi.fn(() => Promise.reject(new Error('Network error: ERR_DISCONNECTED'))),
      saveSettings: vi.fn(() => Promise.reject(new Error('Network error: ERR_DISCONNECTED'))),
    }),

  /**
   * Quota exceeded scenario - storage operations fail due to quota limits
   *
   * @returns {object} Storage mock with quota error behaviors
   */
  quotaExceeded: () =>
    createStorageMock({
      getSettings: vi.fn(() => Promise.reject(new Error('QUOTA_BYTES quota exceeded'))),
      saveSettings: vi.fn(() => Promise.reject(new Error('QUOTA_BYTES quota exceeded'))),
    }),

  /**
   * Validation failure scenario - all validation functions return false
   *
   * @returns {object} Validator mock with failure behaviors
   */
  validationFailure: () =>
    createValidatorMock({
      validateCurrencySymbol: vi.fn(() => false),
      validateCurrencyCode: vi.fn(() => false),
      validateAmount: vi.fn(() => false),
      validateDebounceInterval: vi.fn(() => false),
    }),
};

/**
 * Helper to setup standard spies on logger methods
 * Use this in beforeEach when you need to spy on logger without mocking the entire module
 *
 * @param {object} logger - The logger module to spy on
 * @returns {object} Object containing the spy references
 */
export const setupLoggerSpies = (logger) => {
  return {
    debugSpy: vi.spyOn(logger, 'debug').mockImplementation(() => {}),
    infoSpy: vi.spyOn(logger, 'info').mockImplementation(() => {}),
    warnSpy: vi.spyOn(logger, 'warn').mockImplementation(() => {}),
    errorSpy: vi.spyOn(logger, 'error').mockImplementation(() => {}),
  };
};

/**
 * Helper to setup standard Chrome i18n mock
 * Use this in beforeEach when you need specific i18n message behavior
 *
 * @param {object} messages - Message key-value pairs
 * @returns {Function} The mock getMessage function
 */
export const setupI18nMock = (messages = {}) => {
  const defaultMessages = {
    loadError: 'Failed to load your settings. Please try again.',
    saveError: 'Failed to save your settings. Please try again.',
    saveSuccess: 'Options saved.',
    advShow: 'Show Advanced',
    advHide: 'Hide Advanced',
  };

  const allMessages = { ...defaultMessages, ...messages };

  const getMock = vi.fn((key) => allMessages[key] || key);
  chrome.i18n.getMessage = getMock;
  return getMock;
};
