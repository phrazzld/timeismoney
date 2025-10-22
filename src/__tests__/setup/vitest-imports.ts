/**
 * Vitest import helper
 *
 * This file provides a centralized way to import all commonly used Vitest functions
 * to simplify the migration process from Jest to Vitest.
 *
 * Instead of importing directly from 'vitest' in each test file or relying on globals,
 * import from this file for consistency across the codebase.
 *
 * Example usage:
 * ```ts
 * import { describe, it, expect, vi, beforeEach } from '../../setup/vitest-imports.js';
 * ```
 *
 * For new tests, use this import pattern.
 * For migrated tests, replace individual imports or globals with imports from this file.
 *
 * @module vitest-imports
 */

/* eslint-disable import/named */
import {
  describe,
  it,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  type Mock,
  type MockInstance,
} from 'vitest';
/* eslint-enable import/named */

// Re-export all Vitest testing functions
export { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll };

// Re-export types
export type { Mock, MockInstance };

// Utility for resetting mocks between tests
export { resetTestMocks, setupTestDom } from '../../../vitest.setup.js';

// Chrome API mock helpers and scenarios
export { chromeScenarios, setupChromeApi, resetChromeMocks } from '../mocks/chrome-api.mock.js';

// Standardized mock factories and helpers
export {
  createStorageMock,
  createLoggerMock,
  createMoneyMock,
  createFsPromisesMock,
  createValidatorMock,
  mockScenarios,
  setupLoggerSpies,
  setupI18nMock,
} from '../mocks/module-mocks.js';

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
  convert: Mock;
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
 * Standardized vi.mock factory functions
 * These need to be called directly in vi.mock() callbacks to avoid import timing issues
 *
 * Example usage:
 * vi.mock('../../utils/storage.js', () => mockFactories.createStandardStorageMock());
 */
export const mockFactories = {
  /**
   * Creates a standard storage mock - use in vi.mock() callback
   */
  createStandardStorageMock: (): StorageMock => ({
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
    onSettingsChanged: vi.fn(() => () => {}),
  }),

  /**
   * Creates a standard logger mock - use in vi.mock() callback
   */
  createStandardLoggerMock: (): LoggerMock => ({
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
  }),

  /**
   * Creates a standard money.js mock - use in vi.mock() callback
   */
  createStandardMoneyMock: (): { default: MoneyMock } & MoneyMock => {
    const mock: MoneyMock = {
      rates: { USD: 1, EUR: 0.85, GBP: 0.73 },
      base: 'USD',
      convert: vi.fn((amount: number, options?: { from?: string; to?: string }) => {
        const { from = 'USD', to = 'USD' } = options || {};
        if (from === to) return amount;
        const rates: Record<string, number> = { USD: 1, EUR: 0.85, GBP: 0.73 };
        return (amount / rates[from]) * rates[to];
      }),
    };
    return { default: mock, ...mock };
  },

  /**
   * Creates a standard fs/promises mock - use in vi.mock() callback
   */
  createStandardFsPromisesMock: (): { default: FsPromisesMock } & FsPromisesMock => {
    const mockFunctions: FsPromisesMock = {
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
    return { default: mockFunctions, ...mockFunctions };
  },

  /**
   * Creates a standard validator mock - use in vi.mock() callback
   */
  createStandardValidatorMock: (): ValidatorMock => ({
    validateCurrencySymbol: vi.fn(() => true),
    validateCurrencyCode: vi.fn(() => true),
    validateAmount: vi.fn(() => true),
    validateDebounceInterval: vi.fn(() => true),
  }),
};

/**
 * Creates a spy on an object's method, similar to jest.spyOn
 */
export const spyOn = vi.spyOn;

/**
 * Creates a mock function, similar to jest.fn
 */
export const fn = vi.fn;

/**
 * Mocks a module, similar to jest.mock
 */
export const mock = vi.mock;

/**
 * Removes a previously created mock, similar to jest.unmock
 */
export const unmock = vi.unmock;

/**
 * Jest compatibility layer for easy migration
 *
 * This object provides Jest-compatible methods using Vitest underneath.
 * It's useful for tests that haven't been fully migrated yet.
 *
 * Eventually, direct use of this object should be replaced with
 * proper Vitest imports.
 */
export const jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  unmock: vi.unmock,
  resetAllMocks: vi.resetAllMocks,
  clearAllMocks: vi.clearAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  resetModules: vi.resetModules,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
  runAllTimers: () => vi.runAllTimers(),
  runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
};
