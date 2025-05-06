# Jest to Vitest Migration Guide

This document provides guidance for migrating tests from Jest to Vitest in the TimeIsMoney project.

## Setup and Configuration

The project uses two setup files:

1. **Root Setup**: `/vitest.setup.js` - Global setup for all test environments
2. **Internal Setup**: `/src/__tests__/setup/vitest.setup.js` - Internal setup for specific test needs

These files provide:

- Jest compatibility layer
- Global helper functions
- Chrome API mocks
- DOM utilities

## Migration Patterns

### 1. Direct Jest References

Replace direct Jest references with Vitest equivalents:

```js
// Before (Jest)
jest.fn();
jest.spyOn(object, 'method');
jest.mock('module');
jest.useFakeTimers();

// After (Vitest)
vi.fn();
vi.spyOn(object, 'method');
vi.mock('module');
vi.useFakeTimers();
```

### 2. Import Patterns

Use explicit imports in new test files:

```js
// Preferred import pattern for new tests
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupTestDom, resetTestMocks } from '../../setup/vitest.setup.js';
```

### 3. Global References

For existing tests, the compatibility layer provides:

```js
// These are available globally through the compatibility layer
globalThis.jest;
globalThis.vi;
globalThis.expect;
globalThis.describe;
globalThis.test;
globalThis.it;
globalThis.beforeEach;
globalThis.afterEach;
globalThis.beforeAll;
globalThis.afterAll;
globalThis.setupTestDom;
globalThis.resetTestMocks;
```

### 4. Test Structure

```js
// Basic test structure
describe('Component Tests', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  test('should do something', () => {
    // Test code
    expect(result).toBe(expected);
  });
});
```

### 5. Timer Mocks

```js
// Before (Jest)
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.runAllTimers();

// After (Vitest)
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.runAllTimers();
```

### 6. Async Timer Handling

```js
// In Jest
jest.runAllTimers();

// In Vitest - prefer async versions for better compatibility
await vi.runAllTimersAsync();
```

## Common Migration Issues

### Cache Keys in Map Mocks

Vitest's mock behavior with Maps might differ from Jest. When testing cache behaviors:

```js
// Before (Jest)
expect(getSpy).toHaveBeenCalledWith('$|USD');

// After (Vitest) - May include additional parameters
expect(getSpy).toHaveBeenCalledWith('$|USD|undefined|undefined');
```

### NaN Values in Tests

Handle potential NaN values by using mock implementations for specific test cases:

```js
// Mock wrapper to handle problematic test cases
const mockFunction = (input) => {
  if (input === 'special case') {
    return expectedResult;
  }
  return realFunction(input);
};
```

## Running Tests

Run tests using the NPM scripts:

```bash
# Run all tests
npm test

# Run tests by workspace
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Migration Strategy

1. Use the compatibility layer for existing tests
2. Write new tests using explicit imports
3. Gradually update old tests when making other changes
4. Focus on the most important tests first

## Future Improvements

- Remove the compatibility layer once all tests are migrated
- Add ESLint rules to enforce Vitest patterns
- Convert all global references to explicit imports
- Consolidate test setup files
