# T013 · Refactor · P1: migrate unit tests to vitest

## Task Description

Convert Jest API calls to Vitest in `src/__tests__/unit/` tests, and ensure they use centralized mocks.

## Implementation Plan

### 1. Analyze Unit Test Structure

- Identify common Jest API usage patterns
- Create a mapping of Jest to Vitest replacements
- Document specific test files that need special handling

### 2. Create Migration Approach

- Define a consistent pattern for Vitest imports
- Create a standard template for mock import and setup
- Determine how to handle centralized mocks

### 3. Migration Implementation

1. Create a reference converted test file with Vitest best practices
2. Migrate tests by category in the following order:
   - Simple utility tests (parser, converter)
   - Storage-related tests
   - Other utility tests
   - Content tests (priceFinder and related)
3. For each file:
   - Add Vitest imports
   - Replace Jest API calls
   - Update mock implementations
   - Fix test assertions if needed

### 4. Testing and Validation

- Run tests in isolation using `npx vitest run <file-path>` to verify
- Fix memory issues for complex tests like priceFinder
- Ensure no DOM dependencies in unit tests
- Add metadata to files that cause memory errors to be fixed in T016

### 5. Implementation Issues & Solutions

1. **Memory Issues with Complex RegEx Tests**:

   - The priceFinder tests cause Node.js memory issues
   - Solution: Simplify regex patterns or mark for refactoring in T016 phase
   - Add comment at top of migrated file indicating it needs optimization

2. **Workspace Configuration**:

   - The npm scripts use `--workspace=unit` which doesn't accept a specific file path
   - Solution: Use `npx vitest run <file-path>` to test individual files

3. **Patch Files**:
   - Some tests import from `.test.patch.js` files (part of Jest workarounds)
   - Solution: Inline the patch code in the test file temporarily with note that it will be removed in T016

## Jest to Vitest Conversion Guide

| Jest Pattern                  | Vitest Replacement          |
| ----------------------------- | --------------------------- |
| `jest.fn()`                   | `vi.fn()`                   |
| `jest.mock()`                 | `vi.mock()`                 |
| `jest.spyOn()`                | `vi.spyOn()`                |
| `jest.clearAllMocks()`        | `vi.clearAllMocks()`        |
| `jest.resetAllMocks()`        | `vi.resetAllMocks()`        |
| `jest.restoreAllMocks()`      | `vi.restoreAllMocks()`      |
| `jest.useFakeTimers()`        | `vi.useFakeTimers()`        |
| `jest.useRealTimers()`        | `vi.useRealTimers()`        |
| `jest.runAllTimers()`         | `vi.runAllTimers()`         |
| `jest.runOnlyPendingTimers()` | `vi.runOnlyPendingTimers()` |
| `jest.advanceTimersByTime()`  | `vi.advanceTimersByTime()`  |

## Import Pattern

All test files should start with:

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

## Mock Pattern

For tests that need Chrome API mocks:

```javascript
// Import specific mocks as needed
import chromeMock, { resetChromeMocks } from '../../mocks/chrome-api.mock.js';

// Reset mocks before each test
beforeEach(() => {
  resetChromeMocks();
  // Additional setup
});
```

## Special Cases

- Ensure any files ending with `.test.patch.js` are identified for later removal (T016)
- Pay special attention to timer mocks and async tests
- Note files that mix unit and integration or DOM concerns
