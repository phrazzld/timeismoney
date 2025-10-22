/**
 * Standardized Node.js module mocks
 *
 * This file provides reusable mock factories for commonly mocked modules
 * to ensure consistency across test files and reduce code duplication.
 *
 * @module mocks/module-mocks
 */

import { vi, type Mock, type SpyInstance } from 'vitest';

interface StorageMock {
  getSettings: Mock;
  saveSettings: Mock;
  onSettingsChanged: Mock;
}

interface LoggerMock {
  debug: Mock;
  info: Mock;
  warn: Mock;
  error: Mock;
  LOG_LEVEL: {
    DEBUG: number;
    INFO: number;
    WARN: number;
    ERROR: number;
  };
}

interface MoneyMock {
  rates: Record<string, number>;
  base: string;
  convert: Mock<[amount: number, options?: { from?: string; to?: string }], number>;
}

interface FsPromisesMock {
  readFile: Mock;
  writeFile: Mock;
  access: Mock;
  constants: {
    F_OK: number;
    R_OK: number;
    W_OK: number;
    X_OK: number;
  };
}

interface ValidatorMock {
  validateCurrencySymbol: Mock;
  validateCurrencyCode: Mock;
  validateAmount: Mock;
  validateDebounceInterval: Mock;
}

/**
 * Creates a standardized mock for the storage utility module
 */
export const createStorageMock = (overrides: Partial<StorageMock> = {}): StorageMock => {
  const defaultMocks: StorageMock = {
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
 */
export const createLoggerMock = (overrides: Partial<LoggerMock> = {}): LoggerMock => {
  const defaultMocks: LoggerMock = {
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
 */
export const createMoneyMock = (
  overrides: Partial<MoneyMock> = {}
): { default: MoneyMock } & MoneyMock => {
  const defaultMock: MoneyMock = {
    rates: {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
    },
    base: 'USD',
    convert: vi.fn((amount: number, options?: { from?: string; to?: string }) => {
      // Simple mock conversion logic
      const { from = 'USD', to = 'USD' } = options || {};
      if (from === to) return amount;
      // Mock conversion rates
      const rates: Record<string, number> = { USD: 1, EUR: 0.85, GBP: 0.73 };
      return (amount / rates[from]) * rates[to];
    }),
  };

  const mock = { ...defaultMock, ...overrides };

  return {
    default: mock,
    ...mock,
  };
};

/**
 * Creates a standardized mock for fs/promises module
 */
export const createFsPromisesMock = (
  overrides: Partial<FsPromisesMock> = {}
): { default: FsPromisesMock } & FsPromisesMock => {
  const defaultMocks: FsPromisesMock = {
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
 */
export const createValidatorMock = (overrides: Partial<ValidatorMock> = {}): ValidatorMock => {
  const defaultMocks: ValidatorMock = {
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
   */
  storageError: (): StorageMock =>
    createStorageMock({
      getSettings: vi.fn(() => Promise.reject(new Error('Storage error'))),
      saveSettings: vi.fn(() => Promise.reject(new Error('Storage save error'))),
    }),

  /**
   * Network error scenario - storage operations fail with network errors
   */
  networkError: (): StorageMock =>
    createStorageMock({
      getSettings: vi.fn(() => Promise.reject(new Error('Network error: ERR_DISCONNECTED'))),
      saveSettings: vi.fn(() => Promise.reject(new Error('Network error: ERR_DISCONNECTED'))),
    }),

  /**
   * Quota exceeded scenario - storage operations fail due to quota limits
   */
  quotaExceeded: (): StorageMock =>
    createStorageMock({
      getSettings: vi.fn(() => Promise.reject(new Error('QUOTA_BYTES quota exceeded'))),
      saveSettings: vi.fn(() => Promise.reject(new Error('QUOTA_BYTES quota exceeded'))),
    }),

  /**
   * Validation failure scenario - all validation functions return false
   */
  validationFailure: (): ValidatorMock =>
    createValidatorMock({
      validateCurrencySymbol: vi.fn(() => false),
      validateCurrencyCode: vi.fn(() => false),
      validateAmount: vi.fn(() => false),
      validateDebounceInterval: vi.fn(() => false),
    }),
};

interface LoggerSpies {
  debugSpy: SpyInstance;
  infoSpy: SpyInstance;
  warnSpy: SpyInstance;
  errorSpy: SpyInstance;
}

/**
 * Helper to setup standard spies on logger methods
 * Use this in beforeEach when you need to spy on logger without mocking the entire module
 */
export const setupLoggerSpies = (logger: LoggerMock): LoggerSpies => {
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
 */
export const setupI18nMock = (messages: Record<string, string> = {}): Mock => {
  const defaultMessages: Record<string, string> = {
    loadError: 'Failed to load your settings. Please try again.',
    saveError: 'Failed to save your settings. Please try again.',
    saveSuccess: 'Options saved.',
    advShow: 'Show Advanced',
    advHide: 'Hide Advanced',
  };

  const allMessages = { ...defaultMessages, ...messages };

  const getMock = vi.fn((key: string) => allMessages[key] || key);
  (chrome.i18n as any).getMessage = getMock;
  return getMock;
};
