# CI Failure Audit: PR #55

## Overview

PR #55 "Update scripts and CI config for Vitest" has failed in the CI pipeline. Two checks passed (Build and Lint), but the Test check failed with multiple errors related to Jest-to-Vitest migration issues.

## CI Details

- **PR Number**: 55
- **PR Title**: Update scripts and CI config for Vitest
- **Branch**: todo-04-scripts-ci
- **CI Run ID**: 14850645609
- **Date**: May 6, 2025

## Status of Checks

| Check | Status  | Duration |
| ----- | ------- | -------- |
| Build | ✅ Pass | 12s      |
| Lint  | ✅ Pass | 20s      |
| Test  | ❌ Fail | 43s      |

## Test Failures Analysis

The test failures are consistently related to two main issues:

### 1. Missing Jest Global References

Many tests are still referencing Jest globals that don't exist in the Vitest environment:

```
ReferenceError: jest is not defined
```

This occurs in multiple test files:

- `src/__tests__/integration/options/formHandler.storage.integration.test.js:64:5`
- `src/__tests__/integration/options/formHandler.xss.integration.test.js:40:5`
- `src/__tests__/integration/popup/popup.error.integration.test.js:16:5`
- `src/__tests__/unit/options/formHandler.unit.test.js:25:30`
- `src/__tests__/unit/utils/converter.edge.unit.test.js:17:1`
- `src/__tests__/unit/utils/storage.error.unit.test.js:11:5`
- `src/__tests__/unit/utils/storage.unit.test.js:9:5`

### 2. Missing Helper Function References

Many tests are referencing a helper function that doesn't exist:

```
ReferenceError: resetTestMocks is not defined
```

This occurs in multiple test files:

- `src/__tests__/integration/options/formHandler.storage.integration.test.js:15:5`
- `src/__tests__/unit/content/priceFinder.advanced.unit.test.js:12:5`
- `src/__tests__/unit/content/priceFinder.basic-patterns.unit.test.js:12:5`
- `src/__tests__/unit/content/priceFinder.findPrices.unit.test.js:12:5`

### 3. Test Logic Failures

There are also failures related to test assertions not passing:

```
AssertionError: expected { amount: NaN, currency: 'USD', …(2) } to have property "amount" with value 99.95
```

In `src/__tests__/unit/content/priceFinder.enhanced.unit.test.js:141:20`

```
AssertionError: expected "get" to be called with arguments: [ '$|USD' ]
Received: [ "$|USD|undefined|undefined" ]
```

In `src/__tests__/unit/content/priceFinder.vitest.test.js:121:22` and `162:22`

## Root Causes

1. **Incomplete Jest to Vitest Migration**: The test files have been updated to use Vitest for running, but the test code itself still contains Jest-specific references.

2. **Missing Mock Setup**: The `resetTestMocks` function appears to be a custom helper that was either:

   - Not migrated from Jest to Vitest
   - Not properly imported in the test files
   - Renamed during migration but references not updated

3. **API Differences**: Some Vitest mocks behave differently than Jest mocks, causing assertion failures (particularly in the `priceFinder.vitest.test.js` file).

## Required Fixes

1. Replace Jest references with Vitest equivalents:

   - Import Vitest's functions explicitly: `import { expect, vi } from 'vitest'`
   - Replace `jest.fn()` with `vi.fn()`
   - Replace `jest.spyOn()` with `vi.spyOn()`

2. Create or import the missing `resetTestMocks` helper:

   - Implement this function in a test helper file
   - Ensure it's properly imported in all test files that use it

3. Update test assertions to match Vitest's behavior:
   - Fix the mock expectations in `priceFinder.vitest.test.js`
   - Address the NaN value in price conversion tests

## Recommendations

1. Create a comprehensive Jest-to-Vitest migration guide for the codebase
2. Implement a shared test setup file that provides all common test utilities
3. Add more detailed Vitest configuration to handle test environment setup
4. Consider a phased migration approach if the test suite is large

## Next Steps

1. Fix the `resetTestMocks` function issue as the highest priority
2. Update all Jest references to use Vitest's API
3. Fix the assertion failures in the price finder tests
4. Add comprehensive test setup for the Vitest environment
5. Re-run the CI to verify all tests pass
