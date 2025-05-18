# Jest to Vitest Migration Guide

> **⚠️ DEPRECATED**: This migration documentation has been completed and the relevant information has been integrated into the comprehensive [TESTING_GUIDE.md](./TESTING_GUIDE.md). Please refer to that guide for all current testing documentation.

This document provides guidance on migrating tests from Jest to Vitest in the Time Is Money extension project. It covers the key differences between the two testing frameworks, migration patterns used in this project, and best practices for writing new tests.

## Table of Contents

1. [Introduction](#introduction)
2. [Key Differences](#key-differences)
3. [Migration Patterns](#migration-patterns)
4. [Best Practices](#best-practices)
5. [Project-Specific Helpers](#project-specific-helpers)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [References](#references)

## Introduction

Vitest is a Vite-native testing framework designed to be a faster, more modern alternative to Jest. This migration allows us to leverage Vite's performance benefits, maintain compatibility with existing tests, and improve our testing infrastructure.

The migration process follows these principles:

- Create new `.vitest.test.js` files rather than modifying existing ones
- Maintain test behavior and coverage during migration
- Use project-specific helpers to simplify the migration
- Address edge cases and ensure test isolation

## Key Differences

### API and Syntax Differences

| Feature              | Jest                                           | Vitest                                     |
| -------------------- | ---------------------------------------------- | ------------------------------------------ |
| Global Functions     | `describe`, `it`, `test`, `expect`, etc.       | Same names, but from `vitest` package      |
| Mocking              | `jest.fn()`, `jest.mock()`, `jest.spyOn()`     | `vi.fn()`, `vi.mock()`, `vi.spyOn()`       |
| Setup/Teardown       | `beforeEach`, `afterEach`, etc.                | Same names, but from `vitest` package      |
| Timer Mocks          | `jest.useFakeTimers()`                         | `vi.useFakeTimers()`                       |
| Reset Mocks          | `jest.resetAllMocks()`, `jest.clearAllMocks()` | `vi.resetAllMocks()`, `vi.clearAllMocks()` |
| Configuration        | `jest.config.js`                               | `vitest.config.js`                         |
| Asynchronous Testing | `process.nextTick()`                           | `vi.waitFor()`                             |

### Feature Differences

- **Import/Export System**: Vitest uses ES modules natively
- **Performance**: Vitest is generally faster, especially for tests run in parallel
- **Watch Mode**: Vitest's watch mode is more efficient
- **Configuration**: Vitest configuration is simpler and aligned with Vite
- **TypeScript Support**: Vitest has better TypeScript support out of the box

## Migration Patterns

### 1. File Naming Convention

When migrating a test file, create a new file with `.vitest.test.js` suffix:

```
Original: storage.unit.test.js
Migrated: storage.unit.vitest.test.js
```

### 2. Imports

Replace Jest globals with explicit imports from our helper file:

```javascript
// Before (Jest):
// No imports, uses globals

// After (Vitest):
import { describe, it, expect, vi, beforeEach } from '../../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
```

### 3. Mock Functions

Replace Jest mock functions with Vitest equivalents:

```javascript
// Before (Jest):
const mockCallback = jest.fn();
jest.clearAllMocks();
jest.mock('../utils/logger');

// After (Vitest):
const mockCallback = vi.fn();
resetTestMocks(); // Use our helper that calls vi.clearAllMocks() and more
vi.mock('../utils/logger', () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));
```

### 4. Asynchronous Testing

Replace Jest-specific async patterns with Vitest equivalents:

```javascript
// Before (Jest):
await new Promise(process.nextTick);
expect(window.close).toHaveBeenCalled();

// After (Vitest):
await vi.waitFor(() => {
  expect(window.close).toHaveBeenCalled();
});
```

### 5. Mock Implementations

Update mock implementations to use Vitest patterns:

```javascript
// Before (Jest):
chrome.storage.sync.get.mockImplementation((defaults, callback) => {
  callback(mockItems);
});

// After (Vitest - looks the same for Chrome API mocks because our setup handles this):
chrome.storage.sync.get.mockImplementation((defaults, callback) => {
  callback(mockItems);
});
```

## Best Practices

### For New Tests

1. **Use the Helper Import**:

   ```javascript
   import { describe, test, expect, vi, beforeEach } from '../../../setup/vitest-imports.js';
   ```

2. **Always Reset Mocks**:

   ```javascript
   import { resetTestMocks } from '../../../../vitest.setup.js';

   beforeEach(() => {
     resetTestMocks();
   });
   ```

3. **Clean Up After Tests**:

   ```javascript
   afterEach(() => {
     if (chrome.runtime.lastError) {
       delete chrome.runtime.lastError;
     }
   });
   ```

4. **Proper Async Testing**:

   ```javascript
   it('tests an async operation', async () => {
     // Arrange
     const promise = someAsyncFunction();

     // Act & Assert
     await expect(promise).resolves.toBe(expectedValue);
   });
   ```

5. **Mock External Dependencies Only**:
   - Mock Chrome API, network requests, etc.
   - Avoid mocking internal implementation details

### For Migrating Existing Tests

1. **Understand the Test First**:

   - Read the entire test file to understand what's being tested
   - Identify all Jest-specific patterns and APIs

2. **Create Test in Isolation**:

   - Create a new file with the `.vitest.test.js` suffix
   - Start with imports and structure

3. **Tackle One Test Block at a Time**:

   - Migrate one `describe` or `it` block at a time
   - Run tests frequently to catch issues early

4. **Verify Behavior is Preserved**:
   - Ensure all test assertions behave the same way
   - Don't change test logic during migration

## Project-Specific Helpers

### vitest-imports.js

This helper centralizes all Vitest imports and provides consistent patterns:

```javascript
// Imports from vitest
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Export each function with JSDoc for better IDE support
export { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll };

// Import and export resetTestMocks utility
export { resetTestMocks } from '../../../vitest.setup.js';

// Convenience aliases
export const spyOn = vi.spyOn;
export const fn = vi.fn;
export const mock = vi.mock;
export const unmock = vi.unmock;
```

### vitest.setup.js

This setup file provides:

1. **Global Jest Compatibility Layer**:

   ```javascript
   globalThis.jest = {
     fn: vi.fn,
     spyOn: vi.spyOn,
     mock: vi.mock,
     // ... and many other methods
   };
   ```

2. **Mock Reset Function**:

   ```javascript
   export const resetTestMocks = () => {
     // Reset all Vitest mocks
     vi.resetAllMocks();
     vi.clearAllMocks();
     vi.restoreAllMocks();

     // Reset Chrome API mocks
     resetChromeMocks();

     // Reset Performance API mocks
     // ...
   };
   ```

3. **DOM Setup Utilities**:

   ```javascript
   export const setupTestDom = () => {
     // Reset document body
     document.body.innerHTML = '';

     // Create common elements
     // ...
   };
   ```

## Common Issues and Solutions

### 1. Chrome API Mock Issues

**Issue**: Chrome API mocks not working properly with Vitest.

**Solution**: Ensure the chrome mock is properly initialized and reset between tests:

```javascript
// In setup/test
beforeEach(() => {
  resetTestMocks(); // This resets Chrome API mocks
});
```

### 2. Performance API Mocking

**Issue**: Performance API is read-only in CI environments.

**Solution**: Use the safer mock approach from vitest.setup.js:

```javascript
// In test file that needs performance API
const mockPerf = globalThis.useMockPerformance();
mockPerf.measure('test-measure', 0, 100);
```

### 3. Asynchronous Tests Hanging

**Issue**: Async tests hang or time out.

**Solution**: Use `vi.waitFor()` with an assertion rather than raw Promise resolution:

```javascript
// Bad
await new Promise((resolve) => setTimeout(resolve, 100));
expect(something).toBe(true);

// Good
await vi.waitFor(() => {
  expect(something).toBe(true);
});
```

### 4. ES Module Issues

**Issue**: Import/export errors when migrating tests.

**Solution**: Ensure import paths are correct and use `.js` extension for local imports:

```javascript
// Correct
import { something } from '../../../utils/module.js';

// Incorrect
import { something } from '../../../utils/module';
```

## References

- [Vitest Documentation](https://vitest.dev/guide/)
- [Jest to Vitest Migration Guide](https://vitest.dev/guide/migration.html)
- [Vitest API Reference](https://vitest.dev/api/)
- [Jest Documentation](https://jestjs.io/docs/getting-started) (for comparison)

## Examples from Our Codebase

### Basic Test Structure

```javascript
// src/__tests__/unit/utils/storage.unit.vitest.test.js
import { describe, it, expect, beforeEach } from '../../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
import { getSettings, saveSettings } from '../../../utils/storage.js';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetTestMocks();
  });

  describe('getSettings', () => {
    it('should resolve with storage items when successful', async () => {
      const mockItems = { amount: '10.00', frequency: 'hourly' };
      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(mockItems);
      });

      const result = await getSettings();
      expect(result).toEqual(mockItems);
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    // More tests...
  });
});
```

### Mocking Example

```javascript
// Example of mocking with Vitest
import { describe, test, expect, vi } from '../../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';

// Mock a module
vi.mock('../../../utils/logger', () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));

describe('Module with dependencies', () => {
  beforeEach(() => {
    resetTestMocks();
  });

  test('logs an error when something fails', () => {
    // Test code that uses the logger
    expect(logger.error).toHaveBeenCalledWith('Error message');
  });
});
```
