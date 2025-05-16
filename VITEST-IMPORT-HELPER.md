# Vitest Import Helper

This document explains how to use the Vitest import helper to simplify test file migration and standardize testing patterns across the codebase.

## Overview

The Vitest import helper (`src/__tests__/setup/vitest-imports.js`) provides a centralized way to import all commonly used Vitest functions, making test file migration easier and more consistent.

## Benefits

- **Simplified imports**: One line to import all needed testing functions
- **Consistency**: Standardized import pattern across all test files
- **Documentation**: JSDoc comments for better IDE support and code completion
- **Easier migration**: Transitional compatibility layer for Jest to Vitest migration
- **Reduced boilerplate**: No need to import individual functions in every file

## Usage

### In New Test Files

For new test files, use the import helper directly:

```javascript
import { describe, it, expect, vi, beforeEach } from '../../setup/vitest-imports.js';

describe('My Component', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

### When Migrating Existing Tests

When migrating from Jest to Vitest, replace global references or individual imports with imports from the helper:

```javascript
// Before: Using Jest globals
describe('My Component', () => {
  it('works', () => {
    const mock = jest.fn();
    expect(mock).not.toHaveBeenCalled();
  });
});

// After: Using Vitest import helper
import { describe, it, expect, vi } from '../../setup/vitest-imports.js';

describe('My Component', () => {
  it('works', () => {
    const mock = vi.fn();
    expect(mock).not.toHaveBeenCalled();
  });
});
```

### Using the Transitional Compatibility Layer

For complex tests that would require many Jest to Vitest replacements, you can use the transitional compatibility layer:

```javascript
import { describe, it, expect, jest } from '../../setup/vitest-imports.js';

describe('My Component', () => {
  it('works', () => {
    // Still using jest.fn(), but it's actually using vi.fn() under the hood
    const mock = jest.fn();
    expect(mock).not.toHaveBeenCalled();
  });
});
```

## Available Functions

The helper provides the following imports:

### Core Testing Functions

- `describe` - Creates a test suite
- `it` - Creates a test case (alias for test)
- `test` - Creates a test case
- `expect` - Creates assertions
- `beforeEach` - Runs before each test
- `afterEach` - Runs after each test
- `beforeAll` - Runs once before all tests
- `afterAll` - Runs once after all tests

### Mocking Utilities

- `vi` - Vitest's mocking utility object
- `fn` - Creates a mock function (alias for vi.fn)
- `spyOn` - Creates a spy on an object method (alias for vi.spyOn)
- `mock` - Mocks a module (alias for vi.mock)
- `unmock` - Unmocks a module (alias for vi.unmock)

### Helper Functions

- `resetTestMocks` - Resets all mocks between tests

### Jest Compatibility

- `jest` - Object that provides Jest-compatible methods using Vitest

## Migration Checklist

When migrating a test file from Jest to Vitest:

1. Rename the file from `*.test.js` to `*.vitest.test.js`
2. Add the import from vitest-imports.js at the top of the file
3. Replace Jest globals with imported functions:
   - `jest.fn()` → `vi.fn()` or use the imported `fn`
   - `jest.spyOn()` → `vi.spyOn()` or use the imported `spyOn`
   - Other timer and mock reset functions
4. Update any test-specific code that might need adjustment
5. Run tests to verify the migration worked

## Examples

See `src/__tests__/setup/vitest-migration-example.js` for detailed examples of migrating different Jest patterns to Vitest using the import helper.

## Best Practices

- For new test files, always use `vi` functions directly instead of the `jest` compatibility layer
- Use the `jest` compatibility object only for transitional purposes during migration
- Always import the helper with a relative path (`../../setup/vitest-imports.js`) to avoid path resolution issues
- Remember to reset mocks between tests using `resetTestMocks()` or `vi.resetAllMocks()`
