# CI Failure Analysis

## Current Status (2025-05-01)

After several iterations of fixes, we're making progress on the CI tests:

- 16 of 24 test suites are now passing
- 178 of 185 individual tests are now passing
- Linting issues have been resolved

## Remaining Issues

There are still several test suites failing due to the following issues:

### 1. JSDOM Window Location Issues (Partially Fixed)

- We've added window.location initialization to jest.setup.cjs
- Some tests are still failing with location errors in:
  - `src/__tests__/options/formHandler.test.js`
  - `src/__tests__/options/formHandler.xss.test.js`

These tests need to be updated to call the setupTestDom() function in their beforeEach blocks.

### 2. Missing DOM Elements (Partially Fixed)

- We've created a global setupTestDom() helper
- Some tests are still failing due to missing elements:
  - `src/__tests__/options/formHandler.error.test.js` - missing 'enable-dynamic-scanning' element

Individual test files need to be updated to call the setupTestDom() function in their beforeEach blocks.

### 3. Mock Function Issues (Not Fixed)

Test failures related to mock functions:
- `src/__tests__/options/formHandler.storage.direct.test.js` - Cannot read properties of undefined (reading 'calls')

These tests need to be updated to use the resetTestMocks() helper and properly initialize Jest mocks.

### 4. Testing Failures (Not Fixed)

Assertion failures in several tests:
- `src/__tests__/options/formHandler.storage.test.js` - Expected text doesn't match

These failures will be fixed when the DOM elements are properly set up.

### 5. Worker Process Issues (New)

Some test workers are being terminated prematurely:
```
A jest worker process (pid=2033) was terminated by another process: signal=SIGTERM, exitCode=null
```

This might be related to memory/resource limits in the CI environment.

## Path Forward

1. ✅ Create a test migration guide (TEST-MIGRATION-GUIDE.md)
2. ✅ Create an example test that demonstrates how to use the helpers (test-setup-example.js)
3. ✅ Fix the testing infrastructure (jest.setup.cjs, jest.config.cjs)
4. 🔄 Update individual test files to use the new helpers

### Time Estimate

Updating the remaining 8 failing test suites will require:
1. Adding `/* global setupTestDom, resetTestMocks */` to each file
2. Adding a beforeEach block that calls the helpers
3. Possibly updating the test expectations to match the new environment

This is a non-trivial task that should be done methodically, one test file at a time.

### Example Fix Pattern

For each test file:

```javascript
/* global setupTestDom, resetTestMocks */

describe('Test Suite', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
    // Additional test-specific setup
  });

  // Tests remain unchanged
});
```

## Final Notes

Once all tests are passing in CI, we can proceed with the actual work of completing the MV3 migration (T046).