# Testing Guide for Time Is Money

This comprehensive guide consolidates all testing documentation for the Time Is Money Chrome extension, providing a single source of truth for Vitest testing best practices, patterns, and configuration.

## Table of Contents

1. [Introduction](#introduction)
2. [Setup & Configuration](#setup--configuration)
3. [Test File Organization](#test-file-organization)
4. [Writing Tests with Vitest](#writing-tests-with-vitest)
   - [Core API](#core-api)
   - [ES Module Usage](#es-module-usage)
   - [Environment Configuration](#environment-configuration)
   - [Async Testing Patterns](#async-testing-patterns)
   - [Mocking & Spies](#mocking--spies)
5. [Code Coverage](#code-coverage)
6. [Debugging Tests](#debugging-tests)
7. [Common Patterns](#common-patterns)
8. [Migration from Jest](#migration-from-jest)
9. [Troubleshooting](#troubleshooting)

## Introduction

Time Is Money uses [Vitest](https://vitest.dev/) as its testing framework. Vitest is an ESM-first, Vite-powered testing framework that provides fast test execution, native TypeScript support, and seamless integration with modern JavaScript tooling.

### Testing Philosophy

Our testing approach emphasizes:

- **Minimal mocking**: Mock only true external dependencies (Chrome API, network calls)
- **Real implementations**: Test against actual module implementations
- **Clear categorization**: Separate unit, integration, and DOM tests
- **Comprehensive coverage**: Target >85% overall coverage
- **Fast feedback**: Leverage Vitest's speed for rapid development

## Setup & Configuration

### Vitest Configuration

The project's Vitest configuration is defined in `vitest.config.js`:

```javascript
export default defineConfig({
  test: {
    // Default environment (JSDOM for most tests)
    environment: 'jsdom',

    // Test file patterns
    include: ['src/**/*.vitest.test.js'],

    // Setup files that run before each test file
    setupFiles: ['./vitest.setup.js'],

    // Enable globals for easier migration from Jest
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
```

### NPM Scripts

Run tests using these commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run specific test categories
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:dom        # DOM tests only
```

## Test File Organization

### Directory Structure

Tests are organized in `src/__tests__/` with subdirectories matching the source code structure:

```
src/__tests__/
├── unit/             # Isolated component tests
│   ├── utils/        # Utility function tests
│   ├── content/      # Content script unit tests
│   ├── options/      # Options page unit tests
│   └── popup/        # Popup unit tests
├── integration/      # Component interaction tests
│   ├── content/      # Content script integrations
│   ├── options/      # Options page integrations
│   └── popup/        # Popup integrations
├── dom/              # DOM-specific tests
│   └── content/      # DOM manipulation tests
├── mocks/            # Centralized mock definitions
│   ├── chrome-api.mock.js
│   └── browser-api.mock.js
└── setup/            # Test utilities and setup
    ├── vitest-imports.js  # Centralized imports
    └── test-helpers.js    # Common test utilities
```

### File Naming Conventions

- Standard tests: `[filename].vitest.test.js`
- Specialized tests: `[filename].[type].vitest.test.js`
  - Example: `converter.unit.vitest.test.js`
  - Example: `domModifier.dom.vitest.test.js`

### Test Categories

1. **Unit Tests** (`src/__tests__/unit/`)

   - Focus on individual functions/modules
   - Run in Node environment (no DOM)
   - Minimal mocking (Chrome API only)
   - Coverage target: >95%

2. **Integration Tests** (`src/__tests__/integration/`)

   - Test module interactions
   - Run in JSDOM environment
   - Mock external dependencies
   - Coverage target: >80%

3. **DOM Tests** (`src/__tests__/dom/`)
   - Test DOM manipulation and observers
   - Run in JSDOM environment
   - Focus on UI interactions
   - Coverage target: >70%

## Writing Tests with Vitest

### Core API

#### Basic Test Structure

```javascript
// Import Vitest functions from centralized imports
import { describe, test, expect, vi, beforeEach, afterEach } from '../setup/vitest-imports.js';
import { resetTestMocks } from '../../vitest.setup.js';

// Import the module to test
import { myFunction } from '../../../src/utils/myModule.js';

describe('myModule', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetTestMocks();
  });

  describe('myFunction', () => {
    test('handles normal input correctly', () => {
      // Arrange
      const input = 'test input';
      const expected = 'expected output';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe(expected);
    });

    test('handles edge cases', () => {
      expect(myFunction('')).toBe('empty handling');
      expect(myFunction(null)).toBe('null handling');
    });
  });
});
```

#### Common Matchers

```javascript
// Equality
expect(value).toBe(42); // Strict equality (===)
expect(object).toEqual({ key: 'val' }); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();
expect(value).toBeUndefined();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeGreaterThanOrEqual(3.5);
expect(number).toBeLessThan(5);
expect(number).toBeCloseTo(0.3); // For floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Exceptions
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow('specific message');
```

### ES Module Usage

#### Best Practices

1. Use ES module imports/exports consistently:

```javascript
// Good: ES module syntax
import { someFunction } from './module.js';
export { myFunction };

// Bad: CommonJS syntax
const { someFunction } = require('./module');
module.exports = { myFunction };
```

2. Use explicit file extensions:

```javascript
// Good: Explicit extension
import { helper } from './utils/helper.js';

// Less ideal: Extension omitted
import { helper } from './utils/helper';
```

3. Prefer named exports for testability:

```javascript
// Good: Named exports are easier to mock
export function calculatePrice(amount) {
  /* ... */
}
export function formatPrice(price) {
  /* ... */
}

// Less ideal: Default export of object
export default {
  calculatePrice,
  formatPrice,
};
```

### Environment Configuration

#### Test Environment Matrix

| Test Type   | Directory                | Environment | Use Cases                             |
| ----------- | ------------------------ | ----------- | ------------------------------------- |
| Unit        | `__tests__/unit/`        | Node        | Pure functions, utilities, algorithms |
| Integration | `__tests__/integration/` | JSDOM       | Module interactions, API calls        |
| DOM         | `__tests__/dom/`         | JSDOM       | DOM manipulation, MutationObservers   |

#### JSDOM Configuration

For tests requiring DOM access:

```javascript
// JSDOM is configured automatically for integration/DOM tests
// You can interact with the document directly

test('updates DOM element', () => {
  // Setup DOM
  document.body.innerHTML = `
    <div id="price">$10.00</div>
  `;

  // Run function that modifies DOM
  updatePrice('price', '$20.00');

  // Assert DOM changes
  const element = document.getElementById('price');
  expect(element.textContent).toBe('$20.00');
});
```

#### Node Environment

For pure unit tests:

```javascript
// Unit tests run in Node environment by default
// No DOM access, faster execution

test('calculates hourly wage', () => {
  const wage = calculateHourlyWage('yearly', '52000');
  expect(wage).toBe(25); // $52,000/year = $25/hour
});
```

### Async Testing Patterns

#### Async/Await

```javascript
test('fetches data asynchronously', async () => {
  const data = await fetchData();
  expect(data).toEqual({ status: 'success' });
});

test('handles async errors', async () => {
  await expect(failingAsyncFunction()).rejects.toThrow('Network error');
});
```

#### Promises

```javascript
test('returns a promise', () => {
  // Return the promise for Vitest to wait
  return expectPromise().then((result) => {
    expect(result).toBe('resolved value');
  });
});

test('handles promise rejection', () => {
  return expect(rejectingPromise()).rejects.toMatch('error');
});
```

#### Timers and Time-based Testing

```javascript
import { vi } from 'vitest';

test('debounces function calls', async () => {
  vi.useFakeTimers();

  const debounced = debounce(mockFn, 200);

  // Call multiple times quickly
  debounced();
  debounced();
  debounced();

  // Fast-forward time
  await vi.runAllTimersAsync();

  // Function called only once after debounce
  expect(mockFn).toHaveBeenCalledTimes(1);

  vi.useRealTimers();
});
```

### Mocking & Spies

#### Chrome API Mocking

Chrome APIs are pre-mocked in the setup:

```javascript
test('saves to Chrome storage', async () => {
  // Mock implementation
  chrome.storage.sync.set.mockImplementation((data, callback) => {
    callback();
  });

  // Call function using Chrome API
  await saveSettings({ theme: 'dark' });

  // Verify API usage
  expect(chrome.storage.sync.set).toHaveBeenCalledWith({ theme: 'dark' }, expect.any(Function));
});
```

#### Module Mocking

```javascript
// Mock an entire module
vi.mock('../../../utils/logger.js', () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));

// Import after mocking
import logger from '../../../utils/logger.js';

test('logs errors appropriately', () => {
  performRiskyOperation();
  expect(logger.error).toHaveBeenCalledWith('Operation failed');
});
```

#### Spies

```javascript
test('calls original method', () => {
  const spy = vi.spyOn(console, 'log');

  // Original implementation still runs
  logMessage('test');

  expect(spy).toHaveBeenCalledWith('test');

  // Restore original
  spy.mockRestore();
});
```

#### Mock Functions

```javascript
test('uses callback correctly', () => {
  const mockCallback = vi.fn();

  processArray([1, 2, 3], mockCallback);

  expect(mockCallback).toHaveBeenCalledTimes(3);
  expect(mockCallback).toHaveBeenNthCalledWith(1, 1, 0);
  expect(mockCallback).toHaveBeenNthCalledWith(2, 2, 1);
  expect(mockCallback).toHaveBeenNthCalledWith(3, 3, 2);
});
```

## Code Coverage

### Coverage Targets

- Overall: >85%
- Unit tests: >95%
- Critical utilities: 100%
- Integration tests: >80%
- DOM tests: >70%

### Generating Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Configuration

```javascript
// vitest.config.js
coverage: {
  provider: 'v8',
  enabled: false, // Enable via CLI flag
  reporter: ['text', 'html', 'json', 'lcov'],
  reportsDirectory: './coverage',
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/__tests__/**',
    '**/test-helpers.js'
  ],
}
```

## Debugging Tests

### Debugging with VS Code

1. Add breakpoints in your test files
2. Use VS Code's JavaScript debugger
3. Run tests with `--inspect` flag:

```bash
node --inspect-brk ./node_modules/.bin/vitest run
```

### Console Logging

```javascript
test('debug complex logic', () => {
  const input = { complex: 'data' };

  console.log('Input:', input);

  const result = complexFunction(input);

  console.log('Output:', result);

  expect(result).toBeDefined();
});
```

### Vitest UI

```bash
# Run tests with UI
npx vitest --ui

# Opens browser interface for debugging tests
```

## Common Patterns

### Testing Chrome Extension Components

#### Content Scripts

```javascript
// Test content script initialization
test('initializes content script', () => {
  // Mock DOM
  document.body.innerHTML = '<div class="price">$10</div>';

  // Mock Chrome runtime
  chrome.runtime.sendMessage.mockImplementation((msg, callback) => {
    callback({ settings: { enabled: true } });
  });

  // Initialize content script
  initContentScript();

  // Verify initialization
  expect(chrome.runtime.sendMessage).toHaveBeenCalled();
  expect(document.querySelector('.converted')).toBeTruthy();
});
```

#### Background Scripts

```javascript
test('handles extension messages', () => {
  const sendResponse = vi.fn();

  // Simulate message
  chrome.runtime.onMessage.addListener.mock.calls[0][0](
    { action: 'getSettings' },
    { tab: { id: 1 } },
    sendResponse
  );

  expect(sendResponse).toHaveBeenCalledWith({ settings: expect.any(Object) });
});
```

#### Options Page

```javascript
test('saves options correctly', async () => {
  // Setup DOM
  document.body.innerHTML = `
    <input id="amount" value="25">
    <button id="save">Save</button>
  `;

  // Mock storage
  chrome.storage.sync.set.mockImplementation((data, callback) => {
    callback();
  });

  // Trigger save
  document.getElementById('save').click();

  // Verify save
  expect(chrome.storage.sync.set).toHaveBeenCalledWith({ amount: '25' }, expect.any(Function));
});
```

### Testing MutationObservers

```javascript
test('observes DOM mutations', async () => {
  const callback = vi.fn();

  // Create observer
  observeDomChanges(callback);

  // Trigger mutation
  const newElement = document.createElement('div');
  newElement.className = 'price';
  newElement.textContent = '$30';
  document.body.appendChild(newElement);

  // Wait for observer
  await vi.waitFor(() => {
    expect(callback).toHaveBeenCalled();
  });
});
```

### Testing Error Scenarios

```javascript
test('handles errors gracefully', () => {
  // Mock error scenario
  chrome.storage.sync.get.mockImplementation(() => {
    throw new Error('Storage error');
  });

  // Should not throw
  expect(() => loadSettings()).not.toThrow();

  // Should handle error
  expect(logger.error).toHaveBeenCalledWith('Failed to load settings');
});
```

## Migration from Jest

### Common Migration Patterns

```javascript
// Jest to Vitest replacements
jest.fn()          → vi.fn()
jest.spyOn()       → vi.spyOn()
jest.mock()        → vi.mock()
jest.useFakeTimers() → vi.useFakeTimers()
jest.runAllTimers()  → vi.runAllTimers()
```

### Import Changes

```javascript
// Before: Jest globals
describe('test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
});

// After: Vitest imports
import { describe, beforeEach, vi } from 'vitest';

describe('test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
});
```

## Troubleshooting

### Common Issues

#### Issue: Tests fail with "Cannot find module"

**Solution**: Ensure all imports use explicit file extensions:

```javascript
// Good
import { helper } from './helper.js';

// Bad
import { helper } from './helper';
```

#### Issue: Chrome API not mocked

**Solution**: Check that test setup imports are correct:

```javascript
import { resetTestMocks } from '../../vitest.setup.js';

beforeEach(() => {
  resetTestMocks();
});
```

#### Issue: Async tests timeout

**Solution**: Increase timeout or ensure promises resolve:

```javascript
test('long running test', async () => {
  // Increase timeout to 10 seconds
  await longRunningOperation();
}, 10000);
```

#### Issue: DOM not available in tests

**Solution**: Ensure test file is in correct directory (integration or dom folder) or explicitly set environment:

```javascript
// For specific test files needing DOM
// @vitest-environment jsdom
```

### Debug Configuration

Add to your VS Code launch.json:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["run", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

---

_This guide consolidates all testing documentation. Previous documentation files (VITEST-PATTERNS.md, VITEST-MIGRATION.md) have been integrated here and should be considered deprecated._
