# Testing Guide for Time Is Money

This guide outlines our testing approach, structure, and best practices for the Time Is Money Chrome extension.

## Table of Contents

- [Testing Framework](#testing-framework)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mocking Philosophy](#mocking-philosophy)
- [Coverage Requirements](#coverage-requirements)
- [Performance Considerations](#performance-considerations)

## Testing Framework

We use [Vitest](https://vitest.dev/) as our testing framework. Vitest is ESM-first, built on top of Vite, and provides fast test execution with minimal configuration.

Benefits over our previous Jest setup include:

- Native ESM support
- Faster test execution
- Better TypeScript integration
- Less configuration overhead
- Improved performance for large test suites

## Test Organization

Our tests are organized into three main categories based on their nature and the environment they require:

### 1. Unit Tests (`src/__tests__/unit/`)

- Focus on individual functions/modules
- Run in Node environment (no DOM)
- Very minimal mocking (only Chrome API)
- High coverage expected (>95%)
- Located in `src/__tests__/unit/`
- File naming pattern: `*.vitest.test.js`

### 2. Integration Tests (`src/__tests__/integration/`)

- Test interactions between modules
- Run in JSDOM environment
- Light DOM usage
- External dependencies mocked (Chrome API)
- Focus on data flow and contracts between modules
- Medium-to-high coverage expected (>80%)
- Located in `src/__tests__/integration/`
- File naming pattern: `*.vitest.test.js`

### 3. DOM Tests (`src/__tests__/dom/`)

- Test components heavily interacting with DOM
- Test MutationObservers, UI components, DOM manipulation
- Run in JSDOM environment
- External dependencies mocked (Chrome API)
- Focus on DOM manipulation logic, event handling, observer behavior
- Medium coverage expected (>70%)
- Located in `src/__tests__/dom/`
- File naming pattern: `*.vitest.test.js`

## Running Tests

We provide several npm scripts to run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only DOM tests
npm run test:dom
```

## Writing Tests

### Basic Test Structure

```javascript
// Import the functions to test
import { myFunction } from '../../../path/to/module.js';

// Import Vitest functions explicitly (preferred)
import { describe, test, expect, vi } from 'vitest';

// Simple test group
describe('myFunction', () => {
  // Individual test case
  test('handles normal input correctly', () => {
    const result = myFunction('normal input');
    expect(result).toBe('expected output');
  });

  // Edge case test
  test('handles edge cases', () => {
    expect(myFunction('')).toBe('empty input handling');
    expect(myFunction(null)).toBe('null handling');
  });
});
```

### Testing Asynchronous Code

```javascript
// With async/await
test('async function works correctly', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});

// With Promises
test('promise function works correctly', () => {
  return promiseFunction().then((result) => {
    expect(result).toBe('expected');
  });
});
```

### Testing with JSDOM

For integration and DOM tests, JSDOM is automatically configured. You can interact with the document directly:

```javascript
test('DOM manipulation works correctly', () => {
  // Setup DOM elements
  document.body.innerHTML = '<div id="test">Initial text</div>';

  // Call function that manipulates the DOM
  updateDomElement('test', 'Updated text');

  // Assert the changes
  expect(document.getElementById('test').textContent).toBe('Updated text');
});
```

## Mocking Philosophy

Our testing approach emphasizes minimal mocking. The key principles are:

1. **Mock only true external dependencies** - Primarily the Chrome API
2. **Do not mock internal modules** - Test against real implementations
3. **Use centralized mocks** - Reuse consistent mocks from `src/__tests__/mocks/`

### Mocking the Chrome API

We have a centralized Chrome API mock in `src/__tests__/mocks/chrome-api.mock.js`:

```javascript
// Example of using the Chrome API mock
import { describe, test, expect, vi } from 'vitest';
import chromeMock from '../../../__tests__/mocks/chrome-api.mock.js';

// The chrome mock is automatically available in global scope
test('function correctly interacts with Chrome storage', async () => {
  // Chrome storage is already mocked for you
  chrome.storage.sync.get.mockImplementationOnce((_, callback) => {
    callback({ option: 'value' });
  });

  const result = await yourFunction();
  expect(chrome.storage.sync.get).toHaveBeenCalled();
  expect(result).toBe('expected value');
});
```

### Mock Helpers

Our test setup includes helpers for common mocking tasks:

```javascript
// Import mock helpers
import { resetTestMocks } from '../../../__tests__/setup/vitest.setup.js';

// Reset all mocks before/after tests
beforeEach(() => {
  resetTestMocks();
});

// Or manually
afterEach(() => {
  vi.clearAllMocks();
});
```

## Coverage Requirements

We have established the following coverage targets:

- Overall target: >85% combined line coverage
- Unit tests: >95% coverage
- Critical utility modules (`converter.js`, `parser.js`): 100% coverage
- Integration tests: >80% coverage
- DOM tests: >70% coverage

To check current coverage:

```bash
npm run test:coverage
```

This will generate a coverage report in the `coverage/` directory which you can view in your browser (`coverage/index.html`).

## Performance Considerations

Our test suite is designed to run efficiently. Some best practices:

1. **Proper categorization** - Unit tests run in Node environment (faster than JSDOM)
2. **Minimal setup/teardown** - Reset state efficiently between tests
3. **Focused test runs** - Use specific test commands during development
4. **Parallel execution** - Vitest runs tests in parallel by default
5. **Manage test resources** - Properly clean up resources in DOM tests
