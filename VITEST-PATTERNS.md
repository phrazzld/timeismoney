# Vitest Testing Patterns

> **⚠️ DEPRECATED**: This documentation has been integrated into the comprehensive [TESTING_GUIDE.md](./TESTING_GUIDE.md). Please refer to that guide for all testing documentation.

This guide establishes the preferred patterns for writing new tests using Vitest in the Time Is Money extension. All new tests should follow these guidelines to ensure consistent test structure, organization, and best practices across the codebase.

## Table of Contents

1. [File Structure and Organization](#file-structure-and-organization)
2. [Basic Test Structure](#basic-test-structure)
3. [Mocking Patterns](#mocking-patterns)
4. [Asynchronous Testing](#asynchronous-testing)
5. [Data Setup Patterns](#data-setup-patterns)
6. [Assertions and Expectations](#assertions-and-expectations)
7. [Performance Considerations](#performance-considerations)
8. [Examples](#examples)

## File Structure and Organization

### Naming Conventions

- Test files should be named using the pattern: `[filename].vitest.test.js`
- For specialized test types, use: `[filename].[type].vitest.test.js` (e.g., `domModifier.dom.vitest.test.js`)

### Directory Organization

All tests should be organized in the `src/__tests__/` directory with subdirectories matching the source code structure:

```
src/__tests__/
├── unit/             # Unit tests for isolated components
│   ├── utils/        # Tests for utility functions
│   ├── content/      # Tests for content scripts
│   └── ...
├── integration/      # Integration tests between components
│   ├── content/      # Integration tests for content scripts
│   └── ...
├── dom/              # DOM-specific tests
│   ├── content/      # DOM tests for content scripts
│   └── ...
└── setup/            # Test setup utilities
    └── vitest-imports.js  # Centralized imports
```

### When to Create Different Types of Tests

- **Unit Tests**: Focus on testing individual functions or classes in isolation
- **Integration Tests**: Test how components work together
- **DOM Tests**: Test components that interact with the DOM
- **End-to-End Tests**: Test complete user workflows

## Basic Test Structure

### Required Imports

Always import testing utilities from the centralized import helper:

```javascript
// Required imports for all tests
import { describe, test, expect, vi, beforeEach, afterEach } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../vitest.setup.js';

// Module-specific imports
import { functionToTest } from '../../path/to/module.js';
```

### Setup and Teardown

Use consistent patterns for test setup and teardown:

```javascript
describe('Module name', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset all mocks to ensure test isolation
    resetTestMocks();

    // Additional setup as needed
    // ...
  });

  // Cleanup after each test (if needed)
  afterEach(() => {
    // Cleanup resources
    // ...
  });

  // Tests go here
  test('should do something', () => {
    // ...
  });
});
```

### Test Organization

Organize tests using nested `describe` blocks for logical grouping:

```javascript
describe('ModuleName', () => {
  describe('functionName', () => {
    // Tests for a specific function
    test('should handle valid input', () => {
      // ...
    });

    test('should handle invalid input', () => {
      // ...
    });
  });

  describe('anotherFunction', () => {
    // Tests for another function
    // ...
  });
});
```

### Test Case Structure

Follow the AAA (Arrange-Act-Assert) pattern for test cases:

```javascript
test('should transform input correctly', () => {
  // Arrange: Set up test data and conditions
  const input = {
    /* ... */
  };
  const expected = {
    /* ... */
  };

  // Act: Perform the action being tested
  const result = functionToTest(input);

  // Assert: Verify the results
  expect(result).toEqual(expected);
});
```

## Mocking Patterns

### Mocking Chrome APIs

Chrome APIs are pre-mocked in the `vitest.setup.js` file. Use them as follows:

```javascript
test('should store settings in Chrome storage', () => {
  // Set up the mock implementation
  chrome.storage.sync.set.mockImplementation((data, callback) => {
    callback(); // Simulate successful storage
  });

  // Call the function that uses Chrome storage
  const result = saveSettings({ key: 'value' });

  // Verify Chrome API was called correctly
  expect(chrome.storage.sync.set).toHaveBeenCalledWith({ key: 'value' }, expect.any(Function));
});
```

### Mocking Modules

Use Vitest's mocking capabilities to mock external dependencies:

```javascript
// Mock the entire module
vi.mock('../../utils/logger.js', () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));

// Import the mocked module (after mocking)
import logger from '../../utils/logger.js';

// Test with the mock
test('should log error when operation fails', () => {
  // Call function that should log an error
  functionThatMightFail();

  // Verify logger was called
  expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('operation failed'));
});
```

### Spies vs. Mocks

- **Use Spies**: When you want to verify a method was called without changing its implementation
- **Use Mocks**: When you need to replace functionality with test-specific behavior

```javascript
// Using a spy
test('should call formatter', () => {
  const spy = vi.spyOn(formatter, 'format');
  processData('input');
  expect(spy).toHaveBeenCalledWith('input');
  spy.mockRestore();
});

// Using a mock
test('should handle formatter error', () => {
  vi.spyOn(formatter, 'format').mockImplementation(() => {
    throw new Error('Format error');
  });

  expect(() => processData('input')).toThrow('Format error');
});
```

## Asynchronous Testing

### Testing Promises

Use `async/await` for testing promises:

```javascript
test('should resolve with data', async () => {
  const result = await fetchData();
  expect(result).toEqual({ success: true });
});

test('should reject on error', async () => {
  await expect(fetchDataWithError()).rejects.toThrow('Network error');
});
```

### Waiting for Conditions

Use `vi.waitFor()` to wait for conditions to be met:

```javascript
test('should update UI after data loads', async () => {
  // Trigger async operation
  loadData();

  // Wait for the condition to be true
  await vi.waitFor(() => {
    expect(document.querySelector('.status').textContent).toBe('Loaded');
  });
});
```

### Avoiding Flaky Tests

- Set explicit timeouts for async operations
- Ensure proper cleanup in `afterEach`
- Mock timers for predictable timing

```javascript
beforeEach(() => {
  // Set up fake timers
  vi.useFakeTimers();
});

afterEach(() => {
  // Restore real timers
  vi.useRealTimers();
});

test('should handle debounced events', async () => {
  // Set up test
  const callback = vi.fn();
  const debounced = debounce(callback, 300);

  // Call debounced function multiple times
  debounced();
  debounced();
  debounced();

  // Fast-forward time
  vi.advanceTimersByTime(300);

  // Verify callback was only called once
  expect(callback).toHaveBeenCalledTimes(1);
});
```

## Data Setup Patterns

### Test Data Factory Functions

Create factory functions for common test data:

```javascript
// Test data factory in a shared test utils file
export function createTestSettings(overrides = {}) {
  return {
    currencySymbol: '$',
    amount: '25.00',
    frequency: 'hourly',
    ...overrides,
  };
}

// Using the factory in tests
test('should apply settings', () => {
  const settings = createTestSettings({ currencySymbol: '€' });
  expect(settings.currencySymbol).toBe('€');
});
```

### Common Test Fixtures

Store fixtures in a dedicated directory:

```javascript
// In src/__tests__/fixtures/prices.js
export const validPrices = [
  { html: '$24.99', expected: { amount: '24.99', currency: '$' } },
  { html: '€50,00', expected: { amount: '50,00', currency: '€' } },
  // More test cases...
];

// Using fixtures in tests
import { validPrices } from '../fixtures/prices.js';

test.each(validPrices)('should parse price: $html', ({ html, expected }) => {
  const result = parsePrice(html);
  expect(result).toEqual(expected);
});
```

## Assertions and Expectations

### Common Assertion Patterns

Use these common assertion patterns for clarity:

```javascript
// Equality checks
expect(result).toBe(5); // Strict equality (===)
expect(result).toEqual({ id: 1 }); // Deep equality for objects
expect(result).toStrictEqual({ id: 1 }); // Strict equality for objects (including undefined)

// Truthiness checks
expect(result).toBeTruthy(); // Truthy value
expect(result).toBeFalsy(); // Falsy value
expect(result).toBeNull(); // Null value
expect(result).toBeUndefined(); // Undefined value

// Numeric comparisons
expect(number).toBeGreaterThan(3); // Greater than
expect(number).toBeGreaterThanOrEqual(3); // Greater than or equal
expect(number).toBeLessThan(5); // Less than

// String checks
expect(text).toMatch(/pattern/); // Regex match
expect(text).toContain('substring'); // Contains substring

// Array checks
expect(array).toContain('item'); // Array contains item
expect(array).toHaveLength(3); // Array has length

// Function calls
expect(mockFn).toHaveBeenCalled(); // Function was called
expect(mockFn).toHaveBeenCalledWith(arg); // Function was called with arg
expect(mockFn).toHaveBeenCalledTimes(2); // Function was called twice
```

### Testing DOM Elements

Use DOM-specific assertions:

```javascript
test('should update DOM correctly', () => {
  // Perform action that updates the DOM
  updateElement();

  // Query the DOM
  const element = document.querySelector('.price');

  // Assert on DOM properties
  expect(element).not.toBeNull();
  expect(element.textContent).toBe('$25.00');
  expect(element.classList.contains('converted')).toBe(true);
});
```

### Testing Error Cases

Always test error cases and edge conditions:

```javascript
test('should handle null input', () => {
  expect(() => processInput(null)).toThrow('Input cannot be null');
});

test('should handle empty string', () => {
  const result = processInput('');
  expect(result).toEqual({ isValid: false, error: 'Empty input' });
});
```

## Performance Considerations

### Keeping Tests Fast

- Mock expensive operations like network calls and storage
- Use targeted tests rather than broad integration tests when possible
- Avoid unnecessary setup and teardown

### Efficient Test Organization

- Group related tests to share setup
- Use `beforeAll` for expensive one-time setup when appropriate
- Use `describe.skip` or `test.skip` to temporarily skip slow tests during development

### Parallel Test Execution

Vitest runs tests in parallel by default. Ensure tests are isolated and don't interfere with each other:

- Don't rely on shared global state without proper reset
- Clean up resources in `afterEach` or `afterAll`
- Avoid relying on execution order between tests

## Examples

### Unit Test Example

```javascript
// src/__tests__/unit/utils/converter.unit.vitest.test.js
import { describe, test, expect, beforeEach } from '../../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
import { convertCurrency } from '../../../utils/converter.js';

describe('Currency Converter', () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe('convertCurrency', () => {
    test('should convert USD to time correctly', () => {
      // Arrange
      const price = '25.00';
      const hourlyRate = '50';
      const expected = '0.5'; // Half an hour for $25 at $50/hour

      // Act
      const result = convertCurrency(price, hourlyRate);

      // Assert
      expect(result).toBe(expected);
    });

    test('should handle zero hourly rate', () => {
      // Arrange
      const price = '25.00';
      const hourlyRate = '0';

      // Act & Assert
      expect(() => convertCurrency(price, hourlyRate)).toThrow('Cannot divide by zero hourly rate');
    });

    test('should handle invalid price format', () => {
      // Arrange
      const price = 'not-a-number';
      const hourlyRate = '50';

      // Act
      const result = convertCurrency(price, hourlyRate);

      // Assert
      expect(result).toBe('N/A');
    });
  });
});
```

### Integration Test Example

```javascript
// src/__tests__/integration/content/price-conversion.integration.vitest.test.js
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from '../../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
import { setupTestDom } from '../../../../vitest.setup.js';
import { initPriceConverter } from '../../../content/index.js';
import { DEFAULT_SETTINGS } from '../../../utils/constants.js';

describe('Price Conversion Integration', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();

    // Set up storage mock
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        ...DEFAULT_SETTINGS,
        amount: '50.00',
        frequency: 'hourly',
        currencySymbol: '$',
      });
    });

    // Create test prices in the DOM
    const prices = [
      { text: '$10.00', id: 'price-1' },
      { text: '$25.99', id: 'price-2' },
      { text: '$99.95', id: 'price-3' },
    ];

    prices.forEach(({ text, id }) => {
      const element = document.createElement('span');
      element.id = id;
      element.textContent = text;
      element.className = 'product-price';
      document.body.appendChild(element);
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should convert all prices on the page', async () => {
    // Initialize the price converter
    initPriceConverter();

    // Wait for conversions to complete
    await vi.waitFor(() => {
      return document.querySelectorAll('.time-is-money-converted').length === 3;
    });

    // Check that all prices were converted
    expect(document.getElementById('price-1').textContent).toContain('(0.2 hours)');
    expect(document.getElementById('price-2').textContent).toContain('(0.52 hours)');
    expect(document.getElementById('price-3').textContent).toContain('(2 hours)');
  });
});
```

### DOM Test Example

```javascript
// src/__tests__/dom/content/domModifier.dom.vitest.test.js
import { describe, test, expect, beforeEach, afterEach } from '../../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
import { setupTestDom } from '../../../../vitest.setup.js';
import { addConvertedPrice } from '../../../content/domModifier.js';

describe('DOM Modifier', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();

    // Create test element
    const priceElement = document.createElement('div');
    priceElement.id = 'test-price';
    priceElement.textContent = '$49.99';
    document.body.appendChild(priceElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should add converted price to the DOM', () => {
    // Get the element
    const element = document.getElementById('test-price');

    // Call the function to test
    addConvertedPrice(element, '1 hour');

    // Check that the conversion was added
    expect(element.innerHTML).toContain('$49.99');
    expect(element.innerHTML).toContain('1 hour');
    expect(element.classList.contains('time-is-money-converted')).toBe(true);
  });

  test('should not modify already converted elements', () => {
    // Get the element
    const element = document.getElementById('test-price');

    // Mark as already converted
    element.classList.add('time-is-money-converted');
    const originalHTML = element.innerHTML;

    // Try to convert again
    addConvertedPrice(element, '1 hour');

    // Check that the element wasn't modified
    expect(element.innerHTML).toBe(originalHTML);
  });
});
```

## Conclusion

Following these patterns will ensure consistent, maintainable, and effective tests across the Time Is Money extension. These patterns are derived from best practices in the Vitest community and adapted for our specific project requirements.

Remember that tests should be:

- **Fast**: Quick to run and quick to write
- **Isolated**: Independent of other tests
- **Repeatable**: Consistent results on each run
- **Self-validating**: Clear pass/fail result
- **Thorough**: Cover the important scenarios

If you have questions or suggestions for improving these patterns, please file an issue or submit a pull request.
