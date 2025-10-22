/**
 * Browser API centralized mock
 *
 * This file provides standardized mock implementations for browser APIs
 * like window, document, and performance that can be imported and used across tests.
 *
 * @module browser-api.mock
 */

import { vi, type Mock } from 'vitest';

interface MockClassList {
  add: Mock;
  remove: Mock;
  contains: Mock<[token: string], boolean>;
}

interface MockElement {
  id: string;
  value: string;
  textContent: string;
  innerHTML: string;
  style: Record<string, any>;
  classList: MockClassList;
  querySelector: Mock<[selectors: string], Element | null>;
  querySelectorAll: Mock<[selectors: string], NodeListOf<Element> | Element[]>;
  appendChild: Mock;
  tagName?: string;
  setAttribute?: Mock;
  getAttribute?: Mock;
  addEventListener?: Mock;
}

interface DocumentMock {
  getElementById: Mock<[id: string], MockElement | null>;
  addEventListener: Mock<[type: string, listener: EventListener], void>;
  createElement: Mock<[tagName: string], MockElement>;
  body: {
    appendChild: Mock;
    removeChild: Mock;
    querySelector: Mock<[selectors: string], Element | null>;
    querySelectorAll: Mock<[selectors: string], NodeListOf<Element> | Element[]>;
  };
}

interface WindowMock {
  close: Mock;
  addEventListener: Mock<[type: string, listener: EventListener], void>;
}

interface PerformanceEntry {
  duration: number;
}

interface PerformanceMock {
  mark: Mock<[name: string], void>;
  measure: Mock<[name: string, startMark?: string, endMark?: string], void>;
  getEntriesByName: Mock<[name: string], PerformanceEntry[]>;
  clearMarks: Mock<[name?: string], void>;
  clearMeasures: Mock<[name?: string], void>;
}

interface BrowserMock {
  document: DocumentMock;
  window: WindowMock;
  performance: PerformanceMock;
}

/**
 * Document API mock
 * Provides mock implementation of commonly used document methods
 */
const documentMock: DocumentMock = {
  getElementById: vi.fn<[id: string], MockElement>((id) => {
    // Default implementation returns a minimal element-like object
    // Tests can override this with custom mock elements as needed
    return {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false),
      },
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      appendChild: vi.fn(),
    };
  }),

  addEventListener: vi.fn(),

  createElement: vi.fn<[tagName: string], MockElement>((tagName) => {
    return {
      id: '',
      tagName: tagName.toUpperCase(),
      textContent: '',
      innerHTML: '',
      value: '',
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false),
      },
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
    };
  }),

  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
  },
};

/**
 * Window API mock
 * Provides mock implementation of commonly used window methods
 */
const windowMock: WindowMock = {
  close: vi.fn(),
  addEventListener: vi.fn(),
};

/**
 * Performance API mock
 * Provides mock implementation of performance measurement methods
 */
const performanceMock: PerformanceMock = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => [{ duration: 100 }]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

/**
 * Complete Browser API mock object
 */
const browserMock: BrowserMock = {
  document: documentMock,
  window: windowMock,
  performance: performanceMock,
};

/**
 * Resets all Browser API mocks to their default state
 * Call this in beforeEach to ensure clean state between tests
 */
export const resetBrowserMocks = (): void => {
  // Reset all function mocks
  vi.clearAllMocks();
};

export default browserMock;
